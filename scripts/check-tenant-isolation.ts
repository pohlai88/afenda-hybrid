/**
 * Validates tenant isolation patterns per DB-first guideline Section 6.
 * 
 * Rules:
 * - Tenant-scoped tables MUST include tenantId
 * - tenantId MUST have FK to core.tenants
 * - Unique constraints MUST include tenantId
 * - Indexes should have tenantId as leading column
 * 
 * Output includes inline diagnostics with:
 * - File path and line number (IDE-clickable)
 * - Code snippet showing the problematic line
 * - Suggestion for fix
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface IsolationIssue {
  file: string;
  line: number;
  column: number;
  table: string;
  rule: string;
  message: string;
  severity: "error" | "warning";
  codeSnippet?: string;
  suggestion?: string;
}

const issues: IsolationIssue[] = [];

// Tables that don't need tenant isolation
const EXEMPT_TABLES = [
  "tenants",
  "regions",
  "locations",
  "audit_trail",
  "traces",
];

// Schemas that are tenant-scoped by default
const TENANT_SCOPED_SCHEMAS = ["hr", "finance", "projects", "security"];

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_shared") continue;
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.startsWith("_") && entry.name !== "index.ts") {
      files.push(fullPath);
    }
  }
  return files;
}

function getSchemaFromPath(filePath: string): string | null {
  const match = filePath.match(/schema[\/\\](\w+)/);
  return match ? match[1] : null;
}

function findLineAndColumn(content: string, searchStr: string): { line: number; column: number } {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const col = lines[i].indexOf(searchStr);
    if (col !== -1) {
      return { line: i + 1, column: col + 1 };
    }
  }
  return { line: 1, column: 1 };
}

function getCodeSnippet(content: string, lineNum: number, context: number = 1): string {
  const lines = content.split("\n");
  const start = Math.max(0, lineNum - 1 - context);
  const end = Math.min(lines.length, lineNum + context);
  
  const snippetLines: string[] = [];
  for (let i = start; i < end; i++) {
    const prefix = i === lineNum - 1 ? ">" : " ";
    const lineNumStr = String(i + 1).padStart(4, " ");
    snippetLines.push(`${prefix} ${lineNumStr} | ${lines[i]}`);
  }
  return snippetLines.join("\n");
}

function getTableName(content: string): { name: string; line: number; column: number } | null {
  const match = content.match(/\.table\(["'](\w+)["']/);
  if (!match) return null;
  
  const loc = findLineAndColumn(content, match[0]);
  return { name: match[1], ...loc };
}

function checkTenantIsolation(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  
  if (!content.includes(".table(")) {
    return;
  }

  const schemaName = getSchemaFromPath(filePath);
  const tableInfo = getTableName(content);

  if (!tableInfo) return;
  const tableName = tableInfo.name;

  // Skip exempt tables
  if (EXEMPT_TABLES.includes(tableName)) {
    return;
  }

  // Check if this schema should be tenant-scoped
  const shouldBeTenantScoped = schemaName && TENANT_SCOPED_SCHEMAS.includes(schemaName);

  // Check for tenantId presence
  const hasTenantId = content.includes("tenantId") || content.includes("tenantScopedColumns");

  if (shouldBeTenantScoped && !hasTenantId) {
    issues.push({
      file: relativePath,
      line: tableInfo.line,
      column: tableInfo.column,
      table: tableName,
      rule: "tenant-id-required",
      message: `Table in ${schemaName} schema must include tenantId`,
      severity: "error",
      codeSnippet: getCodeSnippet(content, tableInfo.line),
      suggestion: "Add ...tenantScopedColumns from _shared/tenantScope.ts",
    });
    return;
  }

  if (!hasTenantId) {
    return;
  }

  // Check for FK constraint on tenantId
  const hasTenantFK = 
    content.includes(".references(() => tenants.tenantId)") ||
    content.includes("foreignColumns: [tenants.tenantId]") ||
    content.includes("tenantScopedColumns");

  if (!hasTenantFK) {
    const tenantIdLoc = findLineAndColumn(content, "tenantId:");
    issues.push({
      file: relativePath,
      line: tenantIdLoc.line,
      column: tenantIdLoc.column,
      table: tableName,
      rule: "tenant-fk-required",
      message: "tenantId must have a foreign key constraint to core.tenants",
      severity: "error",
      codeSnippet: getCodeSnippet(content, tenantIdLoc.line),
      suggestion: "Add .references(() => tenants.tenantId) or use tenantScopedColumns mixin",
    });
  }

  // Check unique constraints include tenantId
  const uniqueMatches = content.matchAll(/unique(?:Index)?\(["']([^"']+)["']\)[^;]*\.on\(([^)]+)\)/g);
  for (const match of uniqueMatches) {
    const indexName = match[1];
    const columns = match[2];
    if (!columns.includes("tenantId")) {
      const loc = findLineAndColumn(content, match[0]);
      issues.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        table: tableName,
        rule: "unique-includes-tenant",
        message: `Unique constraint "${indexName}" should include tenantId`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line, 2),
        suggestion: "Add t.tenantId as the first column in the unique constraint",
      });
    }
  }

  // Check .unique() inline constraints
  const inlineUniqueMatches = content.matchAll(/(\w+):[^,\n]+\.unique\(\)/g);
  for (const match of inlineUniqueMatches) {
    const colName = match[1];
    if (colName && colName !== "tenantId") {
      const loc = findLineAndColumn(content, match[0]);
      issues.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        table: tableName,
        rule: "inline-unique-warning",
        message: `Inline .unique() on "${colName}" doesn't include tenantId`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: "Replace with composite uniqueIndex including tenantId:\n   uniqueIndex('uq_table_column').on(t.tenantId, t.column)",
      });
    }
  }

  // Check indexes have tenantId as leading column
  const indexMatches = content.matchAll(/index\(["']([^"']+)["']\)[^;]*\.on\(([^)]+)\)/g);
  for (const match of indexMatches) {
    const indexName = match[1];
    const columns = match[2];
    const firstCol = columns.split(",")[0].trim();
    if (!firstCol.includes("tenantId")) {
      const loc = findLineAndColumn(content, match[0]);
      issues.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        table: tableName,
        rule: "tenant-index-leading",
        message: `Index "${indexName}" should have tenantId as leading column`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line, 2),
        suggestion: "Reorder columns: .on(t.tenantId, ...other columns)",
      });
    }
  }
}

function formatDiagnostic(issue: IsolationIssue): string {
  const lines: string[] = [];
  const icon = issue.severity === "error" ? "❌" : "⚠️";
  
  // File location (IDE-clickable format)
  lines.push(`${icon} ${issue.file}:${issue.line}:${issue.column}`);
  
  // Rule and table
  lines.push(`   [${issue.rule}] Table: ${issue.table}`);
  lines.push(`   ${issue.message}`);
  
  // Code snippet
  if (issue.codeSnippet) {
    lines.push("");
    lines.push(issue.codeSnippet.split("\n").map(l => `   ${l}`).join("\n"));
    lines.push("");
  }
  
  // Suggestion
  if (issue.suggestion) {
    lines.push(`   💡 ${issue.suggestion}`);
  }
  
  return lines.join("\n");
}

function main(): void {
  console.log("🔍 Checking tenant isolation patterns...\n");

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("ℹ️ No schema directory found");
    process.exit(0);
  }

  const files = walkDir(SCHEMA_DIR);
  files.forEach(checkTenantIsolation);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  if (issues.length > 0) {
    console.log("Tenant isolation issues found:\n");
    
    // Group by file
    const byFile = issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, IsolationIssue[]>);

    for (const [file, fileIssues] of Object.entries(byFile)) {
      console.log(`── ${file} ──\n`);
      for (const issue of fileIssues) {
        console.log(formatDiagnostic(issue));
        console.log();
      }
    }

    console.log("─".repeat(60));
    console.log(`\nSummary: ${errorCount} error(s), ${warningCount} warning(s)`);
    console.log("\nRefer to docs/architecture/01-db-first-guideline.md Section 6 for details.");
    
    if (errorCount > 0 || (strictWarnings && warningCount > 0)) {
      if (strictWarnings && warningCount > 0 && errorCount === 0) {
        console.log("\n❌ Strict mode: warnings are treated as failures");
      }
      process.exit(1);
    }
  } else {
    console.log("✅ All tenant isolation checks passed!");
  }
}

main();
