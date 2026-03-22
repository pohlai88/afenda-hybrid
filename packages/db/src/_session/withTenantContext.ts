/**
 * Tenant-aware query wrapper for Server Components
 *
 * Ensures RLS session context is set for every database operation.
 * Use this in RSC/Server Actions instead of raw db.query calls.
 */

import { db, type Database } from "../db";
import { setSessionContext, type SessionContext } from "./setSessionContext";

type TransactionCallback<T> = (tx: Database) => Promise<T>;

/**
 * Execute a database operation with tenant context set for RLS.
 *
 * This wraps the operation in a transaction where `afenda.tenant_id` (and optionally
 * `afenda.user_id`) are set via `set_config(..., true)` so RLS policies can filter rows.
 *
 * @param ctx - Session context (at minimum tenantId)
 * @param fn - Callback receiving the transaction; use tx.query.* inside
 * @returns Result of the callback
 *
 * @example
 * ```typescript
 * const employees = await withTenantContext(
 *   { tenantId: 1, userId: 42 },
 *   (tx) => tx.query.employees.findMany({ limit: 100 })
 * );
 * ```
 */
export async function withTenantContext<T>(
  ctx: SessionContext,
  fn: TransactionCallback<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await setSessionContext(tx, ctx);
    return fn(tx as unknown as Database);
  });
}

/**
 * Helper to get tenant context from request headers/cookies.
 * Use in RSC pages to extract tenant info before querying.
 */
export function getTenantContextFromHeaders(headers: Headers): SessionContext | null {
  const tenantIdStr = headers.get("x-tenant-id");
  if (!tenantIdStr) return null;

  const tenantId = parseInt(tenantIdStr, 10);
  if (isNaN(tenantId)) return null;

  const userIdStr = headers.get("x-user-id");
  const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;

  return {
    tenantId,
    userId: isNaN(userId as number) ? undefined : userId,
    actorType: userId ? "user" : "system",
  };
}
