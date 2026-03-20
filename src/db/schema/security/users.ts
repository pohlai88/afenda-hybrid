import { pgSchema, integer, text, boolean, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { timestampColumns, softDeleteColumns, auditColumns } from "../_shared";
import { tenants } from "../core/tenants";

export const securitySchema = pgSchema("security");

export const userStatuses = ["ACTIVE", "INACTIVE", "LOCKED", "PENDING_VERIFICATION"] as const;

export const userStatusEnum = securitySchema.enum("user_status", [...userStatuses]);

/** Zod enum schema for runtime validation (drizzle-orm/zod) */
export const userStatusZodEnum = createSelectSchema(userStatusEnum);

export const users = securitySchema.table(
  "users",
  {
    userId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(), // FK to core.tenants - tenant isolation
    email: text().notNull(),
    displayName: text().notNull(),
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

export const UserIdSchema = z.number().int().brand<"UserId">();
export type UserId = z.infer<typeof UserIdSchema>;

export const userSelectSchema = createSelectSchema(users);

export const userInsertSchema = createInsertSchema(users, {
  email: z.email(),
  displayName: z.string().min(1).max(200),
});

export const userUpdateSchema = createUpdateSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
