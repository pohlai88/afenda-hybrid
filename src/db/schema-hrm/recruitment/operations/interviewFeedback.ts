import { integer, numeric, text, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { interviewSchedules } from "./interviewSchedules";
import { employees } from "../../hr/fundamentals/employees";

/**
 * Interview Feedback - Interviewer assessments and recommendations.
 * Captures ratings, strengths, concerns, and hiring recommendations.
 */
export const interviewRecommendations = ["STRONG_HIRE", "HIRE", "NEUTRAL", "NO_HIRE", "STRONG_NO_HIRE"] as const;

export const interviewRecommendationEnum = recruitmentSchema.enum("interview_recommendation", [...interviewRecommendations]);

export const InterviewRecommendationSchema = z.enum(interviewRecommendations);
export type InterviewRecommendation = z.infer<typeof InterviewRecommendationSchema>;

const CANONICAL_RATING = /^(0|[1-9]|10)(\.\d{1,2})?$/;

function isValidRating(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_RATING.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= 10;
}

export const interviewFeedback = recruitmentSchema.table(
  "interview_feedback",
  {
    feedbackId: integer().primaryKey().generatedAlwaysAsIdentity(),
    interviewId: integer().notNull(),
    interviewerId: integer().notNull(),
    rating: numeric({ precision: 4, scale: 2 }),
    strengths: text(),
    concerns: text(),
    recommendation: interviewRecommendationEnum(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_interview_feedback_interview").on(t.interviewId),
    index("idx_interview_feedback_interviewer").on(t.interviewerId),
    foreignKey({
      columns: [t.interviewId],
      foreignColumns: [interviewSchedules.interviewId],
      name: "fk_interview_feedback_interview",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.interviewerId],
      foreignColumns: [employees.employeeId],
      name: "fk_interview_feedback_interviewer",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_interview_feedback_rating",
      sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 10)`
    ),
  ]
);

export const InterviewFeedbackIdSchema = z.number().int().positive().brand<"InterviewFeedbackId">();
export type InterviewFeedbackId = z.infer<typeof InterviewFeedbackIdSchema>;

export const interviewFeedbackSelectSchema = createSelectSchema(interviewFeedback);

export const interviewFeedbackInsertSchema = createInsertSchema(interviewFeedback, {
  interviewId: z.number().int().positive(),
  interviewerId: z.number().int().positive(),
  rating: z.string().refine(isValidRating, "must be valid rating 0-10 with max 2 decimals").optional().nullable(),
  strengths: z.string().max(2000).optional().nullable(),
  concerns: z.string().max(2000).optional().nullable(),
  recommendation: InterviewRecommendationSchema.optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const interviewFeedbackUpdateSchema = createUpdateSchema(interviewFeedback, {
  rating: z.string().refine(isValidRating, "must be valid rating 0-10 with max 2 decimals").optional().nullable(),
  strengths: z.string().max(2000).optional().nullable(),
  concerns: z.string().max(2000).optional().nullable(),
  recommendation: InterviewRecommendationSchema.optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ interviewId: true, interviewerId: true });

export type InterviewFeedback = typeof interviewFeedback.$inferSelect;
export type NewInterviewFeedback = typeof interviewFeedback.$inferInsert;
