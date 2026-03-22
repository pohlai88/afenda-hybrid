/**
 * RLS (Row-Level Security) Policy Exports
 *
 * Provides reusable RLS policy definitions for tenant isolation.
 * Frozen: add or change tenant RLS in SQL migrations, not here.
 *
 * @see https://orm.drizzle.team/docs/rls
 */

export {
  appUserRole,
  serviceRole,
  tenantIsolationCheck,
  tenantSelectPolicy,
  tenantInsertPolicy,
  tenantUpdatePolicy,
  tenantDeletePolicy,
  tenantIsolationPolicies,
  serviceBypassPolicy,
} from "./tenant-policies";
