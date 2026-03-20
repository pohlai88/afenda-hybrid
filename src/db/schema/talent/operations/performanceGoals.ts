import { integer, text, date, smallint, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Performance Goals - Employee objectives for performance management.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const goalTypes = ["INDIVIDUAL", "TEAM", "DEPARTMENT", "COMPANY", "DEVELOPMENT"] as const;

export const goalTypeEnum = talentSchema.enum("goal_type", [...goalTypes]);

export const goalTypeZodEnum = createSelectSchema(goalTypeEnum);

export const goalStatuses = ["DRAFT", "ACTIVE", "ON_TRACK", "AT_RISK", "BEHIND", "COMPLETED", "CANCELLED"] as const;

export const goalStatusEnum = talentSchema.enum("goal_status", [...goalStatuses]);

export const goalStatusZodEnum = createSelectSchema(goalStatusEnum);

export const performanceGoals = talentSchema.table(
  "performance_goals",
  {
    goalId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    title: text().notNull(),
    description: text(),
    goalType: goalTypeEnum().notNull().default("INDIVIDUAL"),
    startDate: date().notNull(),
    targetDate: date().notNull(),
    completedDate: date(),
    weight: smallint().default(1),
    targetValue: numeric({ precision: 10, scale: 2 }),
    actualValue: numeric({ precision: 10, scale: 2 }),
    progressPercent: smallint().default(0),
    status: goalStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_performance_goals_tenant").on(t.tenantId),
    index("idx_performance_goals_employee").on(t.tenantId, t.employeeId),
    index("idx_performance_goals_type").on(t.tenantId, t.goalType),
    index("idx_performance_goals_status").on(t.tenantId, t.status),
    index("idx_performance_goals_dates").on(t.tenantId, t.startDate, t.targetDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_performance_goals_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_performance_goals_dates",
      sql`${t.targetDate} >= ${t.startDate}`
    ),
    check(
      "chk_performance_goals_progress",
      sql`${t.progressPercent} IS NULL OR (${t.progressPercent} >= 0 AND ${t.progressPercent} <= 100)`
    ),
    check(
      "chk_performance_goals_weight",
      sql`${t.weight} IS NULL OR ${t.weight} >= 1`
    ),
  ]
);

export const PerformanceGoalIdSchema = z.number().int().brand<"PerformanceGoalId">();
export type PerformanceGoalId = z.infer<typeof PerformanceGoalIdSchema>;

export const performanceGoalSelectSchema = createSelectSchema(performanceGoals);

export const performanceGoalInsertSchema = createInsertSchema(performanceGoals, {
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  weight: z.number().int().min(1).max(10).optional(),
  targetValue: z.string().optional(),
  actualValue: z.string().optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
});

export const performanceGoalUpdateSchema = createUpdateSchema(performanceGoals);

export type PerformanceGoal = typeof performanceGoals.$inferSelect;
export type NewPerformanceGoal = typeof performanceGoals.$inferInsert;
