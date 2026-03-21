/**
 * Migration Preparation Script
 * 
 * Validates that the environment is ready for database migration.
 * Checks all prerequisites and provides actionable guidance.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { config } from "dotenv";

// Load environment variables from .env file
config();

interface PrerequisiteCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  action?: string;
}

const checks: PrerequisiteCheck[] = [];

function checkFile(filePath: string, description: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    checks.push({
      name: description,
      status: "pass",
      message: `Found: ${filePath}`,
    });
    return true;
  } else {
    checks.push({
      name: description,
      status: "fail",
      message: `Missing: ${filePath}`,
      action: `Create ${filePath}`,
    });
    return false;
  }
}

function checkEnvVar(varName: string): boolean {
  if (process.env[varName]) {
    checks.push({
      name: `Environment: ${varName}`,
      status: "pass",
      message: `${varName} is set`,
    });
    return true;
  } else {
    checks.push({
      name: `Environment: ${varName}`,
      status: "fail",
      message: `${varName} is not set`,
      action: `Set ${varName} in .env file`,
    });
    return false;
  }
}

function checkCommand(command: string, description: string): boolean {
  try {
    execSync(command, { stdio: "ignore" });
    checks.push({
      name: description,
      status: "pass",
      message: `${description} available`,
    });
    return true;
  } catch {
    checks.push({
      name: description,
      status: "fail",
      message: `${description} not available`,
      action: `Install ${description}`,
    });
    return false;
  }
}

function checkMigrationFiles(): boolean {
  const migrationsDir = path.join(process.cwd(), "src/db/migrations");
  
  if (!fs.existsSync(migrationsDir)) {
    checks.push({
      name: "Migration Directory",
      status: "fail",
      message: "Migration directory not found",
      action: "Run: pnpm db:generate",
    });
    return false;
  }
  
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter(e => e.isDirectory());
  
  if (entries.length === 0) {
    checks.push({
      name: "Migration Files",
      status: "warn",
      message: "No migrations found",
      action: "Run: pnpm db:generate to create first migration",
    });
    return false;
  }
  
  let allValid = true;
  
  for (const entry of entries) {
    const migrationDir = path.join(migrationsDir, entry.name);
    const hasSql = fs.existsSync(path.join(migrationDir, "migration.sql"));
    const hasSnapshot = fs.existsSync(path.join(migrationDir, "snapshot.json"));
    
    if (!hasSql || !hasSnapshot) {
      checks.push({
        name: `Migration: ${entry.name}`,
        status: "fail",
        message: `Invalid migration format (missing ${!hasSql ? "migration.sql" : "snapshot.json"})`,
        action: "Regenerate migration with: pnpm db:generate",
      });
      allValid = false;
    }
  }
  
  if (allValid) {
    checks.push({
      name: "Migration Files",
      status: "pass",
      message: `Found ${entries.length} valid migration(s)`,
    });
  }
  
  return allValid;
}

function checkDatabaseConnection(): boolean {
  if (!process.env.DATABASE_URL) {
    checks.push({
      name: "Database Connection",
      status: "fail",
      message: "DATABASE_URL not set",
      action: "Set DATABASE_URL in .env file",
    });
    return false;
  }
  
  // Try to parse the connection string
  try {
    const url = new URL(process.env.DATABASE_URL);
    
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      checks.push({
        name: "Database Connection",
        status: "fail",
        message: "DATABASE_URL must be a PostgreSQL connection string",
        action: "Use format: postgresql://user:pass@host:port/database",
      });
      return false;
    }
    
    checks.push({
      name: "Database Connection",
      status: "pass",
      message: `Connection string valid (${url.hostname}:${url.port || 5432}/${url.pathname.slice(1)})`,
    });
    return true;
  } catch {
    checks.push({
      name: "Database Connection",
      status: "fail",
      message: "Invalid DATABASE_URL format",
      action: "Use format: postgresql://user:pass@host:port/database",
    });
    return false;
  }
}

function printResults(): void {
  console.log("🔍 Migration Preparation Checklist\n");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  const passed = checks.filter(c => c.status === "pass");
  const failed = checks.filter(c => c.status === "fail");
  const warned = checks.filter(c => c.status === "warn");
  
  // Print all checks
  for (const check of checks) {
    const icon = check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️";
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}`);
    if (check.action) {
      console.log(`   💡 Action: ${check.action}`);
    }
    console.log();
  }
  
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log("Summary:");
  console.log(`  ✅ Passed: ${passed.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);
  console.log(`  ⚠️  Warnings: ${warned.length}`);
  console.log();
  
  if (failed.length === 0 && warned.length === 0) {
    console.log("🚀 Ready to migrate! Run: pnpm db:migrate\n");
    process.exit(0);
  } else if (failed.length === 0) {
    console.log("⚠️  Ready to migrate with warnings. Review warnings above.\n");
    console.log("To proceed: pnpm db:migrate\n");
    process.exit(0);
  } else {
    console.log("❌ Not ready to migrate. Fix the issues above first.\n");
    console.log("Quick setup:\n");
    console.log("  1. cp .env.example .env");
    console.log("  2. Edit .env with your DATABASE_URL");
    console.log("  3. createdb afenda");
    console.log("  4. psql afenda -c \"CREATE EXTENSION IF NOT EXISTS btree_gist;\"");
    console.log("  5. psql afenda -c \"CREATE EXTENSION IF NOT EXISTS pgcrypto;\"");
    console.log("  6. pnpm db:migrate\n");
    console.log("Or use Docker: pnpm docker:test:start && pnpm db:migrate\n");
    process.exit(1);
  }
}

function main(): void {
  // 1. Check Drizzle config
  checkFile("drizzle.config.ts", "Drizzle Config");
  
  // 2. Check schema files
  checkFile("src/db/schema-platform/index.ts", "Schema Entry Point");
  
  // 3. Check migration files
  checkMigrationFiles();
  
  // 4. Check environment
  checkFile(".env", "Environment File");
  checkEnvVar("DATABASE_URL");
  
  // 5. Check database connection (if DATABASE_URL set)
  if (process.env.DATABASE_URL) {
    checkDatabaseConnection();
  }
  
  // 6. Check required tools
  checkCommand("node --version", "Node.js");
  checkCommand("pnpm --version", "pnpm");
  
  // 7. PostgreSQL client check removed - using Drizzle Studio instead (pnpm db:studio)
  
  // 8. Check git (optional)
  try {
    execSync("git --version", { stdio: "ignore" });
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
    checks.push({
      name: "Git Repository",
      status: "pass",
      message: "Git repository initialized",
    });
  } catch {
    checks.push({
      name: "Git Repository",
      status: "warn",
      message: "Not a git repository (optional but recommended)",
      action: "Run: git init",
    });
  }
  
  // 9. Check validation scripts
  checkFile("scripts/validate-migrations.ts", "Migration Validator");
  checkFile("scripts/detect-schema-drift.ts", "Drift Detector");
  
  // 10. Check documentation
  checkFile("docs/SCHEMA_LOCKDOWN.md", "Schema Lockdown Guide");
  checkFile("src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json", "Custom SQL Registry");
  
  // Print results
  printResults();
}

main();
