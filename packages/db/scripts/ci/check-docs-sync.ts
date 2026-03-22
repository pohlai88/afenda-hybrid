/**
 * Documentation Sync Checker
 *
 * Validates that schema documentation is in sync with actual schema:
 * - README files exist for each schema
 * - Table documentation matches actual tables
 * - Column documentation is up to date
 * - Custom SQL documentation matches registry
 *
 * @see docs/CI_GATES.md
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, SchemaInfo, TableInfo } from "../lib/schema-analyzer";

/** Repo root (directory containing pnpm-workspace.yaml), for monorepo docs paths. */
function resolveMonorepoRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

const SCHEMA_DIR = path.join(process.cwd(), "src/schema-platform");
const DOCS_DIR = path.join(resolveMonorepoRoot(), "docs");
const strictWarnings =
  process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface DocIssue {
  file: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

const issues: DocIssue[] = [];

function checkSchemaReadme(schema: SchemaInfo): void {
  const readmePath = path.join(schema.path, "README.md");

  if (!fs.existsSync(readmePath)) {
    issues.push({
      file: `src/schema-platform/${schema.name}/README.md`,
      rule: "missing-readme",
      message: `Schema "${schema.name}" is missing README.md`,
      severity: "info",
      suggestion: "Create README.md documenting the schema purpose, tables, and relationships",
    });
    return;
  }

  const content = fs.readFileSync(readmePath, "utf-8");

  // Check that all tables are documented
  for (const table of schema.tables) {
    if (!content.includes(table.name)) {
      issues.push({
        file: `src/schema-platform/${schema.name}/README.md`,
        rule: "undocumented-table",
        message: `Table "${table.name}" is not documented in README.md`,
        severity: "info",
        suggestion: `Add documentation for table "${table.name}" including purpose and key columns`,
      });
    }
  }

  // Check for outdated table references
  const tableMatches = content.matchAll(/##\s+(\w+)\s+Table/gi);
  for (const match of tableMatches) {
    const docTable = match[1].toLowerCase();
    const exists = schema.tables.some((t) => t.name.toLowerCase() === docTable);

    if (!exists) {
      issues.push({
        file: `src/schema-platform/${schema.name}/README.md`,
        rule: "outdated-table-doc",
        message: `Documentation references table "${match[1]}" which doesn't exist`,
        severity: "warning",
        suggestion: "Remove or update the outdated table documentation",
      });
    }
  }
}

function checkCustomSqlDocs(): void {
  const customSqlMdPath = path.join(SCHEMA_DIR, "audit", "CUSTOM_SQL.md");
  const registryPath = path.join(SCHEMA_DIR, "audit", "CUSTOM_SQL_REGISTRY.json");

  if (!fs.existsSync(registryPath)) {
    return; // Registry check is handled by check-custom-sql-registry.ts
  }

  if (!fs.existsSync(customSqlMdPath)) {
    issues.push({
      file: "src/schema-platform/audit/CUSTOM_SQL.md",
      rule: "missing-custom-sql-docs",
      message: "CUSTOM_SQL.md documentation file is missing",
      severity: "warning",
      suggestion: "Create CUSTOM_SQL.md documenting all custom SQL blocks",
    });
    return;
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as {
    entries?: Record<string, { purpose?: string }>;
  };
  const docContent = fs.readFileSync(customSqlMdPath, "utf-8");

  // Check that all registry entries are documented
  for (const [id, entry] of Object.entries(registry.entries || {})) {
    if (!docContent.includes(id)) {
      issues.push({
        file: "src/schema-platform/audit/CUSTOM_SQL.md",
        rule: "undocumented-custom-sql",
        message: `Custom SQL "${id}" is not documented in CUSTOM_SQL.md`,
        severity: "warning",
        suggestion: `Add documentation section for ${id}: ${entry.purpose ?? "(see registry)"}`,
      });
    }
  }
}

function checkArchitectureDocs(): void {
  const guidelinePath = path.join(DOCS_DIR, "architecture", "01-db-first-guideline.md");

  if (!fs.existsSync(guidelinePath)) {
    // Try alternative paths
    const altPaths = [
      path.join(DOCS_DIR, "01-db-first-guideline.md"),
      path.join(process.cwd(), "01-db-first-guideline.md"),
    ];

    const exists = altPaths.some((p) => fs.existsSync(p));

    if (!exists) {
      issues.push({
        file: "docs/architecture/01-db-first-guideline.md",
        rule: "missing-guideline",
        message: "DB-first guideline documentation is missing",
        severity: "info",
        suggestion: "Create the guideline document or update the path reference",
      });
    }
  }
}

function checkTableJsDoc(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");

  // Check for JSDoc comment before table definition
  const tableDefIndex = content.indexOf(".table(");
  if (tableDefIndex === -1) return;

  const beforeTable = content.substring(0, tableDefIndex);
  const lines = beforeTable.split("\n");

  let hasJsDoc = false;
  for (let i = lines.length - 1; i >= 0 && i >= lines.length - 10; i--) {
    const line = lines[i].trim();
    if (line.startsWith("/**") || line.startsWith("*") || line.endsWith("*/")) {
      hasJsDoc = true;
      break;
    }
    if (line.length > 0 && !line.startsWith("//") && !line.startsWith("export")) {
      break;
    }
  }

  if (!hasJsDoc) {
    issues.push({
      file: table.relativePath,
      rule: "missing-table-jsdoc",
      message: `Table "${table.name}" is missing JSDoc documentation`,
      severity: "info",
      suggestion: "Add JSDoc comment describing the table purpose and key fields",
    });
  }
}

function checkColumnComments(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");

  // Check for columns that should have comments
  const importantColumns = table.columns.filter(
    (c) =>
      c.name.includes("status") ||
      c.name.includes("type") ||
      c.name.includes("code") ||
      c.name.includes("flag")
  );

  for (const col of importantColumns) {
    const colIndex = content.indexOf(`${col.name}:`);
    if (colIndex === -1) continue;

    const beforeCol = content.substring(Math.max(0, colIndex - 100), colIndex);
    const hasComment = beforeCol.includes("//") || beforeCol.includes("/*");

    if (!hasComment) {
      issues.push({
        file: table.relativePath,
        rule: "missing-column-comment",
        message: `Column "${col.name}" in "${table.name}" should have a comment explaining its purpose`,
        severity: "info",
        suggestion: `Add comment: // ${col.name}: <description of valid values/purpose>`,
      });
    }
  }
}

function main(): void {
  console.log("🔍 Documentation Sync Check\n");

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("No schema directory found");
    process.exit(0);
  }

  const schemas = analyzeSchema(SCHEMA_DIR);

  // Check schema READMEs
  for (const schema of schemas) {
    checkSchemaReadme(schema);

    for (const table of schema.tables) {
      checkTableJsDoc(table);
      checkColumnComments(table);
    }
  }

  // Check custom SQL docs
  checkCustomSqlDocs();

  // Check architecture docs
  checkArchitectureDocs();

  // Report results
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  if (issues.length === 0) {
    console.log("✅ All documentation sync checks passed!\n");
    process.exit(0);
  }

  console.log("Issues found:\n");

  // Group by rule
  const byRule = issues.reduce(
    (acc, issue) => {
      if (!acc[issue.rule]) acc[issue.rule] = [];
      acc[issue.rule].push(issue);
      return acc;
    },
    {} as Record<string, DocIssue[]>
  );

  for (const [rule, ruleIssues] of Object.entries(byRule)) {
    console.log(`=== ${rule} (${ruleIssues.length}) ===\n`);

    for (const issue of ruleIssues) {
      const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`${icon} ${issue.file}`);
      console.log(`   ${issue.message}`);
      console.log(`   💡 ${issue.suggestion}`);
      console.log();
    }
  }

  console.log("─".repeat(60));
  console.log(
    `\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info(s)\n`
  );

  if (errors.length > 0 || (strictWarnings && warnings.length > 0)) {
    process.exit(1);
  }
}

main();
