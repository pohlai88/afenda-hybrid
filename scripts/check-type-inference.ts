/**
 * Type Inference Checker
 * 
 * Validates that all tables have proper TypeScript type exports:
 * - $inferSelect types
 * - $inferInsert types
 * - Zod schemas (createSelectSchema, createInsertSchema)
 * 
 * @see docs/CI_GATES.md
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, TableInfo, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface TypeIssue {
  file: string;
  line: number;
  table: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

const issues: TypeIssue[] = [];

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function checkTypeExports(table: TableInfo, _schema: SchemaInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  const tableName = table.name;
  const typeName = capitalize(tableName);
  
  // Check for $inferSelect type export
  const hasInferSelect = content.includes("$inferSelect");
  const hasSelectType = content.includes(`type ${typeName}`) || content.includes(`type Select${typeName}`);
  
  if (!hasInferSelect && !hasSelectType) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: tableName,
      rule: "missing-select-type",
      message: `Missing TypeScript select type for "${tableName}"`,
      severity: "warning",
      suggestion: `Add: export type ${typeName} = typeof ${tableName}.$inferSelect;`,
    });
  }
  
  // Check for $inferInsert type export
  const hasInferInsert = content.includes("$inferInsert");
  const hasInsertType = content.includes(`type New${typeName}`) || content.includes(`type Insert${typeName}`);
  
  if (!hasInferInsert && !hasInsertType) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: tableName,
      rule: "missing-insert-type",
      message: `Missing TypeScript insert type for "${tableName}"`,
      severity: "warning",
      suggestion: `Add: export type New${typeName} = typeof ${tableName}.$inferInsert;`,
    });
  }
  
  // Check for Zod select schema
  if (!table.hasZodSchemas.select) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: tableName,
      rule: "missing-zod-select",
      message: `Missing Zod select schema for "${tableName}"`,
      severity: "error",
      suggestion: `Add: export const ${tableName}SelectSchema = createSelectSchema(${tableName});`,
    });
  }
  
  // Check for Zod insert schema
  if (!table.hasZodSchemas.insert) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: tableName,
      rule: "missing-zod-insert",
      message: `Missing Zod insert schema for "${tableName}"`,
      severity: "error",
      suggestion: `Add: export const ${tableName}InsertSchema = createInsertSchema(${tableName});`,
    });
  }
  
  // Check for deprecated drizzle-zod import
  if (content.includes("drizzle-zod")) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: tableName,
      rule: "deprecated-drizzle-zod",
      message: "Using deprecated drizzle-zod package",
      severity: "error",
      suggestion: 'Change import to: import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";',
    });
  }
}

function checkIndexExports(schema: SchemaInfo): void {
  const indexPath = path.join(schema.path, "index.ts");
  
  if (!fs.existsSync(indexPath)) {
    issues.push({
      file: `src/db/schema/${schema.name}/index.ts`,
      line: 1,
      table: schema.name,
      rule: "missing-barrel-export",
      message: `Missing barrel export file for schema "${schema.name}"`,
      severity: "warning",
      suggestion: "Create index.ts with exports for all tables, types, and schemas",
    });
    return;
  }
  
  const content = fs.readFileSync(indexPath, "utf-8");
  
  // Check that all tables are exported
  for (const table of schema.tables) {
    const fileName = path.basename(table.file, ".ts");
    if (!content.includes(`from "./${fileName}"`) && !content.includes(`from './${fileName}'`)) {
      issues.push({
        file: `src/db/schema/${schema.name}/index.ts`,
        line: 1,
        table: table.name,
        rule: "missing-table-export",
        message: `Table "${table.name}" is not exported from index.ts`,
        severity: "warning",
        suggestion: `Add: export * from "./${fileName}";`,
      });
    }
  }
  
  // Check that relations are exported
  if (schema.hasRelations && !content.includes("_relations")) {
    issues.push({
      file: `src/db/schema/${schema.name}/index.ts`,
      line: 1,
      table: schema.name,
      rule: "missing-relations-export",
      message: `Relations are not exported from index.ts`,
      severity: "info",
      suggestion: 'Add: export * from "./_relations";',
    });
  }
}

function main(): void {
  console.log("🔍 Type Inference Check\n");
  
  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("No schema directory found");
    process.exit(0);
  }
  
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  // Run checks
  for (const schema of schemas) {
    checkIndexExports(schema);
    
    for (const table of schema.tables) {
      checkTypeExports(table, schema);
    }
  }
  
  // Report results
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ All type inference checks passed!\n");
    process.exit(0);
  }
  
  console.log("Issues found:\n");
  
  // Group by file
  const byFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, TypeIssue[]>);
  
  for (const [file, fileIssues] of Object.entries(byFile)) {
    console.log(`=== ${file} ===\n`);
    
    for (const issue of fileIssues) {
      const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`${icon} [${issue.rule}] Table: ${issue.table}`);
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
