import {
  pgSchema,
  bigint,
  integer,
  text,
  jsonb,
  timestamp,
  uuid,
  inet,
  index,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { tenants } from "../core/tenants";
import { appendOnlyTimestampColumns } from "../_shared";

export const auditSchema = pgSchema("audit");

/**
 * Actor types for audit trail - identifies WHO performed the action.
 * - USER: Human user via UI/API
 * - SERVICE_PRINCIPAL: Machine-to-machine (API keys, service accounts)
 * - SYSTEM: Internal system processes (triggers, scheduled jobs)
 * - ANONYMOUS: Unauthenticated actions (public endpoints)
 */
export const actorTypes = ["USER", "SERVICE_PRINCIPAL", "SYSTEM", "ANONYMOUS"] as const;
export const actorTypeEnum = auditSchema.enum("actor_type", [...actorTypes]);

/**
 * Audit operations - identifies WHAT action was performed.
 * Data operations: INSERT, UPDATE, DELETE, TRUNCATE
 * Access operations: LOGIN, LOGOUT, ACCESS, EXPORT
 * Admin operations: GRANT, REVOKE, CONFIG_CHANGE
 */
export const auditOperations = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "TRUNCATE",
  "LOGIN",
  "LOGOUT",
  "ACCESS",
  "EXPORT",
  "GRANT",
  "REVOKE",
  "CONFIG_CHANGE",
] as const;
export const auditOperationEnum = auditSchema.enum("audit_operation", [...auditOperations]);

/** Zod enum schemas for runtime validation */
export const actorTypeZodEnum = createSelectSchema(actorTypeEnum);
export const auditOperationZodEnum = createSelectSchema(auditOperationEnum);

/**
 * Client information captured during audit - part of HOW dimension.
 */
export interface ClientInfo {
  userAgent?: string;
  appVersion?: string;
  platform?: string;
  deviceId?: string;
}

/**
 * 7W1H Audit Trail Table
 *
 * Comprehensive audit logging following the 7W1H methodology:
 * - WHO: actorId, actorType
 * - WHAT: operation, schemaName, tableName, oldData, newData
 * - WHEN: occurredAt, recordedAt
 * - WHERE: sourceIp, sourceLocation
 * - WHY: reason, correlationId, requestId
 * - WHICH: rowKey, affectedColumns
 * - WHOM: targetActorId (for user-affecting operations)
 * - HOW: clientInfo, sessionId
 *
 * Design notes:
 * - Append-only: No soft-delete, updates/deletes are forbidden
 * - Partitioned by (tenantId, occurredAt) for scalability
 * - GIN indexes on JSONB for containment queries
 * - BTREE indexes on common filter columns
 *
 * @see docs/architecture/01-db-first-guideline.md Section 4.13
 */
export const auditTrail = auditSchema.table(
  "audit_trail",
  {
    // Primary key (will be part of composite PK with occurredAt for partitioning)
    auditId: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),

    // ═══════════════════════════════════════════════════════════════════════
    // WHO - Actor identification
    // ═══════════════════════════════════════════════════════════════════════
    actorId: integer(), // FK to users.userId or servicePrincipals.servicePrincipalId (polymorphic)
    actorType: actorTypeEnum().notNull().default("USER"),

    // ═══════════════════════════════════════════════════════════════════════
    // WHAT - Action details
    // ═══════════════════════════════════════════════════════════════════════
    operation: auditOperationEnum().notNull(),
    schemaName: text().notNull(), // e.g., "hr", "finance", "security"
    tableName: text().notNull(), // e.g., "employees", "invoices"
    oldData: jsonb(), // Previous state (UPDATE, DELETE)
    newData: jsonb(), // New state (INSERT, UPDATE)

    // ═══════════════════════════════════════════════════════════════════════
    // WHEN - Temporal tracking
    // ═══════════════════════════════════════════════════════════════════════
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(), // When action happened
    recordedAt: timestamp({ withTimezone: true }).notNull().defaultNow(), // When audit was written

    // ═══════════════════════════════════════════════════════════════════════
    // WHERE - Origin tracking
    // ═══════════════════════════════════════════════════════════════════════
    sourceIp: inet(), // Client IP address (strict inet type for validation)
    sourceLocation: text(), // ISO country/region code (e.g., "US", "US-CA")

    // ═══════════════════════════════════════════════════════════════════════
    // WHY - Business context
    // ═══════════════════════════════════════════════════════════════════════
    reason: text(), // Business justification (e.g., "Customer request", "Compliance")
    correlationId: uuid(), // Distributed trace ID for request correlation
    requestId: uuid(), // API request ID for debugging

    // ═══════════════════════════════════════════════════════════════════════
    // WHICH - Affected data identification
    // ═══════════════════════════════════════════════════════════════════════
    rowKey: text(), // Primary key value(s) as string (e.g., "123" or "tenant:1,user:42")
    affectedColumns: text().array(), // List of changed column names (UPDATE only)

    // ═══════════════════════════════════════════════════════════════════════
    // WHOM - Target actor (for user-affecting operations)
    // ═══════════════════════════════════════════════════════════════════════
    targetActorId: integer(), // User affected by the action (e.g., password reset target)

    // ═══════════════════════════════════════════════════════════════════════
    // HOW - Client context
    // ═══════════════════════════════════════════════════════════════════════
    clientInfo: jsonb().$type<ClientInfo>(), // User agent, app version, platform
    sessionId: text(), // Session identifier for grouping related actions

    // ═══════════════════════════════════════════════════════════════════════
    // Tenant isolation
    // ═══════════════════════════════════════════════════════════════════════
    tenantId: integer().notNull(), // FK to core.tenants - tenant isolation and partitioning

    // ═══════════════════════════════════════════════════════════════════════
    // Metadata (createdAt only - audit is append-only, no updates)
    // ═══════════════════════════════════════════════════════════════════════
    ...appendOnlyTimestampColumns,
  },
  (t) => [
    // ═══════════════════════════════════════════════════════════════════════
    // BTREE Indexes - Common filter patterns
    // ═══════════════════════════════════════════════════════════════════════
    index("idx_audit_tenant_occurred").on(t.tenantId, t.occurredAt),
    index("idx_audit_actor").on(t.tenantId, t.actorId, t.occurredAt),
    index("idx_audit_table").on(t.schemaName, t.tableName, t.occurredAt),
    index("idx_audit_row_key").on(t.tenantId, t.tableName, t.rowKey),
    index("idx_audit_correlation").on(t.correlationId),
    index("idx_audit_request").on(t.requestId),
    index("idx_audit_session").on(t.tenantId, t.sessionId, t.occurredAt),

    // Composite index for common query pattern: tenant + table + operation + date
    index("idx_audit_tenant_table_op_date")
      .on(t.tenantId, t.tableName, t.operation, t.occurredAt),

    // Partial index for login/logout operations (security monitoring)
    index("idx_audit_auth_ops")
      .on(t.tenantId, t.actorId, t.occurredAt)
      .where(sql`${t.operation} IN ('LOGIN', 'LOGOUT')`),

    // ═══════════════════════════════════════════════════════════════════════
    // GIN Indexes (require custom SQL - see CUSTOM_SQL.md Section 3)
    // ═══════════════════════════════════════════════════════════════════════
    // The following GIN indexes are created via custom SQL in migrations:
    // - idx_audit_old_data_gin: GIN index on old_data (jsonb_path_ops)
    // - idx_audit_new_data_gin: GIN index on new_data (jsonb_path_ops)
    // - idx_audit_client_info_gin: GIN index on client_info (jsonb_path_ops)
    // These indexes enable fast containment queries using the @> operator.

    // ═══════════════════════════════════════════════════════════════════════
    // Foreign Keys
    // ═══════════════════════════════════════════════════════════════════════
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_audit_trail_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    // Note: actorId FK is not enforced at DB level due to polymorphic nature
    // (can reference users OR servicePrincipals). Enforce in application layer.
    //
    // Alternative design (if referential integrity is required):
    // Use discriminated union with separate nullable columns:
    // - actorUserId (FK to users) when actorType = 'USER'
    // - actorServicePrincipalId (FK to servicePrincipals) when actorType = 'SERVICE_PRINCIPAL'
    // - Check constraint ensures only one is set based on actorType
    // See CUSTOM_SQL.md Section 11 for computed column alternative (less invasive).

    // ═══════════════════════════════════════════════════════════════════════
    // Check Constraints
    // ═══════════════════════════════════════════════════════════════════════
    // Ensure data operations have table context
    check(
      "chk_audit_data_ops_have_table",
      sql`${t.operation} NOT IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') OR ${t.tableName} IS NOT NULL`
    ),

    // Ensure UPDATE operations have affected columns
    check(
      "chk_audit_update_has_columns",
      sql`${t.operation} != 'UPDATE' OR ${t.affectedColumns} IS NOT NULL`
    ),

    // Validate source location format (ISO country/region code)
    check(
      "chk_audit_source_location_format",
      sql`${t.sourceLocation} IS NULL OR ${t.sourceLocation} ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'`
    ),
  ]
);

// ═══════════════════════════════════════════════════════════════════════════
// Branded ID Types
// ═══════════════════════════════════════════════════════════════════════════
// Note: Using z.number() since column uses bigint({ mode: "number" })
export const AuditTrailIdSchema = z.number().int().brand<"AuditTrailId">();
export type AuditTrailId = z.infer<typeof AuditTrailIdSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Zod Schemas with Strict Validation
// ═══════════════════════════════════════════════════════════════════════════

/** Client info validation schema */
export const clientInfoSchema = z
  .object({
    userAgent: z.string().max(500).optional(),
    appVersion: z.string().max(50).optional(),
    platform: z.string().max(50).optional(),
    deviceId: z.string().max(100).optional(),
  })
  .strict();

/** Select schema for reading audit entries */
export const auditTrailSelectSchema = createSelectSchema(auditTrail);

/** Insert schema with strict validation for 7W1H fields */
export const auditTrailInsertSchema = createInsertSchema(auditTrail, {
  schemaName: z.string().min(1).max(63), // PostgreSQL identifier limit
  tableName: z.string().min(1).max(63),
  rowKey: z.string().max(500).optional(),
  reason: z.string().max(2000).optional(),
  correlationId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  sourceLocation: z
    .string()
    .max(10)
    .regex(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/, "ISO country/region code")
    .optional(),
  sessionId: z.string().max(100).optional(),
  clientInfo: clientInfoSchema.optional(),
  affectedColumns: z.array(z.string().max(63)).optional(),
});

// Note: No update schema - audit trail is append-only

// ═══════════════════════════════════════════════════════════════════════════
// TypeScript Types
// ═══════════════════════════════════════════════════════════════════════════
export type AuditTrailEntry = typeof auditTrail.$inferSelect;
export type NewAuditTrailEntry = typeof auditTrail.$inferInsert;
export type AuditOperation = (typeof auditOperations)[number];
export type ActorType = (typeof actorTypes)[number];
