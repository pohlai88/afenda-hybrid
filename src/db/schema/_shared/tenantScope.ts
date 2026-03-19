/**
 * Tenant Scope Column Mixin
 *
 * Standard tenantId column with FK to core.tenants for multi-tenant tables.
 *
 * Usage:
 *   import { tenantScopedColumns } from "../_shared";
 *   export const myTable = schema.table("my_table", {
 *     id: integer().primaryKey().generatedAlwaysAsIdentity(),
 *     ...tenantScopedColumns,
 *   });
 *
 * IMPORTANT: This mixin includes an inline FK reference. If you need custom
 * FK actions (onDelete/onUpdate), define tenantId explicitly instead:
 *
 *   tenantId: integer().notNull(), // explicit for FK control
 *   // Then add explicit foreignKey() in table config
 *
 * When bypassing this mixin, add comment: "// explicit for FK control"
 *
 * @stability STABLE - Changes require migration + team review
 */

import { integer } from "drizzle-orm/pg-core";
import { tenants } from "../core/tenants";

/**
 * Standard tenant scope column with FK reference.
 *
 * - tenantId: References core.tenants.tenantId
 *
 * Default FK behavior: no explicit onDelete/onUpdate (DB default = NO ACTION)
 * If you need RESTRICT/CASCADE, use explicit tenantId definition.
 */
export const tenantScopedColumns = {
  tenantId: integer().notNull().references(() => tenants.tenantId),
} as const;

/**
 * Column fingerprints for CI duplication detection.
 */
export const TENANT_FINGERPRINTS = {
  tenantId: "integer:notNull:fk:core.tenants.tenantId",
} as const;
