import { integer, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { gratuityRules } from "./gratuityRules";

/**
 * Gratuity Rule Slabs - Service year brackets for gratuity calculation.
 * Defines fraction of salary per year of service within each bracket.
 */

const CANONICAL_FRACTION = /^(0|1)(\.\d{1,4})?$/;

function isValidFraction(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_FRACTION.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= 1;
}

export const gratuityRuleSlabs = payrollSchema.table(
  "gratuity_rule_slabs",
  {
    slabId: integer().primaryKey().generatedAlwaysAsIdentity(),
    ruleId: integer().notNull(),
    fromYears: numeric({ precision: 5, scale: 2 }).notNull(),
    toYears: numeric({ precision: 5, scale: 2 }),
    fractionOfSalary: numeric({ precision: 5, scale: 4 }).notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_gratuity_rule_slabs_rule").on(t.ruleId),
    foreignKey({
      columns: [t.ruleId],
      foreignColumns: [gratuityRules.ruleId],
      name: "fk_gratuity_rule_slabs_rule",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_gratuity_rule_slabs_years_range",
      sql`${t.toYears} IS NULL OR ${t.toYears} > ${t.fromYears}`
    ),
    check(
      "chk_gratuity_rule_slabs_from_years",
      sql`${t.fromYears} >= 0`
    ),
    check(
      "chk_gratuity_rule_slabs_fraction",
      sql`${t.fractionOfSalary} >= 0 AND ${t.fractionOfSalary} <= 1`
    ),
  ]
);

export const GratuityRuleSlabIdSchema = z.number().int().positive().brand<"GratuityRuleSlabId">();
export type GratuityRuleSlabId = z.infer<typeof GratuityRuleSlabIdSchema>;

const yearsSchema = z.string().regex(/^\d{1,3}(\.\d{1,2})?$/, "must be valid numeric(5,2) >= 0");

export const gratuityRuleSlabSelectSchema = createSelectSchema(gratuityRuleSlabs);

export const gratuityRuleSlabInsertSchema = createInsertSchema(gratuityRuleSlabs, {
  ruleId: z.number().int().positive(),
  fromYears: yearsSchema,
  toYears: yearsSchema.optional().nullable(),
  fractionOfSalary: z.string().refine(isValidFraction, "must be valid fraction 0-1 with max 4 decimals"),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.toYears) {
    const from = Number.parseFloat(data.fromYears);
    const to = Number.parseFloat(data.toYears);
    if (to <= from) {
      ctx.addIssue({
        code: "custom",
        message: "toYears must be greater than fromYears",
        path: ["toYears"],
      });
    }
  }
});

export const gratuityRuleSlabUpdateSchema = createUpdateSchema(gratuityRuleSlabs, {
  fromYears: yearsSchema.optional(),
  toYears: yearsSchema.optional().nullable(),
  fractionOfSalary: z.string().refine(isValidFraction, "must be valid fraction 0-1 with max 4 decimals").optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ ruleId: true });

export type GratuityRuleSlab = typeof gratuityRuleSlabs.$inferSelect;
export type NewGratuityRuleSlab = typeof gratuityRuleSlabs.$inferInsert;
