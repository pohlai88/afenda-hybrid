/**
 * Custom SQL Syntax Checker
 * 
 * Validates that custom SQL blocks in migrations are syntactically correct
 * by running them through PostgreSQL's parser (requires database connection).
 * 
 * @see docs/ci-gate-analysis.md
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const MIGRATIONS_DIR = path.join(process.cwd(), "src/db/migrations");
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/afenda_sql_check";

interface SyntaxIssue {
  migration: string;
  block: string;
  line: number;
  message: string;
  severity: "error" | "warning";
  sql?: string;
}

const issues: SyntaxIssue[] = [];

function extractCustomSqlBlocks(sqlContent: string): Array<{ id: string; sql: string; line: number }> {
  const blocks: Array<{ id: string; sql: string; line: number }> = [];
  const lines = sqlContent.split("\n");
  
  let currentBlock: { id: string; sql: string; line: number } | null = null;
  let inCustomBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect custom SQL marker
    const markerMatch = line.match(/^-- CUSTOM:\s*(.+?)\s*\((CSQL-\d+)\)/);
    if (markerMatch) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        id: markerMatch[2],
        sql: "",
        line: i + 1,
      };
      inCustomBlock = true;
      continue;
    }
    
    // End of custom block (next statement-breakpoint or another CUSTOM marker)
    if (inCustomBlock && (line.includes("--> statement-breakpoint") || line.startsWith("-- CUSTOM:"))) {
      if (currentBlock && currentBlock.sql.trim()) {
        blocks.push(currentBlock);
      }
      currentBlock = null;
      inCustomBlock = false;
    }
    
    // Accumulate SQL content
    if (inCustomBlock && currentBlock && !line.startsWith("--")) {
      currentBlock.sql += line + "\n";
    }
  }
  
  // Don't forget the last block
  if (currentBlock && currentBlock.sql.trim()) {
    blocks.push(currentBlock);
  }
  
  return blocks;
}

function validateSqlSyntax(sql: string, migrationName: string, blockId: string, line: number): void {
  // Skip empty SQL
  if (!sql.trim()) {
    return;
  }
  
  // Use PostgreSQL to parse the SQL (without executing)
  try {
    // Wrap in a transaction that we'll rollback
    const testSql = `
      BEGIN;
      SET LOCAL check_function_bodies = false;
      ${sql}
      ROLLBACK;
    `;
    
    // Write to temp file
    const tempFile = path.join(process.cwd(), ".temp-sql-check.sql");
    fs.writeFileSync(tempFile, testSql);
    
    try {
      execSync(`psql "${DATABASE_URL}" -f "${tempFile}" -v ON_ERROR_STOP=1 2>&1`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? (error as any).stderr || error.message : String(error);
      
      // Parse PostgreSQL error message
      const errorMatch = errorMsg.match(/ERROR:\s*(.+)/);
      const lineMatch = errorMsg.match(/LINE (\d+):/);
      
      issues.push({
        migration: migrationName,
        block: blockId,
        line: line + (lineMatch ? parseInt(lineMatch[1], 10) : 0),
        message: errorMatch ? errorMatch[1] : errorMsg,
        severity: "error",
        sql: sql.substring(0, 200) + (sql.length > 200 ? "..." : ""),
      });
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } catch (error) {
    // Database connection failed - skip syntax check
    console.log(`⚠️ Could not connect to database for syntax check: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function checkMigrationSyntax(migrationDir: string): void {
  const sqlPath = path.join(migrationDir, "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    return;
  }
  
  const migrationName = path.basename(migrationDir);
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");
  
  // Extract custom SQL blocks
  const blocks = extractCustomSqlBlocks(sqlContent);
  
  if (blocks.length === 0) {
    return;
  }
  
  console.log(`  Checking ${blocks.length} custom SQL block(s) in ${migrationName}...`);
  
  for (const block of blocks) {
    validateSqlSyntax(block.sql, migrationName, block.id, block.line);
  }
}

function main(): void {
  console.log("🔍 Custom SQL Syntax Check\n");
  
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log("ℹ️ No migrations directory found");
    process.exit(0);
  }
  
  // Check database connection
  try {
    execSync(`psql "${DATABASE_URL}" -c "SELECT 1" 2>&1`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("✅ Database connection successful\n");
  } catch (error) {
    console.log("⚠️ Could not connect to database - skipping syntax validation");
    console.log("   Set DATABASE_URL environment variable to enable syntax checking\n");
    process.exit(0);
  }
  
  const migrations = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => path.join(MIGRATIONS_DIR, e.name));
  
  console.log(`Found ${migrations.length} migration(s)\n`);
  
  for (const migration of migrations) {
    checkMigrationSyntax(migration);
  }
  
  // Report results
  if (issues.length === 0) {
    console.log("\n✅ All custom SQL syntax checks passed!\n");
    process.exit(0);
  }
  
  console.log("\nSyntax errors found:\n");
  
  for (const issue of issues) {
    console.log(`❌ ${issue.migration}:${issue.line} [${issue.block}]`);
    console.log(`   ${issue.message}`);
    if (issue.sql) {
      console.log(`   SQL: ${issue.sql}`);
    }
    console.log();
  }
  
  console.log("─".repeat(60));
  console.log(`\nSummary: ${issues.length} syntax error(s)\n`);
  
  process.exit(1);
}

main();
