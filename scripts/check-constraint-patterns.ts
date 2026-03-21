/**
 * Validates constraint patterns per DB-first guideline Section 7.
 * 
 * Constraint hierarchy (in order of preference):
 * 1. NOT NULL
 * 2. CHECK
 * 3. UNIQUE
 * 4. Foreign Keys
 * 5. Triggers (only when declarative constraints can't express the invariant)
 * 
 * Output includes inline diagnostics with:
 * - File path and line number (IDE-clickable)
 * - Code snippet showing the problematic line
 * - Suggestion for fix
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema-platform");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

// Columns that are intentionally nullable (scope fields in audit)
const NULLABLE_COLUMN_EXEMPT: Record<string, string[]> = {
  retention_policies: ["schemaName", "tableName"],
};

// Enum columns that intentionally don't have defaults (set by trigger/application)
const ENUM_NO_DEFAULT_EXEMPT: Record<string, string[]> = {
  audit_trail: ["operation"], // Always explicitly set by trigger
};

/** Only primary lifecycle enum columns need a DB default per §7 — not historical `previousStatus` / `newStatus` pairs. */
function enumColumnExpectsDatabaseDefault(colName: string): boolean {
  const n = colName.toLowerCase();
  if (/^(previous|new|old|prior|next)/i.test(colName)) return false;
  return n === "status" || n.endsWith("status") || n === "state" || n.endsWith("state");
}

/** Optional human names / labels that match *Name heuristics but are intentionally nullable */
const OPTIONAL_NAME_LIKE_COLUMNS = new Set([
  "middleName",
  "vendorName",
  "providerName",
  "branchName",
  "schemeName",
]);

/** Optional *Code fields matched by required heuristics */
const OPTIONAL_CODE_LIKE_COLUMNS = new Set(["postalCode", "bankCode"]);

interface ConstraintIssue {
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

const issues: ConstraintIssue[] = [];

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

function getTableName(content: string): string | null {
  // Match .table("name" or .table(\n  "name" (handles multiline)
  const match = content.match(/\.table\(\s*["'](\w+)["']/);
  return match ? match[1] : null;
}

function checkConstraintPatterns(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  
  if (!content.includes(".table(")) {
    return;
  }

  const tableName = getTableName(content) || "unknown";

  // Check for soft delete pattern with partial unique index
  const hasSoftDelete = content.includes("deletedAt") || content.includes("softDeleteColumns");
  const hasUniqueConstraint = content.includes(".unique()") || content.includes("uniqueIndex(");
  
  if (hasSoftDelete && hasUniqueConstraint) {
    const uniqueMatches = content.matchAll(/uniqueIndex\(["']([^"']+)["']\)[^;]+/g);
    for (const match of uniqueMatches) {
      const indexName = match[1];
      const fullMatch = match[0];
      if (!fullMatch.includes(".where(") || !fullMatch.includes("deletedAt")) {
        const loc = findLineAndColumn(content, `uniqueIndex("${indexName}"`);
        issues.push({
          file: relativePath,
          line: loc.line,
          column: loc.column,
          table: tableName,
          rule: "soft-delete-unique",
          message: `Unique index "${indexName}" on soft-delete table should use partial index pattern`,
          severity: "warning",
          codeSnippet: getCodeSnippet(content, loc.line, 2),
          suggestion: "Add .where(sql`${t.deletedAt} IS NULL`) to exclude soft-deleted rows",
        });
      }
    }
  }

  // Check for CHECK constraints on enum-like columns
  const statusMatches = content.matchAll(/(\w+Status|\w+Type|\w+State):\s*text\(\)/g);
  for (const match of statusMatches) {
    const colName = match[1];
    if (colName && !content.includes(`check(`) && !content.includes(`Enum`)) {
      const loc = findLineAndColumn(content, match[0]);
      issues.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        table: tableName,
        rule: "enum-or-check",
        message: `Column "${colName}" looks like an enum - use pgEnum or CHECK constraint`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: "Use pgEnum for stable value sets, CHECK for table-local validation",
      });
    }
  }

  // Check for missing NOT NULL on required-looking columns
  const requiredPatterns = [
    { pattern: /(\w+Code):\s*text\(\)(?![^,\n]*\.notNull\(\))/, name: "Code" },
    { pattern: /(\w+Name):\s*text\(\)(?![^,\n]*\.notNull\(\))/, name: "Name" },
    { pattern: /(\w+Email):\s*text\(\)(?![^,\n]*\.notNull\(\))/, name: "Email" },
  ];

  for (const { pattern, name } of requiredPatterns) {
    const match = content.match(pattern);
    if (match) {
      const colName = match[1];
      // Check if column is exempt for this table
      const tableExempt = NULLABLE_COLUMN_EXEMPT[tableName] || [];
      if (tableExempt.includes(colName)) continue;
      if (name === "Name" && OPTIONAL_NAME_LIKE_COLUMNS.has(colName)) continue;
      if (name === "Code" && OPTIONAL_CODE_LIKE_COLUMNS.has(colName)) continue;

      const loc = findLineAndColumn(content, match[0]);
      issues.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        table: tableName,
        rule: "required-not-null",
        message: `Column "${colName}" (${name} field) appears required but missing .notNull()`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Add .notNull() after text(): ${colName}: text().notNull()`,
      });
    }
  }

  // Check for default values on status/type columns
  const enumColMatches = content.matchAll(/(\w+):\s*(\w+Enum)\(\)(?![^,\n]*\.default\()/g);
  const enumNoDefaultExempt = ENUM_NO_DEFAULT_EXEMPT[tableName] || [];
  
  for (const match of enumColMatches) {
    const colName = match[1];
    const enumName = match[2];

    if (!enumColumnExpectsDatabaseDefault(colName)) continue;

    // Nullable enums: no DB default required (see chained `.notNull()` after `Enum()`)
    const afterEnum = content.slice(match.index, Math.min(content.length, match.index + 100));
    if (!afterEnum.includes(".notNull()")) continue;
    
    // Skip if this column is exempt from default requirement
    if (enumNoDefaultExempt.includes(colName)) continue;
    
    const loc = findLineAndColumn(content, match[0]);
    issues.push({
      file: relativePath,
      line: loc.line,
      column: loc.column,
      table: tableName,
      rule: "enum-default",
      message: `Enum column "${colName}" (${enumName}) should have a .default() value`,
      severity: "warning",
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: `Add .default("ACTIVE") or appropriate default value`,
    });
  }

  // Check for proper FK actions
  const fkWithoutActionsMatches = content.matchAll(/\.references\(\s*\(\)\s*=>\s*(\w+)\.(\w+)\s*\)(?!\s*,\s*\{)/g);
  for (const match of fkWithoutActionsMatches) {
    const refTable = match[1];
    const refCol = match[2];
    const loc = findLineAndColumn(content, match[0]);
    issues.push({
      file: relativePath,
      line: loc.line,
      column: loc.column,
      table: tableName,
      rule: "fk-actions",
      message: `Foreign key to ${refTable}.${refCol} should specify onDelete/onUpdate actions`,
      severity: "warning",
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: `Add options: .references(() => ${refTable}.${refCol}, { onDelete: 'restrict', onUpdate: 'cascade' })`,
    });
  }

  // Check for numeric precision on financial columns
  const moneyPatterns = [
    { pattern: /(\w*amount\w*):\s*(real|doublePrecision)\(\)/i, type: "amount" },
    { pattern: /(\w*price\w*):\s*(real|doublePrecision)\(\)/i, type: "price" },
    { pattern: /(\w*cost\w*):\s*(real|doublePrecision)\(\)/i, type: "cost" },
    { pattern: /(\w*total\w*):\s*(real|doublePrecision)\(\)/i, type: "total" },
    { pattern: /(\w*balance\w*):\s*(real|doublePrecision)\(\)/i, type: "balance" },
  ];

  for (const { pattern, type } of moneyPatterns) {
    const match = content.match(pattern);
    if (match) {
      const colName = match[1];
      const colType = match[2];
      const loc = findLineAndColumn(content, match[0]);
      issues.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        table: tableName,
        rule: "numeric-for-money",
        message: `Financial column "${colName}" (${type}) should use numeric() not ${colType}()`,
        severity: "error",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Change to: ${colName}: numeric({ precision: 12, scale: 2 })`,
      });
    }
  }

  // Check for timestamp with timezone
  if (content.includes("timestamp()") && !content.includes("withTimezone")) {
    const loc = findLineAndColumn(content, "timestamp()");
    issues.push({
      file: relativePath,
      line: loc.line,
      column: loc.column,
      table: tableName,
      rule: "timestamp-timezone",
      message: "Timestamps should use withTimezone: true for proper timezone handling",
      severity: "warning",
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: "Change to: timestamp({ withTimezone: true })",
    });
  }

  // Check for generated columns pattern
  const generatedMatches = content.matchAll(/generatedAlwaysAs\([^)]+\)(?![^,\n]*\.stored\(\))/g);
  for (const match of generatedMatches) {
    const loc = findLineAndColumn(content, match[0]);
    issues.push({
      file: relativePath,
      line: loc.line,
      column: loc.column,
      table: tableName,
      rule: "generated-stored",
      message: "Generated columns should specify .stored() for compatibility",
      severity: "warning",
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: "Add .stored() after generatedAlwaysAs(...)",
    });
  }
}

function formatDiagnostic(issue: ConstraintIssue): string {
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
  console.log("🔍 Checking constraint patterns...\n");

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("ℹ️ No schema directory found");
    process.exit(0);
  }

  const files = walkDir(SCHEMA_DIR);
  files.forEach(checkConstraintPatterns);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  if (issues.length > 0) {
    console.log("Constraint pattern issues found:\n");
    
    // Group by file
    const byFile = issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, ConstraintIssue[]>);

    for (const [file, fileIssues] of Object.entries(byFile)) {
      console.log(`── ${file} ──\n`);
      for (const issue of fileIssues) {
        console.log(formatDiagnostic(issue));
        console.log();
      }
    }

    console.log("─".repeat(60));
    console.log(`\nSummary: ${errorCount} error(s), ${warningCount} warning(s)`);
    console.log("\nRefer to docs/architecture/01-db-first-guideline.md Section 7 for details.");
    
    if (errorCount > 0 || (strictWarnings && warningCount > 0)) {
      if (strictWarnings && warningCount > 0 && errorCount === 0) {
        console.log("\n❌ Strict mode: warnings are treated as failures");
      }
      process.exit(1);
    }
  } else {
    console.log("✅ All constraint pattern checks passed!");
  }
}

main();
