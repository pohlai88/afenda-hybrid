/**
 * Enhanced Guideline Compliance Checker v2
 * 
 * Comprehensive checks based on DB-first guideline:
 * - P1: Database as Source of Truth
 * - P2: Minimal Core, Stable Contracts
 * - P3: Enforce Invariants in DB
 * - P4: Versioned Migrations Only
 * - P5: Operational First
 * - P6: Pragmatic Normalization
 * - P7: TypeScript as Schema Language
 * 
 * Additional checks:
 * - Zod 4 patterns (branded IDs, top-level formats)
 * - Mixin usage patterns
 * - Cross-schema FK conventions
 * - Index patterns
 * 
 * Output includes inline diagnostics with:
 * - File path and line number (IDE-clickable)
 * - Code snippet showing the problematic line
 * - Suggestion for fix
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, TableInfo, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface ComplianceIssue {
  file: string;
  line: number;
  column: number;
  table?: string;
  principle: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  autoFixable: boolean;
  codeSnippet?: string;
  suggestion?: string;
}

const issues: ComplianceIssue[] = [];

// Tier 1-2 schemas (foundational)
const CORE_SCHEMAS = ["core", "security", "audit", "observability"];

// Tables that don't need tenant isolation
const TENANT_EXEMPT = ["tenants", "regions", "audit_trail", "traces", "retention_policies"];

// Columns that are intentionally nullable (audit context fields, polymorphic refs)
const NULLABLE_EXEMPT_COLUMNS: Record<string, string[]> = {
  audit_trail: [
    "actorId",        // Nullable for SYSTEM/ANONYMOUS actors
    "sourceIp",       // Not always available (internal calls)
    "sourceLocation", // Geo lookup may fail
    "reason",         // Optional business justification
    "correlationId",  // Not all requests have trace context
    "requestId",      // Not all requests have request IDs
    "rowKey",         // Non-data operations (LOGIN/LOGOUT) may not have row key
    "affectedColumns",// Only populated for UPDATE operations
    "targetActorId",  // Only for user-affecting operations
    "clientInfo",     // Not always available
    "sessionId",      // Not all operations have session context
  ],
  retention_policies: [
    "tenantId",       // NULL = global default policy
    "schemaName",     // NULL = all schemas
    "tableName",      // NULL = all tables
    "archivePath",    // Only required for non-NONE destinations
    "description",    // Optional documentation
    "effectiveFrom",  // NULL = immediate effect
    "lastAppliedAt",  // NULL = never applied yet
  ],
};

// Columns that look like FKs but are intentionally not constrained
const FK_EXEMPT_COLUMNS: Record<string, string[]> = {
  audit_trail: [
    "actorId",        // Polymorphic: references users OR servicePrincipals
    "targetActorId",  // Polymorphic: same as actorId
    "correlationId",  // External trace ID, not a DB reference
    "requestId",      // External request ID, not a DB reference
    "sessionId",      // External session ID, not a DB reference
  ],
};

function findLineAndColumn(content: string, searchStr: string): { line: number; column: number } {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const col = lines[i].indexOf(searchStr);
    if (col !== -1) {
      return { line: i + 1, column: col + 1 };
    }
  }
  return { line: 1, column: 1 };
}

function getCodeSnippet(content: string, lineNum: number, context: number = 1): string {
  const lines = content.split("\n");
  const start = Math.max(0, lineNum - 1 - context);
  const end = Math.min(lines.length, lineNum + context);
  
  const snippetLines: string[] = [];
  for (let i = start; i < end; i++) {
    const prefix = i === lineNum - 1 ? ">" : " ";
    const lineNumStr = String(i + 1).padStart(4, " ");
    snippetLines.push(`${prefix} ${lineNumStr} | ${lines[i]}`);
  }
  return snippetLines.join("\n");
}

function checkP1_DatabaseAsSourceOfTruth(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Check for timestamp columns (audit trail)
  if (!table.hasTimestamps) {
    const loc = findLineAndColumn(content, ".table(");
    issues.push({
      file: table.relativePath,
      line: loc.line,
      column: loc.column,
      table: table.name,
      principle: "P1",
      rule: "timestamp-columns",
      message: "Table should include timestamp columns (createdAt, updatedAt) for audit trail",
      severity: "warning",
      autoFixable: true,
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: "Add ...timestampColumns from _shared/timestamps.ts",
    });
  }
  
  // NEW: Check for append-only tables with updatedAt (Gap 2)
  const isAppendOnly = 
    content.includes("append-only") || 
    content.includes("appendOnlyTimestampColumns") ||
    content.includes("immutable") ||
    table.name.includes("trail") ||
    table.name.includes("log") ||
    table.name.includes("event") ||
    table.name.includes("history");

  if (isAppendOnly && content.includes("updatedAt") && !content.includes("appendOnlyTimestampColumns")) {
    const loc = findLineAndColumn(content, "updatedAt");
    issues.push({
      file: table.relativePath,
      line: loc.line,
      column: loc.column,
      table: table.name,
      principle: "P1",
      rule: "append-only-no-updates",
      message: "Append-only table should not have updatedAt column",
      severity: "error",
      autoFixable: true,
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: "Use appendOnlyTimestampColumns mixin instead of timestampColumns",
    });
  }
  
  // Check for type exports (TypeScript types from DB schema)
  if (!table.hasTypeExports) {
    const loc = findLineAndColumn(content, `export const ${table.name}`);
    issues.push({
      file: table.relativePath,
      line: loc.line > 0 ? loc.line : 1,
      column: 1,
      table: table.name,
      principle: "P1",
      rule: "type-exports",
      message: "Table should export TypeScript types using $inferSelect and $inferInsert",
      severity: "warning",
      autoFixable: true,
      suggestion: `Add at end of file:\nexport type ${capitalize(table.name)} = typeof ${table.name}.$inferSelect;\nexport type New${capitalize(table.name)} = typeof ${table.name}.$inferInsert;`,
    });
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function checkP3_EnforceInvariantsInDB(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  const nullableExceptions = [
    "deletedAt",
    "settings",
    "oldData",
    "newData",
    "metadata",
    "preferences",
    "parentOrganizationId",
    "regionId",
    "address",
    "postalCode",
    "latitude",
    "longitude",
    "lastUsedAt",
    "expiresAt",
    "description",
    "permissions",
  ];
  
  // NEW: Check for timestamp type consistency (Gap 1)
  const timestampPatterns = ["At", "Date", "Time", "Timestamp"];
  for (const col of table.columns) {
    const hasTimestampSemantics = timestampPatterns.some(p => col.name.endsWith(p));
    if (hasTimestampSemantics && col.type !== "timestamp") {
      const loc = findLineAndColumn(content, `${col.name}:`);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "timestamp-type-consistency",
        message: `Column "${col.name}" has timestamp semantics but uses ${col.type}() instead of timestamp({ withTimezone: true })`,
        severity: "error",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Change to: ${col.name}: timestamp({ withTimezone: true })`,
      });
    }
  }
  
  for (const col of table.columns) {
    // Check table-specific nullable exemptions
    const tableNullableExempt = NULLABLE_EXEMPT_COLUMNS[table.name] || [];
    const isExempt = nullableExceptions.includes(col.name) || tableNullableExempt.includes(col.name);
    
    if (!col.isNotNull && !col.isPrimaryKey && !col.isGenerated && !isExempt) {
      const loc = findLineAndColumn(content, `${col.name}:`);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "not-null-default",
        message: `Column "${col.name}" should be .notNull() unless explicitly justified`,
        severity: "warning",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: "Add .notNull() or add column to nullableExceptions if intentionally nullable",
      });
    }
  }
  
  // Check FK constraints on reference columns
  const refColumns = table.columns.filter(c => c.name.endsWith("Id") && !c.isPrimaryKey);
  const tableFkExempt = FK_EXEMPT_COLUMNS[table.name] || [];
  
  for (const col of refColumns) {
    const hasFk = table.foreignKeys.some(fk => 
      fk.columns.includes(col.name) || 
      fk.references.includes(col.name) ||
      (fk.name && fk.name.toLowerCase().includes(col.name.replace(/Id$/, "").toLowerCase()))
    );
    const isFkExempt = col.name === "tenantId" || col.name === "clientId" || tableFkExempt.includes(col.name);
    
    if (!hasFk && !isFkExempt) {
      const loc = findLineAndColumn(content, `${col.name}:`);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "fk-constraint",
        message: `Column "${col.name}" looks like a reference but has no FK constraint`,
        severity: "warning",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: "Add .references(() => table.column) or foreignKey() in table config",
      });
    }
  }
  
  // NEW: Check polymorphic FK patterns (Gap 3)
  const polymorphicFks = tableFkExempt.filter(col => col.endsWith("Id"));
  for (const polyCol of polymorphicFks) {
    const baseName = polyCol.replace(/Id$/, "");
    const discriminatorCol = `${baseName}Type`;
    
    // Check for discriminator column
    const hasDiscriminator = table.columns.some(c => c.name === discriminatorCol);
    
    if (!hasDiscriminator) {
      const loc = findLineAndColumn(content, `${polyCol}:`);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "polymorphic-discriminator",
        message: `Polymorphic FK "${polyCol}" should have discriminator column "${discriminatorCol}"`,
        severity: "error",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Add: ${discriminatorCol}: someEnum().notNull() and check constraint to enforce integrity`,
      });
    }
    
    // Check for check constraint
    const hasCheckConstraint = content.includes(`chk_${table.name}_${baseName}_type_match`) ||
                                content.includes(`chk_${table.name}_${baseName.toLowerCase()}_type_match`);
    if (hasDiscriminator && !hasCheckConstraint) {
      const loc = findLineAndColumn(content, discriminatorCol);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "polymorphic-check-constraint",
        message: `Polymorphic FK pattern should have check constraint for type matching`,
        severity: "warning",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Add check constraint to ensure ${discriminatorCol} matches the referenced table`,
      });
    }
  }
  
  // Check FK actions are specified
  for (const fk of table.foreignKeys) {
    if (!fk.hasActions) {
      const searchStr = fk.name ? `name: "${fk.name}"` : ".references(";
      const loc = findLineAndColumn(content, searchStr);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "fk-actions",
        message: `Foreign key ${fk.name || "(inline)"} should specify onDelete/onUpdate actions`,
        severity: "warning",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: "Add .onDelete('restrict').onUpdate('cascade') or equivalent",
      });
    }
  }
  
  // Check unique constraints include tenantId for tenant-scoped tables
  if (table.hasTenantScope && table.name !== "tenants") {
    for (const idx of table.indexes) {
      // Globally unique identifiers (e.g. OAuth client_id) are intentionally not tenant-prefixed
      if (idx.isUnique && idx.name === "uq_service_principals_client_id") continue;
      if (idx.isUnique && !idx.columns.some(c => c.includes("tenantId"))) {
        const loc = findLineAndColumn(content, `"${idx.name}"`);
        issues.push({
          file: table.relativePath,
          line: loc.line,
          column: loc.column,
          table: table.name,
          principle: "P3",
          rule: "unique-includes-tenant",
          message: `Unique index "${idx.name}" should include tenantId for tenant isolation`,
          severity: "warning",
          autoFixable: false,
          codeSnippet: getCodeSnippet(content, loc.line, 2),
          suggestion: "Add t.tenantId as the first column in the unique constraint",
        });
      }
    }
  }
}

function checkP7_TypeScriptAsSchemaLanguage(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Check for Zod schema exports
  if (!table.hasZodSchemas.select) {
    const loc = findLineAndColumn(content, "createSelectSchema");
    issues.push({
      file: table.relativePath,
      line: loc.line > 0 ? loc.line : 1,
      column: 1,
      table: table.name,
      principle: "P7",
      rule: "zod-select-schema",
      message: "Missing createSelectSchema export",
      severity: "error",
      autoFixable: true,
      suggestion: `Add: export const ${table.name}SelectSchema = createSelectSchema(${table.name});`,
    });
  }
  
  if (!table.hasZodSchemas.insert) {
    const loc = findLineAndColumn(content, "createInsertSchema");
    issues.push({
      file: table.relativePath,
      line: loc.line > 0 ? loc.line : 1,
      column: 1,
      table: table.name,
      principle: "P7",
      rule: "zod-insert-schema",
      message: "Missing createInsertSchema export",
      severity: "error",
      autoFixable: true,
      suggestion: `Add: export const ${table.name}InsertSchema = createInsertSchema(${table.name});`,
    });
  }
  
  // Check for branded ID types
  if (!table.hasBrandedId) {
    issues.push({
      file: table.relativePath,
      line: 1,
      column: 1,
      table: table.name,
      principle: "P7",
      rule: "branded-id",
      message: "Missing branded ID type for type-safe entity references",
      severity: "info",
      autoFixable: true,
      suggestion: `Add: export const ${capitalize(table.name)}IdSchema = z.number().int().brand<"${capitalize(table.name)}Id">();\nexport type ${capitalize(table.name)}Id = z.infer<typeof ${capitalize(table.name)}IdSchema>;`,
    });
  }
  
  // NEW: Check Zod schema alignment with column types (Gap 7)
  const pkColumn = table.columns.find(c => c.isPrimaryKey);
  if (pkColumn && table.hasBrandedId) {
    const idSchemaName = `${capitalize(table.name)}IdSchema`;
    const idSchemaMatch = content.match(new RegExp(`${idSchemaName}\\s*=\\s*z\\.(\\w+)\\(`));
    
    if (idSchemaMatch) {
      const zodType = idSchemaMatch[1]; // "bigint", "number", "string"
      
      // Check alignment
      const columnModeMatch = content.match(new RegExp(`${pkColumn.name}:\\s*${pkColumn.type}\\(\\{[^}]*mode:\\s*["']([^"']+)["']`));
      const mode = columnModeMatch ? columnModeMatch[1] : (pkColumn.type === "bigint" ? "bigint" : pkColumn.type);
      
      // Determine expected Zod type
      let expectedZodType = "number";
      if (pkColumn.type === "text" || pkColumn.type === "varchar") {
        expectedZodType = "string";
      } else if (pkColumn.type === "bigint" && mode === "bigint") {
        expectedZodType = "bigint";
      } else if (pkColumn.type === "bigint" && mode === "number") {
        expectedZodType = "number";
      } else if (pkColumn.type === "integer" || pkColumn.type === "smallint") {
        expectedZodType = "number";
      }
      
      if (zodType !== expectedZodType) {
        const loc = findLineAndColumn(content, idSchemaName);
        issues.push({
          file: table.relativePath,
          line: loc.line,
          column: loc.column,
          table: table.name,
          principle: "P7",
          rule: "zod-type-alignment",
          message: `Branded ID schema uses z.${zodType}() but column uses ${pkColumn.type}({ mode: "${mode}" })`,
          severity: "error",
          autoFixable: true,
          codeSnippet: getCodeSnippet(content, loc.line),
          suggestion: `Change to: export const ${idSchemaName} = z.${expectedZodType}()${expectedZodType === 'number' ? '.int()' : ''}.brand<"${capitalize(table.name)}Id">();`,
        });
      }
    }
  }
  
  // Check for deprecated drizzle-zod import
  if (content.includes("drizzle-zod")) {
    const loc = findLineAndColumn(content, "drizzle-zod");
    issues.push({
      file: table.relativePath,
      line: loc.line,
      column: loc.column,
      table: table.name,
      principle: "P7",
      rule: "deprecated-import",
      message: "Using deprecated drizzle-zod package",
      severity: "error",
      autoFixable: true,
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: 'Change import to: import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";',
    });
  }
}

function checkTenantIsolation(table: TableInfo, schema: SchemaInfo): void {
  if (CORE_SCHEMAS.includes(schema.name) && schema.name !== "security") return;
  if (TENANT_EXEMPT.includes(table.name)) return;
  
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Check for tenantId
  if (!table.hasTenantScope) {
    const loc = findLineAndColumn(content, ".table(");
    issues.push({
      file: table.relativePath,
      line: loc.line,
      column: loc.column,
      table: table.name,
      principle: "P3",
      rule: "tenant-scope",
      message: "Domain table should include tenantId for tenant isolation",
      severity: "error",
      autoFixable: true,
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: "Add ...tenantScopedColumns from _shared/tenantScope.ts",
    });
    return;
  }
  
  // Check for tenant index
  const hasTenantIndex = table.indexes.some(idx => 
    idx.columns[0]?.includes("tenantId")
  );
  if (!hasTenantIndex) {
    const loc = findLineAndColumn(content, "tenantId");
    issues.push({
      file: table.relativePath,
      line: loc.line,
      column: loc.column,
      table: table.name,
      principle: "P3",
      rule: "tenant-index",
      message: "Tenant-scoped table should have an index with tenantId as leading column",
      severity: "warning",
      autoFixable: false,
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: `Add in table config: index('idx_${table.name}_tenant').on(t.tenantId)`,
    });
  }
}

function checkMixinUsage(_table: TableInfo): void {
  // Mixin usage checks moved to check-shared-columns.ts
  // Run `pnpm check:shared` for detailed shared column analysis
}

function checkConstraintPatterns(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Check for numeric types on financial columns
  const financialPatterns = ["amount", "price", "cost", "total", "balance", "fee", "rate"];
  for (const col of table.columns) {
    const isFinancial = financialPatterns.some(p => col.name.toLowerCase().includes(p));
    if (isFinancial && (col.type === "real" || col.type === "doublePrecision")) {
      const loc = findLineAndColumn(content, `${col.name}:`);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "numeric-for-money",
        message: `Financial column "${col.name}" should use numeric() not ${col.type}()`,
        severity: "error",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Change to: ${col.name}: numeric({ precision: 12, scale: 2 })`,
      });
    }
  }
  
  // Check for case-insensitive uniqueness on code columns
  const codeColumns = table.columns.filter(c => 
    c.name.toLowerCase().includes("code") && 
    (c.type === "text" || c.type === "varchar")
  );
  
  for (const col of codeColumns) {
    // Check if column has case-insensitive uniqueness
    const hasCitextType = content.includes(`${col.name}: citext`);
    const hasLowerIndex = table.indexes.some(idx => 
      idx.name.toLowerCase().includes(col.name.toLowerCase()) &&
      content.includes(`lower(${col.name})`)
    );
    
    // Check if column is part of unique constraint
    const isUnique = table.indexes.some(idx => 
      idx.isUnique && idx.columns.some(c => c.toLowerCase().includes(col.name.toLowerCase()))
    );
    
    if (isUnique && !hasCitextType && !hasLowerIndex) {
      const loc = findLineAndColumn(content, `${col.name}:`);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "case-insensitive-code",
        message: `Code column "${col.name}" with unique constraint should enforce case-insensitive uniqueness`,
        severity: "info",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Use citext type or add unique index on lower(${col.name}). See docs/patterns/case-insensitive-uniqueness.md`,
      });
    }
  }
  
  // Check for timestamp with timezone
  if (content.includes("timestamp()") && !content.includes("withTimezone")) {
    const loc = findLineAndColumn(content, "timestamp()");
    issues.push({
      file: table.relativePath,
      line: loc.line,
      column: loc.column,
      table: table.name,
      principle: "P3",
      rule: "timestamp-timezone",
      message: "Timestamps should use withTimezone: true",
      severity: "warning",
      autoFixable: false,
      codeSnippet: getCodeSnippet(content, loc.line),
      suggestion: "Change to: timestamp({ withTimezone: true })",
    });
  }
  
  // Check for soft delete with partial unique index
  if (table.hasSoftDelete) {
    const uniqueIndexes = table.indexes.filter(i => i.isUnique);
    for (const idx of uniqueIndexes) {
      if (!idx.hasWhere) {
        const loc = findLineAndColumn(content, `"${idx.name}"`);
        issues.push({
          file: table.relativePath,
          line: loc.line,
          column: loc.column,
          table: table.name,
          principle: "P3",
          rule: "soft-delete-unique",
          message: `Unique index "${idx.name}" should use partial index pattern for soft-delete table`,
          severity: "warning",
          autoFixable: false,
          codeSnippet: getCodeSnippet(content, loc.line, 2),
          suggestion: "Add .where(sql`${t.deletedAt} IS NULL`) to exclude soft-deleted rows",
        });
      }
    }
  }
}

function checkSchemaStructure(schema: SchemaInfo): void {
  // Check for index.ts
  if (!schema.hasIndex) {
    issues.push({
      file: `src/db/schema/${schema.name}/index.ts`,
      line: 1,
      column: 1,
      principle: "P7",
      rule: "barrel-export",
      message: `Missing index.ts barrel export in ${schema.name}`,
      severity: "error",
      autoFixable: true,
      suggestion: `Create index.ts with: export * from "./${schema.tables.map(t => t.name).join('";\nexport * from "./')}";\nexport * from "./_relations";`,
    });
  }
  
  // Check for _relations.ts
  if (!schema.hasRelations && schema.tables.length > 0) {
    issues.push({
      file: `src/db/schema/${schema.name}/_relations.ts`,
      line: 1,
      column: 1,
      principle: "P7",
      rule: "relations-file",
      message: `Missing _relations.ts in ${schema.name}`,
      severity: "warning",
      autoFixable: true,
      suggestion: "Create _relations.ts with defineRelations() for all tables in this schema",
    });
  }
}

function formatDiagnostic(issue: ComplianceIssue): string {
  const lines: string[] = [];
  const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
  const fixable = issue.autoFixable ? " [auto-fixable]" : "";
  
  // File location (IDE-clickable format)
  lines.push(`${icon} ${issue.file}:${issue.line}:${issue.column}${fixable}`);
  
  // Principle, rule, and table
  if (issue.table) {
    lines.push(`   [${issue.principle}/${issue.rule}] Table: ${issue.table}`);
  } else {
    lines.push(`   [${issue.principle}/${issue.rule}]`);
  }
  lines.push(`   ${issue.message}`);
  
  // Code snippet
  if (issue.codeSnippet) {
    lines.push("");
    lines.push(issue.codeSnippet.split("\n").map(l => `   ${l}`).join("\n"));
    lines.push("");
  }
  
  // Suggestion
  if (issue.suggestion) {
    lines.push(`   💡 ${issue.suggestion}`);
  }
  
  return lines.join("\n");
}

function main(): void {
  console.log("🔍 Enhanced Guideline Compliance Check v2\n");
  
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  if (schemas.length === 0) {
    console.log("No schemas found");
    process.exit(0);
  }
  
  // Run all checks
  for (const schema of schemas) {
    checkSchemaStructure(schema);
    
    for (const table of schema.tables) {
      checkP1_DatabaseAsSourceOfTruth(table);
      checkP3_EnforceInvariantsInDB(table);
      checkP7_TypeScriptAsSchemaLanguage(table);
      checkTenantIsolation(table, schema);
      checkMixinUsage(table);
      checkConstraintPatterns(table);
    }
  }
  
  // Report results
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  const autoFixable = issues.filter(i => i.autoFixable);
  
  if (issues.length === 0) {
    console.log("✅ All guideline compliance checks passed!\n");
    process.exit(0);
  }
  
  // Group by principle
  const byPrinciple = issues.reduce((acc, issue) => {
    if (!acc[issue.principle]) acc[issue.principle] = [];
    acc[issue.principle].push(issue);
    return acc;
  }, {} as Record<string, ComplianceIssue[]>);
  
  console.log("Issues found:\n");
  
  for (const [principle, principleIssues] of Object.entries(byPrinciple)) {
    console.log(`=== ${principle} ===\n`);
    
    // Group by file within principle
    const byFile = principleIssues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, ComplianceIssue[]>);
    
    for (const [file, fileIssues] of Object.entries(byFile)) {
      console.log(`── ${file} ──\n`);
      for (const issue of fileIssues) {
        console.log(formatDiagnostic(issue));
        console.log();
      }
    }
  }
  
  console.log("─".repeat(60));
  console.log(`\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info(s)`);
  
  if (autoFixable.length > 0) {
    console.log(`\n🔧 ${autoFixable.length} issue(s) can be auto-fixed.`);
    console.log("   Run: pnpm fix:schema");
  }
  
  console.log("\nRefer to docs/architecture/01-db-first-guideline.md for details.\n");
  
  if (errors.length > 0 || (strictWarnings && warnings.length > 0)) {
    if (strictWarnings && warnings.length > 0 && errors.length === 0) {
      console.log("\n❌ Strict mode: warnings are treated as failures");
    }
    process.exit(1);
  }
}

main();
