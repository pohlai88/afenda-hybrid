import { integer, text, varchar, date, timestamp, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  complianceCodeSchema,
  dateNullableOptionalSchema,
  dateOptionalSchema,
  dateStringSchema,
  LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT,
  longTextSchema,
  nullableOptional,
  percent0to100Schema,
  refineAttendanceCompletionConsistency,
  refineCompletionDateOnOrBeforeDueBy,
  refineRequiresCompletionDateIfCompleted,
  timestamptzNullableOptionalSchema,
  timestamptzOptionalSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { trainingSessions } from "./trainingSessions";

/**
 * Training Enrollments - Employee participation in training sessions.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 *
 * Completion: `completionDate` is set iff `status = COMPLETED` (CHECK). There is no `completedBy` column;
 * add one and extend the constraint if HR requires an attesting user.
 *
 * Attendance vs completion: `status = COMPLETED` requires `attendancePercent` to be null or ≥ threshold
 * (`LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT` in `_zodShared.ts`; DB `chk_training_enrollments_completed_min_attendance`).
 */
export const trainingEnrollmentStatuses = ["PENDING", "APPROVED", "ENROLLED", "ATTENDED", "COMPLETED", "NO_SHOW", "CANCELLED", "WAITLISTED"] as const;

export const trainingEnrollmentStatusEnum = learningSchema.enum("training_enrollment_status", [...trainingEnrollmentStatuses]);

export const trainingEnrollmentStatusZodEnum = z.enum(trainingEnrollmentStatuses);

export const trainingEnrollments = learningSchema.table(
  "training_enrollments",
  {
    enrollmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    sessionId: integer().notNull(),
    employeeId: integer().notNull(),
    enrollmentDate: date().notNull(),
    status: trainingEnrollmentStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    attendancePercent: smallint(),
    completionDate: date(),
    dueBy: date(),
    complianceCode: varchar({ length: 100 }),
    score: smallint(),
    feedback: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_training_enrollments_tenant").on(t.tenantId),
    index("idx_training_enrollments_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_training_enrollments_session").on(t.tenantId, t.sessionId),
    index("idx_training_enrollments_employee").on(t.tenantId, t.employeeId),
    index("idx_training_enrollments_status").on(t.tenantId, t.status),
    index("idx_training_enrollments_due")
      .on(t.tenantId, t.dueBy)
      .where(sql`${t.deletedAt} IS NULL AND ${t.dueBy} IS NOT NULL`),
    index("idx_training_enrollments_completed_reporting")
      .on(t.tenantId, t.completionDate)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = ${sql.raw(`'COMPLETED'::"learning"."training_enrollment_status"`)}`,
      ),
    uniqueIndex("uq_training_enrollments_session_employee")
      .on(t.tenantId, t.sessionId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_training_enrollments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.sessionId],
      foreignColumns: [trainingSessions.sessionId],
      name: "fk_training_enrollments_session",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_training_enrollments_attendance",
      sql`${t.attendancePercent} IS NULL OR (${t.attendancePercent} >= 0 AND ${t.attendancePercent} <= 100)`
    ),
    check(
      "chk_training_enrollments_score",
      sql`${t.score} IS NULL OR (${t.score} >= 0 AND ${t.score} <= 100)`
    ),
    check(
      "chk_training_enrollments_completion_consistency",
      sql`(${t.completionDate} IS NULL OR ${t.status}::text = 'COMPLETED') AND
          (${t.status}::text != 'COMPLETED' OR ${t.completionDate} IS NOT NULL)`
    ),
    /* Threshold must stay aligned with `refineAttendanceCompletionConsistency` / `LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT`. */
    check(
      "chk_training_enrollments_completed_min_attendance",
      sql`${t.status}::text <> 'COMPLETED' OR ${t.attendancePercent} IS NULL OR ${t.attendancePercent} >= ${LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT}`
    ),
  ]
);

export const TrainingEnrollmentIdSchema = z.number().int().brand<"TrainingEnrollmentId">();
export type TrainingEnrollmentId = z.infer<typeof TrainingEnrollmentIdSchema>;

/** Read model: trust DB + completion/attendance `CHECK`s; use insert/update for write rules. */
export const trainingEnrollmentSelectSchema = createSelectSchema(trainingEnrollments);

export const trainingEnrollmentInsertSchema = createInsertSchema(trainingEnrollments, {
  enrollmentDate: dateStringSchema,
  dueBy: dateOptionalSchema,
  completionDate: dateOptionalSchema,
  approvedAt: timestamptzOptionalSchema,
  attendancePercent: percent0to100Schema.optional(),
  score: percent0to100Schema.optional(),
  feedback: longTextSchema.optional(),
  complianceCode: complianceCodeSchema.optional(),
  status: trainingEnrollmentStatusZodEnum.optional(),
})
  .superRefine(refineRequiresCompletionDateIfCompleted)
  .superRefine(refineAttendanceCompletionConsistency)
  .superRefine(refineCompletionDateOnOrBeforeDueBy);

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const trainingEnrollmentUpdateSchema = createUpdateSchema(trainingEnrollments, {
  attendancePercent: nullableOptional(percent0to100Schema),
  score: nullableOptional(percent0to100Schema),
  feedback: nullableOptional(longTextSchema),
  complianceCode: nullableOptional(complianceCodeSchema),
  dueBy: dateNullableOptionalSchema,
  completionDate: dateNullableOptionalSchema,
  approvedAt: timestamptzNullableOptionalSchema,
  approvedBy: nullableOptional(z.number().int()),
  status: trainingEnrollmentStatusZodEnum.optional(),
})
  .superRefine(refineRequiresCompletionDateIfCompleted)
  .superRefine(refineAttendanceCompletionConsistency)
  .superRefine(refineCompletionDateOnOrBeforeDueBy);

export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type NewTrainingEnrollment = typeof trainingEnrollments.$inferInsert;
