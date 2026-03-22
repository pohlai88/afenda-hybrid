import { sql } from "drizzle-orm";
import {
  integer,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { timestampColumns } from "../../_shared";
import { tenants } from "../core/tenants";
import { securitySchema } from "./users";
import { users } from "./users";

export const sessionEndReasons = ["LOGOUT", "EXPIRED", "REVOKED", "REPLACED"] as const;
export const sessionEndReasonEnum = securitySchema.enum("session_end_reason", [
  ...sessionEndReasons,
]);
export const SessionEndReasonSchema = z.enum(sessionEndReasons);
export type SessionEndReason = z.infer<typeof SessionEndReasonSchema>;

/**
 * User Sessions - Active authentication sessions.
 *
 * Tracks user login sessions with IP, user agent, and last activity for security
 * auditing and session management. Similar to Odoo's `res.users.log` but with
 * explicit session tokens and expiry.
 *
 * Active sessions have `endedAt` null; closed sessions set `endedAt` and `endReason`.
 *
 * NO soft delete: sessions are hard-deleted on logout or expiry.
 * NO audit columns: sessions are system-managed, not user-created.
 */
export const userSessions = securitySchema.table(
  "user_sessions",
  {
    sessionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    userId: integer().notNull(),
    sessionToken: text().notNull(),
    ipAddress: text(),
    userAgent: text(),
    startedAt: timestamp({ withTimezone: true })
      .notNull()
      .default(sql`now()`),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    lastActivityAt: timestamp({ withTimezone: true })
      .notNull()
      .default(sql`now()`),
    endedAt: timestamp({ withTimezone: true }),
    endReason: sessionEndReasonEnum(),
    metadata: jsonb(),
    ...timestampColumns,
  },
  (t) => [
    index("idx_user_sessions_tenant").on(t.tenantId),
    index("idx_user_sessions_user").on(t.tenantId, t.userId),
    uniqueIndex("uq_user_sessions_token").on(t.sessionToken),
    index("idx_user_sessions_expires").on(t.expiresAt),
    index("idx_user_sessions_last_activity").on(t.lastActivityAt),
    index("idx_user_sessions_user_activity").on(
      t.tenantId,
      t.userId,
      sql`${t.lastActivityAt} DESC`
    ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_user_sessions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.userId],
      name: "fk_user_sessions_user",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const SessionIdSchema = z.number().int().positive().brand<"SessionId">();
export type SessionId = z.infer<typeof SessionIdSchema>;

export const SessionMetadataSchema = z.record(z.string(), z.any()).optional();

export const userSessionSelectSchema = createSelectSchema(userSessions);

export const userSessionInsertSchema = createInsertSchema(userSessions, {
  tenantId: z.number().int().positive(),
  userId: z.number().int().positive(),
  sessionToken: z.string().min(32).max(255),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
  startedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  lastActivityAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
  endReason: SessionEndReasonSchema.optional(),
  metadata: SessionMetadataSchema,
});

export const userSessionUpdateSchema = createUpdateSchema(userSessions, {
  lastActivityAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional().nullable(),
  endReason: SessionEndReasonSchema.optional().nullable(),
  metadata: SessionMetadataSchema.nullable(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
