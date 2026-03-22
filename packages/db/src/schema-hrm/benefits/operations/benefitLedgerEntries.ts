import { integer, date, numeric, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { benefitsSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { benefitEnrollments } from "./benefitEnrollments";

/**
 * Benefit Ledger Entries - Transaction log for benefit allocations, claims, and adjustments.
 * Maintains running balance for each enrollment.
 */
export const benefitLedgerEntryTypes = ["ALLOCATION", "CLAIM", "ADJUSTMENT", "FORFEITURE"] as const;

export const benefitLedgerEntryTypeEnum = benefitsSchema.enum("benefit_ledger_entry_type", [
  ...benefitLedgerEntryTypes,
]);

export const BenefitLedgerEntryTypeSchema = z.enum(benefitLedgerEntryTypes);
export type BenefitLedgerEntryType = z.infer<typeof BenefitLedgerEntryTypeSchema>;

const CANONICAL_MONEY_12_2_SIGNED = /^-?(0|[1-9]\d{0,9})(\.\d{1,2})?$/;
const MAX_MONEY_12_2 = 9_999_999_999.99;

function isValidSignedMoney12_2(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_MONEY_12_2_SIGNED.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && Math.abs(n) <= MAX_MONEY_12_2;
}

export const benefitLedgerEntries = benefitsSchema.table(
  "benefit_ledger_entries",
  {
    ledgerEntryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    enrollmentId: integer().notNull(),
    transactionDate: date().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    entryType: benefitLedgerEntryTypeEnum().notNull(),
    balance: numeric({ precision: 12, scale: 2 }).notNull(),
    notes: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_benefit_ledger_entries_enrollment").on(t.enrollmentId),
    index("idx_benefit_ledger_entries_date").on(t.enrollmentId, t.transactionDate),
    index("idx_benefit_ledger_entries_type").on(t.enrollmentId, t.entryType),
    foreignKey({
      columns: [t.enrollmentId],
      foreignColumns: [benefitEnrollments.enrollmentId],
      name: "fk_benefit_ledger_entries_enrollment",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const BenefitLedgerEntryIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"BenefitLedgerEntryId">();
export type BenefitLedgerEntryId = z.infer<typeof BenefitLedgerEntryIdSchema>;

export const benefitLedgerEntrySelectSchema = createSelectSchema(benefitLedgerEntries);

export const benefitLedgerEntryInsertSchema = createInsertSchema(benefitLedgerEntries, {
  enrollmentId: z.number().int().positive(),
  transactionDate: z.coerce.date(),
  amount: z.string().refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)"),
  balance: z.string().refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)"),
  entryType: BenefitLedgerEntryTypeSchema,
  notes: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const benefitLedgerEntryUpdateSchema = createUpdateSchema(benefitLedgerEntries, {
  amount: z
    .string()
    .refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)")
    .optional(),
  balance: z
    .string()
    .refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)")
    .optional(),
  entryType: BenefitLedgerEntryTypeSchema.optional(),
  notes: z.string().max(1000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ enrollmentId: true, transactionDate: true });

export type BenefitLedgerEntry = typeof benefitLedgerEntries.$inferSelect;
export type NewBenefitLedgerEntry = typeof benefitLedgerEntries.$inferInsert;
