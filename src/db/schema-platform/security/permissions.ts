import { sql } from "drizzle-orm";
import { boolean, foreignKey, index, integer, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { tenants } from "../core/tenants";
import { securitySchema } from "./users";
import { roles } from "./roles";

/**
 * Permissions - Atomic permission definitions (resource.action pairs).
 * 
 * Permissions are tenant-scoped and define what actions can be performed on resources.
 * System permissions are seeded per tenant on creation.
 * 
 * Example keys: "leave.approve", "payroll.view", "employee.create"
 */
export const permissions = securitySchema.table(
  "permissions",
  {
    permissionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    resource: text().notNull(),
    action: text().notNull(),
    key: text().notNull(),
    description: text(),
    isSystemPermission: boolean().notNull().default(false),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_permissions_tenant").on(t.tenantId),
    index("idx_permissions_resource").on(t.tenantId, t.resource),
    index("idx_permissions_key").on(t.tenantId, t.key),
    uniqueIndex("uq_permissions_key")
      .on(t.tenantId, sql`lower(${t.key})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_permissions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const PermissionIdSchema = z.number().int().positive().brand<"PermissionId">();
export type PermissionId = z.infer<typeof PermissionIdSchema>;

export const PermissionKeySchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/i, "Format: resource.action (e.g., leave.approve)");

export const permissionSelectSchema = createSelectSchema(permissions);

export const permissionInsertSchema = createInsertSchema(permissions, {
  tenantId: z.number().int().positive(),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  key: PermissionKeySchema,
  description: z.string().max(500).optional(),
  isSystemPermission: z.boolean().optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const permissionUpdateSchema = createUpdateSchema(permissions, {
  resource: z.string().min(1).max(50).optional(),
  action: z.string().min(1).max(50).optional(),
  key: PermissionKeySchema.optional(),
  description: z.string().max(500).optional().nullable(),
  isSystemPermission: z.boolean().optional(),
});

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

/**
 * Role Permissions - Junction table linking roles to permissions.
 * 
 * Replaces the JSONB permissions column on roles with a normalized structure.
 */
export const rolePermissions = securitySchema.table(
  "role_permissions",
  {
    rolePermissionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    roleId: integer().notNull(),
    permissionId: integer().notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_role_permissions_tenant").on(t.tenantId),
    index("idx_role_permissions_role").on(t.tenantId, t.roleId),
    index("idx_role_permissions_permission").on(t.tenantId, t.permissionId),
    uniqueIndex("uq_role_permissions")
      .on(t.tenantId, t.roleId, t.permissionId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_role_permissions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.roleId],
      foreignColumns: [roles.roleId],
      name: "fk_role_permissions_role",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.permissionId],
      name: "fk_role_permissions_permission",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const rolePermissionSelectSchema = createSelectSchema(rolePermissions);

export const rolePermissionInsertSchema = createInsertSchema(rolePermissions, {
  tenantId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  permissionId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

/**
 * User Permissions - Direct permission grants to users (bypassing roles).
 * 
 * Used for exceptional cases where a user needs specific permissions
 * without being assigned to a role that has them.
 */
export const userPermissions = securitySchema.table(
  "user_permissions",
  {
    userPermissionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    userId: integer().notNull(),
    permissionId: integer().notNull(),
    reason: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_user_permissions_tenant").on(t.tenantId),
    index("idx_user_permissions_user").on(t.tenantId, t.userId),
    index("idx_user_permissions_permission").on(t.tenantId, t.permissionId),
    uniqueIndex("uq_user_permissions")
      .on(t.tenantId, t.userId, t.permissionId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_user_permissions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.permissionId],
      name: "fk_user_permissions_permission",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const userPermissionSelectSchema = createSelectSchema(userPermissions);

export const userPermissionInsertSchema = createInsertSchema(userPermissions, {
  tenantId: z.number().int().positive(),
  userId: z.number().int().positive(),
  permissionId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const userPermissionUpdateSchema = createUpdateSchema(userPermissions, {
  reason: z.string().max(500).optional().nullable(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;
