/**
 * Audit Column Mixins
 *
 * Columns for tracking who created/modified records.
 * Include in tables where user attribution is required.
 *
 * Usage:
 *   import { auditColumns } from "../../_shared";
 *   export const myTable = schema.table("my_table", {
 *     id: integer().primaryKey().generatedAlwaysAsIdentity(),
 *     ...auditColumns,
 *   });
 *
 * Note: These columns reference user IDs but do NOT include FK constraints.
 * This is intentional to avoid circular dependencies and allow flexibility
 * in user management (e.g., system users, deleted users).
 *
 * @stability STABLE - Changes require migration + team review
 */

import { integer } from "drizzle-orm/pg-core";

/**
 * Audit columns for user attribution.
 *
 * - createdBy: User ID who created the record (required)
 * - updatedBy: User ID who last modified the record (required)
 *
 * Application layer is responsible for setting these values.
 */
export const auditColumns = {
  createdBy: integer().notNull(),
  updatedBy: integer().notNull(),
} as const;

/**
 * Column fingerprints for CI duplication detection.
 */
export const AUDIT_FINGERPRINTS = {
  createdBy: "integer:notNull",
  updatedBy: "integer:notNull",
} as const;
