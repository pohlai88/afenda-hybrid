import { sql } from "drizzle-orm";
import {
  integer,
  text,
  date,
  numeric,
  boolean,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { currencies } from "../../../schema-platform/core/currencies";
import { tenants } from "../../../schema-platform/core/tenants";
import { benefitsSchema } from "../_schema";
import { dateValue, nonNegativeDecimalString } from "../_zodShared";
import { benefitsProviders } from "./benefitsProviders";

/** Plan categories and lifecycle enums for `benefit_plans`. */
export const planTypes = [
  "HEALTH_INSURANCE",
  "DENTAL",
  "VISION",
  "LIFE_INSURANCE",
  "DISABILITY",
  "RETIREMENT",
  "WELLNESS",
  "OTHER",
] as const;

export const planTypeEnum = benefitsSchema.enum("plan_type", [...planTypes]);

export const PlanTypeSchema = z.enum(planTypes);
export type PlanType = z.infer<typeof PlanTypeSchema>;

export const planStatuses = ["DRAFT", "ACTIVE", "SUSPENDED", "DISCONTINUED"] as const;

export const planStatusEnum = benefitsSchema.enum("plan_status", [...planStatuses]);

export const PlanStatusSchema = z.enum(planStatuses);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

/**
 * Table `benefit_plans` — tenant plan master; optional `providerId` / `currencyId`; contributions and effective range constrained in DB + Zod.
 */
export const benefitPlans = benefitsSchema.table(
  "benefit_plans",
  {
    benefitPlanId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    // planCode: unique per tenant (case-insensitive, soft-delete aware)
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
    /** Lifecycle: `DRAFT` | `ACTIVE` | `SUSPENDED` | `DISCONTINUED`. */
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
    foreignKey({
      columns: [t.providerId],
      foreignColumns: [benefitsProviders.providerId],
      name: "fk_benefit_plans_provider",
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

export const BenefitPlanIdSchema = z.number().int().positive().brand<"BenefitPlanId">();
export type BenefitPlanId = z.infer<typeof BenefitPlanIdSchema>;

export const benefitPlanSelectSchema = createSelectSchema(benefitPlans);

export const benefitPlanInsertSchema = createInsertSchema(benefitPlans, {
  tenantId: z.number().int().positive(),
  planCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  planType: PlanTypeSchema,
  description: z.string().max(2000).optional(),
  status: PlanStatusSchema.optional(),
  employeeContribution: nonNegativeDecimalString.optional(),
  employerContribution: nonNegativeDecimalString.optional(),
  coverageAmount: nonNegativeDecimalString.optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  maxDependents: z.number().int().min(0).max(20).optional(),
  eligibilityWaitingDays: z.number().int().min(0).max(365).optional(),
  providerId: z.number().int().positive().optional(),
  currencyId: z.number().int().positive().optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.effectiveTo == null) return;
  const fromT = dateValue(data.effectiveFrom);
  const toT = dateValue(data.effectiveTo);
  if (Number.isNaN(fromT) || Number.isNaN(toT)) {
    ctx.addIssue({
      code: "custom",
      message: "effectiveFrom and effectiveTo must be valid dates",
      path: ["effectiveTo"],
    });
    return;
  }
  if (toT < fromT) {
    ctx.addIssue({
      code: "custom",
      message: "effectiveTo must be on or after effectiveFrom",
      path: ["effectiveTo"],
    });
  }
});

export const benefitPlanUpdateSchema = createUpdateSchema(benefitPlans, {
  planCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  name: z.string().min(1).max(200).optional(),
  planType: PlanTypeSchema.optional(),
  description: z.string().max(2000).optional().nullable(),
  status: PlanStatusSchema.optional(),
  employeeContribution: nonNegativeDecimalString.optional().nullable(),
  employerContribution: nonNegativeDecimalString.optional().nullable(),
  coverageAmount: nonNegativeDecimalString.optional().nullable(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  maxDependents: z.number().int().min(0).max(20).optional().nullable(),
  eligibilityWaitingDays: z.number().int().min(0).max(365).optional(),
  providerId: z.number().int().positive().optional().nullable(),
  currencyId: z.number().int().positive().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.effectiveFrom === undefined && data.effectiveTo === undefined) return;
  if (
    data.effectiveFrom === undefined ||
    data.effectiveTo === undefined ||
    data.effectiveTo === null
  )
    return;
  const fromT = dateValue(data.effectiveFrom);
  const toT = dateValue(data.effectiveTo);
  if (Number.isNaN(fromT) || Number.isNaN(toT)) {
    ctx.addIssue({
      code: "custom",
      message: "effectiveFrom and effectiveTo must be valid dates",
      path: ["effectiveTo"],
    });
    return;
  }
  if (toT < fromT) {
    ctx.addIssue({
      code: "custom",
      message: "effectiveTo must be on or after effectiveFrom",
      path: ["effectiveTo"],
    });
  }
});

export type BenefitPlan = typeof benefitPlans.$inferSelect;
export type NewBenefitPlan = typeof benefitPlans.$inferInsert;
