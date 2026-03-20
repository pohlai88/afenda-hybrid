/**
 * Breaking Change Detector
 * 
 * Detects potentially breaking schema changes by comparing:
 * - Current schema vs last migration snapshot
 * - PR changes vs base branch
 * 
 * Breaking changes include:
 * - Dropping tables or columns
 * - Changing column types (narrowing)
 * - Removing NOT NULL without default
 * - Changing enum values (removing)
 * - Changing FK constraints
 * 
 * @see docs/CI_GATES.md
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { analyzeSchema, TableInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const MIGRATIONS_DIR = path.join(process.cwd(), "src/db/migrations");

interface BreakingChange {
  type: "drop-table" | "drop-column" | "type-change" | "nullable-change" | "enum-change" | "fk-change" | "constraint-change";
  severity: "breaking" | "warning" | "info";
  schema: string;
  table: string;
  column?: string;
  message: string;
  migration?: string;
  suggestion: string;
}

const changes: BreakingChange[] = [];

/** Minimal Drizzle snapshot shape used for column/table comparison */
interface DrizzleSnapshotTable {
  columns?: Record<string, unknown>;
}

interface DrizzleSnapshot {
  tables?: Record<string, DrizzleSnapshotTable>;
}

function getLastMigrationSnapshot(): DrizzleSnapshot | null {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return null;
  }
  
  const entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort()
    .reverse();
  
  if (entries.length === 0) {
    return null;
  }
  
  const snapshotPath = path.join(MIGRATIONS_DIR, entries[0], "snapshot.json");
  
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, "utf-8")) as DrizzleSnapshot;
  } catch {
    return null;
  }
}

function getGitDiff(): string[] {
  try {
    // Get changed files in schema directory
    const baseBranch = process.env.GITHUB_BASE_REF || "main";
    const diff = execSync(
      `git diff --name-only origin/${baseBranch}...HEAD -- src/db/schema/`,
      { encoding: "utf-8" }
    ).trim();
    
    return diff ? diff.split("\n") : [];
  } catch {
    // Not in git or no base branch
    return [];
  }
}

function analyzeChangedMigrations(): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return;
  }
  
  const changedFiles = getGitDiff();
  const changedMigrations = changedFiles.filter(f => f.includes("migrations"));
  
  for (const migrationPath of changedMigrations) {
    const fullPath = path.join(process.cwd(), migrationPath);
    if (!fs.existsSync(fullPath)) continue;
    
    const content = fs.readFileSync(fullPath, "utf-8");
    const migrationName = path.basename(path.dirname(migrationPath));
    
    // Check for DROP TABLE
    const dropTableMatches = content.matchAll(/DROP TABLE\s+(?:IF EXISTS\s+)?["']?(\w+)\.(\w+)["']?/gi);
    for (const match of dropTableMatches) {
      changes.push({
        type: "drop-table",
        severity: "breaking",
        schema: match[1],
        table: match[2],
        message: `Table "${match[1]}.${match[2]}" is being dropped`,
        migration: migrationName,
        suggestion: "Ensure all data is migrated and dependent code is updated. Consider soft-delete instead.",
      });
    }
    
    // Check for DROP COLUMN
    const dropColumnMatches = content.matchAll(/ALTER TABLE\s+["']?(\w+)\.(\w+)["']?\s+DROP COLUMN\s+(?:IF EXISTS\s+)?["']?(\w+)["']?/gi);
    for (const match of dropColumnMatches) {
      changes.push({
        type: "drop-column",
        severity: "breaking",
        schema: match[1],
        table: match[2],
        column: match[3],
        message: `Column "${match[3]}" is being dropped from "${match[1]}.${match[2]}"`,
        migration: migrationName,
        suggestion: "Ensure no code references this column. Consider deprecation period before removal.",
      });
    }
    
    // Check for type changes
    const typeChangeMatches = content.matchAll(/ALTER TABLE\s+["']?(\w+)\.(\w+)["']?\s+ALTER COLUMN\s+["']?(\w+)["']?\s+(?:SET DATA\s+)?TYPE\s+(\w+)/gi);
    for (const match of typeChangeMatches) {
      changes.push({
        type: "type-change",
        severity: "warning",
        schema: match[1],
        table: match[2],
        column: match[3],
        message: `Column "${match[3]}" type is changing to "${match[4]}" in "${match[1]}.${match[2]}"`,
        migration: migrationName,
        suggestion: "Verify type change is backward compatible. Consider using USING clause for data conversion.",
      });
    }
    
    // Check for NOT NULL additions without default
    const notNullMatches = content.matchAll(/ALTER TABLE\s+["']?(\w+)\.(\w+)["']?\s+ALTER COLUMN\s+["']?(\w+)["']?\s+SET NOT NULL/gi);
    for (const match of notNullMatches) {
      // Check if there's a SET DEFAULT nearby
      const hasDefault = content.includes(`ALTER COLUMN ${match[3]} SET DEFAULT`) ||
                         content.includes(`ALTER COLUMN "${match[3]}" SET DEFAULT`);
      
      if (!hasDefault) {
        changes.push({
          type: "nullable-change",
          severity: "warning",
          schema: match[1],
          table: match[2],
          column: match[3],
          message: `Column "${match[3]}" is being set to NOT NULL without a default value`,
          migration: migrationName,
          suggestion: "Add a default value or ensure all existing rows have values before applying NOT NULL.",
        });
      }
    }
    
    // Check for enum value removals
    const enumRemoveMatches = content.matchAll(/ALTER TYPE\s+["']?(\w+)["']?\s+DROP VALUE\s+["']?(\w+)["']?/gi);
    for (const match of enumRemoveMatches) {
      changes.push({
        type: "enum-change",
        severity: "breaking",
        schema: "public",
        table: match[1],
        message: `Enum value "${match[2]}" is being removed from "${match[1]}"`,
        migration: migrationName,
        suggestion: "Ensure no rows use this enum value. Consider deprecation before removal.",
      });
    }
    
    // Check for FK constraint drops
    const fkDropMatches = content.matchAll(/ALTER TABLE\s+["']?(\w+)\.(\w+)["']?\s+DROP CONSTRAINT\s+["']?(\w+)["']?/gi);
    for (const match of fkDropMatches) {
      if (match[3].toLowerCase().includes("fk") || match[3].toLowerCase().includes("foreign")) {
        changes.push({
          type: "fk-change",
          severity: "warning",
          schema: match[1],
          table: match[2],
          message: `Foreign key constraint "${match[3]}" is being dropped from "${match[1]}.${match[2]}"`,
          migration: migrationName,
          suggestion: "Verify this doesn't break referential integrity. Document the reason for removal.",
        });
      }
    }
  }
}

function compareSchemaSnapshots(): void {
  const lastSnapshot = getLastMigrationSnapshot();
  if (!lastSnapshot) {
    console.log("ℹ️ No previous migration snapshot found for comparison\n");
    return;
  }
  
  const currentSchemas = analyzeSchema(SCHEMA_DIR);
  
  // Build current table map
  const currentTables: Map<string, TableInfo> = new Map();
  for (const schema of currentSchemas) {
    for (const table of schema.tables) {
      currentTables.set(`${schema.name}.${table.name}`, table);
    }
  }
  
  // Compare with snapshot
  if (lastSnapshot.tables) {
    for (const [tableName, snapshotTable] of Object.entries(lastSnapshot.tables)) {
      // Extract schema and table name from snapshot format
      const parts = tableName.split(".");
      const schemaName = parts.length > 1 ? parts[0] : "public";
      const tblName = parts.length > 1 ? parts[1] : parts[0];
      const fullName = `${schemaName}.${tblName}`;
      
      const currentTable = currentTables.get(fullName);
      
      if (!currentTable) {
        // Table might have been renamed or moved
        changes.push({
          type: "drop-table",
          severity: "info",
          schema: schemaName,
          table: tblName,
          message: `Table "${fullName}" exists in snapshot but not found in current schema`,
          suggestion: "Verify if table was renamed, moved to different schema, or intentionally removed.",
        });
        continue;
      }
      
      // Compare columns
      if (snapshotTable.columns) {
        const currentColumns = new Set(currentTable.columns.map(c => c.name));
        
        for (const colName of Object.keys(snapshotTable.columns)) {
          if (!currentColumns.has(colName)) {
            changes.push({
              type: "drop-column",
              severity: "info",
              schema: schemaName,
              table: tblName,
              column: colName,
              message: `Column "${colName}" exists in snapshot but not in current schema for "${fullName}"`,
              suggestion: "Verify if column was renamed or intentionally removed.",
            });
          }
        }
      }
    }
  }
}

function printSummary(): void {
  const breaking = changes.filter(c => c.severity === "breaking");
  const warnings = changes.filter(c => c.severity === "warning");
  const infos = changes.filter(c => c.severity === "info");
  
  if (changes.length === 0) {
    console.log("✅ No breaking changes detected!\n");
    return;
  }
  
  console.log("Changes detected:\n");
  
  // Group by severity
  if (breaking.length > 0) {
    console.log("=== 🚨 BREAKING CHANGES ===\n");
    for (const change of breaking) {
      console.log(`❌ [${change.type}] ${change.schema}.${change.table}${change.column ? `.${change.column}` : ""}`);
      console.log(`   ${change.message}`);
      if (change.migration) {
        console.log(`   Migration: ${change.migration}`);
      }
      console.log(`   💡 ${change.suggestion}`);
      console.log();
    }
  }
  
  if (warnings.length > 0) {
    console.log("=== ⚠️ WARNINGS ===\n");
    for (const change of warnings) {
      console.log(`⚠️ [${change.type}] ${change.schema}.${change.table}${change.column ? `.${change.column}` : ""}`);
      console.log(`   ${change.message}`);
      if (change.migration) {
        console.log(`   Migration: ${change.migration}`);
      }
      console.log(`   💡 ${change.suggestion}`);
      console.log();
    }
  }
  
  if (infos.length > 0) {
    console.log("=== ℹ️ INFO ===\n");
    for (const change of infos) {
      console.log(`ℹ️ [${change.type}] ${change.schema}.${change.table}${change.column ? `.${change.column}` : ""}`);
      console.log(`   ${change.message}`);
      console.log(`   💡 ${change.suggestion}`);
      console.log();
    }
  }
  
  console.log("─".repeat(60));
  console.log(`\nSummary: ${breaking.length} breaking, ${warnings.length} warning(s), ${infos.length} info(s)\n`);
}

function main(): void {
  console.log("🔍 Breaking Change Detection\n");
  
  // Analyze migration files for explicit changes
  analyzeChangedMigrations();
  
  // Compare current schema with last snapshot
  compareSchemaSnapshots();
  
  // Print results
  printSummary();
  
  // Exit with error if breaking changes detected
  const breaking = changes.filter(c => c.severity === "breaking");
  if (breaking.length > 0) {
    console.log("❌ Breaking changes detected. Review and approve before merging.\n");
    console.log("To proceed, add a comment to the PR acknowledging the breaking changes.");
    process.exit(1);
  }
}

main();
