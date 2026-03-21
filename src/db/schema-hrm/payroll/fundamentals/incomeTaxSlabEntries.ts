import { integer, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { incomeTaxSlabs } from "./incomeTaxSlabs";

/**
 * Income Tax Slab Entries - Individual tax brackets within a slab.
 * Defines progressive tax rates: fromAmount-toAmount range with taxRate and fixedAmount.
 * NULL toAmount means "infinity" (top bracket).
 */

const CANONICAL_MONEY_15_2 = /^(0|[1-9]\d{0,12})(\.\d{1,2})?$/;
const MAX_MONEY_15_2 = 9_999_999_999_999.99;

function isValidMoney15_2(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_MONEY_15_2.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= MAX_MONEY_15_2;
}

const CANONICAL_RATE_5_2 = /^(0|[1-9]\d{0,2})(\.\d{1,2})?$/;

function isValidTaxRate(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_RATE_5_2.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

export const incomeTaxSlabEntries = payrollSchema.table(
  "income_tax_slab_entries",
  {
    entryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    taxSlabId: integer().notNull(),
    fromAmount: numeric({ precision: 15, scale: 2 }).notNull(),
    toAmount: numeric({ precision: 15, scale: 2 }),
    taxRate: numeric({ precision: 5, scale: 2 }).notNull(),
    fixedAmount: numeric({ precision: 15, scale: 2 }).notNull().default("0.00"),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_income_tax_slab_entries_slab").on(t.taxSlabId),
    foreignKey({
      columns: [t.taxSlabId],
      foreignColumns: [incomeTaxSlabs.taxSlabId],
      name: "fk_income_tax_slab_entries_slab",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_income_tax_slab_entries_range",
      sql`${t.toAmount} IS NULL OR ${t.toAmount} > ${t.fromAmount}`
    ),
    check(
      "chk_income_tax_slab_entries_rate",
      sql`${t.taxRate} >= 0 AND ${t.taxRate} <= 100`
    ),
    check(
      "chk_income_tax_slab_entries_from_amount",
      sql`${t.fromAmount} >= 0`
    ),
    check(
      "chk_income_tax_slab_entries_fixed_amount",
      sql`${t.fixedAmount} >= 0`
    ),
  ]
);

export const TaxSlabEntryIdSchema = z.number().int().positive().brand<"TaxSlabEntryId">();
export type TaxSlabEntryId = z.infer<typeof TaxSlabEntryIdSchema>;

export const incomeTaxSlabEntrySelectSchema = createSelectSchema(incomeTaxSlabEntries);

export const incomeTaxSlabEntryInsertSchema = createInsertSchema(incomeTaxSlabEntries, {
  taxSlabId: z.number().int().positive(),
  fromAmount: z.string().refine(isValidMoney15_2, "must be valid numeric(15,2) >= 0"),
  toAmount: z.string().refine(isValidMoney15_2, "must be valid numeric(15,2) >= 0").optional().nullable(),
  taxRate: z.string().refine(isValidTaxRate, "must be valid percentage 0-100 with max 2 decimals"),
  fixedAmount: z.string().refine(isValidMoney15_2, "must be valid numeric(15,2) >= 0").optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.toAmount) {
    const from = Number.parseFloat(data.fromAmount);
    const to = Number.parseFloat(data.toAmount);
    if (to <= from) {
      ctx.addIssue({
        code: "custom",
        message: "toAmount must be greater than fromAmount",
        path: ["toAmount"],
      });
    }
  }
});

export const incomeTaxSlabEntryUpdateSchema = createUpdateSchema(incomeTaxSlabEntries, {
  fromAmount: z.string().refine(isValidMoney15_2, "must be valid numeric(15,2) >= 0").optional(),
  toAmount: z.string().refine(isValidMoney15_2, "must be valid numeric(15,2) >= 0").optional().nullable(),
  taxRate: z.string().refine(isValidTaxRate, "must be valid percentage 0-100 with max 2 decimals").optional(),
  fixedAmount: z.string().refine(isValidMoney15_2, "must be valid numeric(15,2) >= 0").optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ taxSlabId: true });

export type IncomeTaxSlabEntry = typeof incomeTaxSlabEntries.$inferSelect;
export type NewIncomeTaxSlabEntry = typeof incomeTaxSlabEntries.$inferInsert;
