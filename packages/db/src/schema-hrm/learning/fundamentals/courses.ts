import {
  integer,
  text,
  smallint,
  numeric,
  boolean,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  catalogCodeInputSchema,
  courseCostStringSchema,
  courseDescriptionSchema,
  courseDurationHoursSchema,
  courseMaxParticipantsSchema,
  isValidCourseCostString,
  learningBounds,
  longTextSchema,
  nameSchema,
  nullableOptional,
  refineCurrencyIdWhenCourseCostSet,
  refineRequiresCapacityForClassroom,
  refineRequiresDurationForInstructorLed,
  refineRequiresObjectivesIfActive,
  refineRequiresPrerequisitesIfMandatory,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Courses - Training programs master data.
 */
export const courseFormats = [
  "CLASSROOM",
  "ONLINE",
  "BLENDED",
  "SELF_PACED",
  "WORKSHOP",
  "WEBINAR",
  "ON_THE_JOB",
] as const;

export const courseFormatEnum = learningSchema.enum("course_format", [...courseFormats]);

/** Zod: explicit enum; keep aligned with `courseFormats` / Postgres. */
export const courseFormatZodEnum = z.enum(courseFormats);

export const courseStatuses = ["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"] as const;

export const courseStatusEnum = learningSchema.enum("course_status", [...courseStatuses]);

export const courseStatusZodEnum = z.enum(courseStatuses);

export { isValidCourseCostString };

/** Matches `courses.format` Drizzle default — used for insert-time format refinements when `format` is omitted. */
const COURSE_TABLE_DEFAULT_FORMAT = "CLASSROOM" as const;

export const courses = learningSchema.table(
  "courses",
  {
    courseId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    courseCode: text().notNull(),
    ...nameColumn,
    description: text(),
    format: courseFormatEnum().notNull().default("CLASSROOM"),
    durationHours: smallint(),
    maxParticipants: smallint(),
    cost: numeric({ precision: 10, scale: 2 }),
    currencyId: integer(),
    isMandatory: boolean().notNull().default(false),
    prerequisites: text(),
    objectives: text(),
    status: courseStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_courses_tenant").on(t.tenantId),
    index("idx_courses_format").on(t.tenantId, t.format),
    index("idx_courses_status").on(t.tenantId, t.status),
    index("idx_courses_created").on(t.tenantId, t.createdAt),
    index("idx_courses_mandatory").on(t.tenantId, t.isMandatory),
    uniqueIndex("uq_courses_code")
      .on(t.tenantId, sql`lower(${t.courseCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_courses_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_courses_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    /* Keep in sync with `learningBounds` in `_zodShared.ts`. */
    check(
      "chk_courses_duration",
      sql`${t.durationHours} IS NULL OR (${t.durationHours} >= ${learningBounds.courseDurationHours.min} AND ${t.durationHours} <= ${learningBounds.courseDurationHours.max})`
    ),
    check(
      "chk_courses_max_participants",
      sql`${t.maxParticipants} IS NULL OR (${t.maxParticipants} >= ${learningBounds.courseMaxParticipants.min} AND ${t.maxParticipants} <= ${learningBounds.courseMaxParticipants.max})`
    ),
    check(
      "chk_courses_cost",
      sql`${t.cost} IS NULL OR (${t.cost} >= 0 AND ${t.cost} <= ${learningBounds.courseCostMax} AND ${t.currencyId} IS NOT NULL)`
    ),
  ]
);

export const CourseIdSchema = z.number().int().brand<"CourseId">();
export type CourseId = z.infer<typeof CourseIdSchema>;

/** Read model: trust DB + catalog `CHECK`s; use insert/update for normalized writes. */
export const courseSelectSchema = createSelectSchema(courses);

export const courseInsertSchema = createInsertSchema(courses, {
  courseCode: catalogCodeInputSchema,
  name: nameSchema,
  description: courseDescriptionSchema.optional(),
  durationHours: courseDurationHoursSchema.optional(),
  maxParticipants: courseMaxParticipantsSchema.optional(),
  cost: courseCostStringSchema.optional(),
  prerequisites: longTextSchema.optional(),
  objectives: longTextSchema.optional(),
  format: courseFormatZodEnum.optional(),
  status: courseStatusZodEnum.optional(),
})
  .superRefine(refineCurrencyIdWhenCourseCostSet)
  .superRefine(refineRequiresObjectivesIfActive)
  .superRefine(refineRequiresPrerequisitesIfMandatory)
  .superRefine((d, c) =>
    refineRequiresDurationForInstructorLed(d, c, {
      applyDefaultFormat: COURSE_TABLE_DEFAULT_FORMAT,
    })
  )
  .superRefine((d, c) =>
    refineRequiresCapacityForClassroom(d, c, { applyDefaultFormat: COURSE_TABLE_DEFAULT_FORMAT })
  );

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const courseUpdateSchema = createUpdateSchema(courses, {
  courseCode: catalogCodeInputSchema.optional(),
  name: nameSchema.optional(),
  description: nullableOptional(courseDescriptionSchema),
  durationHours: nullableOptional(courseDurationHoursSchema),
  maxParticipants: nullableOptional(courseMaxParticipantsSchema),
  cost: nullableOptional(courseCostStringSchema),
  prerequisites: nullableOptional(longTextSchema),
  objectives: nullableOptional(longTextSchema),
  format: courseFormatZodEnum.optional(),
  status: courseStatusZodEnum.optional(),
})
  .superRefine(refineCurrencyIdWhenCourseCostSet)
  .superRefine(refineRequiresObjectivesIfActive)
  .superRefine(refineRequiresPrerequisitesIfMandatory)
  .superRefine((d, c) => refineRequiresDurationForInstructorLed(d, c))
  .superRefine((d, c) => refineRequiresCapacityForClassroom(d, c));

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
