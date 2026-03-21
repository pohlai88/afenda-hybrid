import { sql, type SQL } from "drizzle-orm";

/**
 * Session context for audit and RLS enforcement
 */
export interface SessionContext {
  tenantId: number;
  userId?: number;
  actorType?: "user" | "service_principal" | "system";
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Minimal interface for Drizzle database/transaction with execute capability.
 * Uses a permissive signature that accepts both db and transaction instances.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbExecutor = { execute: (query: SQL) => Promise<any> };

/**
 * Set PostgreSQL session variables for audit trail and RLS policies
 *
 * Must be called at the start of every database session or transaction.
 * These variables are consumed by:
 * - Audit triggers (log_change_7w1h) to record who made changes
 * - RLS policies (when enabled) to enforce tenant isolation
 * - Observability to correlate DB activity with API requests
 *
 * @param db - Drizzle database instance with execute method
 * @param ctx - Session context with tenant, user, and optional metadata
 *
 * @example
 * ```typescript
 * await setSessionContext(db, {
 *   tenantId: 1,
 *   userId: 42,
 *   correlationId: req.headers['x-correlation-id'],
 *   ipAddress: req.ip
 * });
 * ```
 */
export async function setSessionContext(
  db: DbExecutor,
  ctx: SessionContext
): Promise<void> {
  // Required: tenant and user for audit trail
  // Note: SET LOCAL doesn't support parameterized queries, so we use sql.raw()
  // Values are validated as numbers/strings before interpolation
  await db.execute(sql`SELECT set_config('afenda.tenant_id', ${ctx.tenantId.toString()}, true)`);

  if (ctx.userId != null) {
    await db.execute(sql`SELECT set_config('afenda.user_id', ${ctx.userId.toString()}, true)`);
  }

  // Optional: extended audit context
  if (ctx.actorType != null) {
    await db.execute(sql`SELECT set_config('afenda.actor_type', ${ctx.actorType}, true)`);
  }

  if (ctx.correlationId != null) {
    await db.execute(sql`SELECT set_config('afenda.correlation_id', ${ctx.correlationId}, true)`);
  }

  if (ctx.requestId != null) {
    await db.execute(sql`SELECT set_config('afenda.request_id', ${ctx.requestId}, true)`);
  }

  if (ctx.sessionId != null) {
    await db.execute(sql`SELECT set_config('afenda.session_id', ${ctx.sessionId}, true)`);
  }

  if (ctx.ipAddress != null) {
    await db.execute(sql`SELECT set_config('afenda.ip_address', ${ctx.ipAddress}, true)`);
  }

  if (ctx.userAgent != null) {
    await db.execute(sql`SELECT set_config('afenda.user_agent', ${ctx.userAgent}, true)`);
  }
}

/**
 * Clear session context (useful for connection pooling)
 *
 * @param db - Drizzle database instance with execute method
 */
export async function clearSessionContext(
  db: DbExecutor
): Promise<void> {
  // Reset all session variables to their defaults
  await db.execute(sql`SELECT set_config('afenda.tenant_id', '', true)`);
  await db.execute(sql`SELECT set_config('afenda.user_id', '', true)`);
  await db.execute(sql`SELECT set_config('afenda.actor_type', '', true)`);
  await db.execute(sql`SELECT set_config('afenda.correlation_id', '', true)`);
  await db.execute(sql`SELECT set_config('afenda.request_id', '', true)`);
  await db.execute(sql`SELECT set_config('afenda.session_id', '', true)`);
  await db.execute(sql`SELECT set_config('afenda.ip_address', '', true)`);
  await db.execute(sql`SELECT set_config('afenda.user_agent', '', true)`);
}
