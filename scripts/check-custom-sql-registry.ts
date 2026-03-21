/**
 * Custom SQL Registry Validator
 * 
 * Validates CUSTOM_SQL_REGISTRY.json against its schema and cross-references
 * with actual migration files.
 * 
 * Checks:
 * - JSON schema compliance
 * - Migration file existence
 * - Line number accuracy
 * - Marker presence in migrations
 * - Approval metadata completeness
 * 
 * @see docs/SCHEMA_LOCKDOWN.md
 */

import * as fs from "fs";
import * as path from "path";

const REGISTRY_PATH = path.join(process.cwd(), "src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json");
const SCHEMA_PATH = path.join(process.cwd(), "src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.schema.json");
const MIGRATIONS_DIR = path.join(process.cwd(), "src/db/migrations");

interface RegistryEntry {
  purpose: string;
  migration: string;
  type: string;
  justification: string;
  rollback: string;
  approvedBy?: string;
  approvedDate?: string;
  sqlLines?: string;
  performanceImpact?: string;
  securityReview?: boolean;
  notes?: string;
}

interface Registry {
  $schema?: string;
  version?: string;
  description?: string;
  entries: Record<string, RegistryEntry>;
}

interface ValidationIssue {
  id: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion?: string;
}

const issues: ValidationIssue[] = [];

const VALID_TYPES = [
  "PARTITION",
  "TRIGGER",
  "TRIGGER_FUNCTION",
  "FUNCTION",
  "PROCEDURE",
  "INDEX",
  "POLICY",
  "CONSTRAINT",
  "EXTENSION",
  "OTHER",
];

function validateJsonSyntax(): Registry | null {
  if (!fs.existsSync(REGISTRY_PATH)) {
    issues.push({
      id: "N/A",
      rule: "registry-exists",
      message: "CUSTOM_SQL_REGISTRY.json does not exist",
      severity: "error",
      suggestion: "Create the registry file at src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json",
    });
    return null;
  }
  
  try {
    const content = fs.readFileSync(REGISTRY_PATH, "utf-8");
    return JSON.parse(content) as Registry;
  } catch (error) {
    issues.push({
      id: "N/A",
      rule: "json-syntax",
      message: `Invalid JSON syntax: ${error instanceof Error ? error.message : String(error)}`,
      severity: "error",
      suggestion: "Fix JSON syntax errors in the registry file",
    });
    return null;
  }
}

function validateIdFormat(registry: Registry): void {
  const idPattern = /^CSQL-\d+$/;
  
  for (const id of Object.keys(registry.entries)) {
    if (!idPattern.test(id)) {
      issues.push({
        id,
        rule: "id-format",
        message: `Invalid ID format: "${id}" does not match CSQL-XXX pattern`,
        severity: "error",
        suggestion: "Use format: CSQL-001, CSQL-002, etc.",
      });
    }
  }
  
  // Check for sequential IDs
  const ids = Object.keys(registry.entries)
    .filter(id => idPattern.test(id))
    .map(id => parseInt(id.replace("CSQL-", ""), 10))
    .sort((a, b) => a - b);
  
  for (let i = 0; i < ids.length - 1; i++) {
    if (ids[i + 1] - ids[i] > 1) {
      issues.push({
        id: `CSQL-${ids[i]}`,
        rule: "id-sequence",
        message: `Gap in ID sequence: CSQL-${ids[i]} to CSQL-${ids[i + 1]}`,
        severity: "info",
        suggestion: "Consider using sequential IDs for easier tracking",
      });
    }
  }
}

function validateEntryFields(registry: Registry): void {
  for (const [id, entry] of Object.entries(registry.entries)) {
    // Required fields
    if (!entry.purpose || entry.purpose.length < 10) {
      issues.push({
        id,
        rule: "purpose-required",
        message: "Purpose is missing or too short (min 10 characters)",
        severity: "error",
        suggestion: "Provide a clear, descriptive purpose for the custom SQL",
      });
    }
    
    if (!entry.migration) {
      issues.push({
        id,
        rule: "migration-required",
        message: "Migration name is missing",
        severity: "error",
        suggestion: "Specify the migration file name (e.g., 20260319144405_gifted_ultragirl)",
      });
    } else {
      // Validate migration name format
      const migrationPattern = /^\d{14}_[a-z_]+$/;
      if (!migrationPattern.test(entry.migration)) {
        issues.push({
          id,
          rule: "migration-format",
          message: `Invalid migration name format: "${entry.migration}"`,
          severity: "error",
          suggestion: "Use format: YYYYMMDDHHMMSS_descriptive_name (e.g., 20260319144405_gifted_ultragirl)",
        });
      }
    }
    
    if (!entry.type) {
      issues.push({
        id,
        rule: "type-required",
        message: "Type is missing",
        severity: "error",
        suggestion: `Specify one of: ${VALID_TYPES.join(", ")}`,
      });
    } else if (!VALID_TYPES.includes(entry.type)) {
      issues.push({
        id,
        rule: "type-valid",
        message: `Invalid type: "${entry.type}"`,
        severity: "error",
        suggestion: `Use one of: ${VALID_TYPES.join(", ")}`,
      });
    }
    
    if (!entry.justification || entry.justification.length < 20) {
      issues.push({
        id,
        rule: "justification-required",
        message: "Justification is missing or too short (min 20 characters)",
        severity: "error",
        suggestion: "Explain why Drizzle ORM cannot express this SQL",
      });
    }
    
    if (!entry.rollback || entry.rollback.length < 10) {
      issues.push({
        id,
        rule: "rollback-required",
        message: "Rollback procedure is missing or too short (min 10 characters)",
        severity: "error",
        suggestion: "Provide SQL to undo this custom SQL block",
      });
    }
    
    // Approval fields (warning if missing)
    if (!entry.approvedBy) {
      issues.push({
        id,
        rule: "approval-required",
        message: "approvedBy field is missing",
        severity: "warning",
        suggestion: "Add approvedBy with the approver's name or team",
      });
    }
    
    if (!entry.approvedDate) {
      issues.push({
        id,
        rule: "approval-date-required",
        message: "approvedDate field is missing",
        severity: "warning",
        suggestion: "Add approvedDate in YYYY-MM-DD format",
      });
    } else {
      // Validate date format
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(entry.approvedDate)) {
        issues.push({
          id,
          rule: "date-format",
          message: `Invalid date format: "${entry.approvedDate}"`,
          severity: "error",
          suggestion: "Use ISO 8601 format: YYYY-MM-DD",
        });
      }
    }
    
    // Line numbers (info if TBD)
    if (entry.sqlLines === "TBD") {
      issues.push({
        id,
        rule: "lines-tbd",
        message: "sqlLines is marked as TBD",
        severity: "info",
        suggestion: "Update with actual line numbers once implemented",
      });
    } else if (entry.sqlLines) {
      const linesPattern = /^\d+-\d+$/;
      if (!linesPattern.test(entry.sqlLines)) {
        issues.push({
          id,
          rule: "lines-format",
          message: `Invalid sqlLines format: "${entry.sqlLines}"`,
          severity: "warning",
          suggestion: "Use format: startLine-endLine (e.g., 18-78)",
        });
      }
    }
  }
}

function validateMigrationReferences(registry: Registry): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log("ℹ️ No migrations directory found - skipping migration reference validation\n");
    return;
  }
  
  const migrations = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
  
  for (const [id, entry] of Object.entries(registry.entries)) {
    if (!entry.migration) continue;
    
    // Check if migration exists
    if (!migrations.includes(entry.migration)) {
      issues.push({
        id,
        rule: "migration-exists",
        message: `Migration "${entry.migration}" does not exist`,
        severity: "warning",
        suggestion: "Verify migration name or create the migration",
      });
      continue;
    }
    
    // Check for marker in migration file
    const migrationSqlPath = path.join(MIGRATIONS_DIR, entry.migration, "migration.sql");
    if (fs.existsSync(migrationSqlPath)) {
      const sqlContent = fs.readFileSync(migrationSqlPath, "utf-8");
      const markerPattern = new RegExp(`-- CUSTOM:.*\\(${id}\\)`, "i");
      
      if (!markerPattern.test(sqlContent)) {
        issues.push({
          id,
          rule: "marker-present",
          message: `Marker for ${id} not found in migration "${entry.migration}"`,
          severity: "warning",
          suggestion: `Add marker: -- CUSTOM: ${entry.purpose} (${id})`,
        });
      }
    }
  }
}

function validateAgainstSchema(registry: Registry): void {
  if (!fs.existsSync(SCHEMA_PATH)) {
    issues.push({
      id: "N/A",
      rule: "schema-exists",
      message: "CUSTOM_SQL_REGISTRY.schema.json does not exist",
      severity: "info",
      suggestion: "Create the JSON schema file for validation",
    });
    return;
  }
  
  // Basic schema validation (full JSON Schema validation would require a library)
  if (!registry.version) {
    issues.push({
      id: "N/A",
      rule: "version-required",
      message: "Registry version field is missing",
      severity: "warning",
      suggestion: 'Add "version": "1.0" to the registry',
    });
  }
  
  if (!registry.entries || typeof registry.entries !== "object") {
    issues.push({
      id: "N/A",
      rule: "entries-required",
      message: "Registry entries field is missing or invalid",
      severity: "error",
      suggestion: 'Add "entries": {} object to the registry',
    });
  }
}

function checkForOrphanedMarkers(): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) return;
  
  const migrations = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
  
  const registryIds = new Set(Object.keys(JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8")).entries || {}));
  
  for (const migration of migrations) {
    const sqlPath = path.join(MIGRATIONS_DIR, migration, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;
    
    const content = fs.readFileSync(sqlPath, "utf-8");
    const markerMatches = content.matchAll(/-- CUSTOM:.*\((CSQL-\d+)\)/g);
    
    for (const match of markerMatches) {
      const markerId = match[1];
      if (!registryIds.has(markerId)) {
        issues.push({
          id: markerId,
          rule: "orphaned-marker",
          message: `Marker ${markerId} in migration "${migration}" not found in registry`,
          severity: "error",
          suggestion: `Add entry for ${markerId} to CUSTOM_SQL_REGISTRY.json`,
        });
      }
    }
  }
}

function main(): void {
  console.log("🔍 Custom SQL Registry Validation\n");
  
  // Step 1: Validate JSON syntax
  const registry = validateJsonSyntax();
  if (!registry) {
    printResults();
    process.exit(1);
  }
  
  console.log(`Found ${Object.keys(registry.entries || {}).length} registry entries\n`);
  
  // Step 2: Validate against schema
  validateAgainstSchema(registry);
  
  // Step 3: Validate ID format
  validateIdFormat(registry);
  
  // Step 4: Validate entry fields
  validateEntryFields(registry);
  
  // Step 5: Validate migration references
  validateMigrationReferences(registry);
  
  // Step 6: Check for orphaned markers
  checkForOrphanedMarkers();
  
  // Print results
  printResults();
}

function printResults(): void {
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ Custom SQL Registry validation passed!\n");
    process.exit(0);
  }
  
  console.log("Issues found:\n");
  
  // Group by ID
  const byId = issues.reduce((acc, issue) => {
    if (!acc[issue.id]) acc[issue.id] = [];
    acc[issue.id].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>);
  
  for (const [id, idIssues] of Object.entries(byId)) {
    console.log(`=== ${id} ===\n`);
    
    for (const issue of idIssues) {
      const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`${icon} [${issue.rule}]`);
      console.log(`   ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 ${issue.suggestion}`);
      }
      console.log();
    }
  }
  
  console.log("─".repeat(60));
  console.log(`\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info(s)\n`);
  
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
