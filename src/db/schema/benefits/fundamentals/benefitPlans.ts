import { integer, text, date, numeric, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { benefitsSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Benefit Plans - Insurance, retirement, wellness plans master data.
 */
export const planTypes = ["HEALTH_INSURANCE", "DENTAL", "VISION", "LIFE_INSURANCE", "DISABILITY", "RETIREMENT", "WELLNESS", "OTHER"] as const;

export const planTypeEnum = benefitsSchema.enum("plan_type", [...planTypes]);

export const planTypeZodEnum = createSelectSchema(planTypeEnum);

export const planStatuses = ["DRAFT", "ACTIVE", "SUSPENDED", "DISCONTINUED"] as const;

export const planStatusEnum = benefitsSchema.enum("plan_status", [...planStatuses]);

export const planStatusZodEnum = createSelectSchema(planStatusEnum);

export const benefitPlans = benefitsSchema.table(
  "benefit_plans",
  {
    benefitPlanId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    planCode: text().notNull(),
    ...nameColumn,
    planType: planTypeEnum().notNull(),
    description: text(),
    providerId: integer(),
    employeeContribution: numeric({ precision: 10, scale: 2 }).default("0"),
    employerContribution: numeric({ precision: 10, scale: 2 }).default("0"),
    currencyId: integer(),
    coverageAmount: numeric({ precision: 12, scale: 2 }),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    allowsDependents: boolean().notNull().default(true),
    maxDependents: integer(),
    eligibilityWaitingDays: integer().default(0),
    status: planStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_benefit_plans_tenant").on(t.tenantId),
    index("idx_benefit_plans_type").on(t.tenantId, t.planType),
    index("idx_benefit_plans_provider").on(t.tenantId, t.providerId),
    index("idx_benefit_plans_status").on(t.tenantId, t.status),
    uniqueIndex("uq_benefit_plans_code")
      .on(t.tenantId, sql`lower(${t.planCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_benefit_plans_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_benefit_plans_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_benefit_plans_contributions",
      sql`${t.employeeContribution} IS NULL OR ${t.employeeContribution} >= 0`
    ),
    check(
      "chk_benefit_plans_employer_contribution",
      sql`${t.employerContribution} IS NULL OR ${t.employerContribution} >= 0`
    ),
    check(
      "chk_benefit_plans_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
    check(
      "chk_benefit_plans_max_dependents",
      sql`${t.maxDependents} IS NULL OR ${t.maxDependents} >= 0`
    ),
  ]
);

export const BenefitPlanIdSchema = z.number().int().brand<"BenefitPlanId">();
export type BenefitPlanId = z.infer<typeof BenefitPlanIdSchema>;

export const benefitPlanSelectSchema = createSelectSchema(benefitPlans);

export const benefitPlanInsertSchema = createInsertSchema(benefitPlans, {
  planCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  employeeContribution: z.string().optional(),
  employerContribution: z.string().optional(),
  coverageAmount: z.string().optional(),
  maxDependents: z.number().int().min(0).max(20).optional(),
  eligibilityWaitingDays: z.number().int().min(0).max(365).optional(),
});

export const benefitPlanUpdateSchema = createUpdateSchema(benefitPlans);

export type BenefitPlan = typeof benefitPlans.$inferSelect;
export type NewBenefitPlan = typeof benefitPlans.$inferInsert;
