import { sql } from "drizzle-orm";
import { pgSchema, integer, text, boolean, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { tenants } from "../core/tenants";

// --- Schema + enums (PG + Zod) ---

export const securitySchema = pgSchema("security");

export const userStatuses = ["ACTIVE", "INACTIVE", "LOCKED", "PENDING_VERIFICATION"] as const;

export const userStatusEnum = securitySchema.enum("user_status", [...userStatuses]);

export const UserStatusSchema = z.enum(userStatuses);
export type UserStatus = z.infer<typeof UserStatusSchema>;

// --- Tables ---

/**
 * Human user identity (login account). Audit columns are required in the database and must be set by the API or service layer.
 */
export const users = securitySchema.table(
  "users",
  {
    userId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(), // FK to core.tenants - tenant isolation
    email: text().notNull(),
    displayName: text().notNull(),
    /** Account lifecycle: `ACTIVE` | `INACTIVE` | `LOCKED` | `PENDING_VERIFICATION` (onboarding default). */
    status: userStatusEnum().notNull().default("PENDING_VERIFICATION"),
    emailVerified: boolean().notNull().default(false),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_users_tenant").on(t.tenantId),
    index("idx_users_email").on(t.tenantId, t.email),
    uniqueIndex("uq_users_email")
      .on(t.tenantId, sql`lower(${t.email})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_users_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

// --- Zod: ids + row shapes ---

export const UserIdSchema = z.number().int().positive().brand<"UserId">();
export type UserId = z.infer<typeof UserIdSchema>;

export const userSelectSchema = createSelectSchema(users);

export const userInsertSchema = createInsertSchema(users, {
  tenantId: z.number().int().positive(),
  email: z.email(),
  displayName: z.string().min(1).max(200),
  status: UserStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const userUpdateSchema = createUpdateSchema(users, {
  email: z.email().optional(),
  displayName: z.string().min(1).max(200).optional(),
  status: UserStatusSchema.optional(),
  emailVerified: z.boolean().optional(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
