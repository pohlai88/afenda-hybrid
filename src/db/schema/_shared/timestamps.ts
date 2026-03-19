/**
 * Timestamp Column Mixins
 *
 * Standard timestamp columns for audit trail and soft-delete functionality.
 * These columns should be included in ALL mutable tables.
 *
 * Usage:
 *   import { timestampColumns, softDeleteColumns } from "../_shared";
 *   export const myTable = schema.table("my_table", {
 *     id: integer().primaryKey().generatedAlwaysAsIdentity(),
 *     ...timestampColumns,
 *     ...softDeleteColumns, // optional, for soft-delete tables
 *   });
 *
 * @stability STABLE - Changes require migration + team review
 */

import { timestamp } from "drizzle-orm/pg-core";

/**
 * Standard timestamp columns for all mutable tables.
 *
 * - createdAt: Set automatically on insert via defaultNow()
 * - updatedAt: Set automatically on insert, must be updated by application on updates
 *
 * Both use timestamptz (timestamp with time zone) for proper timezone handling.
 */
export const timestampColumns = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
} as const;

/**
 * Soft-delete column for tables that should not be hard-deleted.
 *
 * - deletedAt: NULL means active, non-NULL means soft-deleted
 *
 * When using soft-delete, ensure unique indexes use partial index pattern:
 *   uniqueIndex("uq_table_code")
 *     .on(t.tenantId, sql`lower(${t.code})`)
 *     .where(sql`${t.deletedAt} IS NULL`)
 */
export const softDeleteColumns = {
  deletedAt: timestamp({ withTimezone: true }),
} as const;

/**
 * Timestamp column for append-only tables (e.g., audit trails).
 *
 * - createdAt: Set automatically on insert via defaultNow()
 *
 * Append-only tables should NOT have updatedAt since records are immutable.
 * Use this mixin instead of timestampColumns for audit trails and event logs.
 */
export const appendOnlyTimestampColumns = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
} as const;

/**
 * Column fingerprints for CI duplication detection.
 * Used by check-shared-columns.ts to identify duplicate column patterns.
 */
export const TIMESTAMP_FINGERPRINTS = {
  createdAt: "timestamp:withTimezone:notNull:defaultNow",
  updatedAt: "timestamp:withTimezone:notNull:defaultNow",
  deletedAt: "timestamp:withTimezone:nullable",
} as const;
