import { integer, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateOptionalSchema,
  nullableOptional,
  refineRequiresCompletionDateIfCompleted,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { learningPathCourses } from "../fundamentals/learningPathCourses";
import { learningPathAssignments } from "./learningPathAssignments";
import { courseEnrollments } from "./courseEnrollments";
import { trainingEnrollments } from "./trainingEnrollments";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Per-assignment progress against a row in `learning_path_courses`.
 * Ensure `pathCourseId` belongs to the same `learningPathId` as `pathAssignmentId` in application logic.
 *
 * Provenance: at most one of `courseEnrollmentId` / `trainingEnrollmentId` may be set (sessionless vs ILT completion).
 */
export const pathCourseProgressStatuses = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "WAIVED",
] as const;

export const pathCourseProgressStatusEnum = learningSchema.enum("path_course_progress_status", [
  ...pathCourseProgressStatuses,
]);

export const pathCourseProgressStatusZodEnum = z.enum(pathCourseProgressStatuses);

export const learningPathCourseProgress = learningSchema.table(
  "learning_path_course_progress",
  {
    pathCourseProgressId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    pathAssignmentId: integer().notNull(),
    pathCourseId: integer().notNull(),
    status: pathCourseProgressStatusEnum().notNull().default("NOT_STARTED"),
    completionDate: date(),
    courseEnrollmentId: integer(),
    trainingEnrollmentId: integer(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_learning_path_course_progress_tenant").on(t.tenantId),
    index("idx_learning_path_course_progress_assignment").on(t.tenantId, t.pathAssignmentId),
    index("idx_learning_path_course_progress_path_course").on(t.tenantId, t.pathCourseId),
    index("idx_learning_path_course_progress_status").on(t.tenantId, t.pathAssignmentId, t.status),
    uniqueIndex("uq_learning_path_course_progress_assignment_course")
      .on(t.tenantId, t.pathAssignmentId, t.pathCourseId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_learning_path_course_progress_tenant",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.pathAssignmentId],
      foreignColumns: [learningPathAssignments.pathAssignmentId],
      name: "fk_learning_path_course_progress_assignment",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.pathCourseId],
      foreignColumns: [learningPathCourses.pathCourseId],
      name: "fk_learning_path_course_progress_path_course",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.courseEnrollmentId],
      foreignColumns: [courseEnrollments.courseEnrollmentId],
      name: "fk_learning_path_course_progress_course_enrollment",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.trainingEnrollmentId],
      foreignColumns: [trainingEnrollments.enrollmentId],
      name: "fk_learning_path_course_progress_training_enrollment",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    check(
      "chk_learning_path_course_progress_single_provenance",
      sql`${t.courseEnrollmentId} IS NULL OR ${t.trainingEnrollmentId} IS NULL`
    ),
    check(
      "chk_learning_path_course_progress_completion_consistency",
      sql`(${t.completionDate} IS NULL OR ${t.status}::text = 'COMPLETED') AND
          (${t.status}::text != 'COMPLETED' OR ${t.completionDate} IS NOT NULL)`
    ),
  ]
);

export const PathCourseProgressIdSchema = z.number().int().brand<"PathCourseProgressId">();
export type PathCourseProgressId = z.infer<typeof PathCourseProgressIdSchema>;

/** Read model: trust DB + completion/provenance `CHECK`s; use insert/update for write rules. */
export const learningPathCourseProgressSelectSchema = createSelectSchema(
  learningPathCourseProgress
);

export const learningPathCourseProgressInsertSchema = createInsertSchema(
  learningPathCourseProgress,
  {
    completionDate: dateOptionalSchema,
    status: pathCourseProgressStatusZodEnum.optional(),
  }
).superRefine(refineRequiresCompletionDateIfCompleted);

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const learningPathCourseProgressUpdateSchema = createUpdateSchema(
  learningPathCourseProgress,
  {
    status: pathCourseProgressStatusZodEnum.optional(),
    completionDate: dateNullableOptionalSchema,
    courseEnrollmentId: nullableOptional(z.number().int()),
    trainingEnrollmentId: nullableOptional(z.number().int()),
  }
).superRefine(refineRequiresCompletionDateIfCompleted);

export type LearningPathCourseProgress = typeof learningPathCourseProgress.$inferSelect;
export type NewLearningPathCourseProgress = typeof learningPathCourseProgress.$inferInsert;
