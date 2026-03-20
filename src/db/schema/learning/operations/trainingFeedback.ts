import { integer, text, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns } from "../../_shared";
import { trainingSessions } from "./trainingSessions";

/**
 * Training Feedback - Participant evaluations of training sessions.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const trainingFeedback = learningSchema.table(
  "training_feedback",
  {
    feedbackId: integer().primaryKey().generatedAlwaysAsIdentity(),
    sessionId: integer().notNull(),
    employeeId: integer().notNull(),
    overallRating: smallint().notNull(),
    contentRating: smallint(),
    trainerRating: smallint(),
    venueRating: smallint(),
    comments: text(),
    suggestions: text(),
    wouldRecommend: integer(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    index("idx_training_feedback_session").on(t.sessionId),
    index("idx_training_feedback_employee").on(t.employeeId),
    uniqueIndex("uq_training_feedback_session_employee")
      .on(t.sessionId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.sessionId],
      foreignColumns: [trainingSessions.sessionId],
      name: "fk_training_feedback_session",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_training_feedback_overall",
      sql`${t.overallRating} >= 1 AND ${t.overallRating} <= 5`
    ),
    check(
      "chk_training_feedback_content",
      sql`${t.contentRating} IS NULL OR (${t.contentRating} >= 1 AND ${t.contentRating} <= 5)`
    ),
    check(
      "chk_training_feedback_trainer",
      sql`${t.trainerRating} IS NULL OR (${t.trainerRating} >= 1 AND ${t.trainerRating} <= 5)`
    ),
    check(
      "chk_training_feedback_venue",
      sql`${t.venueRating} IS NULL OR (${t.venueRating} >= 1 AND ${t.venueRating} <= 5)`
    ),
  ]
);

export const TrainingFeedbackIdSchema = z.number().int().brand<"TrainingFeedbackId">();
export type TrainingFeedbackId = z.infer<typeof TrainingFeedbackIdSchema>;

export const trainingFeedbackSelectSchema = createSelectSchema(trainingFeedback);

export const trainingFeedbackInsertSchema = createInsertSchema(trainingFeedback, {
  overallRating: z.number().int().min(1).max(5),
  contentRating: z.number().int().min(1).max(5).optional(),
  trainerRating: z.number().int().min(1).max(5).optional(),
  venueRating: z.number().int().min(1).max(5).optional(),
  comments: z.string().max(2000).optional(),
  suggestions: z.string().max(2000).optional(),
});

export const trainingFeedbackUpdateSchema = createUpdateSchema(trainingFeedback);

export type TrainingFeedback = typeof trainingFeedback.$inferSelect;
export type NewTrainingFeedback = typeof trainingFeedback.$inferInsert;
