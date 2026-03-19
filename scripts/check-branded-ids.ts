/**
 * Branded ID Consistency Checker
 * 
 * Validates that branded ID types are:
 * - Consistently defined across tables
 * - Properly aligned with column types
 * - Exported for use in application code
 * 
 * @see docs/ci-gate-analysis.md
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, TableInfo, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface BrandedIdIssue {
  file: string;
  line: number;
  table: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

const issues: BrandedIdIssue[] = [];

function findLineNumber(content: string, searchStr: string): number {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return 1;
}

function checkBrandedIdConsistency(table: TableInfo, schema: SchemaInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Find primary key column
  const pkColumn = table.columns.find(c => c.isPrimaryKey);
  if (!pkColumn) return;
  
  // Check if branded ID schema exists
  const tableName = table.name;
  const expectedBrandName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const expectedSchemaName = `${expectedBrandName}IdSchema`;
  const expectedTypeName = `${expectedBrandName}Id`;
  
  const hasBrandedSchema = content.includes(expectedSchemaName) || content.includes(".brand<");
  const hasBrandedType = content.includes(`type ${expectedTypeName}`);
  
  if (!hasBrandedSchema) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: tableName,
      rule: "missing-branded-schema",
      message: `Missing branded ID schema "${expectedSchemaName}"`,
      severity: "info",
      suggestion: `Add: export const ${expectedSchemaName} = z.number().int().brand<"${expectedTypeName}">();`,
    });
  }
  
  if (!hasBrandedType && hasBrandedSchema) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: tableName,
      rule: "missing-branded-type",
      message: `Missing branded ID type export "${expectedTypeName}"`,
      severity: "warning",
      suggestion: `Add: export type ${expectedTypeName} = z.infer<typeof ${expectedSchemaName}>;`,
    });
  }
  
  // Check type alignment
  if (hasBrandedSchema) {
    // Determine expected Zod type based on column type
    let expectedZodType = "number";
    if (pkColumn.type === "bigint") {
      // Check for mode
      const modeMatch = content.match(new RegExp(`${pkColumn.name}:\\s*bigint\\(\\{[^}]*mode:\\s*["']([^"']+)["']`));
      expectedZodType = modeMatch && modeMatch[1] === "bigint" ? "bigint" : "number";
    } else if (pkColumn.type === "text" || pkColumn.type === "varchar" || pkColumn.type === "uuid") {
      expectedZodType = "string";
    }
    
    // Check if branded schema uses correct Zod type
    const brandedSchemaMatch = content.match(new RegExp(`${expectedSchemaName}\\s*=\\s*z\\.(\\w+)\\(`));
    if (brandedSchemaMatch) {
      const actualZodType = brandedSchemaMatch[1];
      if (actualZodType !== expectedZodType) {
        issues.push({
          file: table.relativePath,
          line: findLineNumber(content, expectedSchemaName),
          table: tableName,
          rule: "branded-type-mismatch",
          message: `Branded ID uses z.${actualZodType}() but column type is ${pkColumn.type}`,
          severity: "error",
          suggestion: `Change to: z.${expectedZodType}()${expectedZodType === 'number' ? '.int()' : ''}.brand<"${expectedTypeName}">()`,
        });
      }
    }
  }
}

function checkForeignKeyBrandedIds(table: TableInfo, schema: SchemaInfo, allSchemas: SchemaInfo[]): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Find FK columns
  const fkColumns = table.columns.filter(c => c.name.endsWith("Id") && !c.isPrimaryKey);
  
  for (const fkCol of fkColumns) {
    // Try to find the referenced table
    const baseName = fkCol.name.replace(/Id$/, "");
    
    // Look for import of the referenced table
    const importMatch = content.match(new RegExp(`import.*\\{[^}]*${baseName}s?[^}]*\\}.*from`));
    
    if (importMatch) {
      // Check if the FK column uses the branded type
      const expectedBrandedType = baseName.charAt(0).toUpperCase() + baseName.slice(1) + "Id";
      const usesBrandedType = content.includes(expectedBrandedType);
      
      if (!usesBrandedType) {
        issues.push({
          file: table.relativePath,
          line: findLineNumber(content, `${fkCol.name}:`),
          table: table.name,
          rule: "fk-not-branded",
          message: `FK column "${fkCol.name}" should use branded type "${expectedBrandedType}"`,
          severity: "info",
          suggestion: `Consider using branded type for type-safe FK references`,
        });
      }
    }
  }
}

function main(): void {
  console.log("🔍 Branded ID Consistency Check\n");
  
  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("No schema directory found");
    process.exit(0);
  }
  
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  // Run checks
  for (const schema of schemas) {
    for (const table of schema.tables) {
      checkBrandedIdConsistency(table, schema);
      checkForeignKeyBrandedIds(table, schema, schemas);
    }
  }
  
  // Report results
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ All branded ID consistency checks passed!\n");
    process.exit(0);
  }
  
  console.log("Issues found:\n");
  
  // Group by table
  const byTable = issues.reduce((acc, issue) => {
    if (!acc[issue.table]) acc[issue.table] = [];
    acc[issue.table].push(issue);
    return acc;
  }, {} as Record<string, BrandedIdIssue[]>);
  
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
