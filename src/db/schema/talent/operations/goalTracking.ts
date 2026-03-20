import { integer, text, date, numeric, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { appendOnlyTimestampColumns } from "../../_shared";
import { performanceGoals } from "./performanceGoals";

/**
 * Goal Tracking - Progress metrics for performance goals.
 * Append-only table for tracking history.
 * Circular FK note: updatedBy FK added via custom SQL.
 */
export const goalTracking = talentSchema.table(
  "goal_tracking",
  {
    trackingId: integer().primaryKey().generatedAlwaysAsIdentity(),
    goalId: integer().notNull(),
    trackingDate: date().notNull(),
    progressPercent: smallint().notNull(),
    actualValue: numeric({ precision: 10, scale: 2 }),
    notes: text(),
    updatedBy: integer(),
    ...appendOnlyTimestampColumns,
  },
  (t) => [
    index("idx_goal_tracking_goal").on(t.goalId),
    index("idx_goal_tracking_date").on(t.goalId, t.trackingDate),
    foreignKey({
      columns: [t.goalId],
      foreignColumns: [performanceGoals.goalId],
      name: "fk_goal_tracking_goal",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_goal_tracking_progress",
      sql`${t.progressPercent} >= 0 AND ${t.progressPercent} <= 100`
    ),
  ]
);

export const GoalTrackingIdSchema = z.number().int().brand<"GoalTrackingId">();
export type GoalTrackingId = z.infer<typeof GoalTrackingIdSchema>;

export const goalTrackingSelectSchema = createSelectSchema(goalTracking);

export const goalTrackingInsertSchema = createInsertSchema(goalTracking, {
  progressPercent: z.number().int().min(0).max(100),
  actualValue: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type GoalTracking = typeof goalTracking.$inferSelect;
export type NewGoalTracking = typeof goalTracking.$inferInsert;
