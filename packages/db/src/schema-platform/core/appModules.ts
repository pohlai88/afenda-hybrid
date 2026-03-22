import { sql } from "drizzle-orm";
import { integer, text, boolean, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { coreSchema } from "./tenants";
import { tenants } from "./tenants";

/**
 * App Modules - Top-level application domain registry.
 *
 * Defines the major functional modules visible in the sidebar navigation.
 * Similar to Odoo's `ir.module.module` but simplified for AFENDA's 9 domains.
 *
 * Each module represents a schema (hr, payroll, benefits, talent, learning,
 * recruitment, core, security, audit) with display metadata (icon, color, path).
 */
export const appModules = coreSchema.table(
  "app_modules",
  {
    appModuleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    // code: stable module key, unique per tenant (case-insensitive with soft-delete filter)
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    icon: text(),
    color: text(),
    basePath: text().notNull(),
    sortOrder: integer().notNull().default(0),
    isEnabled: boolean().notNull().default(true),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_app_modules_tenant").on(t.tenantId),
    index("idx_app_modules_enabled").on(t.tenantId, t.isEnabled, t.sortOrder),
    uniqueIndex("uq_app_modules_code")
      .on(t.tenantId, sql`lower(${t.code})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_app_modules_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const AppModuleIdSchema = z.number().int().positive().brand<"AppModuleId">();
export type AppModuleId = z.infer<typeof AppModuleIdSchema>;

export const AppModuleCodeSchema = z.enum([
  "core",
  "security",
  "audit",
  "hr",
  "payroll",
  "benefits",
  "talent",
  "learning",
  "recruitment",
]);
export type AppModuleCode = z.infer<typeof AppModuleCodeSchema>;

export const appModuleSelectSchema = createSelectSchema(appModules);

export const appModuleInsertSchema = createInsertSchema(appModules, {
  tenantId: z.number().int().positive(),
  code: AppModuleCodeSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  basePath: z.string().regex(/^\/[a-z-]+$/, "Format: /hr, /payroll"),
  sortOrder: z.number().int().min(0).optional(),
  isEnabled: z.boolean().optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const appModuleUpdateSchema = createUpdateSchema(appModules, {
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  basePath: z
    .string()
    .regex(/^\/[a-z-]+$/)
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  isEnabled: z.boolean().optional(),
});

export type AppModule = typeof appModules.$inferSelect;
export type NewAppModule = typeof appModules.$inferInsert;
