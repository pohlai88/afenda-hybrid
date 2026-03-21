import { integer, text, date, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { candidates } from "../fundamentals/candidates";
import { jobRequisitions } from "./jobRequisitions";

/**
 * Per-requisition application (`recruitment.applications`).
 *
 * **Grain:** One row per (`tenantId`, `candidateId`, `requisitionId`) for active rows — partial unique
 * `uq_applications_candidate_requisition` (with `deletedAt IS NULL`). Reapply or interest in another
 * opening = **new row**, same `candidateId`, different `requisitionId`. Do **not** create a second
 * `candidates` profile row for reapply.
 *
 * **Dual status:** `applications.status` is the **per-requisition** pipeline (submitted → hired/rejected, etc.).
 * `candidates.status` on the profile is the broader talent-pool / global lifecycle. For funnel and
 * time-in-stage metrics, prefer this table (and downstream interviews/offers) over `candidates.status` alone.
 *
 * **Tenancy:** `tenantId` should match the referenced `candidates` row and `job_requisitions` row — PostgreSQL
 * does not enforce that equality; validate in the service layer before insert/update.
 *
 * **Concurrent creates:** two parallel inserts for the same active `(tenantId, candidateId, requisitionId)`
 * race on `uq_applications_candidate_requisition`; one succeeds, one returns **`23505`**. Handle with retry,
 * advisory lock, or `INSERT ... ON CONFLICT` where the partial unique index is the arbiter.
 *
 * @see docs/recruitment-candidate-databank.md
 *
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const applicationStatuses = ["SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEWING", "OFFER_PENDING", "OFFER_EXTENDED", "HIRED", "REJECTED", "WITHDRAWN"] as const;

export const applicationStatusEnum = recruitmentSchema.enum("application_status", [...applicationStatuses]);

/** Single source of truth with `applicationStatuses` for insert/update validation. */
export const ApplicationStatusSchema = z.enum(applicationStatuses);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const applications = recruitmentSchema.table(
  "applications",
  {
    applicationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    candidateId: integer().notNull(),
    requisitionId: integer().notNull(),
    applicationDate: date().notNull(),
    coverLetter: text(),
    resumeVersion: text(),
    status: applicationStatusEnum().notNull().default("SUBMITTED"),
    rejectionReason: text(),
    withdrawalReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_applications_tenant").on(t.tenantId),
    index("idx_applications_candidate").on(t.tenantId, t.candidateId),
    index("idx_applications_requisition").on(t.tenantId, t.requisitionId),
    index("idx_applications_status").on(t.tenantId, t.status),
    index("idx_applications_date").on(t.tenantId, t.applicationDate),
    /** Lists per candidate by recency: `WHERE tenantId AND candidateId ORDER BY applicationDate DESC`. */
    index("idx_applications_tenant_candidate_date").on(t.tenantId, t.candidateId, t.applicationDate),
    uniqueIndex("uq_applications_candidate_requisition")
      .on(t.tenantId, t.candidateId, t.requisitionId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_applications_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.candidateId],
      foreignColumns: [candidates.candidateId],
      name: "fk_applications_candidate",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.requisitionId],
      foreignColumns: [jobRequisitions.requisitionId],
      name: "fk_applications_requisition",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const ApplicationIdSchema = z.number().int().brand<"ApplicationId">();
export type ApplicationId = z.infer<typeof ApplicationIdSchema>;

export const applicationSelectSchema = createSelectSchema(applications);

function refineApplicationIdFieldsOnUpdate(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  const ids = ["tenantId", "candidateId", "requisitionId"] as const;
  for (const key of ids) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const v = data[key];
    if (v === undefined) continue;
    if (v === null || typeof v !== "number" || !Number.isInteger(v) || v <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must be a positive integer`,
        path: [key],
      });
    }
  }
}

export const applicationInsertSchema = createInsertSchema(applications, {
  /** Omit to use DB default `SUBMITTED`. */
  status: ApplicationStatusSchema.optional(),
  tenantId: z.number().int().positive(),
  candidateId: z.number().int().positive(),
  requisitionId: z.number().int().positive(),
  coverLetter: z.string().max(10000).optional(),
  resumeVersion: z.string().max(500).optional(),
  rejectionReason: z.string().max(1000).optional(),
  withdrawalReason: z.string().max(1000).optional(),
});

export const applicationUpdateSchema = createUpdateSchema(applications, {
  status: ApplicationStatusSchema.optional(),
  tenantId: z.number().int().positive().optional(),
  candidateId: z.number().int().positive().optional(),
  requisitionId: z.number().int().positive().optional(),
  coverLetter: z.string().max(10000).optional(),
  resumeVersion: z.string().max(500).optional(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  withdrawalReason: z.string().max(1000).optional().nullable(),
}).superRefine((row, ctx) => refineApplicationIdFieldsOnUpdate(row as Record<string, unknown>, ctx));

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
