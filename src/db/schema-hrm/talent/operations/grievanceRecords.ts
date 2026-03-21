import { integer, varchar, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Grievance Records - Employee complaints and resolution tracking.
 * Circular FK note: employeeId, againstEmployeeId, assignedTo, resolvedBy FKs added via custom SQL.
 *
 * Resolution: `resolvedBy` / `resolvedDate` are both NULL or both set; `status = RESOLVED` iff those
 * fields are set (CHECK). Preflight: `docs/preflight-grievance-records-resolution.sql`.
 */
export const grievanceTypes = [
  "HARASSMENT",
  "DISCRIMINATION",
  "WORKPLACE_SAFETY",
  "POLICY_VIOLATION",
  "MANAGEMENT",
  "COMPENSATION",
  "WORKING_CONDITIONS",
  "OTHER",
] as const;

export const grievanceTypeEnum = talentSchema.enum("grievance_type", [...grievanceTypes]);

export const grievanceTypeZodEnum = createSelectSchema(grievanceTypeEnum);

export const grievanceStatuses = [
  "SUBMITTED",
  "UNDER_INVESTIGATION",
  "PENDING_RESOLUTION",
  "RESOLVED",
  "ESCALATED",
  "CLOSED",
  "WITHDRAWN",
] as const;

export const grievanceStatusEnum = talentSchema.enum("grievance_status", [...grievanceStatuses]);

export const grievanceStatusZodEnum = createSelectSchema(grievanceStatusEnum);

export const grievanceRecords = talentSchema.table(
  "grievance_records",
  {
    grievanceRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    grievanceType: grievanceTypeEnum().notNull(),
    submissionDate: date().notNull(),
    incidentDate: date(),
    /** DB-capped to match API / Zod (was unbounded `text`). */
    description: varchar({ length: 4000 }).notNull(),
    againstEmployeeId: integer(),
    assignedTo: integer(),
    investigationNotes: varchar({ length: 4000 }),
    resolution: varchar({ length: 4000 }),
    resolvedBy: integer(),
    resolvedDate: date(),
    status: grievanceStatusEnum().notNull().default("SUBMITTED"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_grievance_records_tenant").on(t.tenantId),
    index("idx_grievance_records_employee").on(t.tenantId, t.employeeId),
    index("idx_grievance_records_type").on(t.tenantId, t.grievanceType),
    index("idx_grievance_records_status").on(t.tenantId, t.status),
    index("idx_grievance_records_date").on(t.tenantId, t.submissionDate),
    /** Reporting / date-range filters (e.g. “last quarter”) */
    index("idx_grievance_records_incident").on(t.tenantId, t.incidentDate),
    index("idx_grievance_records_assigned").on(t.tenantId, t.assignedTo),
    index("idx_grievance_records_resolved_reporting")
      .on(t.tenantId, t.resolvedDate)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = ${sql.raw(`'RESOLVED'::"talent"."grievance_status"`)}`
      ),
    /** Active investigations (partial — excludes soft-deleted rows). */
    index("idx_grievance_records_under_investigation")
      .on(t.tenantId)
      .where(sql`${t.status} = 'UNDER_INVESTIGATION' AND ${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_grievance_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_grievance_records_resolution_consistency",
      sql`((${t.resolvedBy} IS NULL) = (${t.resolvedDate} IS NULL)) AND
          (${t.status}::text != 'RESOLVED' OR (${t.resolvedBy} IS NOT NULL AND ${t.resolvedDate} IS NOT NULL)) AND
          ((${t.resolvedBy} IS NULL AND ${t.resolvedDate} IS NULL) OR ${t.status}::text = 'RESOLVED')`
    ),
  ]
);

export const GrievanceRecordIdSchema = z.number().int().brand<"GrievanceRecordId">();
export type GrievanceRecordId = z.infer<typeof GrievanceRecordIdSchema>;

export const grievanceRecordSelectSchema = createSelectSchema(grievanceRecords);

export const grievanceRecordInsertSchema = createInsertSchema(grievanceRecords, {
  description: z.string().min(1).max(4000),
  investigationNotes: z.string().max(4000).optional(),
  resolution: z.string().max(4000).optional(),
});

export const grievanceRecordUpdateSchema = createUpdateSchema(grievanceRecords);

export type GrievanceRecord = typeof grievanceRecords.$inferSelect;
export type NewGrievanceRecord = typeof grievanceRecords.$inferInsert;
