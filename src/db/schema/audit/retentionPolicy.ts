import { integer, text, boolean, timestamp, bigint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { auditSchema } from "./auditTrail";
import { tenants } from "../core/tenants";
import { timestampColumns, softDeleteColumns, auditColumns } from "../_shared";

/**
 * Retention policy statuses
 */
export const retentionPolicyStatuses = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;
export const retentionPolicyStatusEnum = auditSchema.enum("retention_policy_status", [
  ...retentionPolicyStatuses,
]);

/**
 * Archive destinations for expired audit data
 */
export const archiveDestinations = ["S3", "GCS", "AZURE_BLOB", "LOCAL", "NONE"] as const;
export const archiveDestinationEnum = auditSchema.enum("archive_destination", [
  ...archiveDestinations,
]);

/** Zod enum schemas for runtime validation */
export const retentionPolicyStatusZodEnum = createSelectSchema(retentionPolicyStatusEnum);
export const archiveDestinationZodEnum = createSelectSchema(archiveDestinationEnum);

/**
 * Global minimum retention period in days.
 * This cannot be overridden by tenant-specific policies.
 * Default: 365 days (1 year) for compliance.
 */
export const GLOBAL_MINIMUM_RETENTION_DAYS = 365;

/**
 * Default retention period in days.
 * Used when no specific policy is defined.
 * Default: 2555 days (~7 years) for regulatory compliance.
 */
export const DEFAULT_RETENTION_DAYS = 2555;

/**
 * Retention Policies Table
 *
 * Configurable retention rules for audit data per tenant and/or table.
 * Supports hierarchical policy resolution:
 * 1. Specific: tenantId + schemaName + tableName
 * 2. Schema-wide: tenantId + schemaName (tableName = NULL)
 * 3. Tenant-wide: tenantId (schemaName = NULL, tableName = NULL)
 * 4. Global default: tenantId = NULL
 *
 * Constraints:
 * - retentionDays >= GLOBAL_MINIMUM_RETENTION_DAYS (365)
 * - archiveEnabled must be true if archiveDestination is set
 *
 * @see CUSTOM_SQL.md Section 8 for archival procedures
 */
export const retentionPolicies = auditSchema.table(
  "retention_policies",
  {
    policyId: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Scope (NULL = applies to all)
    tenantId: integer(), // NULL = global default policy
    schemaName: text(), // NULL = all schemas for this tenant
    tableName: text(), // NULL = all tables in this schema

    // Retention settings
    retentionDays: integer().notNull().default(DEFAULT_RETENTION_DAYS),
    status: retentionPolicyStatusEnum().notNull().default("ACTIVE"),

    // Archive settings
    archiveEnabled: boolean().notNull().default(true),
    archiveDestination: archiveDestinationEnum().default("S3"),
    archivePath: text(), // e.g., "s3://bucket/audit/{tenant}/{year}/{quarter}"
    archiveEncrypted: boolean().notNull().default(true),

    // Policy metadata
    description: text(),
    effectiveFrom: timestamp({ withTimezone: true }), // When policy takes effect
    lastAppliedAt: timestamp({ withTimezone: true }), // Timestamp of last retention job run

    // Standard columns
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    // Unique constraint: one policy per scope combination
    uniqueIndex("uq_retention_policy_scope")
      .on(
        sql`COALESCE(${t.tenantId}, 0)`,
        sql`COALESCE(${t.schemaName}, '')`,
        sql`COALESCE(${t.tableName}, '')`
      )
      .where(sql`${t.deletedAt} IS NULL`),

    // Index for policy lookup
    index("idx_retention_tenant").on(t.tenantId),
    index("idx_retention_schema").on(t.schemaName, t.tableName),
    index("idx_retention_status").on(t.status),

    // FK to tenants (optional - NULL means global)
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_retention_policy_tenant",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),

    // Enforce global minimum retention
    check(
      "chk_retention_minimum_days",
      sql`${t.retentionDays} >= ${GLOBAL_MINIMUM_RETENTION_DAYS}`
    ),

    // Ensure archive destination is set if archiving is enabled
    check(
      "chk_archive_destination_required",
      sql`${t.archiveEnabled} = false OR ${t.archiveDestination} IS NOT NULL`
    ),

    // Ensure archive path is set for non-NONE destinations
    check(
      "chk_archive_path_required",
      sql`${t.archiveDestination} = 'NONE' OR ${t.archiveDestination} IS NULL OR ${t.archivePath} IS NOT NULL`
    ),
  ]
);

// ═══════════════════════════════════════════════════════════════════════════
// Branded ID Types
// ═══════════════════════════════════════════════════════════════════════════
export const RetentionPolicyIdSchema = z.number().int().brand<"RetentionPolicyId">();
export type RetentionPolicyId = z.infer<typeof RetentionPolicyIdSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Zod Schemas
// ═══════════════════════════════════════════════════════════════════════════

export const retentionPolicySelectSchema = createSelectSchema(retentionPolicies);

export const retentionPolicyInsertSchema = createInsertSchema(retentionPolicies, {
  schemaName: z.string().min(1).max(63).optional(),
  tableName: z.string().min(1).max(63).optional(),
  retentionDays: z.number().int().min(GLOBAL_MINIMUM_RETENTION_DAYS),
  archivePath: z
    .string()
    .max(500)
    .refine(
      (val) => {
        if (!val) return true;
        // Cloud storage paths: s3://, gs://, azure://
        // Local paths: /path/to/directory
        return /^(s3|gs|azure):\/\//.test(val) || /^\//.test(val);
      },
      { message: "Must be a valid cloud storage or local path" }
    )
    .optional(),
  description: z.string().max(2000).optional(),
});

export const retentionPolicyUpdateSchema = createUpdateSchema(retentionPolicies, {
  retentionDays: z.number().int().min(GLOBAL_MINIMUM_RETENTION_DAYS).optional(),
  archivePath: z
    .string()
    .max(500)
    .refine(
      (val) => {
        if (!val) return true;
        // Cloud storage paths: s3://, gs://, azure://
        // Local paths: /path/to/directory
        return /^(s3|gs|azure):\/\//.test(val) || /^\//.test(val);
      },
      { message: "Must be a valid cloud storage or local path" }
    )
    .optional()
    .nullable(),
  description: z.string().max(2000).optional().nullable(),
});

/**
 * Retention Execution Status Enum
 */
export const retentionExecutionStatuses = ["RUNNING", "COMPLETED", "FAILED", "CANCELLED"] as const;
export const retentionExecutionStatusEnum = auditSchema.enum("retention_execution_status", [
  ...retentionExecutionStatuses,
]);

export const retentionExecutionStatusZodEnum = createSelectSchema(retentionExecutionStatusEnum);

/**
 * Retention Executions Table
 *
 * Tracks execution history of retention policy jobs.
 * Used for monitoring, debugging, and audit of retention operations.
 */
export const retentionExecutions = auditSchema.table(
  "retention_executions",
  {
    executionId: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    policyId: integer().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp({ withTimezone: true }),
    status: retentionExecutionStatusEnum().notNull().default("RUNNING"),
    recordsProcessed: bigint({ mode: "number" }),
    recordsArchived: bigint({ mode: "number" }),
    recordsDeleted: bigint({ mode: "number" }),
    errorMessage: text(),
    ...timestampColumns,
  },
  (t) => [
    index("idx_retention_exec_policy").on(t.policyId, t.startedAt),
    index("idx_retention_exec_status").on(t.status, t.startedAt),
    foreignKey({
      columns: [t.policyId],
      foreignColumns: [retentionPolicies.policyId],
      name: "fk_retention_exec_policy",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);

// ═══════════════════════════════════════════════════════════════════════════
// Branded ID Types
// ═══════════════════════════════════════════════════════════════════════════
export const RetentionExecutionIdSchema = z.number().int().brand<"RetentionExecutionId">();
export type RetentionExecutionId = z.infer<typeof RetentionExecutionIdSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Zod Schemas for Retention Executions
// ═══════════════════════════════════════════════════════════════════════════
export const retentionExecutionSelectSchema = createSelectSchema(retentionExecutions);
export const retentionExecutionInsertSchema = createInsertSchema(retentionExecutions, {
  errorMessage: z.string().max(5000).optional(),
});
export const retentionExecutionUpdateSchema = createUpdateSchema(retentionExecutions);

// ═══════════════════════════════════════════════════════════════════════════
// TypeScript Types
// ═══════════════════════════════════════════════════════════════════════════
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type NewRetentionPolicy = typeof retentionPolicies.$inferInsert;
export type RetentionPolicyStatus = (typeof retentionPolicyStatuses)[number];
export type ArchiveDestination = (typeof archiveDestinations)[number];
export type RetentionExecution = typeof retentionExecutions.$inferSelect;
export type NewRetentionExecution = typeof retentionExecutions.$inferInsert;
export type RetentionExecutionStatus = (typeof retentionExecutionStatuses)[number];
