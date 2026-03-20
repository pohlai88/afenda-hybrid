/**
 * Security Validation Script
 * 
 * Comprehensive security checks for database schema and migrations:
 * - SQL injection patterns
 * - Hardcoded credentials
 * - Dangerous operations
 * - RLS policy completeness
 * - Privilege escalation patterns
 * - Audit logging coverage
 * 
 * @see docs/archive/ci-gates/ci-gate-analysis.md
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const MIGRATIONS_DIR = path.join(process.cwd(), "src/db/migrations");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface SecurityIssue {
  file: string;
  line: number;
  rule: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cwe?: string;
  suggestion: string;
}

const issues: SecurityIssue[] = [];

// Patterns that indicate potential SQL injection
const SQL_INJECTION_PATTERNS = [
  { pattern: /\$\{[^}]+\}.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/i, name: "template-literal-sql" },
  { pattern: /\+\s*['"][^'"]*(?:SELECT|INSERT|UPDATE|DELETE)/i, name: "string-concat-sql" },
  { pattern: /execute\s*\(\s*['"`][^'"`]*\$\{/i, name: "execute-interpolation" },
];

// Patterns that indicate hardcoded credentials
const CREDENTIAL_PATTERNS = [
  { pattern: /password\s*[:=]\s*['"][^'"]{3,}['"]/i, name: "hardcoded-password" },
  { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/i, name: "hardcoded-api-key" },
  { pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/i, name: "hardcoded-secret" },
  { pattern: /token\s*[:=]\s*['"][^'"]{10,}['"]/i, name: "hardcoded-token" },
  { pattern: /private[_-]?key\s*[:=]\s*['"][^'"]+['"]/i, name: "hardcoded-private-key" },
];

// Dangerous SQL patterns in migrations
const DANGEROUS_MIGRATION_PATTERNS = [
  { pattern: /GRANT\s+ALL/i, severity: "high" as const, name: "grant-all" },
  { pattern: /SUPERUSER/i, severity: "critical" as const, name: "superuser" },
  // Word-safe: avoid matching column names like "createdBy" (contains CREATEDB)
  { pattern: /\bCREATE\s+DATABASE\b|\bCREATE\s+ROLE\b/i, severity: "high" as const, name: "elevated-privileges" },
  { pattern: /DROP\s+DATABASE/i, severity: "critical" as const, name: "drop-database" },
  { pattern: /TRUNCATE\s+(?!.*CASCADE)/i, severity: "high" as const, name: "truncate-no-cascade" },
  { pattern: /DELETE\s+FROM\s+\w+\s*;/i, severity: "high" as const, name: "delete-all-rows" },
  { pattern: /ALTER\s+SYSTEM/i, severity: "critical" as const, name: "alter-system" },
  { pattern: /pg_execute_server_program/i, severity: "critical" as const, name: "server-program-execution" },
];

// Tables that should have audit logging
const AUDIT_REQUIRED_TABLES = [
  "users",
  "roles",
  "user_roles",
  "service_principals",
  "tenants",
  "organizations",
];

function findLineNumber(content: string, pattern: RegExp): number {
  const match = content.match(pattern);
  if (!match) return 1;
  
  const index = content.indexOf(match[0]);
  return content.substring(0, index).split("\n").length;
}

function checkSqlInjection(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  
  // Skip test files
  if (relativePath.includes(".test.") || relativePath.includes(".spec.")) {
    return;
  }
  
  for (const { pattern, name } of SQL_INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      // Check if it's using sql`` template tag (safe)
      const match = content.match(pattern);
      if (match) {
        const idx = content.indexOf(match[0]);
        const context = content.substring(Math.max(0, idx - 2500), idx + match[0].length + 80);
        
        // Skip if match is inside Drizzle sql`...` (look back far enough for multi-line views)
        if (context.includes("sql`") || context.includes("sql.raw")) {
          continue;
        }
        
        issues.push({
          file: relativePath,
          line: findLineNumber(content, pattern),
          rule: name,
          message: "Potential SQL injection vulnerability detected",
          severity: "critical",
          cwe: "CWE-89",
          suggestion: "Use parameterized queries with sql`` template tag from drizzle-orm",
        });
      }
    }
  }
}

function checkHardcodedCredentials(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  
  // Skip test files and example files
  if (relativePath.includes(".test.") || 
      relativePath.includes(".spec.") ||
      relativePath.includes(".example.") ||
      relativePath.includes("__mocks__")) {
    return;
  }
  
  for (const { pattern, name } of CREDENTIAL_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) {
        // Skip if it's a type definition or placeholder
        const context = content.substring(Math.max(0, content.indexOf(match[0]) - 30), content.indexOf(match[0]) + match[0].length);
        if (context.includes("type ") || 
            context.includes("interface ") ||
            match[0].includes("${") ||
            match[0].includes("process.env") ||
            match[0].includes("placeholder") ||
            match[0].includes("example")) {
          continue;
        }
        
        issues.push({
          file: relativePath,
          line: findLineNumber(content, pattern),
          rule: name,
          message: "Potential hardcoded credential detected",
          severity: "critical",
          cwe: "CWE-798",
          suggestion: "Use environment variables for sensitive values",
        });
      }
    }
  }
}

function checkMigrationSecurity(): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return;
  }
  
  const migrations = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
  
  for (const migration of migrations) {
    const sqlPath = path.join(MIGRATIONS_DIR, migration, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;
    
    const content = fs.readFileSync(sqlPath, "utf-8");
    const relativePath = `src/db/migrations/${migration}/migration.sql`;
    
    for (const { pattern, severity, name } of DANGEROUS_MIGRATION_PATTERNS) {
      if (pattern.test(content)) {
        issues.push({
          file: relativePath,
          line: findLineNumber(content, pattern),
          rule: name,
          message: `Dangerous SQL pattern detected: ${name}`,
          severity,
          suggestion: "Review this operation carefully. Ensure it's necessary and has proper safeguards.",
        });
      }
    }
    
    // Check for DELETE/UPDATE without WHERE clause
    if (/DELETE\s+FROM\s+\w+\s*;/i.test(content)) {
      issues.push({
        file: relativePath,
        line: findLineNumber(content, /DELETE\s+FROM/i),
        rule: "delete-without-where",
        message: "DELETE statement without WHERE clause",
        severity: "high",
        suggestion: "Add WHERE clause to limit affected rows",
      });
    }
    
    // Check for tenant isolation in data modifications
    if (/(?:DELETE|UPDATE)\s+FROM\s+(?!.*tenant_id)/i.test(content)) {
      const match = content.match(/(?:DELETE|UPDATE)\s+FROM\s+(\w+)/i);
      if (match && !["audit", "core", "security"].some(s => match[1].includes(s))) {
        issues.push({
          file: relativePath,
          line: findLineNumber(content, /(?:DELETE|UPDATE)\s+FROM/i),
          rule: "missing-tenant-filter",
          message: "Data modification without tenant_id filter",
          severity: "medium",
          suggestion: "Add tenant_id filter to ensure tenant isolation",
        });
      }
    }
  }
}

function checkRlsPolicies(schemas: SchemaInfo[]): void {
  for (const schema of schemas) {
    for (const table of schema.tables) {
      const content = fs.readFileSync(table.file, "utf-8");
      
      // Check if table has tenant scope but no RLS
      if (table.hasTenantScope) {
        const hasRls = content.includes("pgPolicy") || content.includes("withRLS");
        
        if (!hasRls) {
          issues.push({
            file: table.relativePath,
            line: 1,
            rule: "missing-rls",
            message: `Tenant-scoped table "${table.name}" does not have RLS policies`,
            severity: "info",
            suggestion: "Consider adding RLS policies for defense-in-depth tenant isolation",
          });
        }
      }
    }
  }
}

function checkAuditCoverage(schemas: SchemaInfo[]): void {
  const auditedTables = new Set<string>();
  
  // Find tables with audit triggers
  for (const schema of schemas) {
    for (const table of schema.tables) {
      const content = fs.readFileSync(table.file, "utf-8");
      
      if (content.includes("audit") && content.includes("trigger")) {
        auditedTables.add(table.name);
      }
    }
  }
  
  // Check if required tables have audit
  for (const requiredTable of AUDIT_REQUIRED_TABLES) {
    if (!auditedTables.has(requiredTable)) {
      issues.push({
        file: `src/db/schema/*/`,
        line: 1,
        rule: "missing-audit",
        message: `Security-sensitive table "${requiredTable}" may not have audit logging`,
        severity: "medium",
        suggestion: "Add audit trigger to track changes to this table",
      });
    }
  }
}

function checkPasswordStorage(schemas: SchemaInfo[]): void {
  for (const schema of schemas) {
    for (const table of schema.tables) {
      const content = fs.readFileSync(table.file, "utf-8");
      
      // Check for password columns
      if (content.includes("password")) {
        // Check if it's stored as plain text
        if (content.match(/password.*text\(\)/i) && !content.includes("hash")) {
          issues.push({
            file: table.relativePath,
            line: findLineNumber(content, /password/i),
            rule: "plaintext-password",
            message: "Password column may be storing plaintext passwords",
            severity: "critical",
            cwe: "CWE-256",
            suggestion: "Store password hashes using bcrypt or argon2, not plaintext",
          });
        }
      }
    }
  }
}

function checkSensitiveDataExposure(schemas: SchemaInfo[]): void {
  const sensitiveColumns = ["ssn", "social_security", "credit_card", "card_number", "cvv", "pin"];
  
  for (const schema of schemas) {
    for (const table of schema.tables) {
      for (const col of table.columns) {
        const colLower = col.name.toLowerCase();
        
        for (const sensitive of sensitiveColumns) {
          if (colLower.includes(sensitive)) {
            issues.push({
              file: table.relativePath,
              line: col.line,
              rule: "sensitive-data",
              message: `Column "${col.name}" may contain sensitive PII/PCI data`,
              severity: "high",
              cwe: "CWE-359",
              suggestion: "Ensure this data is encrypted at rest and access is properly controlled",
            });
          }
        }
      }
    }
  }
}

function walkDir(dir: string, filter?: (file: string) => boolean): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      files.push(...walkDir(fullPath, filter));
    } else if (entry.name.endsWith(".ts")) {
      if (!filter || filter(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function main(): void {
  console.log("🔒 Security Validation\n");
  
  // Check schema files
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  // Check all TypeScript files for SQL injection and credentials
  const tsFiles = walkDir(path.join(process.cwd(), "src"));
  
  console.log(`Scanning ${tsFiles.length} TypeScript files...\n`);
  
  for (const file of tsFiles) {
    checkSqlInjection(file);
    checkHardcodedCredentials(file);
  }
  
  // Check migrations
  checkMigrationSecurity();
  
  // Check RLS policies
  checkRlsPolicies(schemas);
  
  // Check audit coverage
  checkAuditCoverage(schemas);
  
  // Check password storage
  checkPasswordStorage(schemas);
  
  // Check sensitive data
  checkSensitiveDataExposure(schemas);
  
  // Report results
  const critical = issues.filter(i => i.severity === "critical");
  const high = issues.filter(i => i.severity === "high");
  const medium = issues.filter(i => i.severity === "medium");
  const low = issues.filter(i => i.severity === "low");
  const info = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ Security validation passed!\n");
    process.exit(0);
  }
  
  console.log("Security issues found:\n");
  
  // Group by severity
  const bySeverity = [
    { name: "CRITICAL", items: critical, icon: "🚨" },
    { name: "HIGH", items: high, icon: "❌" },
    { name: "MEDIUM", items: medium, icon: "⚠️" },
    { name: "LOW", items: low, icon: "⚡" },
    { name: "INFO", items: info, icon: "ℹ️" },
  ];
  
  for (const { name, items, icon } of bySeverity) {
    if (items.length === 0) continue;
    
    console.log(`=== ${icon} ${name} (${items.length}) ===\n`);
    
    for (const issue of items) {
      console.log(`${icon} ${issue.file}:${issue.line}`);
      console.log(`   [${issue.rule}]${issue.cwe ? ` (${issue.cwe})` : ""}`);
      console.log(`   ${issue.message}`);
      console.log(`   💡 ${issue.suggestion}`);
      console.log();
    }
  }
  
  console.log("─".repeat(60));
  console.log(`\nSummary: ${critical.length} critical, ${high.length} high, ${medium.length} medium, ${low.length} low, ${info.length} info\n`);
  
  // Exit with error if critical or high issues found
  if (critical.length > 0 || high.length > 0 || (strictWarnings && medium.length > 0)) {
    process.exit(1);
  }
}

main();
