import { integer, timestamp, text, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { applications } from "./applications";
import { interviewRounds } from "./interviewRounds";
import { employees } from "../../hr/fundamentals/employees";

/**
 * Interview Schedules - Scheduled interviews for candidates.
 * Links applications to interview rounds with interviewer assignments and meeting details.
 */
export const interviewScheduleStatuses = [
  "SCHEDULED",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const interviewScheduleStatusEnum = recruitmentSchema.enum("interview_schedule_status", [
  ...interviewScheduleStatuses,
]);

export const InterviewScheduleStatusSchema = z.enum(interviewScheduleStatuses);
export type InterviewScheduleStatus = z.infer<typeof InterviewScheduleStatusSchema>;

export const interviewSchedules = recruitmentSchema.table(
  "interview_schedules",
  {
    interviewId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    applicationId: integer().notNull(),
    roundId: integer().notNull(),
    interviewerId: integer(),
    scheduledAt: timestamp({ withTimezone: true }).notNull(),
    durationMinutes: smallint().notNull().default(60),
    location: text(),
    meetingLink: text(),
    status: interviewScheduleStatusEnum().notNull().default("SCHEDULED"),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_interview_schedules_tenant").on(t.tenantId),
    index("idx_interview_schedules_application").on(t.tenantId, t.applicationId),
    index("idx_interview_schedules_round").on(t.tenantId, t.roundId),
    index("idx_interview_schedules_interviewer").on(t.tenantId, t.interviewerId),
    index("idx_interview_schedules_scheduled_at").on(t.tenantId, t.scheduledAt),
    index("idx_interview_schedules_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_interview_schedules_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.applicationId],
      foreignColumns: [applications.applicationId],
      name: "fk_interview_schedules_application",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.roundId],
      foreignColumns: [interviewRounds.roundId],
      name: "fk_interview_schedules_round",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.interviewerId],
      foreignColumns: [employees.employeeId],
      name: "fk_interview_schedules_interviewer",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_interview_schedules_duration", sql`${t.durationMinutes} > 0`),
  ]
);

export const InterviewScheduleIdSchema = z.number().int().positive().brand<"InterviewScheduleId">();
export type InterviewScheduleId = z.infer<typeof InterviewScheduleIdSchema>;

export const interviewScheduleSelectSchema = createSelectSchema(interviewSchedules);

export const interviewScheduleInsertSchema = createInsertSchema(interviewSchedules, {
  tenantId: z.number().int().positive(),
  applicationId: z.number().int().positive(),
  roundId: z.number().int().positive(),
  interviewerId: z.number().int().positive().optional().nullable(),
  durationMinutes: z.number().int().positive().optional(),
  location: z.string().max(500).optional().nullable(),
  meetingLink: z.string().url().max(1000).optional().nullable(),
  status: InterviewScheduleStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const interviewScheduleUpdateSchema = createUpdateSchema(interviewSchedules, {
  interviewerId: z.number().int().positive().optional().nullable(),
  durationMinutes: z.number().int().positive().optional(),
  location: z.string().max(500).optional().nullable(),
  meetingLink: z.string().url().max(1000).optional().nullable(),
  status: InterviewScheduleStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, applicationId: true, roundId: true, scheduledAt: true });

export type InterviewSchedule = typeof interviewSchedules.$inferSelect;
export type NewInterviewSchedule = typeof interviewSchedules.$inferInsert;
