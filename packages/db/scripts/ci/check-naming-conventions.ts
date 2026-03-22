/**
 * Validates schema naming conventions per DB-first guideline.
 *
 * Rules:
 * - Schema names: lowercase, short (core, hr, finance)
 * - Table names: singular or plural noun, consistent per schema
 * - Column names: camelCase in TS (auto-mapped to snake_case)
 * - Primary keys: {entity}Id pattern
 * - Foreign keys: fk_{table}_{reference} or inline
 * - Indexes: idx_{table}_{columns}
 *
 * Output includes inline diagnostics with:
 * - File path and line number (IDE-clickable)
 * - Code snippet showing the problematic line
 * - Suggestion for fix
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/schema-platform");
const strictWarnings =
  process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface ValidationError {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: "error" | "warning";
  codeSnippet?: string;
  suggestion?: string;
}

const errors: ValidationError[] = [];

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_shared") continue;
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.startsWith("_")) {
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

function checkFile(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");

  // Check schema naming (pgSchema declarations)
  const schemaMatches = content.matchAll(/pgSchema\(["'](\w+)["']\)/g);
  for (const match of schemaMatches) {
    const name = match[1];
    if (name && name !== name.toLowerCase()) {
      const loc = findLineAndColumn(content, match[0]);
      errors.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        rule: "schema-lowercase",
        message: `Schema name "${name}" should be lowercase`,
        severity: "error",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Change to: pgSchema("${name.toLowerCase()}")`,
      });
    }
  }

  // Check table naming
  const tableMatches = content.matchAll(/\.table\(["'](\w+)["']/g);
  for (const match of tableMatches) {
    const name = match[1];
    if (name) {
      if (name !== name.toLowerCase() && !name.includes("_")) {
        const loc = findLineAndColumn(content, match[0]);
        const suggested = name
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "");
        errors.push({
          file: relativePath,
          line: loc.line,
          column: loc.column,
          rule: "table-snake-case",
          message: `Table name "${name}" should be snake_case`,
          severity: "warning",
          codeSnippet: getCodeSnippet(content, loc.line),
          suggestion: `Change to: .table("${suggested}", ...)`,
        });
      }
    }
  }

  // Check primary key naming
  const pkMatches = content.matchAll(/(\w+):\s*integer\(\)\.primaryKey\(\)/g);
  for (const match of pkMatches) {
    const colName = match[1];
    if (colName && !colName.endsWith("Id")) {
      const loc = findLineAndColumn(content, match[0]);
      errors.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        rule: "pk-naming",
        message: `Primary key "${colName}" should follow {entity}Id pattern`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Rename to: ${colName}Id or use entity-specific name like userId, orderId`,
      });
    }
  }

  // Check index naming
  const indexMatches = content.matchAll(/index\(["'](\w+)["']\)/g);
  for (const match of indexMatches) {
    const name = match[1];
    if (name && !name.startsWith("idx_")) {
      const loc = findLineAndColumn(content, match[0]);
      errors.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        rule: "index-naming",
        message: `Index "${name}" should start with "idx_"`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Rename to: idx_${name.replace(/^idx_?/, "")}`,
      });
    }
  }

  // Check uniqueIndex naming
  const uqMatches = content.matchAll(/uniqueIndex\(["'](\w+)["']\)/g);
  for (const match of uqMatches) {
    const name = match[1];
    if (name && !name.startsWith("uq_") && !name.startsWith("idx_")) {
      const loc = findLineAndColumn(content, match[0]);
      errors.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        rule: "unique-index-naming",
        message: `Unique index "${name}" should start with "uq_" or "idx_"`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Rename to: uq_${name.replace(/^(uq_|idx_)?/, "")}`,
      });
    }
  }

  // Check foreign key naming
  const fkMatches = content.matchAll(/foreignKey\(\{[^}]*name:\s*["'](\w+)["']/g);
  for (const match of fkMatches) {
    const name = match[1];
    if (name && !name.startsWith("fk_")) {
      const loc = findLineAndColumn(content, `name: "${name}"`);
      errors.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        rule: "fk-naming",
        message: `Foreign key "${name}" should start with "fk_"`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Rename to: fk_${name.replace(/^fk_?/, "")}`,
      });
    }
  }

  // Check enum naming
  const enumMatches = content.matchAll(/\.enum\(["'](\w+)["']/g);
  for (const match of enumMatches) {
    const name = match[1];
    if (name && name !== name.toLowerCase()) {
      const loc = findLineAndColumn(content, match[0]);
      errors.push({
        file: relativePath,
        line: loc.line,
        column: loc.column,
        rule: "enum-naming",
        message: `Enum "${name}" should be snake_case`,
        severity: "warning",
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Rename to: ${name
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "")}`,
      });
    }
  }
}

function formatDiagnostic(error: ValidationError): string {
  const lines: string[] = [];
  const icon = error.severity === "error" ? "❌" : "⚠️";

  // File location (IDE-clickable format)
  lines.push(`${icon} ${error.file}:${error.line}:${error.column}`);

  // Rule
  lines.push(`   [${error.rule}] ${error.message}`);

  // Code snippet
  if (error.codeSnippet) {
    lines.push("");
    lines.push(
      error.codeSnippet
        .split("\n")
        .map((l) => `   ${l}`)
        .join("\n")
    );
    lines.push("");
  }

  // Suggestion
  if (error.suggestion) {
    lines.push(`   💡 ${error.suggestion}`);
  }

  return lines.join("\n");
}

function main(): void {
  console.log("🔍 Checking naming conventions...\n");

  const files = walkDir(SCHEMA_DIR);

  if (files.length === 0) {
    console.log("ℹ️ No schema files found");
    process.exit(0);
  }

  files.forEach(checkFile);

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  if (errors.length > 0) {
    console.log("Issues found:\n");

    // Group by file
    const byFile = errors.reduce(
      (acc, err) => {
        if (!acc[err.file]) acc[err.file] = [];
        acc[err.file].push(err);
        return acc;
      },
      {} as Record<string, ValidationError[]>
    );

    for (const [file, fileErrors] of Object.entries(byFile)) {
      console.log(`── ${file} ──\n`);
      for (const error of fileErrors) {
        console.log(formatDiagnostic(error));
        console.log();
      }
    }

    console.log("─".repeat(60));
    console.log(`\nSummary: ${errorCount} error(s), ${warningCount} warning(s)`);

    if (errorCount > 0 || (strictWarnings && warningCount > 0)) {
      if (strictWarnings && warningCount > 0 && errorCount === 0) {
        console.log("\n❌ Strict mode: warnings are treated as failures");
      }
      process.exit(1);
    }
  } else {
    console.log("✅ All naming conventions passed!");
  }
}

main();
