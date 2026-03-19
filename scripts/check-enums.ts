/**
 * Enum Consistency Checker
 * 
 * Validates that enums are:
 * - Consistently named (snake_case for DB, camelCase for TypeScript)
 * - Used consistently across tables
 * - Have corresponding TypeScript types exported
 * - Values are documented
 * 
 * @see docs/ci-gate-analysis.md
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface EnumIssue {
  file: string;
  line: number;
  enumName: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

interface EnumInfo {
  name: string;
  dbName: string;
  values: string[];
  file: string;
  line: number;
  hasTypeExport: boolean;
  usedInTables: string[];
}

const issues: EnumIssue[] = [];
const enums: Map<string, EnumInfo> = new Map();

function findLineNumber(content: string, searchStr: string): number {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return 1;
}

function extractEnums(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  
  // Match pgEnum definitions
  const enumRegex = /export\s+const\s+(\w+)\s*=\s*(?:schema\.)?pgEnum\(\s*["'](\w+)["']\s*,\s*\[([^\]]+)\]/g;
  
  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const varName = match[1];
    const dbName = match[2];
    const valuesStr = match[3];
    const line = findLineNumber(content, match[0]);
    
    // Parse values
    const values = valuesStr
      .split(",")
      .map(v => v.trim().replace(/['"]/g, ""))
      .filter(v => v.length > 0);
    
    // Check for type export
    const hasTypeExport = content.includes(`type ${varName.replace(/Enum$/, "")}`) ||
                          content.includes(`typeof ${varName}`);
    
    enums.set(varName, {
      name: varName,
      dbName,
      values,
      file: relativePath,
      line,
      hasTypeExport,
      usedInTables: [],
    });
  }
}

function findEnumUsage(schemas: SchemaInfo[]): void {
  for (const schema of schemas) {
    for (const table of schema.tables) {
      const content = fs.readFileSync(table.file, "utf-8");
      
      for (const [enumName, enumInfo] of enums) {
        if (content.includes(`${enumName}(`)) {
          enumInfo.usedInTables.push(`${schema.name}.${table.name}`);
        }
      }
    }
  }
}

function checkEnumNaming(): void {
  for (const [name, info] of enums) {
    // Check variable name ends with Enum
    if (!name.endsWith("Enum")) {
      issues.push({
        file: info.file,
        line: info.line,
        enumName: name,
        rule: "enum-naming-suffix",
        message: `Enum variable "${name}" should end with "Enum"`,
        severity: "warning",
        suggestion: `Rename to: ${name}Enum`,
      });
    }
    
    // Check DB name is snake_case
    if (info.dbName !== info.dbName.toLowerCase()) {
      issues.push({
        file: info.file,
        line: info.line,
        enumName: name,
        rule: "enum-db-naming",
        message: `Enum DB name "${info.dbName}" should be lowercase snake_case`,
        severity: "error",
        suggestion: `Use: ${info.dbName.toLowerCase().replace(/([A-Z])/g, "_$1").replace(/^_/, "")}`,
      });
    }
    
    // Check values are UPPER_SNAKE_CASE
    for (const value of info.values) {
      if (value !== value.toUpperCase()) {
        issues.push({
          file: info.file,
          line: info.line,
          enumName: name,
          rule: "enum-value-case",
          message: `Enum value "${value}" should be UPPER_SNAKE_CASE`,
          severity: "warning",
          suggestion: `Use: ${value.toUpperCase().replace(/([a-z])([A-Z])/g, "$1_$2")}`,
        });
      }
    }
  }
}

function checkEnumTypeExports(): void {
  for (const [name, info] of enums) {
    if (!info.hasTypeExport) {
      issues.push({
        file: info.file,
        line: info.line,
        enumName: name,
        rule: "enum-type-export",
        message: `Enum "${name}" should have a TypeScript type export`,
        severity: "warning",
        suggestion: `Add: export type ${name.replace(/Enum$/, "")} = (typeof ${name}.enumValues)[number];`,
      });
    }
  }
}

function checkEnumUsage(): void {
  for (const [name, info] of enums) {
    if (info.usedInTables.length === 0) {
      issues.push({
        file: info.file,
        line: info.line,
        enumName: name,
        rule: "enum-unused",
        message: `Enum "${name}" is not used in any table`,
        severity: "info",
        suggestion: "Remove if not needed, or add to relevant tables",
      });
    }
  }
}

function checkEnumConsistency(): void {
  // Check for similar enum names that might be duplicates
  const enumNames = Array.from(enums.keys());
  
  for (let i = 0; i < enumNames.length; i++) {
    for (let j = i + 1; j < enumNames.length; j++) {
      const name1 = enumNames[i].toLowerCase().replace(/enum$/, "");
      const name2 = enumNames[j].toLowerCase().replace(/enum$/, "");
      
      // Check for similar names
      if (name1 === name2 || 
          name1.includes(name2) || 
          name2.includes(name1)) {
        const info1 = enums.get(enumNames[i])!;
        const info2 = enums.get(enumNames[j])!;
        
        // Check if values overlap significantly
        const overlap = info1.values.filter(v => info2.values.includes(v));
        if (overlap.length > 0 && overlap.length >= Math.min(info1.values.length, info2.values.length) / 2) {
          issues.push({
            file: info1.file,
            line: info1.line,
            enumName: enumNames[i],
            rule: "enum-duplicate",
            message: `Enum "${enumNames[i]}" has significant overlap with "${enumNames[j]}"`,
            severity: "warning",
            suggestion: "Consider consolidating into a single enum if they represent the same concept",
          });
        }
      }
    }
  }
}

function checkEnumDocumentation(): void {
  for (const [name, info] of enums) {
    const content = fs.readFileSync(path.join(process.cwd(), info.file), "utf-8");
    const lines = content.split("\n");
    
    // Check for JSDoc comment before enum
    const enumLine = info.line - 1;
    let hasDoc = false;
    
    for (let i = enumLine - 1; i >= 0 && i >= enumLine - 10; i--) {
      const line = lines[i].trim();
      if (line.startsWith("/**") || line.startsWith("*") || line.startsWith("*/")) {
        hasDoc = true;
        break;
      }
      if (line.length > 0 && !line.startsWith("//")) {
        break;
      }
    }
    
    if (!hasDoc && info.values.length > 3) {
      issues.push({
        file: info.file,
        line: info.line,
        enumName: name,
        rule: "enum-documentation",
        message: `Enum "${name}" with ${info.values.length} values should have JSDoc documentation`,
        severity: "info",
        suggestion: "Add JSDoc comment explaining the enum purpose and value meanings",
      });
    }
  }
}

function main(): void {
  console.log("🔍 Enum Consistency Check\n");
  
  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("No schema directory found");
    process.exit(0);
  }
  
  // Collect all enums
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  for (const schema of schemas) {
    for (const table of schema.tables) {
      extractEnums(table.file);
    }
    
    // Also check index files for shared enums
    const indexPath = path.join(schema.path, "index.ts");
    if (fs.existsSync(indexPath)) {
      extractEnums(indexPath);
    }
  }
  
  // Check _shared for common enums
  const sharedDir = path.join(SCHEMA_DIR, "_shared");
  if (fs.existsSync(sharedDir)) {
    const sharedFiles = fs.readdirSync(sharedDir)
      .filter(f => f.endsWith(".ts"))
      .map(f => path.join(sharedDir, f));
    
    for (const file of sharedFiles) {
      extractEnums(file);
    }
  }
  
  console.log(`Found ${enums.size} enum(s)\n`);
  
  // Find usage
  findEnumUsage(schemas);
  
  // Run checks
  checkEnumNaming();
  checkEnumTypeExports();
  checkEnumUsage();
  checkEnumConsistency();
  checkEnumDocumentation();
  
  // Report results
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ All enum consistency checks passed!\n");
    
    // Print summary
    console.log("Enum Summary:");
    for (const [name, info] of enums) {
      console.log(`  - ${name}: ${info.values.length} values, used in ${info.usedInTables.length} table(s)`);
    }
    
    process.exit(0);
  }
  
  // Group by enum
  const byEnum = issues.reduce((acc, issue) => {
    if (!acc[issue.enumName]) acc[issue.enumName] = [];
    acc[issue.enumName].push(issue);
    return acc;
  }, {} as Record<string, EnumIssue[]>);
  
  console.log("Issues found:\n");
  
  for (const [enumName, enumIssues] of Object.entries(byEnum)) {
    console.log(`=== ${enumName} ===\n`);
    
    for (const issue of enumIssues) {
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
    if (strictWarnings && warnings.length > 0 && errors.length === 0) {
      console.log("\n❌ Strict mode: warnings are treated as failures");
    }
    process.exit(1);
  }
}

main();
