/**
 * Shared Column Checker
 *
 * CI gate that enforces shared column mixin usage and detects duplicate
 * column patterns that should be promoted to _shared.
 *
 * Rules:
 * 1. MANDATORY columns (createdAt, updatedAt) MUST use timestampColumns mixin
 * 2. RECOMMENDED columns (deletedAt, tenantId, etc.) SHOULD use mixins (warning)
 * 3. Duplicate column patterns appearing 3+ times trigger promotion suggestion
 * 4. Exceptions in shared-exceptions.json bypass warnings
 *
 * Output includes inline diagnostics with:
 * - File path and line number
 * - Code snippet showing the problematic line
 * - Suggestion for fix
 *
 * Usage:
 *   pnpm check:shared
 *
 * @see docs/architecture/01-db-first-guideline.md
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const EXCEPTIONS_FILE = path.join(process.cwd(), "scripts/config/shared-exceptions.json");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

// Columns that MUST use shared mixins (error if manual)
const MANDATORY_SHARED = ["createdAt", "updatedAt"];

// Columns that SHOULD use shared mixins (warning if manual without exception)
const RECOMMENDED_SHARED = ["deletedAt", "createdBy", "updatedBy", "tenantId"];

// Mixin names for each column
const COLUMN_TO_MIXIN: Record<string, string> = {
  createdAt: "timestampColumns",
  updatedAt: "timestampColumns",
  deletedAt: "softDeleteColumns",
  createdBy: "auditColumns",
  updatedBy: "auditColumns",
  tenantId: "tenantScopedColumns",
};

// Rule names for exceptions
const COLUMN_TO_RULE: Record<string, string> = {
  createdAt: "use-timestamp-mixin",
  updatedAt: "use-timestamp-mixin",
  deletedAt: "use-softdelete-mixin",
  createdBy: "use-audit-mixin",
  updatedBy: "use-audit-mixin",
  tenantId: "use-tenant-mixin",
};

interface Exception {
  file: string;
  table: string;
  column: string;
  rule: string;
  reason: string;
  owner: string;
  date: string;
}

interface ExceptionsConfig {
  exceptions: Exception[];
}

interface Issue {
  file: string;
  line: number;
  column: number;
  table: string;
  columnName: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion?: string;
  codeSnippet?: string;
}

interface ColumnFingerprint {
  name: string;
  type: string;
  isNotNull: boolean;
  hasDefault: boolean;
  file: string;
  table: string;
  line: number;
}

const issues: Issue[] = [];
const columnFingerprints: ColumnFingerprint[] = [];

function loadExceptions(): Exception[] {
  if (!fs.existsSync(EXCEPTIONS_FILE)) {
    return [];
  }
  try {
    const content = fs.readFileSync(EXCEPTIONS_FILE, "utf-8");
    const config: ExceptionsConfig = JSON.parse(content);
    return config.exceptions || [];
  } catch {
    console.warn(`Warning: Could not parse ${EXCEPTIONS_FILE}`);
    return [];
  }
}

function isExcepted(exceptions: Exception[], file: string, table: string, column: string, rule: string): boolean {
  const relativePath = file.replace(/\\/g, "/");
  return exceptions.some(
    (e) =>
      relativePath.includes(e.file.replace(/\\/g, "/")) &&
      e.table === table &&
      e.column === column &&
      e.rule === rule
  );
}

function extractTableName(content: string): string | null {
  const match = content.match(/export\s+const\s+(\w+)\s*=\s*\w+\.table\s*\(\s*["'](\w+)["']/);
  return match ? match[2] : null;
}

function findLineNumber(content: string, searchStr: string): number {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return 1;
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

function extractColumnsWithLines(content: string): { name: string; line: string; lineNum: number; colNum: number }[] {
  const columns: { name: string; line: string; lineNum: number; colNum: number }[] = [];
  const lines = content.split("\n");

  const columnRegex = /^\s*(\w+):\s*(integer|text|varchar|boolean|timestamp|date|jsonb|json|bigint|smallint|real|doublePrecision|numeric|uuid)\s*\([^)]*\)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(columnRegex);
    if (match) {
      columns.push({
        name: match[1],
        line: lines[i],
        lineNum: i + 1,
        colNum: lines[i].indexOf(match[1]) + 1,
      });
    }
  }

  return columns;
}

function checkFile(filePath: string, exceptions: Exception[]): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");

  if (
    relativePath.includes("_shared") ||
    relativePath.endsWith("index.ts") ||
    relativePath.includes("_relations")
  ) {
    return;
  }

  const tableName = extractTableName(content);
  if (!tableName) return;

  const columns = extractColumnsWithLines(content);
  const usesMixin = (mixin: string) => content.includes(mixin);

  for (const col of columns) {
    const colName = col.name;

    // Check MANDATORY columns
    if (MANDATORY_SHARED.includes(colName)) {
      const mixin = COLUMN_TO_MIXIN[colName];
      const rule = COLUMN_TO_RULE[colName];

      if (!usesMixin(mixin)) {
        if (!isExcepted(exceptions, relativePath, tableName, colName, rule)) {
          issues.push({
            file: relativePath,
            line: col.lineNum,
            column: col.colNum,
            table: tableName,
            columnName: colName,
            rule,
            message: `Column "${colName}" MUST use ${mixin} mixin`,
            severity: "error",
            suggestion: `Replace manual definition with ...${mixin}`,
            codeSnippet: getCodeSnippet(content, col.lineNum),
          });
        }
      }
    }

    // Check RECOMMENDED columns
    if (RECOMMENDED_SHARED.includes(colName)) {
      const mixin = COLUMN_TO_MIXIN[colName];
      const rule = COLUMN_TO_RULE[colName];

      if (!usesMixin(mixin)) {
        if (!isExcepted(exceptions, relativePath, tableName, colName, rule)) {
          const hasJustification = content.includes(`${colName}:`) && 
            (content.includes("// explicit") || content.includes("// Explicit"));

          if (!hasJustification) {
            issues.push({
              file: relativePath,
              line: col.lineNum,
              column: col.colNum,
              table: tableName,
              columnName: colName,
              rule,
              message: `Column "${colName}" should use ${mixin} mixin or have exception`,
              severity: "warning",
              suggestion: `Use ...${mixin} or add exception to shared-exceptions.json`,
              codeSnippet: getCodeSnippet(content, col.lineNum),
            });
          }
        }
      }
    }

    // Collect fingerprints for duplication detection
    const typeMatch = col.line.match(/(integer|text|varchar|boolean|timestamp|date|jsonb|json|bigint|smallint|real|doublePrecision|numeric|uuid)/);
    if (typeMatch) {
      columnFingerprints.push({
        name: colName,
        type: typeMatch[1],
        isNotNull: col.line.includes(".notNull()"),
        hasDefault: col.line.includes(".default") || col.line.includes(".defaultNow()"),
        file: relativePath,
        table: tableName,
        line: col.lineNum,
      });
    }
  }
}

function detectDuplicatePatterns(): void {
  const fingerprints = new Map<string, ColumnFingerprint[]>();

  for (const col of columnFingerprints) {
    if ([...MANDATORY_SHARED, ...RECOMMENDED_SHARED].includes(col.name)) {
      continue;
    }

    const key = `${col.name}:${col.type}:${col.isNotNull}:${col.hasDefault}`;
    if (!fingerprints.has(key)) {
      fingerprints.set(key, []);
    }
    fingerprints.get(key)!.push(col);
  }

  // Report duplicates appearing 3+ times
  for (const [key, cols] of fingerprints) {
    if (cols.length >= 3) {
      const [name, type] = key.split(":");
      const locations = cols.map((c) => `  - ${c.file}:${c.line} (${c.table})`).join("\n");

      issues.push({
        file: "multiple",
        line: 0,
        column: 0,
        table: "multiple",
        columnName: name,
        rule: "promote-to-shared",
        message: `Column "${name}" (${type}) appears in ${cols.length} tables - consider promoting to _shared`,
        severity: "info",
        suggestion: `Locations:\n${locations}`,
      });
    }
  }

  // Report duplicates appearing 5+ times as warnings
  for (const [key, cols] of fingerprints) {
    if (cols.length >= 5) {
      const [name, type] = key.split(":");
      const locations = cols.map((c) => `  - ${c.file}:${c.line} (${c.table})`).join("\n");

      issues.push({
        file: "multiple",
        line: 0,
        column: 0,
        table: "multiple",
        columnName: name,
        rule: "duplicate-column-pattern",
        message: `Column "${name}" (${type}) appears in ${cols.length} tables - SHOULD be in _shared`,
        severity: "warning",
        suggestion: `Add to _shared and refactor:\n${locations}`,
      });
    }
  }
}

function walkDir(dir: string, callback: (file: string) => void): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      callback(fullPath);
    }
  }
}

function formatDiagnostic(issue: Issue): string {
  const lines: string[] = [];
  const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
  
  // File location (IDE-clickable format)
  if (issue.line > 0) {
    lines.push(`${icon} ${issue.file}:${issue.line}:${issue.column}`);
  } else {
    lines.push(`${icon} ${issue.file}`);
  }
  
  // Rule and table context
  lines.push(`   [${issue.rule}] ${issue.table}.${issue.columnName}`);
  
  // Message
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
  console.log("🔍 Checking shared column usage...\n");

  const exceptions = loadExceptions();
  console.log(`Loaded ${exceptions.length} exception(s) from config\n`);

  walkDir(SCHEMA_DIR, (file) => checkFile(file, exceptions));
  detectDuplicatePatterns();

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  if (issues.length === 0) {
    console.log("✅ All shared column checks passed!\n");
    process.exit(0);
  }

  console.log("Issues found:\n");

  if (errors.length > 0) {
    console.log("=== ERRORS (must fix) ===\n");
    for (const issue of errors) {
      console.log(formatDiagnostic(issue));
      console.log();
    }
  }

  if (warnings.length > 0) {
    console.log("=== WARNINGS (should fix) ===\n");
    for (const issue of warnings) {
      console.log(formatDiagnostic(issue));
      console.log();
    }
  }

  if (infos.length > 0) {
    console.log("=== INFO (suggestions) ===\n");
    for (const issue of infos) {
      console.log(formatDiagnostic(issue));
      console.log();
    }
  }

  console.log("─".repeat(60));
  console.log(`\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info(s)`);

  if (errors.length > 0 || (strictWarnings && warnings.length > 0)) {
    console.log("\n❌ Shared column check FAILED");
    console.log("   Fix errors or add exceptions to scripts/config/shared-exceptions.json\n");
    if (strictWarnings && warnings.length > 0 && errors.length === 0) {
      console.log("   Strict mode enabled: warnings are treated as failures\n");
    }
    process.exit(1);
  }

  console.log("\n✅ Shared column check passed (with warnings/info)\n");
}

main();
