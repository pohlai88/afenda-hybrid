import { integer, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { auditSchema, auditTrail, auditOperationEnum, actorTypeEnum } from "./auditTrail";

/**
 * Audit Summary Materialized View
 *
 * Pre-aggregated audit statistics for dashboard and reporting performance.
 * Aggregates audit_trail data by tenant, schema, table, operation, and day.
 *
 * Refresh strategy:
 * - Schedule hourly or daily refresh depending on reporting needs
 * - Use CONCURRENTLY to avoid locking during refresh
 *
 * Custom SQL required for:
 * - Index creation on materialized view
 * - Refresh scheduling via pg_cron
 *
 * @see CUSTOM_SQL.md for index and refresh setup
 */
export const auditSummary = auditSchema
  .materializedView("mv_audit_summary", {
    // Dimensions
    tenantId: integer().notNull(),
    schemaName: text().notNull(),
    tableName: text().notNull(),
    operation: auditOperationEnum().notNull(),
    actorType: actorTypeEnum().notNull(),
    summaryDate: timestamp({ withTimezone: true }).notNull(),

    // Metrics
    eventCount: bigint({ mode: "number" }).notNull(),
    uniqueActors: bigint({ mode: "number" }).notNull(),
    uniqueRows: bigint({ mode: "number" }).notNull(),

    // Metadata
    firstOccurredAt: timestamp({ withTimezone: true }),
    lastOccurredAt: timestamp({ withTimezone: true }),
  })
  .as(
    sql`
    SELECT
      ${auditTrail.tenantId} AS tenant_id,
      ${auditTrail.schemaName} AS schema_name,
      ${auditTrail.tableName} AS table_name,
      ${auditTrail.operation} AS operation,
      ${auditTrail.actorType} AS actor_type,
      date_trunc('day', ${auditTrail.occurredAt}) AS summary_date,
      count(*)::bigint AS event_count,
      count(DISTINCT ${auditTrail.actorId})::bigint AS unique_actors,
      count(DISTINCT ${auditTrail.rowKey})::bigint AS unique_rows,
      min(${auditTrail.occurredAt}) AS first_occurred_at,
      max(${auditTrail.occurredAt}) AS last_occurred_at
    FROM ${auditTrail}
    GROUP BY
      ${auditTrail.tenantId},
      ${auditTrail.schemaName},
      ${auditTrail.tableName},
      ${auditTrail.operation},
      ${auditTrail.actorType},
      date_trunc('day', ${auditTrail.occurredAt})
  `
  );

/**
 * Actor Activity Summary Materialized View
 *
 * Per-actor audit activity for user behavior analysis and security monitoring.
 * Useful for detecting anomalous activity patterns.
 */
export const actorActivitySummary = auditSchema
  .materializedView("mv_actor_activity", {
    // Dimensions
    tenantId: integer().notNull(),
    actorId: integer(),
    actorType: actorTypeEnum().notNull(),
    summaryDate: timestamp({ withTimezone: true }).notNull(),

    // Metrics
    totalActions: bigint({ mode: "number" }).notNull(),
    insertCount: bigint({ mode: "number" }).notNull(),
    updateCount: bigint({ mode: "number" }).notNull(),
    deleteCount: bigint({ mode: "number" }).notNull(),
    loginCount: bigint({ mode: "number" }).notNull(),
    logoutCount: bigint({ mode: "number" }).notNull(),
    tablesAccessed: bigint({ mode: "number" }).notNull(),

    // Session info
    uniqueSessions: bigint({ mode: "number" }).notNull(),
    uniqueIps: bigint({ mode: "number" }).notNull(),

    // Temporal
    firstActivity: timestamp({ withTimezone: true }),
    lastActivity: timestamp({ withTimezone: true }),
  })
  .as(
    sql`
    SELECT
      ${auditTrail.tenantId} AS tenant_id,
      ${auditTrail.actorId} AS actor_id,
      ${auditTrail.actorType} AS actor_type,
      date_trunc('day', ${auditTrail.occurredAt}) AS summary_date,
      count(*)::bigint AS total_actions,
      count(*) FILTER (WHERE ${auditTrail.operation} = 'INSERT')::bigint AS insert_count,
      count(*) FILTER (WHERE ${auditTrail.operation} = 'UPDATE')::bigint AS update_count,
      count(*) FILTER (WHERE ${auditTrail.operation} = 'DELETE')::bigint AS delete_count,
      count(*) FILTER (WHERE ${auditTrail.operation} = 'LOGIN')::bigint AS login_count,
      count(*) FILTER (WHERE ${auditTrail.operation} = 'LOGOUT')::bigint AS logout_count,
      count(DISTINCT ${auditTrail.tableName})::bigint AS tables_accessed,
      count(DISTINCT ${auditTrail.sessionId})::bigint AS unique_sessions,
      count(DISTINCT ${auditTrail.sourceIp})::bigint AS unique_ips,
      min(${auditTrail.occurredAt}) AS first_activity,
      max(${auditTrail.occurredAt}) AS last_activity
    FROM ${auditTrail}
    GROUP BY
      ${auditTrail.tenantId},
      ${auditTrail.actorId},
      ${auditTrail.actorType},
      date_trunc('day', ${auditTrail.occurredAt})
  `
  );

/**
 * Tenant Audit Overview Materialized View
 *
 * High-level audit statistics per tenant for admin dashboards.
 */
export const tenantAuditOverview = auditSchema
  .materializedView("mv_tenant_audit_overview", {
    tenantId: integer().notNull(),
    summaryMonth: timestamp({ withTimezone: true }).notNull(),

    // Volume metrics
    totalEvents: bigint({ mode: "number" }).notNull(),
    dataOperations: bigint({ mode: "number" }).notNull(),
    accessOperations: bigint({ mode: "number" }).notNull(),
    adminOperations: bigint({ mode: "number" }).notNull(),

    // Actor metrics
    activeUsers: bigint({ mode: "number" }).notNull(),
    activeServicePrincipals: bigint({ mode: "number" }).notNull(),
    systemEvents: bigint({ mode: "number" }).notNull(),

    // Coverage metrics
    tablesAudited: bigint({ mode: "number" }).notNull(),
    schemasAudited: bigint({ mode: "number" }).notNull(),
  })
  .as(
    sql`
    SELECT
      ${auditTrail.tenantId} AS tenant_id,
      date_trunc('month', ${auditTrail.occurredAt}) AS summary_month,
      count(*)::bigint AS total_events,
      count(*) FILTER (WHERE ${auditTrail.operation} IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'))::bigint AS data_operations,
      count(*) FILTER (WHERE ${auditTrail.operation} IN ('LOGIN', 'LOGOUT', 'ACCESS', 'EXPORT'))::bigint AS access_operations,
      count(*) FILTER (WHERE ${auditTrail.operation} IN ('GRANT', 'REVOKE', 'CONFIG_CHANGE'))::bigint AS admin_operations,
      count(DISTINCT ${auditTrail.actorId}) FILTER (WHERE ${auditTrail.actorType} = 'USER')::bigint AS active_users,
      count(DISTINCT ${auditTrail.actorId}) FILTER (WHERE ${auditTrail.actorType} = 'SERVICE_PRINCIPAL')::bigint AS active_service_principals,
      count(*) FILTER (WHERE ${auditTrail.actorType} = 'SYSTEM')::bigint AS system_events,
      count(DISTINCT ${auditTrail.tableName})::bigint AS tables_audited,
      count(DISTINCT ${auditTrail.schemaName})::bigint AS schemas_audited
    FROM ${auditTrail}
    GROUP BY
      ${auditTrail.tenantId},
      date_trunc('month', ${auditTrail.occurredAt})
  `
  );

// ═══════════════════════════════════════════════════════════════════════════
// TypeScript Types for Materialized Views
// ═══════════════════════════════════════════════════════════════════════════
export type AuditSummaryRow = typeof auditSummary.$inferSelect;
export type ActorActivityRow = typeof actorActivitySummary.$inferSelect;
export type TenantAuditOverviewRow = typeof tenantAuditOverview.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════
// Custom SQL for Materialized View Indexes (append to migration)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Add to generated migration:
 *
 * ```sql
 * -- CUSTOM: Indexes on mv_audit_summary
 * CREATE UNIQUE INDEX idx_mv_audit_summary_pk
 *   ON audit.mv_audit_summary (tenant_id, schema_name, table_name, operation, actor_type, summary_date);
 * CREATE INDEX idx_mv_audit_summary_tenant_date
 *   ON audit.mv_audit_summary (tenant_id, summary_date);
 *
 * -- CUSTOM: Indexes on mv_actor_activity
 * CREATE UNIQUE INDEX idx_mv_actor_activity_pk
 *   ON audit.mv_actor_activity (tenant_id, actor_id, actor_type, summary_date);
 * CREATE INDEX idx_mv_actor_activity_tenant_date
 *   ON audit.mv_actor_activity (tenant_id, summary_date);
 *
 * -- CUSTOM: Indexes on mv_tenant_audit_overview
 * CREATE UNIQUE INDEX idx_mv_tenant_overview_pk
 *   ON audit.mv_tenant_audit_overview (tenant_id, summary_month);
 *
 * -- CUSTOM: Refresh functions (schedule via pg_cron with staggered times)
 * -- Staggered refresh reduces lock contention and spreads load
 *
 * -- Hourly summary (most frequently queried)
 * CREATE OR REPLACE FUNCTION audit.refresh_audit_summary()
 * RETURNS void AS $$
 * BEGIN
 *   REFRESH MATERIALIZED VIEW CONCURRENTLY audit.mv_audit_summary;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * -- Actor activity (less frequent, refresh every 2 hours)
 * CREATE OR REPLACE FUNCTION audit.refresh_actor_activity()
 * RETURNS void AS $$
 * BEGIN
 *   REFRESH MATERIALIZED VIEW CONCURRENTLY audit.mv_actor_activity;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * -- Tenant overview (daily is sufficient)
 * CREATE OR REPLACE FUNCTION audit.refresh_tenant_overview()
 * RETURNS void AS $$
 * BEGIN
 *   REFRESH MATERIALIZED VIEW CONCURRENTLY audit.mv_tenant_audit_overview;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * -- Staggered refresh schedule (requires pg_cron extension)
 * -- Hourly summary at :05 past the hour
 * -- SELECT cron.schedule('refresh-audit-summary', '5 * * * *', 'SELECT audit.refresh_audit_summary()');
 * -- Actor activity every 2 hours at :15 (cron: 15 star-slash-2 star star star)
 * -- SELECT cron.schedule('refresh-actor-activity', '15 STAR/2 * * *', 'SELECT audit.refresh_actor_activity()');
 * -- Tenant overview daily at 2 AM
 * -- SELECT cron.schedule('refresh-tenant-overview', '0 2 * * *', 'SELECT audit.refresh_tenant_overview()');
 * -- Note: Replace STAR with * in the actual cron expression
 * ```
 */
