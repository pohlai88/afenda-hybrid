import { integer, text, smallint, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Staffing Plans - Annual or periodic workforce planning documents.
 * Defines hiring targets and budget allocations per fiscal period.
 */
export const staffingPlanStatuses = ["DRAFT", "APPROVED", "ACTIVE", "CLOSED"] as const;

export const staffingPlanStatusEnum = recruitmentSchema.enum("staffing_plan_status", [...staffingPlanStatuses]);

export const StaffingPlanStatusSchema = z.enum(staffingPlanStatuses);
export type StaffingPlanStatus = z.infer<typeof StaffingPlanStatusSchema>;

export const staffingPlans = recruitmentSchema.table(
  "staffing_plans",
  {
    planId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    planCode: text().notNull(),
    ...nameColumn,
    fiscalYear: smallint().notNull(),
    status: staffingPlanStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_staffing_plans_tenant").on(t.tenantId),
    index("idx_staffing_plans_fiscal_year").on(t.tenantId, t.fiscalYear),
    index("idx_staffing_plans_status").on(t.tenantId, t.status),
    uniqueIndex("uq_staffing_plans_code")
      .on(t.tenantId, sql`lower(${t.planCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_staffing_plans_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const StaffingPlanIdSchema = z.number().int().positive().brand<"StaffingPlanId">();
export type StaffingPlanId = z.infer<typeof StaffingPlanIdSchema>;

const planCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const staffingPlanSelectSchema = createSelectSchema(staffingPlans);

export const staffingPlanInsertSchema = createInsertSchema(staffingPlans, {
  tenantId: z.number().int().positive(),
  planCode: planCodeSchema,
  name: z.string().min(1).max(200),
  fiscalYear: z.number().int().min(2000).max(2100),
  status: StaffingPlanStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const staffingPlanUpdateSchema = createUpdateSchema(staffingPlans, {
  planCode: planCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  status: StaffingPlanStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true });

export type StaffingPlan = typeof staffingPlans.$inferSelect;
export type NewStaffingPlan = typeof staffingPlans.$inferInsert;
