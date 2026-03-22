import { integer, text, date, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Probation Evaluations - Initial employment review during probation period.
 * Circular FK note: employeeId and evaluatorId FKs added via custom SQL.
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 *
 * **Lifecycle (Zod, insert/update):** `outcome === "EXTEND"` requires **`extensionDays`** (1–180).
 * Non-null **`extensionDays`** is only allowed when **`outcome` is `EXTEND`**. For partial updates, changing
 * `outcome` away from `EXTEND` must include **`extensionDays: null`** if clearing a prior extension.
 */
export const evaluationStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const evaluationStatusEnum = recruitmentSchema.enum("evaluation_status", [
  ...evaluationStatuses,
]);

/** Stricter than `createSelectSchema(enum)` for inserts/updates — single source of truth with `evaluationStatuses`. */
export const EvaluationStatusSchema = z.enum(evaluationStatuses);
export type EvaluationStatus = z.infer<typeof EvaluationStatusSchema>;

export const evaluationOutcomes = ["PASS", "EXTEND", "FAIL", "PENDING"] as const;

export const evaluationOutcomeEnum = recruitmentSchema.enum("evaluation_outcome", [
  ...evaluationOutcomes,
]);

/** Stricter than `createSelectSchema(enum)` for inserts/updates — single source of truth with `evaluationOutcomes`. */
export const EvaluationOutcomeSchema = z.enum(evaluationOutcomes);
export type EvaluationOutcome = z.infer<typeof EvaluationOutcomeSchema>;

export const probationEvaluations = recruitmentSchema.table(
  "probation_evaluations",
  {
    evaluationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    evaluatorId: integer().notNull(),
    evaluationDate: date().notNull(),
    evaluationPeriodStart: date().notNull(),
    evaluationPeriodEnd: date().notNull(),
    performanceRating: smallint(),
    attendanceRating: smallint(),
    attitudeRating: smallint(),
    overallRating: smallint(),
    strengths: text(),
    areasForImprovement: text(),
    recommendations: text(),
    outcome: evaluationOutcomeEnum(),
    extensionDays: smallint(),
    status: evaluationStatusEnum().notNull().default("SCHEDULED"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_probation_evaluations_tenant").on(t.tenantId),
    index("idx_probation_evaluations_employee").on(t.tenantId, t.employeeId),
    index("idx_probation_evaluations_evaluator").on(t.tenantId, t.evaluatorId),
    index("idx_probation_evaluations_status").on(t.tenantId, t.status),
    index("idx_probation_evaluations_outcome").on(t.tenantId, t.outcome),
    index("idx_probation_evaluations_date").on(t.tenantId, t.evaluationDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_probation_evaluations_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_probation_evaluations_period",
      sql`${t.evaluationPeriodEnd} >= ${t.evaluationPeriodStart}`
    ),
    check(
      "chk_probation_evaluations_ratings",
      sql`(${t.performanceRating} IS NULL OR (${t.performanceRating} >= 1 AND ${t.performanceRating} <= 5)) AND
          (${t.attendanceRating} IS NULL OR (${t.attendanceRating} >= 1 AND ${t.attendanceRating} <= 5)) AND
          (${t.attitudeRating} IS NULL OR (${t.attitudeRating} >= 1 AND ${t.attitudeRating} <= 5)) AND
          (${t.overallRating} IS NULL OR (${t.overallRating} >= 1 AND ${t.overallRating} <= 5))`
    ),
    check(
      "chk_probation_evaluations_extension",
      sql`${t.extensionDays} IS NULL OR ${t.extensionDays} > 0`
    ),
  ]
);

export const ProbationEvaluationIdSchema = z.number().int().brand<"ProbationEvaluationId">();
export type ProbationEvaluationId = z.infer<typeof ProbationEvaluationIdSchema>;

export const probationEvaluationSelectSchema = createSelectSchema(probationEvaluations);

function refineProbationLifecycleInsert(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  const outcome = data.outcome;
  const ext = data.extensionDays;

  if (outcome === "EXTEND") {
    if (ext == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "extensionDays is required when outcome is EXTEND",
        path: ["extensionDays"],
      });
    }
  }

  if (ext != null && outcome !== "EXTEND") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "extensionDays may only be set when outcome is EXTEND",
      path: ["extensionDays"],
    });
  }
}

function refineProbationLifecycleUpdate(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  const hasOutcome = Object.prototype.hasOwnProperty.call(data, "outcome");
  const hasExt = Object.prototype.hasOwnProperty.call(data, "extensionDays");

  if (!hasOutcome && !hasExt) return;

  if (hasOutcome) {
    if (data.outcome === "EXTEND") {
      if (!hasExt || data.extensionDays == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "extensionDays is required in the same update when outcome is EXTEND",
          path: ["extensionDays"],
        });
      }
    } else if (hasExt && data.extensionDays != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "extensionDays must be null when outcome is not EXTEND",
        path: ["extensionDays"],
      });
    }
  } else if (hasExt && data.extensionDays != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "outcome must be included as EXTEND in the same update when setting extensionDays",
      path: ["outcome"],
    });
  }
}

export const probationEvaluationInsertSchema = createInsertSchema(probationEvaluations, {
  /** Omit to use DB default `SCHEDULED`. */
  status: EvaluationStatusSchema.optional(),
  outcome: EvaluationOutcomeSchema.optional().nullable(),
  performanceRating: z.number().int().min(1).max(5).optional(),
  attendanceRating: z.number().int().min(1).max(5).optional(),
  attitudeRating: z.number().int().min(1).max(5).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  strengths: z.string().max(2000).optional(),
  areasForImprovement: z.string().max(2000).optional(),
  recommendations: z.string().max(2000).optional(),
  extensionDays: z.number().int().min(1).max(180).optional(),
}).superRefine((row, ctx) => refineProbationLifecycleInsert(row as Record<string, unknown>, ctx));

export const probationEvaluationUpdateSchema = createUpdateSchema(probationEvaluations, {
  status: EvaluationStatusSchema.optional(),
  outcome: EvaluationOutcomeSchema.optional().nullable(),
  performanceRating: z.number().int().min(1).max(5).optional().nullable(),
  attendanceRating: z.number().int().min(1).max(5).optional().nullable(),
  attitudeRating: z.number().int().min(1).max(5).optional().nullable(),
  overallRating: z.number().int().min(1).max(5).optional().nullable(),
  strengths: z.string().max(2000).optional().nullable(),
  areasForImprovement: z.string().max(2000).optional().nullable(),
  recommendations: z.string().max(2000).optional().nullable(),
  extensionDays: z.number().int().min(1).max(180).optional().nullable(),
}).superRefine((row, ctx) => refineProbationLifecycleUpdate(row as Record<string, unknown>, ctx));

export type ProbationEvaluation = typeof probationEvaluations.$inferSelect;
export type NewProbationEvaluation = typeof probationEvaluations.$inferInsert;
