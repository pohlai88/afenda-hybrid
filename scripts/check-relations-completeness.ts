/**
 * Relations Completeness Checker
 * 
 * Validates that all foreign key relationships have corresponding relations
 * defined in _relations.ts files.
 * 
 * Checks:
 * - All FK columns have relations defined
 * - Polymorphic FK relationships are documented
 * - Bidirectional relations exist where appropriate
 * - Relations reference correct tables
 * 
 * @see docs/ci-gate-analysis.md Gap 6
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, TableInfo, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface RelationIssue {
  file: string;
  line: number;
  table: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

const issues: RelationIssue[] = [];

// Polymorphic FK columns that need special handling
const POLYMORPHIC_FKS: Record<string, string[]> = {
  audit_trail: ["actorId", "targetActorId"],
};

function extractReferencedTable(fkReferences: string): string | null {
  // Extract table name from FK reference
  // Examples: "tenants.tenantId", "[users.userId]", "users"
  const match = fkReferences.match(/(\w+)\.(\w+)/);
  if (match) return match[1];
  
  // Try to extract from inline reference pattern
  const inlineMatch = fkReferences.match(/(\w+)\./);
  if (inlineMatch) return inlineMatch[1];
  
  return null;
}

function checkForeignKeyRelations(table: TableInfo, schema: SchemaInfo): void {
  const relationsFile = path.join(schema.path, "_relations.ts");
  
  if (!fs.existsSync(relationsFile)) {
    // Already reported by check-guideline-compliance-v2.ts
    return;
  }
  
  const relationsContent = fs.readFileSync(relationsFile, "utf-8");
  const polymorphicFks = POLYMORPHIC_FKS[table.name] || [];
  
  for (const fk of table.foreignKeys) {
    // Skip polymorphic FKs (they need special handling)
    const isPolymorphic = fk.columns.some(col => polymorphicFks.includes(col));
    if (isPolymorphic) {
      checkPolymorphicFkRelations(table, schema, fk, relationsContent);
      continue;
    }
    
    // Extract referenced table
    const referencedTable = extractReferencedTable(fk.references);
    if (!referencedTable) continue;
    
    // Check if relation exists
    const hasRelation = relationsContent.includes(referencedTable);
    
    if (!hasRelation) {
      issues.push({
        file: `src/db/schema/${schema.name}/_relations.ts`,
        line: 1,
        table: table.name,
        rule: "missing-fk-relation",
        message: `Missing relation for FK from ${table.name} to ${referencedTable}`,
        severity: "warning",
        suggestion: `Add relation in defineRelations() for ${table.name} -> ${referencedTable}`,
      });
    }
    
    // Check if relation is properly named
    if (hasRelation && fk.columns.length > 0) {
      const fkColumn = fk.columns[0];
      const expectedRelationName = fkColumn.replace(/Id$/, "");
      
      // Check if relation uses a reasonable name
      const hasNamedRelation = 
        relationsContent.includes(`${expectedRelationName}:`) ||
        relationsContent.includes(`${referencedTable}:`);
      
      if (!hasNamedRelation) {
        issues.push({
          file: `src/db/schema/${schema.name}/_relations.ts`,
          line: 1,
          table: table.name,
          rule: "relation-naming",
          message: `Relation for ${fkColumn} should be named "${expectedRelationName}" or "${referencedTable}"`,
          severity: "info",
          suggestion: `Use: ${expectedRelationName}: r.one.${referencedTable}({ ... })`,
        });
      }
    }
  }
}

function checkPolymorphicFkRelations(
  table: TableInfo, 
  schema: SchemaInfo, 
  fk: any, 
  relationsContent: string
): void {
  // For polymorphic FKs, check if ALL possible target tables have relations
  
  // Example: actorId can reference users OR servicePrincipals
  // Should have relations for both
  
  const fkColumn = fk.columns[0];
  if (!fkColumn) return;
  
  // Check for discriminator column to determine possible types
  const baseName = fkColumn.replace(/Id$/, "");
  const discriminatorCol = table.columns.find(c => c.name === `${baseName}Type`);
  
  if (!discriminatorCol) {
    // Already reported by polymorphic-discriminator check
    return;
  }
  
  // Read the enum values from the file
  const tableContent = fs.readFileSync(table.file, "utf-8");
  const enumMatch = tableContent.match(new RegExp(`${baseName}Types?\\s*=\\s*\\[([^\\]]+)\\]`));
  
  if (enumMatch) {
    const enumValues = enumMatch[1].split(",").map(v => v.trim().replace(/['"]/g, ""));
    
    // For each enum value, check if there's a relation
    for (const enumValue of enumValues) {
      // Skip system/anonymous types that don't have FK targets
      if (enumValue === "SYSTEM" || enumValue === "ANONYMOUS") continue;
      
      // Convert enum value to table name (e.g., "USER" -> "users", "SERVICE_PRINCIPAL" -> "servicePrincipals")
      let tableName = enumValue.toLowerCase();
      if (tableName === "user") tableName = "users";
      if (tableName === "service_principal") tableName = "servicePrincipals";
      
      const hasRelation = relationsContent.includes(tableName);
      
      if (!hasRelation) {
        issues.push({
          file: `src/db/schema/${schema.name}/_relations.ts`,
          line: 1,
          table: table.name,
          rule: "missing-polymorphic-relation",
          message: `Missing relation for polymorphic FK ${fkColumn} -> ${tableName} (${enumValue} type)`,
          severity: "warning",
          suggestion: `Add: ${baseName}${capitalize(tableName)}: r.one.${tableName}({ from: r.${table.name}.${fkColumn}, to: r.${tableName}.${tableName.replace(/s$/, "")}Id, optional: true })`,
        });
      }
    }
  }
}

function checkBidirectionalRelations(schema: SchemaInfo): void {
  const relationsFile = path.join(schema.path, "_relations.ts");
  
  if (!fs.existsSync(relationsFile)) return;
  
  const relationsContent = fs.readFileSync(relationsFile, "utf-8");
  
  // Parse relations to check for bidirectional completeness
  // This is a heuristic check - we look for r.one without corresponding r.many
  
  const oneRelations = [...relationsContent.matchAll(/r\.one\.(\w+)/g)].map(m => m[1]);
  const manyRelations = [...relationsContent.matchAll(/r\.many\.(\w+)/g)].map(m => m[1]);
  
  // For each r.one relation, check if there's a corresponding r.many
  for (const oneRel of oneRelations) {
    if (!manyRelations.includes(oneRel)) {
      issues.push({
        file: `src/db/schema/${schema.name}/_relations.ts`,
        line: 1,
        table: oneRel,
        rule: "missing-bidirectional-relation",
        message: `One-to-many relation to ${oneRel} may be missing inverse many-to-one relation`,
        severity: "info",
        suggestion: `Consider adding inverse relation: ${oneRel}: { someCollection: r.many.${schema.name}(...) }`,
      });
    }
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function main(): void {
  console.log("🔍 Relations Completeness Check\n");
  
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  if (schemas.length === 0) {
    console.log("No schemas found");
    process.exit(0);
  }
  
  // Run all checks
  for (const schema of schemas) {
    for (const table of schema.tables) {
      checkForeignKeyRelations(table, schema);
    }
    
    checkBidirectionalRelations(schema);
  }
  
  // Report results
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ All relations completeness checks passed!\n");
    process.exit(0);
  }
  
  // Group by file
  const byFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, RelationIssue[]>);
  
  console.log("Issues found:\n");
  
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
    if (strictWarnings && warnings.length > 0 && errors.length === 0) {
      console.log("\n❌ Strict mode: warnings are treated as failures");
    }
    process.exit(1);
  }
}

main();
