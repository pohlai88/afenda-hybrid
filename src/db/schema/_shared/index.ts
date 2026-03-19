/**
 * Shared Column Mixins
 *
 * Centralized column definitions for consistency across all schema tables.
 * Use these mixins to ensure uniform column types, nullability, and defaults.
 *
 * Available mixins:
 * - timestampColumns: createdAt, updatedAt
 * - softDeleteColumns: deletedAt
 * - auditColumns: createdBy, updatedBy
 * - tenantScopedColumns: tenantId with FK to core.tenants
 *
 * CI Enforcement:
 * - Tables MUST use timestampColumns (enforced)
 * - Tables with soft-delete MUST use softDeleteColumns (enforced)
 * - Tenant-scoped tables SHOULD use tenantScopedColumns (warning if bypassed without reason)
 * - Tracked tables SHOULD use auditColumns (warning if missing)
 *
 * Bypassing mixins:
 * - Add exception to scripts/config/shared-exceptions.json
 * - Include comment explaining why (e.g., "// explicit for FK control")
 *
 * @see docs/architecture/01-db-first-guideline.md Section 7
 */

export { timestampColumns, softDeleteColumns, appendOnlyTimestampColumns, TIMESTAMP_FINGERPRINTS } from "./timestamps";
export { tenantScopedColumns, TENANT_FINGERPRINTS } from "./tenantScope";
export { auditColumns, AUDIT_FINGERPRINTS } from "./auditColumns";
export { nameColumn, NAME_FINGERPRINTS } from "./nameColumns";

/**
 * All fingerprints combined for CI detection.
 */
export const ALL_SHARED_FINGERPRINTS = {
  // Timestamps
  createdAt: "timestamp:withTimezone:notNull:defaultNow",
  updatedAt: "timestamp:withTimezone:notNull:defaultNow",
  deletedAt: "timestamp:withTimezone:nullable",
  // Audit
  createdBy: "integer:notNull",
  updatedBy: "integer:notNull",
  // Tenant
  tenantId: "integer:notNull:fk:core.tenants.tenantId",
} as const;

/**
 * Columns that MUST use shared mixins (CI error if manual definition found).
 */
export const MANDATORY_SHARED_COLUMNS = ["createdAt", "updatedAt"] as const;

/**
 * Columns that SHOULD use shared mixins (CI warning if manual definition found).
 */
export const RECOMMENDED_SHARED_COLUMNS = ["deletedAt", "createdBy", "updatedBy", "tenantId"] as const;
