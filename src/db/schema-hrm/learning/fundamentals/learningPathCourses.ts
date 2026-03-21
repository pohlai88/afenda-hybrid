import { integer, smallint, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { learningBounds, orderedSequenceNumberSchema } from "../_zodShared";
import { timestampColumns, softDeleteColumns } from "../../../_shared";
import { learningPaths } from "./learningPaths";
import { courses } from "./courses";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Learning Path Courses - Path to course junction with sequence.
 * No `auditColumns`: lightweight link table; path and course parents carry attribution where needed.
 */
export const learningPathCourses = learningSchema.table(
  "learning_path_courses",
  {
    pathCourseId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    learningPathId: integer().notNull(),
    courseId: integer().notNull(),
    sequenceNumber: smallint().notNull(),
    isRequired: boolean().notNull().default(true),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    index("idx_learning_path_courses_tenant").on(t.tenantId),
    index("idx_learning_path_courses_path").on(t.tenantId, t.learningPathId),
    index("idx_learning_path_courses_course").on(t.tenantId, t.courseId),
    index("idx_learning_path_courses_sequence").on(t.tenantId, t.learningPathId, t.sequenceNumber),
    uniqueIndex("uq_learning_path_courses_path_course")
      .on(t.tenantId, t.learningPathId, t.courseId)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_learning_path_courses_sequence")
      .on(t.tenantId, t.learningPathId, t.sequenceNumber)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_learning_path_courses_tenant",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.learningPathId],
      foreignColumns: [learningPaths.learningPathId],
      name: "fk_learning_path_courses_path",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.courseId],
      foreignColumns: [courses.courseId],
      name: "fk_learning_path_courses_course",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    /* Keep in sync with `learningBounds.orderedSequence` in `_zodShared.ts`. */
    check(
      "chk_learning_path_courses_sequence",
      sql`${t.sequenceNumber} >= ${learningBounds.orderedSequence.min} AND ${t.sequenceNumber} <= ${learningBounds.orderedSequence.max}`
    ),
  ]
);

export const LearningPathCourseIdSchema = z.number().int().brand<"LearningPathCourseId">();
export type LearningPathCourseId = z.infer<typeof LearningPathCourseIdSchema>;

/** Read model: trust DB + CHECK constraints; use insert/update for write rules. */
export const learningPathCourseSelectSchema = createSelectSchema(learningPathCourses);

export const learningPathCourseInsertSchema = createInsertSchema(learningPathCourses, {
  sequenceNumber: orderedSequenceNumberSchema,
  isRequired: z.boolean().optional(),
});

/**
 * Patch semantics: `.optional()` only — omit a field to leave the DB value unchanged.
 */
export const learningPathCourseUpdateSchema = createUpdateSchema(learningPathCourses, {
  sequenceNumber: orderedSequenceNumberSchema.optional(),
  isRequired: z.boolean().optional(),
});

export type LearningPathCourse = typeof learningPathCourses.$inferSelect;
export type NewLearningPathCourse = typeof learningPathCourses.$inferInsert;
