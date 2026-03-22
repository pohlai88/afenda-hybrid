import { sql } from "drizzle-orm";
import { integer, text, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { coreSchema } from "./tenants";
import { tenants } from "./tenants";
import { appModules } from "./appModules";

/**
 * Menu Items - Hierarchical navigation structure.
 *
 * Column names match the DB prerequisites plan: `parentMenuItemId`, `routePath`, `isVisible`,
 * stable `code` (unique per tenant), optional `resourceTable` and `requiredPermission`.
 *
 * SECURITY: `badgeQuery` is server-executed SQL - must be validated/sanitized
 * before storage. Consider using a safe query builder or pre-approved templates.
 */
export const menuItems = coreSchema.table(
  "menu_items",
  {
    menuItemId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    appModuleId: integer().notNull(),
    parentMenuItemId: integer(),
    /** Stable key for API and seeds, unique per tenant (case-insensitive). */
    code: text().notNull(),
    label: text().notNull(),
    icon: text(),
    routePath: text(),
    /** Optional Drizzle table name for auto-CRUD (e.g. `employees`). */
    resourceTable: text(),
    sortOrder: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    /** Single permission key for visibility (e.g. `hr.employees.view`). */
    requiredPermission: text(),
    badgeQuery: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_menu_items_tenant").on(t.tenantId),
    index("idx_menu_items_module").on(t.tenantId, t.appModuleId),
    index("idx_menu_items_module_sort").on(t.tenantId, t.appModuleId, t.sortOrder),
    index("idx_menu_items_parent").on(t.tenantId, t.parentMenuItemId),
    index("idx_menu_items_visible_sort").on(t.tenantId, t.isVisible, t.sortOrder),
    uniqueIndex("uq_menu_items_tenant_code")
      .on(t.tenantId, sql`lower(${t.code})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_menu_items_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.appModuleId],
      foreignColumns: [appModules.appModuleId],
      name: "fk_menu_items_module",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.parentMenuItemId],
      foreignColumns: [t.menuItemId],
      name: "fk_menu_items_parent",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check("chk_menu_items_sort_order", sql`${t.sortOrder} >= 0`),
  ]
);

export const MenuItemIdSchema = z.number().int().positive().brand<"MenuItemId">();
export type MenuItemId = z.infer<typeof MenuItemIdSchema>;

/** Visibility gate for the menu row (e.g. `hr.employees.view`); not the same shape as `security.permissions.key`. */
export const MenuRequiredPermissionSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z][a-z0-9_.]*$/i, "Format: hr.employees.view");

export const menuItemSelectSchema = createSelectSchema(menuItems);

export const menuItemInsertSchema = createInsertSchema(menuItems, {
  tenantId: z.number().int().positive(),
  appModuleId: z.number().int().positive(),
  parentMenuItemId: z.number().int().positive().optional(),
  code: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9_]*$/, "Lowercase slug: core_organizations"),
  label: z.string().min(1).max(100),
  icon: z.string().max(50).optional(),
  routePath: z
    .string()
    .regex(/^\/[a-z0-9\-/]+$/, "Format: /hr/employees")
    .optional(),
  resourceTable: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  requiredPermission: MenuRequiredPermissionSchema.optional(),
  badgeQuery: z.string().max(1000).optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const menuItemUpdateSchema = createUpdateSchema(menuItems, {
  appModuleId: z.number().int().positive().optional(),
  parentMenuItemId: z.number().int().positive().optional().nullable(),
  code: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9_]*$/)
    .optional(),
  label: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).optional().nullable(),
  routePath: z
    .string()
    .regex(/^\/[a-z0-9\-/]+$/)
    .optional()
    .nullable(),
  resourceTable: z.string().min(1).max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  requiredPermission: MenuRequiredPermissionSchema.optional().nullable(),
  badgeQuery: z.string().max(1000).optional().nullable(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
