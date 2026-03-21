import { integer, numeric, text, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { payrollCorrections } from "./payrollCorrections";
import { payComponents } from "../fundamentals/payComponents";

/**
 * Payroll Correction Entries - Line items for payroll corrections.
 * Each entry specifies a pay component adjustment (positive or negative).
 */

const CANONICAL_MONEY_12_2_SIGNED = /^-?(0|[1-9]\d{0,9})(\.\d{1,2})?$/;
const MAX_MONEY_12_2 = 9_999_999_999.99;

function isValidSignedMoney12_2(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_MONEY_12_2_SIGNED.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && Math.abs(n) <= MAX_MONEY_12_2;
}

export const payrollCorrectionEntries = payrollSchema.table(
  "payroll_correction_entries",
  {
    entryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    correctionId: integer().notNull(),
    payComponentId: integer().notNull(),
    adjustmentAmount: numeric({ precision: 12, scale: 2 }).notNull(),
    notes: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_payroll_correction_entries_correction").on(t.correctionId),
    index("idx_payroll_correction_entries_component").on(t.payComponentId),
    foreignKey({
      columns: [t.correctionId],
      foreignColumns: [payrollCorrections.correctionId],
      name: "fk_payroll_correction_entries_correction",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payComponentId],
      foreignColumns: [payComponents.payComponentId],
      name: "fk_payroll_correction_entries_component",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_payroll_correction_entries_amount",
      sql`${t.adjustmentAmount} != 0`
    ),
  ]
);

export const PayrollCorrectionEntryIdSchema = z.number().int().positive().brand<"PayrollCorrectionEntryId">();
export type PayrollCorrectionEntryId = z.infer<typeof PayrollCorrectionEntryIdSchema>;

export const payrollCorrectionEntrySelectSchema = createSelectSchema(payrollCorrectionEntries);

export const payrollCorrectionEntryInsertSchema = createInsertSchema(payrollCorrectionEntries, {
  correctionId: z.number().int().positive(),
  payComponentId: z.number().int().positive(),
  adjustmentAmount: z.string().refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)"),
  notes: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const payrollCorrectionEntryUpdateSchema = createUpdateSchema(payrollCorrectionEntries, {
  adjustmentAmount: z.string().refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)").optional(),
  notes: z.string().max(1000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ correctionId: true, payComponentId: true });

export type PayrollCorrectionEntry = typeof payrollCorrectionEntries.$inferSelect;
export type NewPayrollCorrectionEntry = typeof payrollCorrectionEntries.$inferInsert;
