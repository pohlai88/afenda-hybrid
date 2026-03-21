/**
 * Checks compliance with DB-first guideline (01-db-first-guideline.md).
 * 
 * Key rules enforced:
 * - P1: Database as source of truth
 * - P3: Enforce invariants in DB (constraints, FKs)
 * - P7: TypeScript as schema language (Drizzle)
 * - Zod schema exports for all tables
 * - Proper use of shared mixins
 */

import * as fs from "fs";
import * as path from "path";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema-platform");

interface ComplianceIssue {
  file: string;
  rule: string;
  principle: string;
  message: string;
  severity: "error" | "warning";
}

const issues: ComplianceIssue[] = [];

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.startsWith("_") && entry.name !== "index.ts") {
      files.push(fullPath);
    }
  }
  return files;
}

function checkTableFile(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath);

  // Skip if not a table file
  if (!content.includes(".table(")) {
    return;
  }

  // P3: Check for NOT NULL usage (default should be notNull)
  const columnMatches = content.match(/(\w+):\s*(integer|text|varchar|boolean|timestamp|date|jsonb|bigint)\([^)]*\)(?!.*\.notNull\(\))/g);
  if (columnMatches) {
    columnMatches.forEach((match) => {
      // Exclude columns that are explicitly nullable (deletedAt, optional fields)
      if (!match.includes("deletedAt") && !match.includes("optional")) {
        const colName = match.match(/^(\w+):/)?.[1];
        if (colName && !["deletedAt", "settings", "oldData", "newData"].includes(colName)) {
          issues.push({
            file: relativePath,
            rule: "not-null-default",
            principle: "P3",
            message: `Column "${colName}" should be .notNull() unless explicitly justified`,
            severity: "warning",
          });
        }
      }
    });
  }

  // P3: Check for foreign key constraints on reference columns
  if (content.includes("tenantId") && !content.includes(".references(") && !content.includes("foreignKey(")) {
    // Check if it's not the tenants table itself
    if (!filePath.includes("tenants.ts")) {
      issues.push({
        file: relativePath,
        rule: "fk-constraint",
        principle: "P3",
        message: "tenantId column should have a foreign key constraint to core.tenants",
        severity: "error",
      });
    }
  }

  // P7: Check for Zod schema exports
  const hasSelectSchema = content.includes("createSelectSchema");
  const hasInsertSchema = content.includes("createInsertSchema");
  
  if (!hasSelectSchema) {
    issues.push({
      file: relativePath,
      rule: "zod-select-schema",
      principle: "P7",
      message: "Missing createSelectSchema export for table",
      severity: "error",
    });
  }
  
  if (!hasInsertSchema) {
    issues.push({
      file: relativePath,
      rule: "zod-insert-schema",
      principle: "P7",
      message: "Missing createInsertSchema export for table",
      severity: "error",
    });
  }

  // Check for timestamp mixin usage
  if (!content.includes("timestampColumns") && !content.includes("createdAt")) {
    issues.push({
      file: relativePath,
      rule: "timestamp-mixin",
      principle: "P1",
      message: "Table should include timestampColumns mixin for audit trail",
      severity: "warning",
    });
  }

  // Check for type exports
  if (!content.includes("$inferSelect") && !content.includes("type ")) {
    issues.push({
      file: relativePath,
      rule: "type-export",
      principle: "P7",
      message: "Missing TypeScript type export (use $inferSelect)",
      severity: "warning",
    });
  }

  // Check for primary key with identity
  if (content.includes(".primaryKey()") && !content.includes("generatedAlwaysAsIdentity")) {
    // Check if it's not a composite PK
    if (!content.includes("primaryKey({")) {
      issues.push({
        file: relativePath,
        rule: "pk-identity",
        principle: "P1",
        message: "Primary key should use .generatedAlwaysAsIdentity() (preferred over serial)",
        severity: "warning",
      });
    }
  }

  // Check for index on tenantId for tenant-scoped tables
  if (content.includes("tenantId:") || content.includes("tenantId =")) {
    if (!content.includes("idx_") || !content.match(/index\([^)]*\)\.on\([^)]*tenantId/)) {
      // Check if there's any index mentioning tenant
      if (!content.includes("tenant")) {
        issues.push({
          file: relativePath,
          rule: "tenant-index",
          principle: "P3",
          message: "Tenant-scoped table should have an index with tenantId as leading column",
          severity: "warning",
        });
      }
    }
  }
}

function checkDrizzleImports(): void {
  const files = walkDir(SCHEMA_DIR);
  
  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(process.cwd(), filePath);

    // Check for drizzle-orm imports (P7)
    if (content.includes(".table(") && !content.includes("drizzle-orm")) {
      issues.push({
        file: relativePath,
        rule: "drizzle-import",
        principle: "P7",
        message: "Table file should import from drizzle-orm",
        severity: "error",
      });
    }

    // Check for deprecated drizzle-zod package
    if (content.includes("drizzle-zod")) {
      issues.push({
        file: relativePath,
        rule: "deprecated-drizzle-zod",
        principle: "P7",
        message: "Use drizzle-orm/zod instead of deprecated drizzle-zod package",
        severity: "error",
      });
    }
  });
}

function main(): void {
  console.log("🔍 Checking DB-first guideline compliance...\n");

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("ℹ️ No schema directory found");
    process.exit(0);
  }

  // Check all table files
  const files = walkDir(SCHEMA_DIR);
  files.forEach(checkTableFile);

  // Check Drizzle imports
  checkDrizzleImports();

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  if (issues.length > 0) {
    console.log("Compliance issues found:\n");
    
    // Group by principle
    const byPrinciple = issues.reduce((acc, issue) => {
      if (!acc[issue.principle]) acc[issue.principle] = [];
      acc[issue.principle].push(issue);
      return acc;
    }, {} as Record<string, ComplianceIssue[]>);

    Object.entries(byPrinciple).forEach(([principle, principleIssues]) => {
      console.log(`\n=== ${principle} ===`);
      principleIssues.forEach((issue) => {
        const icon = issue.severity === "error" ? "❌" : "⚠️";
        console.log(`${icon} [${issue.rule}] ${issue.file}`);
        console.log(`   ${issue.message}`);
      });
    });

    console.log(`\n\nSummary: ${errorCount} error(s), ${warningCount} warning(s)`);
    console.log("\nRefer to docs/architecture/01-db-first-guideline.md for details.");
    
    if (errorCount > 0) {
      process.exit(1);
    }
  } else {
    console.log("✅ All guideline compliance checks passed!");
  }
}

main();
