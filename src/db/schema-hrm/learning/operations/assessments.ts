import { integer, text, date, smallint, timestamp, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  assessmentActualScoreOptionalSchema,
  assessmentActualScoreSchema,
  assessmentAttemptsBaseSchema,
  assessmentAttemptsSchema,
  assessmentMaxScoreSchema,
  assessmentPassingScoreSchema,
  dateStringSchema,
  longTextSchema,
  nullableOptional,
  refineAssessmentPassingVsMaxScore,
  timestamptzNullableOptionalSchema,
  timestamptzOptionalSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { courses } from "../fundamentals/courses";

/**
 * Assessments - Exams or skill tests for courses.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const assessmentTypes = ["QUIZ", "EXAM", "PRACTICAL", "PROJECT", "PRESENTATION", "CERTIFICATION_EXAM"] as const;

export const assessmentTypeEnum = learningSchema.enum("assessment_type", [...assessmentTypes]);

export const assessmentTypeZodEnum = z.enum(assessmentTypes);

export const assessmentStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "GRADED", "CANCELLED"] as const;

export const assessmentStatusEnum = learningSchema.enum("assessment_status", [...assessmentStatuses]);

export const assessmentStatusZodEnum = z.enum(assessmentStatuses);

export const assessments = learningSchema.table(
  "assessments",
  {
    assessmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    courseId: integer().notNull(),
    employeeId: integer().notNull(),
    assessmentType: assessmentTypeEnum().notNull(),
    assessmentDate: date().notNull(),
    startTime: timestamp({ withTimezone: true }),
    endTime: timestamp({ withTimezone: true }),
    maxScore: smallint().notNull().default(100),
    passingScore: smallint().notNull().default(60),
    actualScore: smallint(),
    passed: integer(),
    attempts: smallint().default(1),
    notes: text(),
    status: assessmentStatusEnum().notNull().default("SCHEDULED"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_assessments_tenant").on(t.tenantId),
    index("idx_assessments_course").on(t.tenantId, t.courseId),
    index("idx_assessments_employee").on(t.tenantId, t.employeeId),
    index("idx_assessments_type").on(t.tenantId, t.assessmentType),
    index("idx_assessments_date").on(t.tenantId, t.assessmentDate),
    index("idx_assessments_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_assessments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.courseId],
      foreignColumns: [courses.courseId],
      name: "fk_assessments_course",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_assessments_max_score",
      sql`${t.maxScore} > 0`
    ),
    check(
      "chk_assessments_passing_score",
      sql`${t.passingScore} > 0 AND ${t.passingScore} <= ${t.maxScore}`
    ),
    check(
      "chk_assessments_actual_score",
      sql`${t.actualScore} IS NULL OR (${t.actualScore} >= 0 AND ${t.actualScore} <= ${t.maxScore})`
    ),
    check(
      "chk_assessments_attempts",
      sql`${t.attempts} IS NULL OR ${t.attempts} >= 1`
    ),
  ]
);

export const AssessmentIdSchema = z.number().int().brand<"AssessmentId">();
export type AssessmentId = z.infer<typeof AssessmentIdSchema>;

/** Read model: trust DB + score `CHECK`s; use insert/update for write rules. */
export const assessmentSelectSchema = createSelectSchema(assessments);

export const assessmentInsertSchema = createInsertSchema(assessments, {
  assessmentType: assessmentTypeZodEnum,
  assessmentDate: dateStringSchema,
  startTime: timestamptzOptionalSchema,
  endTime: timestamptzOptionalSchema,
  maxScore: assessmentMaxScoreSchema.optional(),
  passingScore: assessmentPassingScoreSchema.optional(),
  actualScore: assessmentActualScoreOptionalSchema,
  attempts: assessmentAttemptsSchema,
  notes: longTextSchema.optional(),
  status: assessmentStatusZodEnum.optional(),
})
  .superRefine(refineAssessmentPassingVsMaxScore);

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const assessmentUpdateSchema = createUpdateSchema(assessments, {
  assessmentType: assessmentTypeZodEnum.optional(),
  assessmentDate: dateStringSchema.optional(),
  startTime: timestamptzNullableOptionalSchema,
  endTime: timestamptzNullableOptionalSchema,
  maxScore: assessmentMaxScoreSchema.optional(),
  passingScore: assessmentPassingScoreSchema.optional(),
  actualScore: nullableOptional(assessmentActualScoreSchema),
  attempts: nullableOptional(assessmentAttemptsBaseSchema),
  notes: nullableOptional(longTextSchema),
  status: assessmentStatusZodEnum.optional(),
  passed: nullableOptional(z.number().int()),
})
  .superRefine(refineAssessmentPassingVsMaxScore);

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
