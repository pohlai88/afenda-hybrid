/**
 * Tenant Isolation RLS Policies
 *
 * Provides reusable RLS policy definitions for tenant-scoped tables.
 * Uses PostgreSQL GUC `afenda.tenant_id` set by `setSessionContext()`.
 *
 * @see https://orm.drizzle.team/docs/rls
 * @see packages/db/src/_session/setSessionContext.ts
 */

import { sql } from "drizzle-orm";
import { pgPolicy, pgRole } from "drizzle-orm/pg-core";

/**
 * Application role that all authenticated requests use.
 * This role is created in the database and granted to the connection pool user.
 * Marked as `.existing()` because it's managed outside of Drizzle migrations.
 */
export const appUserRole = pgRole("app_user").existing();

/**
 * Service role for background jobs and system operations.
 * Bypasses RLS for administrative tasks.
 */
export const serviceRole = pgRole("service_role").existing();

/**
 * SQL expression that checks if the row's tenantId matches the session context.
 * Used in RLS USING and WITH CHECK clauses.
 *
 * Uses NULLIF to handle empty string (unset) gracefully - returns NULL which
 * causes the comparison to fail, denying access when no tenant is set.
 *
 * IMPORTANT: Uses quoted "tenantId" to match the camelCase column names in migrations.
 * The db.ts uses `casing: "camelCase"` so columns are stored as quoted identifiers.
 *
 * @returns SQL expression for tenant isolation
 */
export const tenantIsolationCheck = () =>
  sql`"tenantId" = NULLIF(current_setting('afenda.tenant_id', true), '')::int`;

/**
 * Creates a standard tenant isolation policy for SELECT operations.
 * Users can only read rows belonging to their tenant.
 */
export const tenantSelectPolicy = (tableName: string) =>
  pgPolicy(`${tableName}_tenant_select`, {
    as: "permissive",
    for: "select",
    to: appUserRole,
    using: tenantIsolationCheck(),
  });

/**
 * Creates a standard tenant isolation policy for INSERT operations.
 * Users can only insert rows with their tenant's ID.
 */
export const tenantInsertPolicy = (tableName: string) =>
  pgPolicy(`${tableName}_tenant_insert`, {
    as: "permissive",
    for: "insert",
    to: appUserRole,
    withCheck: tenantIsolationCheck(),
  });

/**
 * Creates a standard tenant isolation policy for UPDATE operations.
 * Users can only update rows belonging to their tenant.
 */
export const tenantUpdatePolicy = (tableName: string) =>
  pgPolicy(`${tableName}_tenant_update`, {
    as: "permissive",
    for: "update",
    to: appUserRole,
    using: tenantIsolationCheck(),
    withCheck: tenantIsolationCheck(),
  });

/**
 * Creates a standard tenant isolation policy for DELETE operations.
 * Users can only delete rows belonging to their tenant.
 */
export const tenantDeletePolicy = (tableName: string) =>
  pgPolicy(`${tableName}_tenant_delete`, {
    as: "permissive",
    for: "delete",
    to: appUserRole,
    using: tenantIsolationCheck(),
  });

/**
 * Creates all CRUD policies for tenant isolation.
 * Returns an array of policies to spread into the table constraints.
 *
 * @param tableName - Base name for policy naming (e.g., "users", "employees")
 * @returns Array of pgPolicy definitions for SELECT, INSERT, UPDATE, DELETE
 *
 * @example
 * ```typescript
 * export const employees = hrSchema.table(
 *   "employees",
 *   { ... },
 *   (t) => [
 *     ...tenantIsolationPolicies("employees"),
 *     // other constraints...
 *   ]
 * );
 * ```
 */
export function tenantIsolationPolicies(tableName: string) {
  return [
    tenantSelectPolicy(tableName),
    tenantInsertPolicy(tableName),
    tenantUpdatePolicy(tableName),
    tenantDeletePolicy(tableName),
  ];
}

/**
 * Service role bypass policy - allows service_role to bypass all RLS.
 * Use sparingly for administrative operations.
 */
export const serviceBypassPolicy = (tableName: string) =>
  pgPolicy(`${tableName}_service_bypass`, {
    as: "permissive",
    for: "all",
    to: serviceRole,
    using: sql`true`,
    withCheck: sql`true`,
  });
