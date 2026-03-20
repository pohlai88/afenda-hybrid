import { integer, text, date, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { trainingSessions } from "./trainingSessions";

/**
 * Training Enrollments - Employee participation in training sessions.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 *
 * Completion: `completionDate` is set iff `status = COMPLETED` (CHECK). There is no `completedBy` column;
 * add one and extend the constraint if HR requires an attesting user.
 */
export const trainingEnrollmentStatuses = ["PENDING", "APPROVED", "ENROLLED", "ATTENDED", "COMPLETED", "NO_SHOW", "CANCELLED", "WAITLISTED"] as const;

export const trainingEnrollmentStatusEnum = learningSchema.enum("training_enrollment_status", [...trainingEnrollmentStatuses]);

export const trainingEnrollmentStatusZodEnum = createSelectSchema(trainingEnrollmentStatusEnum);

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
    approvedAt: date(),
    attendancePercent: smallint(),
    completionDate: date(),
    score: smallint(),
    feedback: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_training_enrollments_tenant").on(t.tenantId),
    index("idx_training_enrollments_session").on(t.tenantId, t.sessionId),
    index("idx_training_enrollments_employee").on(t.tenantId, t.employeeId),
    index("idx_training_enrollments_status").on(t.tenantId, t.status),
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
  ]
);

export const TrainingEnrollmentIdSchema = z.number().int().brand<"TrainingEnrollmentId">();
export type TrainingEnrollmentId = z.infer<typeof TrainingEnrollmentIdSchema>;

export const trainingEnrollmentSelectSchema = createSelectSchema(trainingEnrollments);

export const trainingEnrollmentInsertSchema = createInsertSchema(trainingEnrollments, {
  attendancePercent: z.number().int().min(0).max(100).optional(),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().max(2000).optional(),
});

export const trainingEnrollmentUpdateSchema = createUpdateSchema(trainingEnrollments);

export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type NewTrainingEnrollment = typeof trainingEnrollments.$inferInsert;
