/**
 * Verifies that all Drizzle table definitions have corresponding Zod schema exports.
 * This script is run as part of the CI gate to ensure type safety.
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/schema-platform");

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
  if (
    filePath.includes("_relations") ||
    filePath.includes("_schema") ||
    filePath.endsWith("index.ts")
  ) {
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
    // Simplified approach: check if there's a schema that reasonably corresponds to this table
    // by checking if the schema name is similar to the table name (allowing for singularization)
    const tableLower = table.toLowerCase();

    // Helper function to check if a schema prefix reasonably matches the table
    const isReasonableMatch = (prefix: string): boolean => {
      const prefixLower = prefix.toLowerCase();

      // Exact match
      if (tableLower === prefixLower) return true;

      // Simple plural: table ends with 's', prefix is table without 's'
      if (tableLower === prefixLower + "s") return true;

      // -es plural: addresses -> address
      if (tableLower === prefixLower + "es") return true;

      // -ies plural: policies -> policy
      if (tableLower === prefixLower.slice(0, -1) + "ies") return true;

      // For compound words like "claimsRecords" -> "claimRecord"
      // Check if removing 's' from each word component matches
      const tableWithoutS = tableLower.replace(/s([a-z])/g, "$1").replace(/s$/, "");
      if (tableWithoutS === prefixLower) return true;

      // Levenshtein distance <= 2 (allows for minor differences)
      const distance = levenshteinDistance(tableLower, prefixLower);
      if (distance <= 2 && Math.abs(tableLower.length - prefixLower.length) <= 2) return true;

      return false;
    };

    // Check for SelectSchema
    const hasSelectSchema = zodSchemas.some((s) => {
      if (!s.endsWith("SelectSchema")) return false;
      const prefix = s.slice(0, -"SelectSchema".length);
      return isReasonableMatch(prefix);
    });

    // Check for InsertSchema
    const hasInsertSchema = zodSchemas.some((s) => {
      if (!s.endsWith("InsertSchema")) return false;
      const prefix = s.slice(0, -"InsertSchema".length);
      return isReasonableMatch(prefix);
    });

    if (!hasSelectSchema) {
      missingSchemas.push(`${table}SelectSchema (or singular variant)`);
    }
    if (!hasInsertSchema) {
      missingSchemas.push(`${table}InsertSchema (or singular variant)`);
    }
  }

  return {
    file: filePath,
    tables,
    missingSchemas,
    hasErrors: missingSchemas.length > 0,
  };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
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
