import { integer, text, smallint, numeric, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Courses - Training programs master data.
 */
export const courseFormats = ["CLASSROOM", "ONLINE", "BLENDED", "SELF_PACED", "WORKSHOP", "WEBINAR", "ON_THE_JOB"] as const;

export const courseFormatEnum = learningSchema.enum("course_format", [...courseFormats]);

export const courseFormatZodEnum = createSelectSchema(courseFormatEnum);

export const courseStatuses = ["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"] as const;

export const courseStatusEnum = learningSchema.enum("course_status", [...courseStatuses]);

export const courseStatusZodEnum = createSelectSchema(courseStatusEnum);

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
    check(
      "chk_courses_duration",
      sql`${t.durationHours} IS NULL OR ${t.durationHours} > 0`
    ),
    check(
      "chk_courses_max_participants",
      sql`${t.maxParticipants} IS NULL OR ${t.maxParticipants} > 0`
    ),
    check(
      "chk_courses_cost",
      sql`${t.cost} IS NULL OR ${t.cost} >= 0`
    ),
  ]
);

export const CourseIdSchema = z.number().int().brand<"CourseId">();
export type CourseId = z.infer<typeof CourseIdSchema>;

export const courseSelectSchema = createSelectSchema(courses);

export const courseInsertSchema = createInsertSchema(courses, {
  courseCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  durationHours: z.number().int().min(1).max(1000).optional(),
  maxParticipants: z.number().int().min(1).max(1000).optional(),
  cost: z.string().optional(),
  prerequisites: z.string().max(2000).optional(),
  objectives: z.string().max(2000).optional(),
});

export const courseUpdateSchema = createUpdateSchema(courses);

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
