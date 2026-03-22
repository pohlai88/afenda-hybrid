import { integer, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { benefitsSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { benefitApplications } from "./benefitApplications";
import { benefitPlans } from "../fundamentals/benefitPlans";

/**
 * Benefit Application Details - Line items for flexible benefit elections.
 * Allows employees to elect specific amounts across multiple benefit plans.
 */

const CANONICAL_MONEY_10_2 = /^(0|[1-9]\d{0,7})(\.\d{1,2})?$/;
const MAX_MONEY_10_2 = 99_999_999.99;

function isValidMoney10_2(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_MONEY_10_2.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= MAX_MONEY_10_2;
}

export const benefitApplicationDetails = benefitsSchema.table(
  "benefit_application_details",
  {
    detailId: integer().primaryKey().generatedAlwaysAsIdentity(),
    applicationId: integer().notNull(),
    benefitPlanId: integer().notNull(),
    electedAmount: numeric({ precision: 10, scale: 2 }).notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_benefit_application_details_application").on(t.applicationId),
    index("idx_benefit_application_details_plan").on(t.benefitPlanId),
    foreignKey({
      columns: [t.applicationId],
      foreignColumns: [benefitApplications.applicationId],
      name: "fk_benefit_application_details_application",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.benefitPlanId],
      foreignColumns: [benefitPlans.benefitPlanId],
      name: "fk_benefit_application_details_plan",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_benefit_application_details_amount", sql`${t.electedAmount} >= 0`),
  ]
);

export const BenefitApplicationDetailIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"BenefitApplicationDetailId">();
export type BenefitApplicationDetailId = z.infer<typeof BenefitApplicationDetailIdSchema>;

export const benefitApplicationDetailSelectSchema = createSelectSchema(benefitApplicationDetails);

export const benefitApplicationDetailInsertSchema = createInsertSchema(benefitApplicationDetails, {
  applicationId: z.number().int().positive(),
  benefitPlanId: z.number().int().positive(),
  electedAmount: z.string().refine(isValidMoney10_2, "must be valid numeric(10,2) >= 0"),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const benefitApplicationDetailUpdateSchema = createUpdateSchema(benefitApplicationDetails, {
  electedAmount: z.string().refine(isValidMoney10_2, "must be valid numeric(10,2) >= 0").optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ applicationId: true, benefitPlanId: true });

export type BenefitApplicationDetail = typeof benefitApplicationDetails.$inferSelect;
export type NewBenefitApplicationDetail = typeof benefitApplicationDetails.$inferInsert;
