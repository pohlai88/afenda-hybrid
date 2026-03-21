import { integer, text, date, timestamp, numeric, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Job requisitions — hiring requests (`recruitment.job_requisitions`).
 *
 * **Tenant alignment:** `tenantId` must match optional `hr.departments.tenantId`, `hr.positions.tenantId`, and
 * `hr.employees.tenantId` when those FKs are populated — PostgreSQL does not enforce cross-schema tenant equality
 * for those links. Use `createJobRequisition` in `src/db/_services/recruitment/jobRequisitionsService.ts` for creates.
 *
 * **Lifecycle:** When **`status` is `APPROVED`**, **`approvedBy`** and **`approvedAt`** are required (Zod insert/update).
 *
 * **Salaries:** `minSalary` / `maxSalary` are validated as decimal strings (up to `numeric(12,2)`); if both are set,
 * `minSalary ≤ maxSalary` (Zod + DB `chk_job_requisitions_salary_range`).
 *
 * **Recency listings:** `idx_job_requisitions_tenant_created` supports `WHERE tenantId ORDER BY createdAt DESC`.
 *
 * Circular FK note: `positionId`, `departmentId`, `hiringManagerId`, `approvedBy` may be wired via custom SQL.
 *
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const requisitionTypes = ["NEW_POSITION", "REPLACEMENT", "EXPANSION", "TEMPORARY", "CONTRACTOR"] as const;

export const requisitionTypeEnum = recruitmentSchema.enum("requisition_type", [...requisitionTypes]);

export const RequisitionTypeSchema = z.enum(requisitionTypes);
export type RequisitionType = z.infer<typeof RequisitionTypeSchema>;

export const requisitionStatuses = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "OPEN", "ON_HOLD", "FILLED", "CANCELLED"] as const;

export const requisitionStatusEnum = recruitmentSchema.enum("requisition_status", [...requisitionStatuses]);

export const RequisitionStatusSchema = z.enum(requisitionStatuses);
export type RequisitionStatus = z.infer<typeof RequisitionStatusSchema>;

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
    approvedAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_job_requisitions_tenant").on(t.tenantId),
    index("idx_job_requisitions_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    /** Latest requisitions per tenant (lists, dashboards). */
    index("idx_job_requisitions_tenant_created").on(t.tenantId, t.createdAt),
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

/** Matches `numeric(12,2)` string inputs (integer part up to 10 digits). */
const salaryAmountStringSchema = z
  .string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Up to 10 digits and at most 2 decimal places");

function refineJobRequisitionSalaryAndApproval(data: Record<string, unknown>, ctx: z.RefinementCtx, mode: "insert" | "update") {
  const minRaw = data.minSalary;
  const maxRaw = data.maxSalary;
  const minStr = typeof minRaw === "string" && minRaw !== "" ? minRaw : null;
  const maxStr = typeof maxRaw === "string" && maxRaw !== "" ? maxRaw : null;
  if (minStr != null && maxStr != null && parseFloat(minStr) > parseFloat(maxStr)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "maxSalary must be greater than or equal to minSalary",
      path: ["maxSalary"],
    });
  }

  const status = data.status;
  if (status === "APPROVED") {
    if (data.approvedBy == null || data.approvedAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          mode === "update"
            ? "approvedBy and approvedAt are required in the same update when status is APPROVED"
            : "approvedBy and approvedAt are required when status is APPROVED",
        path: ["approvedBy"],
      });
    }
  }
}

function refineJobRequisitionUpdate(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  const minRaw = data.minSalary;
  const maxRaw = data.maxSalary;
  if (
    Object.prototype.hasOwnProperty.call(data, "minSalary") &&
    Object.prototype.hasOwnProperty.call(data, "maxSalary") &&
    typeof minRaw === "string" &&
    minRaw !== "" &&
    typeof maxRaw === "string" &&
    maxRaw !== "" &&
    parseFloat(minRaw) > parseFloat(maxRaw)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "maxSalary must be greater than or equal to minSalary",
      path: ["maxSalary"],
    });
  }

  if (!Object.prototype.hasOwnProperty.call(data, "status") || data.status !== "APPROVED") return;
  if (
    !Object.prototype.hasOwnProperty.call(data, "approvedBy") ||
    data.approvedBy == null ||
    !Object.prototype.hasOwnProperty.call(data, "approvedAt") ||
    data.approvedAt == null
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "approvedBy and approvedAt are required in the same update when status is APPROVED",
      path: ["approvedBy"],
    });
  }
}

export const jobRequisitionInsertSchema = createInsertSchema(jobRequisitions, {
  /** Omit to use DB default `NEW_POSITION`. */
  requisitionType: RequisitionTypeSchema.optional(),
  /** Omit to use DB default `DRAFT`. */
  status: RequisitionStatusSchema.optional(),
  tenantId: z.number().int().positive(),
  requisitionCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  title: z.string().min(1).max(200),
  headcount: z.number().int().min(1).max(100),
  departmentId: z.number().int().positive().optional(),
  positionId: z.number().int().positive().optional(),
  hiringManagerId: z.number().int().positive().optional(),
  currencyId: z.number().int().positive().optional(),
  approvedBy: z.number().int().positive().optional(),
  minSalary: z.union([salaryAmountStringSchema, z.literal("")]).optional(),
  maxSalary: z.union([salaryAmountStringSchema, z.literal("")]).optional(),
  jobDescription: z.string().max(10000).optional(),
  requirements: z.string().max(5000).optional(),
})
  .superRefine((row, ctx) => refineJobRequisitionSalaryAndApproval(row as Record<string, unknown>, ctx, "insert"));

export const jobRequisitionUpdateSchema = createUpdateSchema(jobRequisitions, {
  requisitionType: RequisitionTypeSchema.optional(),
  status: RequisitionStatusSchema.optional(),
  tenantId: z.number().int().positive().optional(),
  requisitionCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed").optional(),
  title: z.string().min(1).max(200).optional(),
  headcount: z.number().int().min(1).max(100).optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  positionId: z.number().int().positive().optional().nullable(),
  hiringManagerId: z.number().int().positive().optional().nullable(),
  currencyId: z.number().int().positive().optional().nullable(),
  approvedBy: z.number().int().positive().optional().nullable(),
  minSalary: z.union([salaryAmountStringSchema, z.literal("")]).optional().nullable(),
  maxSalary: z.union([salaryAmountStringSchema, z.literal("")]).optional().nullable(),
  jobDescription: z.string().max(10000).optional().nullable(),
  requirements: z.string().max(5000).optional().nullable(),
}).superRefine((row, ctx) => refineJobRequisitionUpdate(row as Record<string, unknown>, ctx));

export type JobRequisition = typeof jobRequisitions.$inferSelect;
export type NewJobRequisition = typeof jobRequisitions.$inferInsert;
