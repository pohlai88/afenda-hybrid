import { integer, smallint, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { staffingPlans } from "./staffingPlans";
import { departments } from "../../hr/fundamentals/departments";
import { positions } from "../../hr/fundamentals/positions";

/**
 * Staffing Plan Details - Line items for staffing plans.
 * Specifies current and planned headcount per department/position with cost estimates.
 */

const CANONICAL_MONEY_12_2 = /^(0|[1-9]\d{0,9})(\.\d{1,2})?$/;
const MAX_MONEY_12_2 = 9_999_999_999.99;

function isValidMoney12_2(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_MONEY_12_2.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= MAX_MONEY_12_2;
}

export const staffingPlanDetails = recruitmentSchema.table(
  "staffing_plan_details",
  {
    detailId: integer().primaryKey().generatedAlwaysAsIdentity(),
    planId: integer().notNull(),
    departmentId: integer(),
    positionId: integer(),
    currentCount: smallint().notNull().default(0),
    plannedCount: smallint().notNull(),
    estimatedCostPerPosition: numeric({ precision: 12, scale: 2 }),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_staffing_plan_details_plan").on(t.planId),
    index("idx_staffing_plan_details_department").on(t.departmentId),
    index("idx_staffing_plan_details_position").on(t.positionId),
    foreignKey({
      columns: [t.planId],
      foreignColumns: [staffingPlans.planId],
      name: "fk_staffing_plan_details_plan",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.departmentId],
      foreignColumns: [departments.departmentId],
      name: "fk_staffing_plan_details_department",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.positionId],
      foreignColumns: [positions.positionId],
      name: "fk_staffing_plan_details_position",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_staffing_plan_details_current_count", sql`${t.currentCount} >= 0`),
    check("chk_staffing_plan_details_planned_count", sql`${t.plannedCount} >= 0`),
    check(
      "chk_staffing_plan_details_cost",
      sql`${t.estimatedCostPerPosition} IS NULL OR ${t.estimatedCostPerPosition} >= 0`
    ),
  ]
);

export const StaffingPlanDetailIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"StaffingPlanDetailId">();
export type StaffingPlanDetailId = z.infer<typeof StaffingPlanDetailIdSchema>;

export const staffingPlanDetailSelectSchema = createSelectSchema(staffingPlanDetails);

export const staffingPlanDetailInsertSchema = createInsertSchema(staffingPlanDetails, {
  planId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional().nullable(),
  positionId: z.number().int().positive().optional().nullable(),
  currentCount: z.number().int().nonnegative().optional(),
  plannedCount: z.number().int().nonnegative(),
  estimatedCostPerPosition: z
    .string()
    .refine(isValidMoney12_2, "must be valid numeric(12,2) >= 0")
    .optional()
    .nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const staffingPlanDetailUpdateSchema = createUpdateSchema(staffingPlanDetails, {
  currentCount: z.number().int().nonnegative().optional(),
  plannedCount: z.number().int().nonnegative().optional(),
  estimatedCostPerPosition: z
    .string()
    .refine(isValidMoney12_2, "must be valid numeric(12,2) >= 0")
    .optional()
    .nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ planId: true, departmentId: true, positionId: true });

export type StaffingPlanDetail = typeof staffingPlanDetails.$inferSelect;
export type NewStaffingPlanDetail = typeof staffingPlanDetails.$inferInsert;
