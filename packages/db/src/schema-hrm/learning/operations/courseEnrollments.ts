import {
  integer,
  text,
  varchar,
  date,
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
  complianceCodeSchema,
  dateNullableOptionalSchema,
  dateOptionalSchema,
  dateStringSchema,
  longTextSchema,
  nullableOptional,
  refineCompletionDateOnOrBeforeDueBy,
  refineRequiresCompletionDateIfCompleted,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { courses } from "../fundamentals/courses";

/**
 * Course enrollments — sessionless / self-paced progress on a course (no `training_sessions` row).
 * Allowed `courses.format` must be enforced in the application layer (avoid cross-table CHECK).
 *
 * Circular FK note: `employeeId` / `assignedBy` → `hr.employees` may be added via custom SQL if desired.
 */
export const courseEnrollmentStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;

export const courseEnrollmentStatusEnum = learningSchema.enum("course_enrollment_status", [
  ...courseEnrollmentStatuses,
]);

export const courseEnrollmentStatusZodEnum = z.enum(courseEnrollmentStatuses);

export const courseEnrollments = learningSchema.table(
  "course_enrollments",
  {
    courseEnrollmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    courseId: integer().notNull(),
    employeeId: integer().notNull(),
    enrolledAt: date().notNull(),
    status: courseEnrollmentStatusEnum().notNull().default("PENDING"),
    completionDate: date(),
    dueBy: date(),
    complianceCode: varchar({ length: 100 }),
    assignedBy: integer(),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_course_enrollments_tenant").on(t.tenantId),
    index("idx_course_enrollments_course").on(t.tenantId, t.courseId),
    index("idx_course_enrollments_employee").on(t.tenantId, t.employeeId),
    index("idx_course_enrollments_status").on(t.tenantId, t.status),
    index("idx_course_enrollments_due")
      .on(t.tenantId, t.dueBy)
      .where(sql`${t.deletedAt} IS NULL AND ${t.dueBy} IS NOT NULL`),
    index("idx_course_enrollments_completed_reporting")
      .on(t.tenantId, t.completionDate)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = ${sql.raw(`'COMPLETED'::"learning"."course_enrollment_status"`)}`
      ),
    uniqueIndex("uq_course_enrollments_course_employee")
      .on(t.tenantId, t.courseId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_course_enrollments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.courseId],
      foreignColumns: [courses.courseId],
      name: "fk_course_enrollments_course",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_course_enrollments_completion_consistency",
      sql`(${t.completionDate} IS NULL OR ${t.status}::text = 'COMPLETED') AND
          (${t.status}::text != 'COMPLETED' OR ${t.completionDate} IS NOT NULL)`
    ),
  ]
);

export const CourseEnrollmentIdSchema = z.number().int().brand<"CourseEnrollmentId">();
export type CourseEnrollmentId = z.infer<typeof CourseEnrollmentIdSchema>;

/** Read model: trust DB + `chk_course_enrollments_completion_consistency`; use insert/update for write rules. */
export const courseEnrollmentSelectSchema = createSelectSchema(courseEnrollments);

export const courseEnrollmentInsertSchema = createInsertSchema(courseEnrollments, {
  enrolledAt: dateStringSchema,
  dueBy: dateOptionalSchema,
  completionDate: dateOptionalSchema,
  notes: longTextSchema.optional(),
  complianceCode: complianceCodeSchema.optional(),
  status: courseEnrollmentStatusZodEnum.optional(),
})
  .superRefine(refineRequiresCompletionDateIfCompleted)
  .superRefine(refineCompletionDateOnOrBeforeDueBy);

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const courseEnrollmentUpdateSchema = createUpdateSchema(courseEnrollments, {
  notes: nullableOptional(longTextSchema),
  complianceCode: nullableOptional(complianceCodeSchema),
  dueBy: dateNullableOptionalSchema,
  completionDate: dateNullableOptionalSchema,
  assignedBy: nullableOptional(z.number().int()),
  status: courseEnrollmentStatusZodEnum.optional(),
})
  .superRefine(refineRequiresCompletionDateIfCompleted)
  .superRefine(refineCompletionDateOnOrBeforeDueBy);

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type NewCourseEnrollment = typeof courseEnrollments.$inferInsert;
