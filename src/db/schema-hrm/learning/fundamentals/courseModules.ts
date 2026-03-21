import { integer, text, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  catalogCodeInputSchema,
  contentUrlSchema,
  learningBounds,
  longTextSchema,
  moduleDurationMinutesSchema,
  nameSchema,
  nullableOptional,
  orderedSequenceNumberSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { courses } from "./courses";

/**
 * Course Modules - Lessons inside courses.
 */
export const moduleStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const moduleStatusEnum = learningSchema.enum("module_status", [...moduleStatuses]);

/** Zod status: decoupled from `createSelectSchema(enum)`; values stay aligned with `moduleStatuses` / Postgres enum. */
export const moduleStatusZodEnum = z.enum(moduleStatuses);

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
    /* Keep in sync with `learningBounds` in `_zodShared.ts`. */
    check(
      "chk_course_modules_sequence",
      sql`${t.sequenceNumber} >= ${learningBounds.orderedSequence.min} AND ${t.sequenceNumber} <= ${learningBounds.orderedSequence.max}`
    ),
    check(
      "chk_course_modules_duration",
      sql`${t.durationMinutes} IS NULL OR (${t.durationMinutes} >= ${learningBounds.moduleDurationMinutes.min} AND ${t.durationMinutes} <= ${learningBounds.moduleDurationMinutes.max})`
    ),
  ]
);

export const CourseModuleIdSchema = z.number().int().brand<"CourseModuleId">();
export type CourseModuleId = z.infer<typeof CourseModuleIdSchema>;

/** Read model: trust DB + CHECK constraints; use insert/update for normalized writes. */
export const courseModuleSelectSchema = createSelectSchema(courseModules);

export const courseModuleInsertSchema = createInsertSchema(courseModules, {
  moduleCode: catalogCodeInputSchema,
  name: nameSchema,
  description: longTextSchema.optional(),
  sequenceNumber: orderedSequenceNumberSchema,
  durationMinutes: moduleDurationMinutesSchema.optional(),
  contentUrl: contentUrlSchema.optional(),
  status: moduleStatusZodEnum.optional(),
});

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const courseModuleUpdateSchema = createUpdateSchema(courseModules, {
  moduleCode: catalogCodeInputSchema.optional(),
  name: nameSchema.optional(),
  description: nullableOptional(longTextSchema),
  sequenceNumber: orderedSequenceNumberSchema.optional(),
  durationMinutes: nullableOptional(moduleDurationMinutesSchema),
  contentUrl: nullableOptional(contentUrlSchema),
  status: moduleStatusZodEnum.optional(),
});

export type CourseModule = typeof courseModules.$inferSelect;
export type NewCourseModule = typeof courseModules.$inferInsert;
