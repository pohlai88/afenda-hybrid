import {
  integer,
  varchar,
  date,
  numeric,
  smallint,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { appendOnlyTimestampColumns } from "../../../_shared";
import { performanceGoals } from "./performanceGoals";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Goal Tracking - Progress metrics for performance goals.
 * Append-only table for tracking history.
 * Circular FK note: updatedBy FK added via custom SQL.
 */
/** Matches `numeric(10,2)` — use with string output for inserts (Postgres / Drizzle driver). */
const numeric10_2 = z
  .union([
    z.number().finite().min(-99_999_999.99).max(99_999_999.99),
    z
      .string()
      .trim()
      .regex(
        /^-?\d{1,8}(\.\d{1,2})?$/,
        "Must be a decimal with up to 8 integer digits and 2 fractional digits"
      ),
  ])
  .transform((v) => (typeof v === "number" ? v.toFixed(2) : v));

export const goalTracking = talentSchema.table(
  "goal_tracking",
  {
    trackingId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    goalId: integer().notNull(),
    trackingDate: date().notNull(),
    progressPercent: smallint().notNull(),
    actualValue: numeric({ precision: 10, scale: 2 }),
    /** Bounded to match Zod / API validation (was unbounded `text`). */
    notes: varchar({ length: 1000 }),
    updatedBy: integer(),
    ...appendOnlyTimestampColumns,
  },
  (t) => [
    index("idx_goal_tracking_tenant").on(t.tenantId),
    index("idx_goal_tracking_goal").on(t.tenantId, t.goalId),
    index("idx_goal_tracking_date").on(t.tenantId, t.goalId, t.trackingDate),
    index("idx_goal_tracking_tracking_date").on(t.tenantId, t.trackingDate),
    uniqueIndex("uq_goal_tracking_goal_date").on(t.tenantId, t.goalId, t.trackingDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_goal_tracking_tenant",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
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
  /** Accepts number or decimal string; stored as `numeric(10,2)` via string wire format. */
  actualValue: numeric10_2.optional(),
  notes: z.string().max(1000).optional(),
});

export type GoalTracking = typeof goalTracking.$inferSelect;
export type NewGoalTracking = typeof goalTracking.$inferInsert;
