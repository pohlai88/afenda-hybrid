import { integer, smallint, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns } from "../../_shared";
import { learningPaths } from "./learningPaths";
import { courses } from "./courses";

/**
 * Learning Path Courses - Path to course junction with sequence.
 */
export const learningPathCourses = learningSchema.table(
  "learning_path_courses",
  {
    pathCourseId: integer().primaryKey().generatedAlwaysAsIdentity(),
    learningPathId: integer().notNull(),
    courseId: integer().notNull(),
    sequenceNumber: smallint().notNull(),
    isRequired: boolean().notNull().default(true),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    index("idx_learning_path_courses_path").on(t.learningPathId),
    index("idx_learning_path_courses_course").on(t.courseId),
    index("idx_learning_path_courses_sequence").on(t.learningPathId, t.sequenceNumber),
    uniqueIndex("uq_learning_path_courses_path_course")
      .on(t.learningPathId, t.courseId)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_learning_path_courses_sequence")
      .on(t.learningPathId, t.sequenceNumber)
      .where(sql`${t.deletedAt} IS NULL`),
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
    check(
      "chk_learning_path_courses_sequence",
      sql`${t.sequenceNumber} >= 1`
    ),
  ]
);

export const LearningPathCourseIdSchema = z.number().int().brand<"LearningPathCourseId">();
export type LearningPathCourseId = z.infer<typeof LearningPathCourseIdSchema>;

export const learningPathCourseSelectSchema = createSelectSchema(learningPathCourses);

export const learningPathCourseInsertSchema = createInsertSchema(learningPathCourses, {
  sequenceNumber: z.number().int().min(1).max(100),
});

export const learningPathCourseUpdateSchema = createUpdateSchema(learningPathCourses);

export type LearningPathCourse = typeof learningPathCourses.$inferSelect;
export type NewLearningPathCourse = typeof learningPathCourses.$inferInsert;
