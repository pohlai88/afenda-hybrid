import {
  foreignKey,
  index,
  integer,
  primaryKey,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { timestampColumns } from "../../_shared";
import { tenants } from "../core/tenants";
import { roles } from "./roles";
import { securitySchema, users } from "./users";

/**
 * User–role assignment (junction). Composite PK `(userId, roleId)`; tenant-scoped uniqueness on `(tenantId, userId, roleId)`.
 * Prefer {@link userRoleAssignmentInsertSchema} at API boundaries for stricter validation.
 */
export const userRoles = securitySchema.table(
  "user_roles",
  {
    userId: integer().notNull(),
    roleId: integer().notNull(),
    tenantId: integer().notNull(),
    assignedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    /** Granting user; must exist in `security.users`. Prefer same `tenantId` as this row (enforced in app / triggers if needed). */
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

/**
 * Role-assignment inserts: same shape as {@link userRoleInsertSchema}, with explicit positive IDs
 * and a clear validation message for the assigning user (`assignedBy`). The column is already
 * NOT NULL in the database; this schema matches the recruitment pattern of tightening Zod at
 * operation boundaries.
 */
export const userRoleAssignmentInsertSchema = createInsertSchema(userRoles, {
  userId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  assignedBy: z.number().int().positive({
    message: "assignedBy must reference the user who granted this role",
  }),
  expiresAt: z.coerce.date().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.expiresAt == null) return;
  const t = data.expiresAt.getTime();
  if (Number.isNaN(t)) {
    ctx.addIssue({
      code: "custom",
      message: "expiresAt must be a valid date",
      path: ["expiresAt"],
    });
    return;
  }
  if (t <= Date.now()) {
    ctx.addIssue({
      code: "custom",
      message: "expiresAt must be in the future when set",
      path: ["expiresAt"],
    });
  }
});

export const userRoleUpdateSchema = createUpdateSchema(userRoles, {
  expiresAt: z.coerce.date().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.expiresAt === undefined || data.expiresAt === null) return;
  const t = data.expiresAt.getTime();
  if (Number.isNaN(t)) {
    ctx.addIssue({
      code: "custom",
      message: "expiresAt must be a valid date",
      path: ["expiresAt"],
    });
    return;
  }
  if (t <= Date.now()) {
    ctx.addIssue({
      code: "custom",
      message: "expiresAt must be in the future when set",
      path: ["expiresAt"],
    });
  }
});

export const UserRoleIdSchema = z
  .object({
    userId: z.number().int().positive(),
    roleId: z.number().int().positive(),
  })
  .brand<"UserRoleId">();
export type UserRoleId = z.infer<typeof UserRoleIdSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
