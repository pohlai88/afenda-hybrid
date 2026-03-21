/**
 * Index Pattern Checker
 * 
 * Validates that tables have appropriate indexes for common query patterns.
 * 
 * Checks:
 * - Composite indexes for tenant + operation/status + timestamp queries
 * - Tenant index as leading column for tenant-scoped tables
 * - Partial indexes for soft-delete tables
 * - Index coverage for common filter patterns
 * 
 * @see docs/CI_GATES.md
 */

import * as path from "path";
import { analyzeSchema, TableInfo, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema-platform");
const strictWarnings = process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface IndexIssue {
  file: string;
  line: number;
  table: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

const issues: IndexIssue[] = [];

/** Tables where generic `status` + timestamp should not imply tenant+workflow composite index */
const COMPOSITE_INDEX_STATUS_FALSE_POSITIVES = new Set([
  "retention_policies",
  "service_principals",
]);

function checkCompositeIndexPatterns(table: TableInfo, _schema: SchemaInfo): void {
  // Skip non-tenant-scoped tables
  if (!table.hasTenantScope) return;
  
  // Check for operation/status columns (status alone is too broad — see exempt list)
  const hasOperationCol = table.columns.some(c => 
    c.name === "operation" || c.name === "type" || c.name === "state" ||
    (c.name === "status" && !COMPOSITE_INDEX_STATUS_FALSE_POSITIVES.has(table.name))
  );
  
  // Check for timestamp columns
  const timestampCols = table.columns.filter(c => 
    c.name.endsWith("At") && c.type === "timestamp"
  );
  
  if (hasOperationCol && timestampCols.length > 0) {
    // Check if composite index exists
    const hasCompositeIndex = table.indexes.some(idx => {
      const colNames = idx.columns.map(c => c.replace(/^t\./, "").toLowerCase());
      const hasTenant = colNames.some(c => c.includes("tenantid"));
      const hasOp = colNames.some(c => c.includes("operation") || c.includes("status") || c.includes("type") || c.includes("state"));
      const hasTimestamp = colNames.some(c => c.endsWith("at"));
      return hasTenant && hasOp && hasTimestamp;
    });
    
    if (!hasCompositeIndex) {
      const operationCol = table.columns.find(c => 
        c.name === "operation" || c.name === "status" || c.name === "type" || c.name === "state"
      );
      const timestampCol = timestampCols[0];
      
      issues.push({
        file: table.relativePath,
        line: 1,
        table: table.name,
        rule: "missing-composite-index",
        message: "Table should have composite index for tenant + operation/status + timestamp queries",
        severity: "warning",
        suggestion: `Add: index("idx_${table.name}_tenant_op_date").on(t.tenantId, t.${operationCol?.name}, t.${timestampCol.name})`,
      });
    }
  }
  
  // Check for table name + row key pattern (for audit/log tables)
  const hasTableNameCol = table.columns.some(c => c.name === "tableName" || c.name === "table");
  const hasRowKeyCol = table.columns.some(c => c.name === "rowKey" || c.name === "recordId");
  
  if (hasTableNameCol && hasRowKeyCol) {
    const hasRowKeyIndex = table.indexes.some(idx => {
      const colNames = idx.columns.map(c => c.replace(/^t\./, "").toLowerCase());
      return colNames.some(c => c.includes("tenantid")) &&
             colNames.some(c => c.includes("tablename") || c.includes("table")) &&
             colNames.some(c => c.includes("rowkey") || c.includes("recordid"));
    });
    
    if (!hasRowKeyIndex) {
      issues.push({
        file: table.relativePath,
        line: 1,
        table: table.name,
        rule: "missing-row-key-index",
        message: "Table with tableName and rowKey should have composite index for record lookups",
        severity: "warning",
        suggestion: `Add: index("idx_${table.name}_row_key").on(t.tenantId, t.tableName, t.rowKey)`,
      });
    }
  }
}

function checkTenantIndexLeadingColumn(table: TableInfo): void {
  if (!table.hasTenantScope) return;
  
  // Skip the tenants table itself
  if (table.name === "tenants") return;
  
  // Check that tenant index exists with tenantId as leading column
  const hasTenantLeadingIndex = table.indexes.some(idx => {
    if (idx.columns.length === 0) return false;
    const firstCol = idx.columns[0].replace(/^t\./, "").toLowerCase();
    return firstCol.includes("tenantid");
  });
  
  if (!hasTenantLeadingIndex) {
    issues.push({
      file: table.relativePath,
      line: 1,
      table: table.name,
      rule: "tenant-leading-index",
      message: "Tenant-scoped table should have at least one index with tenantId as leading column",
      severity: "warning",
      suggestion: `Add: index("idx_${table.name}_tenant").on(t.tenantId)`,
    });
  }
}

function checkPartialIndexesForSoftDelete(table: TableInfo): void {
  if (!table.hasSoftDelete) return;
  
  // Check unique indexes
  const uniqueIndexes = table.indexes.filter(i => i.isUnique);
  
  for (const idx of uniqueIndexes) {
    if (!idx.hasWhere) {
      issues.push({
        file: table.relativePath,
        line: idx.line,
        table: table.name,
        rule: "soft-delete-partial-index",
        message: `Unique index "${idx.name}" should use partial index pattern (.where) for soft-delete table`,
        severity: "warning",
        suggestion: `Add .where(sql\`\${t.deletedAt} IS NULL\`) to exclude soft-deleted rows`,
      });
    }
  }
}

function checkCorrelationIndexes(table: TableInfo): void {
  // Check for correlation/request ID columns
  const hasCorrelationId = table.columns.some(c => c.name === "correlationId");
  const hasRequestId = table.columns.some(c => c.name === "requestId");
  const hasSessionId = table.columns.some(c => c.name === "sessionId");
  
  if (hasCorrelationId) {
    const hasCorrelationIndex = table.indexes.some(idx => 
      idx.columns.some(c => c.toLowerCase().includes("correlationid"))
    );
    
    if (!hasCorrelationIndex) {
      issues.push({
        file: table.relativePath,
        line: 1,
        table: table.name,
        rule: "missing-correlation-index",
        message: "Table with correlationId should have index for distributed tracing queries",
        severity: "info",
        suggestion: `Add: index("idx_${table.name}_correlation").on(t.correlationId)`,
      });
    }
  }
  
  if (hasRequestId) {
    const hasRequestIndex = table.indexes.some(idx => 
      idx.columns.some(c => c.toLowerCase().includes("requestid"))
    );
    
    if (!hasRequestIndex) {
      issues.push({
        file: table.relativePath,
        line: 1,
        table: table.name,
        rule: "missing-request-index",
        message: "Table with requestId should have index for request debugging queries",
        severity: "info",
        suggestion: `Add: index("idx_${table.name}_request").on(t.requestId)`,
      });
    }
  }

  if (hasSessionId) {
    const hasSessionIndex = table.indexes.some(idx =>
      idx.columns.some(c => c.toLowerCase().includes("sessionid"))
    );

    if (!hasSessionIndex) {
      issues.push({
        file: table.relativePath,
        line: 1,
        table: table.name,
        rule: "missing-session-index",
        message: "Table with sessionId should have index for session-scoped queries",
        severity: "info",
        suggestion: `Add: index("idx_${table.name}_session").on(t.sessionId)`,
      });
    }
  }
}

function main(): void {
  console.log("🔍 Index Pattern Check\n");
  
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  if (schemas.length === 0) {
    console.log("No schemas found");
    process.exit(0);
  }
  
  // Run all checks
  for (const schema of schemas) {
    for (const table of schema.tables) {
      checkCompositeIndexPatterns(table, schema);
      checkTenantIndexLeadingColumn(table);
      checkPartialIndexesForSoftDelete(table);
      checkCorrelationIndexes(table);
    }
  }
  
  // Report results
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  if (issues.length === 0) {
    console.log("✅ All index pattern checks passed!\n");
    process.exit(0);
  }
  
  // Group by table
  const byTable = issues.reduce((acc, issue) => {
    if (!acc[issue.table]) acc[issue.table] = [];
    acc[issue.table].push(issue);
    return acc;
  }, {} as Record<string, IndexIssue[]>);
  
  console.log("Issues found:\n");
  
  for (const [tableName, tableIssues] of Object.entries(byTable)) {
    console.log(`=== ${tableName} ===\n`);
    
    for (const issue of tableIssues) {
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
