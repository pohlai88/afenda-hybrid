import { integer, timestamp, index, uniqueIndex, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { timestampColumns } from "../_shared";
import { tenants } from "../core/tenants";
import { users, securitySchema } from "./users";
import { roles } from "./roles";

export const userRoles = securitySchema.table(
  "user_roles",
  {
    userId: integer().notNull(),
    roleId: integer().notNull(),
    tenantId: integer().notNull(),
    assignedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    assignedBy: integer().notNull(),
    expiresAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId], name: "pk_user_roles" }),
    index("idx_user_roles_tenant").on(t.tenantId),
    index("idx_user_roles_user").on(t.tenantId, t.userId),
    uniqueIndex("uq_user_roles_assignment").on(t.tenantId, t.userId, t.roleId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_user_roles_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.userId],
      name: "fk_user_roles_user",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.roleId],
      foreignColumns: [roles.roleId],
      name: "fk_user_roles_role",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.assignedBy],
      foreignColumns: [users.userId],
      name: "fk_user_roles_assigned_by",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const userRoleSelectSchema = createSelectSchema(userRoles);

export const userRoleInsertSchema = createInsertSchema(userRoles);

export const userRoleUpdateSchema = createUpdateSchema(userRoles);

export const UserRoleIdSchema = z.object({
  userId: z.number().int(),
  roleId: z.number().int(),
}).brand<"UserRoleId">();
export type UserRoleId = z.infer<typeof UserRoleIdSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
