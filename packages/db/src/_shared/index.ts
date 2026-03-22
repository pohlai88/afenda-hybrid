/**
 * Shared Column Mixins
 *
 * Barrel uses **explicit** `export { … }` (including from `zodWire.ts`) — no `export *`.
 *
 * Centralized column definitions for consistency across all schema tables.
 * Use these mixins to ensure uniform column types, nullability, and defaults.
 *
 * Available mixins:
 * - timestampColumns: createdAt, updatedAt (REQUIRED for all tables)
 * - softDeleteColumns: deletedAt (REQUIRED for tables with soft-delete)
 * - auditColumns: createdBy, updatedBy (RECOMMENDED for tracked tables)
 * - nameColumn: name text column (OPTIONAL convenience)
 *
 * Tenant Scope Pattern (NOT a mixin):
 * - tenantId MUST be defined EXPLICITLY in each table with explicit foreignKey()
 * - This allows customizing onDelete/onUpdate actions per table
 * - See guideline section 6.1 for the standard pattern
 *
 * CI Enforcement:
 * - Tables MUST use timestampColumns (enforced)
 * - Tables with soft-delete MUST use softDeleteColumns (enforced)
 * - Tenant-scoped tables MUST have tenantId with FK to core.tenants (enforced)
 * - Tracked tables SHOULD use auditColumns (warning if missing)
 *
 * @see docs/architecture/01-db-first-guideline.md Section 6.1 (Tenancy)
 * @see docs/architecture/01-db-first-guideline.md Section 7 (Shared Columns)
 *
 * Zod wire formats for `date` / `timestamptz` (domain `_zodShared` re-exports): see `zodWire.ts`.
 */

export {
  dateCoerceSchema,
  dateNullableOptionalSchema,
  dateOptionalSchema,
  dateStringSchema,
  dateValue,
  isoDateWireString,
  isParseableTimestamptzString,
  nullableOptional,
  parseUnknownToEpochMs,
  timestamptzNullableOptionalSchema,
  timestamptzOptionalSchema,
  timestamptzStringSchema,
  timestamptzWireNullableOptionalSchema,
  timestamptzWireSchema,
} from "./zodWire";
export {
  timestampColumns,
  softDeleteColumns,
  appendOnlyTimestampColumns,
  TIMESTAMP_FINGERPRINTS,
} from "./timestamps";
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
} as const;

/**
 * Columns that MUST use shared mixins (CI error if manual definition found).
 */
export const MANDATORY_SHARED_COLUMNS = ["createdAt", "updatedAt"] as const;

/**
 * Columns that SHOULD use shared mixins (CI warning if manual definition found).
 * Note: tenantId is NOT in this list - it MUST be defined explicitly with foreignKey().
 */
export const RECOMMENDED_SHARED_COLUMNS = ["deletedAt", "createdBy", "updatedBy"] as const;
