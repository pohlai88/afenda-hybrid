import { integer, text, date, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Probation Evaluations - Initial employment review during probation period.
 * Circular FK note: employeeId and evaluatorId FKs added via custom SQL.
 */
export const evaluationStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const evaluationStatusEnum = recruitmentSchema.enum("evaluation_status", [...evaluationStatuses]);

export const evaluationStatusZodEnum = createSelectSchema(evaluationStatusEnum);

export const evaluationOutcomes = ["PASS", "EXTEND", "FAIL", "PENDING"] as const;

export const evaluationOutcomeEnum = recruitmentSchema.enum("evaluation_outcome", [...evaluationOutcomes]);

export const evaluationOutcomeZodEnum = createSelectSchema(evaluationOutcomeEnum);

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

export const probationEvaluationInsertSchema = createInsertSchema(probationEvaluations, {
  performanceRating: z.number().int().min(1).max(5).optional(),
  attendanceRating: z.number().int().min(1).max(5).optional(),
  attitudeRating: z.number().int().min(1).max(5).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  strengths: z.string().max(2000).optional(),
  areasForImprovement: z.string().max(2000).optional(),
  recommendations: z.string().max(2000).optional(),
  extensionDays: z.number().int().min(1).max(180).optional(),
});

export const probationEvaluationUpdateSchema = createUpdateSchema(probationEvaluations);

export type ProbationEvaluation = typeof probationEvaluations.$inferSelect;
export type NewProbationEvaluation = typeof probationEvaluations.$inferInsert;
