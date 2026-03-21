import { integer, text, smallint, boolean, index, uniqueIndex, foreignKey, check, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { offboardingChecklists } from "./offboardingChecklists";

/**
 * Departure / exit interviews for employees leaving the organization.
 * Every row must reference exactly one `offboarding_checklists` row (`linkedOffboardingChecklistId` — FK + NOT NULL).
 *
 * **DB enforcement (CSQL-015):** `trg_exit_interviews_linked_checklist` requires active row, `taskCategory = EXIT_INTERVIEW`, and matching `tenantId` / `employeeId`. `trg_offboarding_checklists_exit_interview_guard` blocks soft-delete or drifting category/tenant/employee while an active `exit_interviews` row references the checklist.
 * For application-layer creates, use `createExitInterview` in `src/db/_services/recruitment/exitInterviewsService.ts` (validates linked checklist before insert; aligns with CSQL-015).
 *
 * **Scheduling reads:** `idx_exit_interviews_scheduled` supports `WHERE tenantId AND … ORDER BY scheduledAt`.
 *
 * **Uniqueness:** at most one non-deleted exit interview per tenant + linked checklist (`uq_exit_interviews_tenant_linked_checklist_active`).
 *
 * Circular FK note: `employeeId` and `conductedByEmployeeId` → `hr.employees` via custom SQL if used — validate at the app layer when wiring HR.
 *
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const exitInterviewFormats = ["IN_PERSON", "VIDEO", "PHONE", "OTHER"] as const;

export const exitInterviewFormatEnum = recruitmentSchema.enum("exit_interview_format", [...exitInterviewFormats]);

export const ExitInterviewFormatSchema = z.enum(exitInterviewFormats);
export type ExitInterviewFormat = z.infer<typeof ExitInterviewFormatSchema>;

export const exitInterviewStatuses = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const exitInterviewStatusEnum = recruitmentSchema.enum("exit_interview_status", [...exitInterviewStatuses]);

export const ExitInterviewStatusSchema = z.enum(exitInterviewStatuses);
export type ExitInterviewStatus = z.infer<typeof ExitInterviewStatusSchema>;

export const exitInterviews = recruitmentSchema.table(
  "exit_interviews",
  {
    exitInterviewId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    /** HR / manager conducting the conversation (optional until assigned). */
    conductedByEmployeeId: integer(),
    /** Required: the `EXIT_INTERVIEW` offboarding checklist row this record fulfills (1:1 while active). */
    linkedOffboardingChecklistId: integer().notNull(),
    format: exitInterviewFormatEnum(),
    scheduledAt: timestamp({ withTimezone: true }),
    conductedAt: timestamp({ withTimezone: true }),
    durationMinutes: smallint(),
    status: exitInterviewStatusEnum().notNull().default("SCHEDULED"),
    keyThemes: text(),
    summaryNotes: text(),
    concernsRaised: text(),
    /** Null = not recorded; use for eligibility / talent pipeline discussions. */
    wouldRehire: boolean(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_exit_interviews_tenant").on(t.tenantId),
    index("idx_exit_interviews_tenant_op_date").on(t.tenantId, t.status, t.scheduledAt),
    index("idx_exit_interviews_employee").on(t.tenantId, t.employeeId),
    index("idx_exit_interviews_conductor").on(t.tenantId, t.conductedByEmployeeId),
    index("idx_exit_interviews_status").on(t.tenantId, t.status),
    /** Tenant + scheduled time (listings, calendars). */
    index("idx_exit_interviews_scheduled").on(t.tenantId, t.scheduledAt),
    index("idx_exit_interviews_linked_checklist").on(t.tenantId, t.linkedOffboardingChecklistId),
    uniqueIndex("uq_exit_interviews_tenant_linked_checklist_active")
      .on(t.tenantId, t.linkedOffboardingChecklistId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_exit_interviews_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.linkedOffboardingChecklistId],
      foreignColumns: [offboardingChecklists.offboardingChecklistId],
      name: "fk_exit_interviews_offboarding_checklist",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_exit_interviews_duration", sql`${t.durationMinutes} IS NULL OR ${t.durationMinutes} > 0`),
    check(
      "chk_exit_interviews_completed_timing",
      sql`${t.status} <> 'COMPLETED' OR ${t.conductedAt} IS NOT NULL`
    ),
  ]
);

export const ExitInterviewIdSchema = z.number().int().brand<"ExitInterviewId">();
export type ExitInterviewId = z.infer<typeof ExitInterviewIdSchema>;

export const exitInterviewSelectSchema = createSelectSchema(exitInterviews);

function refineExitInterviewCompletedTimingInsert(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  if (data.status !== "COMPLETED") return;
  const ca = data.conductedAt;
  if (ca === undefined || ca === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "conductedAt must be set when status is COMPLETED",
      path: ["conductedAt"],
    });
  }
}

export const exitInterviewInsertSchema = createInsertSchema(exitInterviews, {
  format: ExitInterviewFormatSchema.optional().nullable(),
  /** Omit to use DB default `SCHEDULED`. */
  status: ExitInterviewStatusSchema.optional(),
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  conductedByEmployeeId: z.number().int().positive().optional(),
  linkedOffboardingChecklistId: z.number().int().positive(),
  keyThemes: z.string().max(4000).optional(),
  summaryNotes: z.string().max(8000).optional(),
  concernsRaised: z.string().max(4000).optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
}).superRefine((row, ctx) => refineExitInterviewCompletedTimingInsert(row as Record<string, unknown>, ctx));

export const exitInterviewUpdateSchema = createUpdateSchema(exitInterviews, {
  format: ExitInterviewFormatSchema.optional().nullable(),
  status: ExitInterviewStatusSchema.optional(),
  tenantId: z.number().int().positive().optional(),
  employeeId: z.number().int().positive().optional(),
  conductedByEmployeeId: z.number().int().positive().optional().nullable(),
  linkedOffboardingChecklistId: z.number().int().positive().optional(),
  keyThemes: z.string().max(4000).optional().nullable(),
  summaryNotes: z.string().max(8000).optional().nullable(),
  concernsRaised: z.string().max(4000).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(480).optional().nullable(),
}).superRefine((row, ctx) => {
  const data = row as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(data, "status") || data.status !== "COMPLETED") return;
  if (!Object.prototype.hasOwnProperty.call(data, "conductedAt") || data.conductedAt == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "conductedAt must be set in the same update when status is COMPLETED",
      path: ["conductedAt"],
    });
  }
});

export type ExitInterview = typeof exitInterviews.$inferSelect;
export type NewExitInterview = typeof exitInterviews.$inferInsert;
