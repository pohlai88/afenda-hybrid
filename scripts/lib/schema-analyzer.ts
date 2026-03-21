/**
 * Schema Analyzer - Core library for analyzing Drizzle schema files
 * Used by all CI gate scripts for consistent parsing and analysis
 */

import * as fs from "fs";
import * as path from "path";

export interface TableInfo {
  name: string;
  file: string;
  relativePath: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: FKInfo[];
  hasTimestamps: boolean;
  hasSoftDelete: boolean;
  hasTenantScope: boolean;
  hasAuditColumns: boolean;
  hasZodSchemas: {
    select: boolean;
    insert: boolean;
    update: boolean;
  };
  hasBrandedId: boolean;
  hasTypeExports: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNotNull: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  isGenerated: boolean;
  line: number;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  hasWhere: boolean;
  line: number;
}

export interface FKInfo {
  name?: string;
  columns: string[];
  references: string;
  hasActions: boolean;
  line: number;
}

export interface SchemaInfo {
  name: string;
  path: string;
  tables: TableInfo[];
  enums: string[];
  hasRelations: boolean;
  hasIndex: boolean;
}

export function walkDir(dir: string, filter?: (file: string) => boolean): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, filter));
    } else if (entry.name.endsWith(".ts")) {
      if (!filter || filter(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

export function parseTableFile(filePath: string): TableInfo | null {
  const content = fs.readFileSync(filePath, "utf-8");

  const tableMatch = content.match(/\.table\(\s*["'](\w+)["']/);
  if (!tableMatch) return null;

  const tableName = tableMatch[1];
  const relativePath = path.relative(process.cwd(), filePath);

  const columns: ColumnInfo[] = [];
  const indexes: IndexInfo[] = [];
  const foreignKeys: FKInfo[] = [];

  // Parse columns
  // Include *Enum() builders (e.g. actorTypeEnum) so polymorphic/discriminator checks see those columns
  const columnRegex =
    /(\w+):\s*(integer|text|varchar|boolean|timestamp|date|jsonb|json|bigint|smallint|real|doublePrecision|numeric|uuid|inet|cidr|\w+Enum)\([^)]*\)/g;
  let match;
  while ((match = columnRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split("\n").length;
    const colContext = content.substring(match.index, match.index + 200);
    
    columns.push({
      name: match[1],
      type: match[2],
      isNotNull: colContext.includes(".notNull()"),
      hasDefault: colContext.includes(".default") || colContext.includes(".defaultNow()") || colContext.includes(".defaultRandom()"),
      isPrimaryKey: colContext.includes(".primaryKey()"),
      isGenerated: colContext.includes("generatedAlwaysAs") || colContext.includes("generatedAlwaysAsIdentity"),
      line: lineNum,
    });
  }

  // Parse indexes
  const indexRegex = /(unique)?[Ii]ndex\(["']([^"']+)["']\)/g;
  while ((match = indexRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split("\n").length;
    const idxContext = content.substring(match.index, match.index + 300);
    const columnsMatch = idxContext.match(/\.on\(([^)]+)\)/);
    
    indexes.push({
      name: match[2],
      columns: columnsMatch ? columnsMatch[1].split(",").map(c => c.trim()) : [],
      isUnique: !!match[1],
      hasWhere: idxContext.includes(".where("),
      line: lineNum,
    });
  }

  // Parse foreign keys
  const fkRegex = /foreignKey\(\{([^}]+)\}\)/g;
  while ((match = fkRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split("\n").length;
    const fkContent = match[1];
    
    // Check for actions in object OR chained method calls (e.g., .onDelete("restrict").onUpdate("cascade"))
    const fkContext = content.substring(match.index, match.index + 300);
    const hasActionsInObject = fkContent.includes("onDelete") || fkContent.includes("onUpdate");
    const hasChainedActions = fkContext.includes(".onDelete(") && fkContext.includes(".onUpdate(");
    
    // Extract column names from columns array
    const columnsMatch = fkContent.match(/columns:\s*\[([^\]]+)\]/);
    const columnNames = columnsMatch 
      ? columnsMatch[1].split(",").map(c => c.trim().replace(/^t\./, ""))
      : [];
    
    foreignKeys.push({
      name: fkContent.match(/name:\s*["']([^"']+)["']/)?.[1],
      columns: columnNames,
      references: fkContent.match(/foreignColumns:\s*\[([^\]]+)\]/)?.[1] || "",
      hasActions: hasActionsInObject || hasChainedActions,
      line: lineNum,
    });
  }

  // Check for inline references
  const inlineRefRegex = /\.references\(\s*\(\)\s*=>/g;
  while ((match = inlineRefRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split("\n").length;
    const refContext = content.substring(match.index, match.index + 200);
    
    foreignKeys.push({
      columns: [],
      references: "inline",
      hasActions: refContext.includes("onDelete") || refContext.includes("onUpdate"),
      line: lineNum,
    });
  }

  return {
    name: tableName,
    file: filePath,
    relativePath,
    columns,
    indexes,
    foreignKeys,
    hasTimestamps:
      content.includes("timestampColumns") ||
      content.includes("appendOnlyTimestampColumns") ||
      (content.includes("createdAt") && content.includes("updatedAt")),
    hasSoftDelete: content.includes("softDeleteColumns") || content.includes("deletedAt"),
    hasTenantScope: content.includes("tenantId:") || content.includes("tenantId ="),
    hasAuditColumns: content.includes("auditColumns") || 
                     (content.includes("createdBy") && content.includes("updatedBy")),
    hasZodSchemas: {
      select: content.includes("createSelectSchema"),
      insert: content.includes("createInsertSchema"),
      update: content.includes("createUpdateSchema"),
    },
    hasBrandedId: content.includes(".brand<"),
    hasTypeExports: content.includes("$inferSelect") || content.includes("type "),
  };
}

export function analyzeSchema(schemaDir: string): SchemaInfo[] {
  const schemas: SchemaInfo[] = [];
  
  if (!fs.existsSync(schemaDir)) return schemas;

  const entries = fs.readdirSync(schemaDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    
    const schemaPath = path.join(schemaDir, entry.name);
    const tables: TableInfo[] = [];
    const enums: string[] = [];
    
    const files = walkDir(schemaPath, (f) => !f.includes("_relations") && !f.includes("_schema") && !f.endsWith("index.ts"));
    
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      
      // Find enums
      const enumMatches = content.matchAll(/\.enum\(["'](\w+)["']/g);
      for (const match of enumMatches) {
        enums.push(match[1]);
      }
      
      // Parse table
      const table = parseTableFile(file);
      if (table) {
        tables.push(table);
      }
    }
    
    schemas.push({
      name: entry.name,
      path: schemaPath,
      tables,
      enums,
      hasRelations: fs.existsSync(path.join(schemaPath, "_relations.ts")),
      hasIndex: fs.existsSync(path.join(schemaPath, "index.ts")),
    });
  }
  
  return schemas;
}

export function generateReport(schemas: SchemaInfo[]): string {
  let report = "# Schema Analysis Report\n\n";
  
  for (const schema of schemas) {
    report += `## ${schema.name}\n\n`;
    report += `- Tables: ${schema.tables.length}\n`;
    report += `- Enums: ${schema.enums.length}\n`;
    report += `- Has relations: ${schema.hasRelations ? "✅" : "❌"}\n`;
    report += `- Has index: ${schema.hasIndex ? "✅" : "❌"}\n\n`;
    
    for (const table of schema.tables) {
      report += `### ${table.name}\n`;
      report += `- Columns: ${table.columns.length}\n`;
      report += `- Indexes: ${table.indexes.length}\n`;
      report += `- Foreign Keys: ${table.foreignKeys.length}\n`;
      report += `- Timestamps: ${table.hasTimestamps ? "✅" : "❌"}\n`;
      report += `- Tenant Scope: ${table.hasTenantScope ? "✅" : "❌"}\n`;
      report += `- Zod Schemas: Select=${table.hasZodSchemas.select ? "✅" : "❌"}, Insert=${table.hasZodSchemas.insert ? "✅" : "❌"}\n`;
      report += `- Branded ID: ${table.hasBrandedId ? "✅" : "❌"}\n\n`;
    }
  }
  
  return report;
}

// CLI entry point (ESM compatible)
async function main() {
  const schemaDir = path.join(process.cwd(), "src/db/schema-platform");
  
  console.log("🔍 Analyzing schema...\n");
  
  const schemas = analyzeSchema(schemaDir);
  const report = generateReport(schemas);
  
  console.log(report);
  
  // Summary statistics
  const totalTables = schemas.reduce((sum, s) => sum + s.tables.length, 0);
  const totalEnums = schemas.reduce((sum, s) => sum + s.enums.length, 0);
  const tablesWithTenantScope = schemas.reduce(
    (sum, s) => sum + s.tables.filter(t => t.hasTenantScope).length,
    0
  );
  const tablesWithTimestamps = schemas.reduce(
    (sum, s) => sum + s.tables.filter(t => t.hasTimestamps).length,
    0
  );
  
  console.log("## Summary\n");
  console.log(`- Total schemas: ${schemas.length}`);
  console.log(`- Total tables: ${totalTables}`);
  console.log(`- Total enums: ${totalEnums}`);
  console.log(`- Tables with tenant scope: ${tablesWithTenantScope}/${totalTables}`);
  console.log(`- Tables with timestamps: ${tablesWithTimestamps}/${totalTables}`);
  console.log();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('schema-analyzer.ts')) {
  main().catch(console.error);
}
