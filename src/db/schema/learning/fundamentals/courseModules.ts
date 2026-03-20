import { integer, text, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { courses } from "./courses";

/**
 * Course Modules - Lessons inside courses.
 */
export const moduleStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const moduleStatusEnum = learningSchema.enum("module_status", [...moduleStatuses]);

export const moduleStatusZodEnum = createSelectSchema(moduleStatusEnum);

export const courseModules = learningSchema.table(
  "course_modules",
  {
    moduleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    courseId: integer().notNull(),
    moduleCode: text().notNull(),
    ...nameColumn,
    description: text(),
    sequenceNumber: smallint().notNull(),
    durationMinutes: smallint(),
    contentUrl: text(),
    status: moduleStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_course_modules_course").on(t.courseId),
    index("idx_course_modules_sequence").on(t.courseId, t.sequenceNumber),
    index("idx_course_modules_status").on(t.status),
    uniqueIndex("uq_course_modules_code")
      .on(t.courseId, sql`lower(${t.moduleCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_course_modules_sequence")
      .on(t.courseId, t.sequenceNumber)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.courseId],
      foreignColumns: [courses.courseId],
      name: "fk_course_modules_course",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_course_modules_sequence",
      sql`${t.sequenceNumber} >= 1`
    ),
    check(
      "chk_course_modules_duration",
      sql`${t.durationMinutes} IS NULL OR ${t.durationMinutes} > 0`
    ),
  ]
);

export const CourseModuleIdSchema = z.number().int().brand<"CourseModuleId">();
export type CourseModuleId = z.infer<typeof CourseModuleIdSchema>;

export const courseModuleSelectSchema = createSelectSchema(courseModules);

export const courseModuleInsertSchema = createInsertSchema(courseModules, {
  moduleCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sequenceNumber: z.number().int().min(1).max(100),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  contentUrl: z.string().url().max(500).optional(),
});

export const courseModuleUpdateSchema = createUpdateSchema(courseModules);

export type CourseModule = typeof courseModules.$inferSelect;
export type NewCourseModule = typeof courseModules.$inferInsert;
