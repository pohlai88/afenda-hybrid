/**
 * Auto-fix Schema Issues
 * 
 * Automatically fixes common schema issues:
 * - Missing Zod schema exports
 * - Missing branded ID types
 * - Missing type exports
 * - Missing barrel exports
 * - Missing _relations.ts files
 * 
 * Run with: pnpm tsx scripts/auto-fix-schema.ts [--dry-run]
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, TableInfo, SchemaInfo } from "./lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema-platform");
const DRY_RUN = process.argv.includes("--dry-run");

interface Fix {
  file: string;
  description: string;
  action: () => void;
}

const fixes: Fix[] = [];

function addZodSchemaExports(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Check what's missing
  const missingSchemas: string[] = [];
  if (!table.hasZodSchemas.select) missingSchemas.push("select");
  if (!table.hasZodSchemas.insert) missingSchemas.push("insert");
  
  if (missingSchemas.length === 0) return;
  
  // Check if drizzle-orm/zod is imported
  const hasZodImport = content.includes("drizzle-orm/zod");
  
  const singularName = table.name.replace(/s$/, "");
  const schemaExports: string[] = [];
  
  if (!table.hasZodSchemas.select) {
    schemaExports.push(`export const ${singularName}SelectSchema = createSelectSchema(${table.name});`);
  }
  if (!table.hasZodSchemas.insert) {
    schemaExports.push(`export const ${singularName}InsertSchema = createInsertSchema(${table.name});`);
  }
  
  fixes.push({
    file: table.relativePath,
    description: `Add missing Zod schemas: ${missingSchemas.join(", ")}`,
    action: () => {
      let newContent = content;
      
      // Add import if missing
      if (!hasZodImport) {
        const importLine = 'import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";';
        const firstImportMatch = newContent.match(/^import .+ from .+;$/m);
        if (firstImportMatch) {
          newContent = newContent.replace(
            firstImportMatch[0],
            `${firstImportMatch[0]}\n${importLine}`
          );
        }
      }
      
      // Add schema exports before type exports or at end
      const typeExportMatch = newContent.match(/export type \w+ = typeof/);
      if (typeExportMatch) {
        newContent = newContent.replace(
          typeExportMatch[0],
          `${schemaExports.join("\n")}\n\n${typeExportMatch[0]}`
        );
      } else {
        newContent += `\n${schemaExports.join("\n")}\n`;
      }
      
      fs.writeFileSync(table.file, newContent);
    },
  });
}

function addBrandedIdType(table: TableInfo): void {
  if (table.hasBrandedId) return;
  
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Find primary key column
  const pkColumn = table.columns.find(c => c.isPrimaryKey);
  if (!pkColumn) return;
  
  const singularName = table.name.replace(/s$/, "");
  const idTypeName = `${singularName.charAt(0).toUpperCase()}${singularName.slice(1)}Id`;
  
  // Check if z is imported
  const hasZodImport = content.includes('from "zod"');
  
  const brandedIdCode = `
export const ${idTypeName} = z.number().int().brand<"${idTypeName}">();
export type ${idTypeName} = z.infer<typeof ${idTypeName}>;`;

  fixes.push({
    file: table.relativePath,
    description: `Add branded ID type: ${idTypeName}`,
    action: () => {
      let newContent = content;
      
      // Add zod import if missing
      if (!hasZodImport) {
        const importMatch = newContent.match(/^import .+ from "drizzle-orm.+";$/m);
        if (importMatch) {
          newContent = newContent.replace(
            importMatch[0],
            `${importMatch[0]}\nimport { z } from "zod";`
          );
        }
      }
      
      // Add branded ID before schema exports or at end of table definition
      const schemaMatch = newContent.match(/export const \w+SelectSchema/);
      if (schemaMatch) {
        newContent = newContent.replace(
          schemaMatch[0],
          `${brandedIdCode}\n\n${schemaMatch[0]}`
        );
      } else {
        const typeMatch = newContent.match(/export type \w+ = typeof/);
        if (typeMatch) {
          newContent = newContent.replace(
            typeMatch[0],
            `${brandedIdCode}\n\n${typeMatch[0]}`
          );
        }
      }
      
      fs.writeFileSync(table.file, newContent);
    },
  });
}

function addTypeExports(table: TableInfo): void {
  if (table.hasTypeExports) return;
  
  const content = fs.readFileSync(table.file, "utf-8");
  const singularName = table.name.replace(/s$/, "");
  const typeName = singularName.charAt(0).toUpperCase() + singularName.slice(1);
  
  const typeExports = `
export type ${typeName} = typeof ${table.name}.$inferSelect;
export type New${typeName} = typeof ${table.name}.$inferInsert;`;

  fixes.push({
    file: table.relativePath,
    description: `Add type exports: ${typeName}, New${typeName}`,
    action: () => {
      const newContent = content + typeExports + "\n";
      fs.writeFileSync(table.file, newContent);
    },
  });
}

function addBarrelExport(schema: SchemaInfo): void {
  if (schema.hasIndex) return;
  
  const indexPath = path.join(schema.path, "index.ts");
  const exports: string[] = [];
  
  // Find all .ts files in the schema directory
  const files = fs.readdirSync(schema.path, { withFileTypes: true });
  
  for (const file of files) {
    if (file.isFile() && file.name.endsWith(".ts") && !file.name.startsWith("_") && file.name !== "index.ts") {
      const moduleName = file.name.replace(".ts", "");
      exports.push(`export * from "./${moduleName}";`);
    }
    if (file.isDirectory()) {
      // Check for nested index.ts
      const nestedIndex = path.join(schema.path, file.name, "index.ts");
      if (fs.existsSync(nestedIndex)) {
        exports.push(`export * from "./${file.name}";`);
      }
    }
  }
  
  // Check for _relations.ts
  if (fs.existsSync(path.join(schema.path, "_relations.ts"))) {
    exports.push('export * from "./_relations";');
  }
  
  // Check for _schema.ts
  if (fs.existsSync(path.join(schema.path, "_schema.ts"))) {
    exports.unshift('export * from "./_schema";');
  }
  
  if (exports.length === 0) return;
  
  fixes.push({
    file: path.relative(process.cwd(), indexPath),
    description: "Create barrel export index.ts",
    action: () => {
      fs.writeFileSync(indexPath, exports.join("\n") + "\n");
    },
  });
}

function addRelationsFile(schema: SchemaInfo): void {
  if (schema.hasRelations || schema.tables.length === 0) return;
  
  const relationsPath = path.join(schema.path, "_relations.ts");
  
  // Generate basic relations file
  const imports: string[] = ['import { defineRelations } from "drizzle-orm";'];
  const tableImports: string[] = [];
  const tableNames: string[] = [];
  
  for (const table of schema.tables) {
    const relativePath = path.relative(schema.path, table.file).replace(".ts", "").replace(/\\/g, "/");
    tableImports.push(`import { ${table.name} } from "./${relativePath}";`);
    tableNames.push(table.name);
  }
  
  // Import tenants if tables have tenant scope
  const hasTenantScoped = schema.tables.some(t => t.hasTenantScope);
  if (hasTenantScoped && schema.name !== "core") {
    imports.push('import { tenants } from "../core/tenants";');
    tableNames.push("tenants");
  }
  
  const relationsContent = `${imports.join("\n")}
${tableImports.join("\n")}

export const ${schema.name}Relations = defineRelations({ ${tableNames.join(", ")} }, (r) => ({
  // Define relations here
  // Example:
  // ${schema.tables[0]?.name || "tableName"}: {
  //   relatedTable: r.one.relatedTable({ from: r.${schema.tables[0]?.name || "tableName"}.columnId, to: r.relatedTable.id }),
  // },
}));
`;

  fixes.push({
    file: path.relative(process.cwd(), relationsPath),
    description: "Create _relations.ts file",
    action: () => {
      fs.writeFileSync(relationsPath, relationsContent);
    },
  });
}

function main(): void {
  console.log("🔧 Schema Auto-Fix Tool\n");
  
  if (DRY_RUN) {
    console.log("Running in DRY-RUN mode - no files will be modified\n");
  }
  
  const schemas = analyzeSchema(SCHEMA_DIR);
  
  if (schemas.length === 0) {
    console.log("No schemas found");
    process.exit(0);
  }
  
  // Analyze and collect fixes
  for (const schema of schemas) {
    // Schema-level fixes
    addBarrelExport(schema);
    addRelationsFile(schema);
    
    // Table-level fixes
    for (const table of schema.tables) {
      addZodSchemaExports(table);
      addBrandedIdType(table);
      addTypeExports(table);
    }
  }
  
  if (fixes.length === 0) {
    console.log("✅ No fixes needed - all schemas are compliant!\n");
    process.exit(0);
  }
  
  console.log(`Found ${fixes.length} potential fix(es):\n`);
  
  for (const fix of fixes) {
    console.log(`📝 ${fix.file}`);
    console.log(`   ${fix.description}\n`);
    
    if (!DRY_RUN) {
      try {
        fix.action();
        console.log("   ✅ Fixed\n");
      } catch (error) {
        console.log(`   ❌ Error: ${error}\n`);
      }
    }
  }
  
  if (DRY_RUN) {
    console.log("\nRun without --dry-run to apply fixes.");
  } else {
    console.log(`\n✅ Applied ${fixes.length} fix(es)`);
    console.log("Run 'pnpm typecheck' to verify changes.");
  }
}

main();
