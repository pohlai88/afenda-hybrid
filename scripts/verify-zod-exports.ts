/**
 * Verifies that all Drizzle table definitions have corresponding Zod schema exports.
 * This script is run as part of the CI gate to ensure type safety.
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");

interface ValidationResult {
  file: string;
  tables: string[];
  missingSchemas: string[];
  hasErrors: boolean;
}

function findTableDefinitions(content: string): string[] {
  const tableRegex = /export\s+const\s+(\w+)\s*=\s*\w+Schema\.table\(/g;
  const publicTableRegex = /export\s+const\s+(\w+)\s*=\s*pgTable\(/g;
  
  const tables: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(content)) !== null) {
    tables.push(match[1]);
  }
  while ((match = publicTableRegex.exec(content)) !== null) {
    tables.push(match[1]);
  }

  return tables;
}

function findZodSchemaExports(content: string): string[] {
  const schemaRegex = /export\s+const\s+(\w+(?:Select|Insert|Update)Schema)\s*=/g;
  
  const schemas: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = schemaRegex.exec(content)) !== null) {
    schemas.push(match[1]);
  }

  return schemas;
}

function validateFile(filePath: string): ValidationResult | null {
  if (filePath.includes("_relations") || filePath.includes("_schema") || filePath.endsWith("index.ts")) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const tables = findTableDefinitions(content);
  
  if (tables.length === 0) {
    return null;
  }

  const zodSchemas = findZodSchemaExports(content);
  const missingSchemas: string[] = [];

  for (const table of tables) {
    // Handle common plural patterns to derive singular base name
    let baseName = table;
    if (table.endsWith("ies")) {
      // policies -> policy, categories -> category
      baseName = table.slice(0, -3) + "y";
    } else if (table.endsWith("es") && !table.endsWith("ses") && !table.endsWith("xes")) {
      // Not all -es words: keep as-is for ambiguous cases
      baseName = table.slice(0, -1);
    } else if (table.endsWith("s") && !table.endsWith("ss")) {
      // users -> user, tenants -> tenant
      baseName = table.slice(0, -1);
    }

    const expectedSchemas = [
      `${baseName}SelectSchema`,
      `${baseName}InsertSchema`,
    ];

    for (const expected of expectedSchemas) {
      const found = zodSchemas.some(
        (s) => s.toLowerCase() === expected.toLowerCase()
      );
      if (!found) {
        missingSchemas.push(expected);
      }
    }
  }

  return {
    file: filePath,
    tables,
    missingSchemas,
    hasErrors: missingSchemas.length > 0,
  };
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  console.log("🔍 Verifying Zod schema exports...\n");

  const files = walkDir(SCHEMA_DIR);
  const results: ValidationResult[] = [];
  let hasErrors = false;

  for (const file of files) {
    const result = validateFile(file);
    if (result) {
      results.push(result);
      if (result.hasErrors) {
        hasErrors = true;
      }
    }
  }

  for (const result of results) {
    const relativePath = path.relative(process.cwd(), result.file);
    
    if (result.hasErrors) {
      console.log(`❌ ${relativePath}`);
      console.log(`   Tables: ${result.tables.join(", ")}`);
      console.log(`   Missing: ${result.missingSchemas.join(", ")}`);
      console.log();
    } else {
      console.log(`✅ ${relativePath}`);
      console.log(`   Tables: ${result.tables.join(", ")}`);
      console.log();
    }
  }

  if (hasErrors) {
    console.log("\n❌ Zod schema verification failed!");
    console.log("   Each table must export at least:");
    console.log("   - {tableName}SelectSchema (via createSelectSchema)");
    console.log("   - {tableName}InsertSchema (via createInsertSchema)");
    process.exit(1);
  }

  console.log("\n✅ All Zod schema exports verified!");
}

main();
