import { integer, text, date, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Succession Plans - Replacement planning for key positions.
 * Circular FK note: positionId, incumbentId, successorId FKs added via custom SQL.
 */
export const readinessLevels = ["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPMENT_NEEDED", "NOT_READY"] as const;

export const readinessLevelEnum = talentSchema.enum("readiness_level", [...readinessLevels]);

export const readinessLevelZodEnum = createSelectSchema(readinessLevelEnum);

export const successionPlanStatuses = ["DRAFT", "ACTIVE", "UNDER_REVIEW", "ARCHIVED"] as const;

export const successionPlanStatusEnum = talentSchema.enum("succession_plan_status", [...successionPlanStatuses]);

export const successionPlanStatusZodEnum = createSelectSchema(successionPlanStatusEnum);

export const successionPlans = talentSchema.table(
  "succession_plans",
  {
    successionPlanId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    positionId: integer().notNull(),
    incumbentId: integer(),
    successorId: integer().notNull(),
    readinessLevel: readinessLevelEnum().notNull(),
    priority: smallint().notNull().default(1),
    developmentPlan: text(),
    targetDate: date(),
    status: successionPlanStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_succession_plans_tenant").on(t.tenantId),
    index("idx_succession_plans_position").on(t.tenantId, t.positionId),
    index("idx_succession_plans_incumbent").on(t.tenantId, t.incumbentId),
    index("idx_succession_plans_successor").on(t.tenantId, t.successorId),
    index("idx_succession_plans_readiness").on(t.tenantId, t.readinessLevel),
    index("idx_succession_plans_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_succession_plans_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_succession_plans_priority",
      sql`${t.priority} >= 1 AND ${t.priority} <= 10`
    ),
    check(
      "chk_succession_plans_different",
      sql`${t.incumbentId} IS NULL OR ${t.incumbentId} != ${t.successorId}`
    ),
  ]
);

export const SuccessionPlanIdSchema = z.number().int().brand<"SuccessionPlanId">();
export type SuccessionPlanId = z.infer<typeof SuccessionPlanIdSchema>;

export const successionPlanSelectSchema = createSelectSchema(successionPlans);

export const successionPlanInsertSchema = createInsertSchema(successionPlans, {
  priority: z.number().int().min(1).max(10),
  developmentPlan: z.string().max(4000).optional(),
});

export const successionPlanUpdateSchema = createUpdateSchema(successionPlans);

export type SuccessionPlan = typeof successionPlans.$inferSelect;
export type NewSuccessionPlan = typeof successionPlans.$inferInsert;
