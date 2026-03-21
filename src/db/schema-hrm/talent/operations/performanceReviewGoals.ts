import {
  integer,
  varchar,
  date,
  numeric,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { performanceReviews } from "./performanceReviews";
import { performanceGoals } from "./performanceGoals";

/**
 * Performance Review Goals - Frozen goal snapshots evaluated in a review cycle.
 *
 * DB: `trg_review_goals_final_vs_parent_status` enforces that `finalScore` is set only when the
 * parent `performance_reviews.status` is `COMPLETED` or `ACKNOWLEDGED` (see CSQL-014 migration).
 * Parent demotion while children have `finalScore` is blocked by `trg_reviews_status_vs_goal_finals`.
 * Preflight rows that violate this: `docs/preflight-csql-014-review-goal-final-score.sql`.
 */

/** 0–5 scale, `numeric(5,2)` — accepts number or decimal string, normalizes to 2 dp for insert. */
const numericReviewScoreOptional = z
  .union([z.number().finite().min(0).max(5), z.string().trim()])
  .refine(
    (v) => {
      const n = typeof v === "number" ? v : Number.parseFloat(v);
      return Number.isFinite(n) && n >= 0 && n <= 5;
    },
    { message: "Score must be between 0 and 5" }
  )
  .transform((v) => (typeof v === "number" ? v.toFixed(2) : Number.parseFloat(v).toFixed(2)))
  .optional();

export const performanceReviewGoals = talentSchema.table(
  "performance_review_goals",
  {
    reviewGoalId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    reviewId: integer().notNull(),
    goalId: integer().notNull(),
    goalTitleSnapshot: varchar({ length: 200 }).notNull(),
    goalWeightSnapshot: numeric({ precision: 5, scale: 2 }),
    goalTargetSnapshot: varchar({ length: 2000 }),
    goalDueDateSnapshot: date(),
    managerScore: numeric({ precision: 5, scale: 2 }),
    employeeScore: numeric({ precision: 5, scale: 2 }),
    finalScore: numeric({ precision: 5, scale: 2 }),
    comment: varchar({ length: 4000 }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_performance_review_goals_tenant").on(t.tenantId),
    index("idx_performance_review_goals_review").on(t.tenantId, t.reviewId),
    index("idx_performance_review_goals_goal").on(t.tenantId, t.goalId),
    index("idx_performance_review_goals_final")
      .on(t.tenantId, t.finalScore)
      .where(sql`${t.finalScore} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    uniqueIndex("uq_performance_review_goals_review_goal")
      .on(t.tenantId, t.reviewId, t.goalId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_performance_review_goals_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.reviewId],
      foreignColumns: [performanceReviews.reviewId],
      name: "fk_performance_review_goals_review",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.goalId],
      foreignColumns: [performanceGoals.goalId],
      name: "fk_performance_review_goals_goal",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_performance_review_goals_scores",
      sql`(${t.managerScore} IS NULL OR (${t.managerScore} >= 0 AND ${t.managerScore} <= 5)) AND
          (${t.employeeScore} IS NULL OR (${t.employeeScore} >= 0 AND ${t.employeeScore} <= 5)) AND
          (${t.finalScore} IS NULL OR (${t.finalScore} >= 0 AND ${t.finalScore} <= 5))`
    ),
    /** When both rater scores exist, `finalScore` must lie on the closed interval between them (allows average or manual calibration in range). */
    check(
      "chk_performance_review_goals_final_between",
      sql`${t.managerScore} IS NULL OR ${t.employeeScore} IS NULL OR ${t.finalScore} IS NULL OR
          (${t.finalScore} >= LEAST(${t.managerScore}, ${t.employeeScore}) AND ${t.finalScore} <= GREATEST(${t.managerScore}, ${t.employeeScore}))`
    ),
  ]
);

export const PerformanceReviewGoalIdSchema = z.number().int().brand<"PerformanceReviewGoalId">();
export type PerformanceReviewGoalId = z.infer<typeof PerformanceReviewGoalIdSchema>;

export const performanceReviewGoalSelectSchema = createSelectSchema(performanceReviewGoals);
export const performanceReviewGoalInsertSchema = createInsertSchema(performanceReviewGoals, {
  goalTitleSnapshot: z.string().min(1).max(200),
  goalTargetSnapshot: z.string().max(2000).optional(),
  comment: z.string().max(4000).optional(),
  managerScore: numericReviewScoreOptional,
  employeeScore: numericReviewScoreOptional,
  finalScore: numericReviewScoreOptional,
});
export const performanceReviewGoalUpdateSchema = createUpdateSchema(performanceReviewGoals);

export type PerformanceReviewGoal = typeof performanceReviewGoals.$inferSelect;
export type NewPerformanceReviewGoal = typeof performanceReviewGoals.$inferInsert;
