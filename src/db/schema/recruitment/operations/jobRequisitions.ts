import { integer, text, date, numeric, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Job Requisitions - Hiring requests.
 * Circular FK note: positionId, departmentId, hiringManagerId, approvedBy FKs added via custom SQL.
 */
export const requisitionTypes = ["NEW_POSITION", "REPLACEMENT", "EXPANSION", "TEMPORARY", "CONTRACTOR"] as const;

export const requisitionTypeEnum = recruitmentSchema.enum("requisition_type", [...requisitionTypes]);

export const requisitionTypeZodEnum = createSelectSchema(requisitionTypeEnum);

export const requisitionStatuses = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "OPEN", "ON_HOLD", "FILLED", "CANCELLED"] as const;

export const requisitionStatusEnum = recruitmentSchema.enum("requisition_status", [...requisitionStatuses]);

export const requisitionStatusZodEnum = createSelectSchema(requisitionStatusEnum);

export const jobRequisitions = recruitmentSchema.table(
  "job_requisitions",
  {
    requisitionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    requisitionCode: text().notNull(),
    title: text().notNull(),
    positionId: integer(),
    departmentId: integer(),
    requisitionType: requisitionTypeEnum().notNull().default("NEW_POSITION"),
    headcount: smallint().notNull().default(1),
    hiringManagerId: integer(),
    minSalary: numeric({ precision: 12, scale: 2 }),
    maxSalary: numeric({ precision: 12, scale: 2 }),
    currencyId: integer(),
    targetStartDate: date(),
    closingDate: date(),
    jobDescription: text(),
    requirements: text(),
    status: requisitionStatusEnum().notNull().default("DRAFT"),
    approvedBy: integer(),
    approvedAt: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_job_requisitions_tenant").on(t.tenantId),
    index("idx_job_requisitions_position").on(t.tenantId, t.positionId),
    index("idx_job_requisitions_department").on(t.tenantId, t.departmentId),
    index("idx_job_requisitions_type").on(t.tenantId, t.requisitionType),
    index("idx_job_requisitions_status").on(t.tenantId, t.status),
    index("idx_job_requisitions_manager").on(t.tenantId, t.hiringManagerId),
    uniqueIndex("uq_job_requisitions_code")
      .on(t.tenantId, sql`lower(${t.requisitionCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_job_requisitions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_job_requisitions_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_job_requisitions_headcount",
      sql`${t.headcount} >= 1`
    ),
    check(
      "chk_job_requisitions_salary_range",
      sql`${t.minSalary} IS NULL OR ${t.maxSalary} IS NULL OR ${t.minSalary} <= ${t.maxSalary}`
    ),
  ]
);

export const JobRequisitionIdSchema = z.number().int().brand<"JobRequisitionId">();
export type JobRequisitionId = z.infer<typeof JobRequisitionIdSchema>;

export const jobRequisitionSelectSchema = createSelectSchema(jobRequisitions);

export const jobRequisitionInsertSchema = createInsertSchema(jobRequisitions, {
  requisitionCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  title: z.string().min(1).max(200),
  headcount: z.number().int().min(1).max(100),
  minSalary: z.string().optional(),
  maxSalary: z.string().optional(),
  jobDescription: z.string().max(10000).optional(),
  requirements: z.string().max(5000).optional(),
});

export const jobRequisitionUpdateSchema = createUpdateSchema(jobRequisitions);

export type JobRequisition = typeof jobRequisitions.$inferSelect;
export type NewJobRequisition = typeof jobRequisitions.$inferInsert;
