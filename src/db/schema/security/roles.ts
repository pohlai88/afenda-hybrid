import { integer, text, boolean, jsonb, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../_shared";
import { tenants } from "../core/tenants";
import { securitySchema } from "./users";

export interface RolePermissions {
  [resource: string]: boolean | string[] | Record<string, boolean>;
}

export const roles = securitySchema.table(
  "roles",
  {
    roleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(), // Explicit tenantId for precise FK control
    roleCode: text().notNull(),
    ...nameColumn,
    description: text(),
    permissions: jsonb().$type<RolePermissions>(),
    isSystemRole: boolean().notNull().default(false),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_roles_tenant").on(t.tenantId),
    uniqueIndex("uq_roles_code")
      .on(t.tenantId, sql`lower(${t.roleCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_roles_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const rolePermissionsSchema = z
  .record(z.string(), z.union([z.boolean(), z.array(z.string()), z.record(z.string(), z.boolean())]))
  .optional();

export const RoleIdSchema = z.number().int().brand<"RoleId">();
export type RoleId = z.infer<typeof RoleIdSchema>;

export const roleSelectSchema = createSelectSchema(roles);

export const roleInsertSchema = createInsertSchema(roles, {
  roleCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  permissions: rolePermissionsSchema,
});

export const roleUpdateSchema = createUpdateSchema(roles);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
