import {
  integer,
  text,
  smallint,
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
  longTextSchema,
  nullableOptional,
  trainingRating1to5OptionalSchema,
  trainingRating1to5Schema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns } from "../../../_shared";
import { trainingSessions } from "./trainingSessions";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Training Feedback - Participant evaluations of training sessions.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const trainingFeedback = learningSchema.table(
  "training_feedback",
  {
    feedbackId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
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
    index("idx_training_feedback_tenant").on(t.tenantId),
    index("idx_training_feedback_session").on(t.tenantId, t.sessionId),
    index("idx_training_feedback_employee").on(t.tenantId, t.employeeId),
    uniqueIndex("uq_training_feedback_session_employee")
      .on(t.tenantId, t.sessionId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_training_feedback_tenant",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
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

/** Read model: trust DB + rating `CHECK`s; use insert/update for write rules. */
export const trainingFeedbackSelectSchema = createSelectSchema(trainingFeedback);

export const trainingFeedbackInsertSchema = createInsertSchema(trainingFeedback, {
  overallRating: trainingRating1to5Schema,
  contentRating: trainingRating1to5OptionalSchema,
  trainerRating: trainingRating1to5OptionalSchema,
  venueRating: trainingRating1to5OptionalSchema,
  comments: longTextSchema.optional(),
  suggestions: longTextSchema.optional(),
});

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const trainingFeedbackUpdateSchema = createUpdateSchema(trainingFeedback, {
  overallRating: trainingRating1to5Schema.optional(),
  contentRating: nullableOptional(trainingRating1to5Schema),
  trainerRating: nullableOptional(trainingRating1to5Schema),
  venueRating: nullableOptional(trainingRating1to5Schema),
  comments: nullableOptional(longTextSchema),
  suggestions: nullableOptional(longTextSchema),
});

export type TrainingFeedback = typeof trainingFeedback.$inferSelect;
export type NewTrainingFeedback = typeof trainingFeedback.$inferInsert;
