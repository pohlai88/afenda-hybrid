/**
 * RLS Policy Checker
 * 
 * Validates Row-Level Security policies:
 * - All tenant-scoped tables have RLS enabled
 * - Policies reference tenant_id correctly
 * - Policy names follow conventions
 * - All CRUD operations are covered
 * 
 * @see docs/archive/ci-gates/ci-gate-analysis.md
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, TableInfo, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface RlsIssue {
  file: string;
  line: number;
  table: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

const issues: RlsIssue[] = [];

// Tables that don't need RLS (system tables, audit tables)
const RLS_EXEMPT_TABLES = [
  "tenants",
  "regions",
  "audit_trail",
  "traces",
  "retention_policies",
];

function findLineNumber(content: string, searchStr: string): number {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return 1;
}

function checkRlsEnabled(table: TableInfo, _schema: SchemaInfo): void {
  if (RLS_EXEMPT_TABLES.includes(table.name)) {
    return;
  }
  
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Check if table has tenant scope
  if (!table.hasTenantScope) {
    return; // Non-tenant tables don't need RLS
  }
  
  // Check for RLS enablement
  const hasRls = content.includes("withRLS") || 
                 content.includes("pgPolicy") ||
                 content.includes("enableRLS");
  
  if (!hasRls) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: table.name,
      rule: "rls-not-enabled",
      message: `Tenant-scoped table "${table.name}" does not have RLS enabled`,
      severity: "info",
      suggestion: "Consider adding RLS policies for defense-in-depth tenant isolation",
    });
  }
}

function checkRlsPolicies(table: TableInfo, _schema: SchemaInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Find all policy definitions
  const policyMatches = content.matchAll(/pgPolicy\(\s*["']([^"']+)["']/g);
  const policies: string[] = [];
  
  for (const match of policyMatches) {
    policies.push(match[1]);
  }
  
  if (policies.length === 0) {
    return; // No policies to check
  }
  
  // Check policy naming convention
  for (const policy of policies) {
    // Expected format: {table}_{operation}_policy or tenant_{operation}_{table}
    const validPattern = new RegExp(`^(${table.name}|tenant)_\\w+_(policy|select|insert|update|delete)$`, "i");
    
    if (!validPattern.test(policy)) {
      issues.push({
        file: table.relativePath,
        line: findLineNumber(content, policy),
        table: table.name,
        rule: "policy-naming",
        message: `Policy "${policy}" doesn't follow naming convention`,
        severity: "info",
        suggestion: `Use format: ${table.name}_select_policy, ${table.name}_insert_policy, etc.`,
      });
    }
  }
  
  // Check that policies reference tenant_id
  const policyBlocks = content.matchAll(/pgPolicy\([^)]+\)[^;]*(?:using|withCheck)\([^)]+\)/g);
  
  for (const match of policyBlocks) {
    const policyBlock = match[0];
    
    if (!policyBlock.includes("tenant") && !policyBlock.includes("tenantId")) {
      issues.push({
        file: table.relativePath,
        line: findLineNumber(content, policyBlock.substring(0, 50)),
        table: table.name,
        rule: "policy-no-tenant",
        message: "RLS policy doesn't reference tenant_id",
        severity: "warning",
        suggestion: "Add tenant_id check: using(tenant_id = current_setting('afenda.tenant_id')::integer)",
      });
    }
  }
  
  // Check CRUD coverage
  const operations = ["select", "insert", "update", "delete"];
  const coveredOps = new Set<string>();
  
  for (const policy of policies) {
    for (const op of operations) {
      if (policy.toLowerCase().includes(op)) {
        coveredOps.add(op);
      }
    }
  }
  
  // Also check for "for" clause in policy definitions
  for (const op of operations) {
    const forClause = new RegExp(`for\\s*:\\s*["']${op}["']`, "i");
    if (forClause.test(content)) {
      coveredOps.add(op);
    }
  }
  
  const missingOps = operations.filter(op => !coveredOps.has(op));
  
  if (missingOps.length > 0 && policies.length > 0) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: table.name,
      rule: "policy-incomplete-coverage",
      message: `RLS policies don't cover all operations: missing ${missingOps.join(", ")}`,
      severity: "info",
      suggestion: `Add policies for: ${missingOps.map(op => `${table.name}_${op}_policy`).join(", ")}`,
    });
  }
}

function checkMigrationRls(): void {
  const migrationsDir = path.join(process.cwd(), "src/db/migrations");
  
  if (!fs.existsSync(migrationsDir)) {
    return;
  }
  
  const migrations = fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
  
  for (const migration of migrations) {
    const sqlPath = path.join(migrationsDir, migration, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;
    
    const content = fs.readFileSync(sqlPath, "utf-8");
    
    // Check for RLS enable without policies
    if (content.includes("ENABLE ROW LEVEL SECURITY") && !content.includes("CREATE POLICY")) {
      issues.push({
        file: `src/db/migrations/${migration}/migration.sql`,
        line: findLineNumber(content, "ENABLE ROW LEVEL SECURITY"),
        table: migration,
        rule: "rls-no-policies",
        message: "RLS enabled but no policies created in same migration",
        severity: "warning",
        suggestion: "Add CREATE POLICY statements after enabling RLS",
      });
    }
    
    // Check for policies without RLS enable
    if (content.includes("CREATE POLICY") && !content.includes("ENABLE ROW LEVEL SECURITY")) {
      issues.push({
        file: `src/db/migrations/${migration}/migration.sql`,
        line: findLineNumber(content, "CREATE POLICY"),
        table: migration,
        rule: "policy-no-rls",
        message: "CREATE POLICY without ENABLE ROW LEVEL SECURITY",
        severity: "warning",
        suggestion: "Add ALTER TABLE ... ENABLE ROW LEVEL SECURITY before creating policies",
      });
    }
  }
}

function main(): void {
  console.log("🔍 RLS Policy Check\n");
  
  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("No schema directory found");
    process.exit(0);
  }
  
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  // Run checks
  for (const schema of schemas) {
    for (const table of schema.tables) {
      checkRlsEnabled(table, schema);
      checkRlsPolicies(table, schema);
    }
  }
  
  // Check migrations
  checkMigrationRls();
  
  // Report results
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ All RLS policy checks passed!\n");
    process.exit(0);
  }
  
  console.log("Issues found:\n");
  
  // Group by table
  const byTable = issues.reduce((acc, issue) => {
    if (!acc[issue.table]) acc[issue.table] = [];
    acc[issue.table].push(issue);
    return acc;
  }, {} as Record<string, RlsIssue[]>);
  
  for (const [tableName, tableIssues] of Object.entries(byTable)) {
    console.log(`=== ${tableName} ===\n`);
    
    for (const issue of tableIssues) {
      const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`${icon} ${issue.file}:${issue.line}`);
      console.log(`   [${issue.rule}]`);
      console.log(`   ${issue.message}`);
      console.log(`   💡 ${issue.suggestion}`);
      console.log();
    }
  }
  
  console.log("─".repeat(60));
  console.log(`\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info(s)\n`);
  
  if (errors.length > 0 || (strictWarnings && warnings.length > 0)) {
    process.exit(1);
  }
}

main();
