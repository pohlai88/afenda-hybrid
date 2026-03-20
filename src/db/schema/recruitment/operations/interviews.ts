import { integer, text, date, timestamp, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { applications } from "./applications";

/**
 * Interviews - Evaluation sessions for candidates.
 * Circular FK note: interviewerId FK added via custom SQL.
 */
export const interviewTypes = ["PHONE_SCREEN", "VIDEO", "IN_PERSON", "PANEL", "TECHNICAL", "BEHAVIORAL", "FINAL"] as const;

export const interviewTypeEnum = recruitmentSchema.enum("interview_type", [...interviewTypes]);

export const interviewTypeZodEnum = createSelectSchema(interviewTypeEnum);

export const interviewStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"] as const;

export const interviewStatusEnum = recruitmentSchema.enum("interview_status", [...interviewStatuses]);

export const interviewStatusZodEnum = createSelectSchema(interviewStatusEnum);

export const interviewResults = ["STRONG_YES", "YES", "MAYBE", "NO", "STRONG_NO"] as const;

export const interviewResultEnum = recruitmentSchema.enum("interview_result", [...interviewResults]);

export const interviewResultZodEnum = createSelectSchema(interviewResultEnum);

export const interviews = recruitmentSchema.table(
  "interviews",
  {
    interviewId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    applicationId: integer().notNull(),
    interviewType: interviewTypeEnum().notNull(),
    interviewerId: integer().notNull(),
    scheduledDate: date().notNull(),
    scheduledTime: timestamp({ withTimezone: true }),
    durationMinutes: smallint().default(60),
    location: text(),
    meetingUrl: text(),
    status: interviewStatusEnum().notNull().default("SCHEDULED"),
    result: interviewResultEnum(),
    overallRating: smallint(),
    feedback: text(),
    strengths: text(),
    concerns: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_interviews_tenant").on(t.tenantId),
    index("idx_interviews_application").on(t.tenantId, t.applicationId),
    index("idx_interviews_interviewer").on(t.tenantId, t.interviewerId),
    index("idx_interviews_type").on(t.tenantId, t.interviewType),
    index("idx_interviews_status").on(t.tenantId, t.status),
    index("idx_interviews_date").on(t.tenantId, t.scheduledDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_interviews_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.applicationId],
      foreignColumns: [applications.applicationId],
      name: "fk_interviews_application",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_interviews_duration",
      sql`${t.durationMinutes} IS NULL OR ${t.durationMinutes} > 0`
    ),
    check(
      "chk_interviews_rating",
      sql`${t.overallRating} IS NULL OR (${t.overallRating} >= 1 AND ${t.overallRating} <= 5)`
    ),
  ]
);

export const InterviewIdSchema = z.number().int().brand<"InterviewId">();
export type InterviewId = z.infer<typeof InterviewIdSchema>;

export const interviewSelectSchema = createSelectSchema(interviews);

export const interviewInsertSchema = createInsertSchema(interviews, {
  durationMinutes: z.number().int().min(15).max(480).optional(),
  location: z.string().max(500).optional(),
  meetingUrl: z.string().url().max(500).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(4000).optional(),
  strengths: z.string().max(2000).optional(),
  concerns: z.string().max(2000).optional(),
});

export const interviewUpdateSchema = createUpdateSchema(interviews);

export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
