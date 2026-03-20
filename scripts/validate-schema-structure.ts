/**
 * Validates schema structure per DB-first guideline.
 * 
 * Rules:
 * - Each schema directory has an index.ts barrel export
 * - Each schema has a _relations.ts file (if tables exist)
 * - Tables export type definitions
 * - Proper tier organization (core, security, audit = Tier 1-2, others = Tier 3)
 * 
 * Output includes inline diagnostics with:
 * - File path and line number (IDE-clickable)
 * - Code snippet showing the problematic area
 * - Suggestion for fix
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

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

const TIER_1_2_SCHEMAS = ["core", "security", "audit", "observability"];

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

function checkSchemaDirectory(schemaPath: string, schemaName: string): void {
  const relativePath = path.relative(process.cwd(), schemaPath).replace(/\\/g, "/");

  // Check for index.ts
  const indexPath = path.join(schemaPath, "index.ts");
  if (!fs.existsSync(indexPath)) {
    errors.push({
      file: `${relativePath}/index.ts`,
      line: 1,
      column: 1,
      rule: "barrel-export",
      message: `Missing index.ts barrel export in ${schemaName}`,
      severity: "error",
      suggestion: `Create index.ts with exports for all tables and _relations in ${schemaName}`,
    });
  } else {
    // Check if index.ts exports all table files
    const indexContent = fs.readFileSync(indexPath, "utf-8");
    const files = fs.readdirSync(schemaPath);
    const tableFiles = files.filter(
      (f) => f.endsWith(".ts") && !f.startsWith("_") && f !== "index.ts"
    );
    
    for (const tableFile of tableFiles) {
      const baseName = tableFile.replace(".ts", "");
      if (!indexContent.includes(`"./${baseName}"`) && !indexContent.includes(`'./${baseName}'`)) {
        const loc = findLineAndColumn(indexContent, "export");
        errors.push({
          file: `${relativePath}/index.ts`,
          line: loc.line,
          column: loc.column,
          rule: "barrel-completeness",
          message: `Table "${baseName}" not exported from index.ts`,
          severity: "warning",
          codeSnippet: getCodeSnippet(indexContent, loc.line),
          suggestion: `Add: export * from "./${baseName}";`,
        });
      }
    }
  }

  // Check for _relations.ts if tables exist
  const files = fs.readdirSync(schemaPath);
  const hasTableFiles = files.some(
    (f) => f.endsWith(".ts") && !f.startsWith("_") && f !== "index.ts"
  );

  if (hasTableFiles) {
    const relationsPath = path.join(schemaPath, "_relations.ts");
    if (!fs.existsSync(relationsPath)) {
      errors.push({
        file: `${relativePath}/_relations.ts`,
        line: 1,
        column: 1,
        rule: "relations-file",
        message: `Missing _relations.ts in ${schemaName} (has table definitions)`,
        severity: "warning",
        suggestion: `Create _relations.ts with defineRelations() for tables in ${schemaName}`,
      });
    }
  }

  // Check table files for required exports
  files
    .filter((f) => f.endsWith(".ts") && !f.startsWith("_") && f !== "index.ts")
    .forEach((tableFile) => {
      const tablePath = path.join(schemaPath, tableFile);
      const content = fs.readFileSync(tablePath, "utf-8");
      const tableRelPath = `${relativePath}/${tableFile}`;

      // Check for table or view export (tables, views, materialized views are all valid)
      const hasTableOrView = content.includes("export const") && 
        (content.includes(".table(") || 
         content.includes(".view(") || 
         content.includes(".materializedView("));
      
      if (!hasTableOrView) {
        errors.push({
          file: tableRelPath,
          line: 1,
          column: 1,
          rule: "table-export",
          message: `No table/view export found in ${tableFile}`,
          severity: "error",
          suggestion: `Add: export const tableName = schema.table("table_name", { ... });`,
        });
      }

      // Check for type exports
      if (!content.includes("$inferSelect") && !content.includes("type ")) {
        const loc = findLineAndColumn(content, "export const");
        errors.push({
          file: tableRelPath,
          line: loc.line,
          column: loc.column,
          rule: "type-export",
          message: `Missing type export (use $inferSelect) in ${tableFile}`,
          severity: "warning",
          codeSnippet: getCodeSnippet(content, loc.line),
          suggestion: `Add at end of file:\nexport type TableName = typeof tableName.$inferSelect;\nexport type NewTableName = typeof tableName.$inferInsert;`,
        });
      }
    });
}

function checkTierStructure(): void {
  const entries = fs.readdirSync(SCHEMA_DIR, { withFileTypes: true });
  
  entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .forEach((entry) => {
      const schemaName = entry.name;
      const schemaPath = path.join(SCHEMA_DIR, schemaName);

      if (!TIER_1_2_SCHEMAS.includes(schemaName)) {
        const hasFundamentals = fs.existsSync(
          path.join(schemaPath, "fundamentals")
        );
        const hasOperations = fs.existsSync(
          path.join(schemaPath, "operations")
        );

        if (!hasFundamentals && !hasOperations) {
          const files = fs.readdirSync(schemaPath);
          const tableCount = files.filter(
            (f) => f.endsWith(".ts") && !f.startsWith("_") && f !== "index.ts"
          ).length;

          if (tableCount > 3) {
            errors.push({
              file: `src/db/schema/${schemaName}`,
              line: 1,
              column: 1,
              rule: "tier3-structure",
              message: `Tier 3 schema "${schemaName}" with ${tableCount} tables should use fundamentals/operations structure`,
              severity: "warning",
              suggestion: `Create fundamentals/ for entity tables and operations/ for transactional tables`,
            });
          }
        }
      }
    });
}

function checkSharedMixins(): void {
  const sharedPath = path.join(SCHEMA_DIR, "_shared");
  
  if (!fs.existsSync(sharedPath)) {
    errors.push({
      file: "src/db/schema/_shared",
      line: 1,
      column: 1,
      rule: "shared-mixins",
      message: "Missing _shared directory for column mixins",
      severity: "error",
      suggestion: "Create _shared/ with timestamps.ts, auditColumns.ts, and index.ts",
    });
    return;
  }

  // Check for required mixins (tenantScope removed - tenantId is explicit per table)
  const requiredMixins = [
    { file: "timestamps.ts", desc: "createdAt/updatedAt columns" },
    { file: "auditColumns.ts", desc: "createdBy/updatedBy columns" },
  ];
  
  for (const { file, desc } of requiredMixins) {
    if (!fs.existsSync(path.join(sharedPath, file))) {
      errors.push({
        file: `src/db/schema/_shared/${file}`,
        line: 1,
        column: 1,
        rule: "required-mixin",
        message: `Missing required mixin: ${file}`,
        severity: "warning",
        suggestion: `Create ${file} with ${desc}`,
      });
    }
  }

  // Check for index.ts in _shared
  if (!fs.existsSync(path.join(sharedPath, "index.ts"))) {
    errors.push({
      file: "src/db/schema/_shared/index.ts",
      line: 1,
      column: 1,
      rule: "barrel-export",
      message: "Missing index.ts barrel export in _shared",
      severity: "error",
      suggestion: "Create index.ts exporting all mixins",
    });
  }
}

function checkMainIndex(): void {
  const mainIndexPath = path.join(SCHEMA_DIR, "index.ts");
  
  if (!fs.existsSync(mainIndexPath)) {
    errors.push({
      file: "src/db/schema/index.ts",
      line: 1,
      column: 1,
      rule: "main-barrel",
      message: "Missing main index.ts barrel export",
      severity: "error",
      suggestion: "Create index.ts exporting all schema directories",
    });
    return;
  }

  const content = fs.readFileSync(mainIndexPath, "utf-8");
  const entries = fs.readdirSync(SCHEMA_DIR, { withFileTypes: true });
  
  entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .forEach((entry) => {
      if (!content.includes(`"./${entry.name}"`) && !content.includes(`'./${entry.name}'`)) {
        const loc = findLineAndColumn(content, "export");
        errors.push({
          file: "src/db/schema/index.ts",
          line: loc.line,
          column: loc.column,
          rule: "barrel-completeness",
          message: `Schema "${entry.name}" not exported from main index.ts`,
          severity: "warning",
          codeSnippet: getCodeSnippet(content, loc.line),
          suggestion: `Add: export * from "./${entry.name}";`,
        });
      }
    });
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
    lines.push(error.codeSnippet.split("\n").map(l => `   ${l}`).join("\n"));
    lines.push("");
  }
  
  // Suggestion
  if (error.suggestion) {
    lines.push(`   💡 ${error.suggestion}`);
  }
  
  return lines.join("\n");
}

function main(): void {
  console.log("🔍 Validating schema structure...\n");

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("ℹ️ No schema directory found");
    process.exit(0);
  }

  // Check shared mixins
  checkSharedMixins();

  // Check main index
  checkMainIndex();

  // Check each schema directory
  const entries = fs.readdirSync(SCHEMA_DIR, { withFileTypes: true });
  entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .forEach((entry) => {
      const schemaPath = path.join(SCHEMA_DIR, entry.name);
      
      // Check for nested structure (fundamentals/operations)
      const nestedDirs = fs.readdirSync(schemaPath, { withFileTypes: true })
        .filter((e) => e.isDirectory());
      
      if (nestedDirs.length > 0) {
        nestedDirs.forEach((nested) => {
          checkSchemaDirectory(
            path.join(schemaPath, nested.name),
            `${entry.name}/${nested.name}`
          );
        });
      }
      
      checkSchemaDirectory(schemaPath, entry.name);
    });

  // Check tier structure
  checkTierStructure();

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  if (errors.length > 0) {
    console.log("Issues found:\n");
    
    // Group by file
    const byFile = errors.reduce((acc, err) => {
      if (!acc[err.file]) acc[err.file] = [];
      acc[err.file].push(err);
      return acc;
    }, {} as Record<string, ValidationError[]>);

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
    console.log("✅ Schema structure validation passed!");
  }
}

main();
