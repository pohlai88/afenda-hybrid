import { integer, text, date, timestamp, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { applications } from "./applications";

/**
 * Interviews — pipeline rows tied to a specific application (not directly to `candidates`).
 * Resolve profile via `application` → `applications.candidateId`. See `docs/recruitment-candidate-databank.md` §0.
 *
 * **Tenancy:** `tenantId` should match `applications.tenantId` for `applicationId`; PostgreSQL does not enforce
 * that equality. Use `createInterview` in `src/db/_services/recruitment/interviewsService.ts` for application-layer creates.
 *
 * **Result vs status:** `result` is only valid when `status` is **`COMPLETED`** — enforced in Zod (insert/update).
 *
 * **Listing by application + recency:** `idx_interviews_application_date` supports
 * `WHERE tenantId AND applicationId ORDER BY scheduledDate DESC`.
 *
 * Circular FK note: `interviewerId` → `hr.employees` via custom SQL if used — validate in the app when wiring HR.
 *
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const interviewTypes = ["PHONE_SCREEN", "VIDEO", "IN_PERSON", "PANEL", "TECHNICAL", "BEHAVIORAL", "FINAL"] as const;

export const interviewTypeEnum = recruitmentSchema.enum("interview_type", [...interviewTypes]);

export const InterviewTypeSchema = z.enum(interviewTypes);
export type InterviewType = z.infer<typeof InterviewTypeSchema>;

export const interviewStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"] as const;

export const interviewStatusEnum = recruitmentSchema.enum("interview_status", [...interviewStatuses]);

export const InterviewStatusSchema = z.enum(interviewStatuses);
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;

export const interviewResults = ["STRONG_YES", "YES", "MAYBE", "NO", "STRONG_NO"] as const;

export const interviewResultEnum = recruitmentSchema.enum("interview_result", [...interviewResults]);

export const InterviewResultSchema = z.enum(interviewResults);
export type InterviewResult = z.infer<typeof InterviewResultSchema>;

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
    /** Per application, by interview date (recency lists). */
    index("idx_interviews_application_date").on(t.tenantId, t.applicationId, t.scheduledDate),
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

function refineInterviewResultVsStatus(data: Record<string, unknown>, ctx: z.RefinementCtx, mode: "insert" | "update") {
  const status = data.status;
  const hasResult = Object.prototype.hasOwnProperty.call(data, "result");
  const result = hasResult ? data.result : undefined;

  if (result != null && status !== "COMPLETED") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        mode === "update"
          ? "When setting result, status must be COMPLETED in the same update"
          : "Result can only be set when status is COMPLETED",
      path: ["result"],
    });
  }
}

export const interviewInsertSchema = createInsertSchema(interviews, {
  interviewType: InterviewTypeSchema,
  /** Omit to use DB default `SCHEDULED`. */
  status: InterviewStatusSchema.optional(),
  result: InterviewResultSchema.optional().nullable(),
  tenantId: z.number().int().positive(),
  applicationId: z.number().int().positive(),
  interviewerId: z.number().int().positive(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  location: z.string().max(500).optional(),
  meetingUrl: z.union([z.string().url().max(500), z.literal("")]).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(4000).optional(),
  strengths: z.string().max(2000).optional(),
  concerns: z.string().max(2000).optional(),
}).superRefine((row, ctx) => refineInterviewResultVsStatus(row as Record<string, unknown>, ctx, "insert"));

export const interviewUpdateSchema = createUpdateSchema(interviews, {
  interviewType: InterviewTypeSchema.optional(),
  status: InterviewStatusSchema.optional(),
  result: InterviewResultSchema.optional().nullable(),
  tenantId: z.number().int().positive().optional(),
  applicationId: z.number().int().positive().optional(),
  interviewerId: z.number().int().positive().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  meetingUrl: z.union([z.string().url().max(500), z.literal("")]).optional().nullable(),
  overallRating: z.number().int().min(1).max(5).optional().nullable(),
  feedback: z.string().max(4000).optional().nullable(),
  strengths: z.string().max(2000).optional().nullable(),
  concerns: z.string().max(2000).optional().nullable(),
}).superRefine((row, ctx) => refineInterviewResultVsStatus(row as Record<string, unknown>, ctx, "update"));

export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
