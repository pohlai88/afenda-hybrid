import { integer, text, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { moneyFracOk } from "../_zodShared";
import { timestampColumns, softDeleteColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { payrollRuns } from "./payrollRuns";
import { payComponents } from "../fundamentals/payComponents";
import { statutorySchemes } from "../fundamentals/statutorySchemes";

/**
 * Payroll entries — line items per employee per payroll run.
 * When `rate` is set, `amount` should match `quantity × rate` (default quantity **1**); enforced in Zod within rounding tolerance.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const entryTypes = ["EARNING", "DEDUCTION", "EMPLOYER_CONTRIBUTION", "ADJUSTMENT"] as const;

export const entryTypeEnum = payrollSchema.enum("entry_type", [...entryTypes]);

export const EntryTypeSchema = z.enum(entryTypes);
export type EntryType = z.infer<typeof EntryTypeSchema>;

const MAX_AMOUNT_12_2 = 9_999_999_999.99;
const MAX_QUANTITY_8_2 = 999_999.99;
const MAX_RATE_12_4 = 99_999_999.9999; // numeric(12,4): 8 integer digits + 4 decimals

function isValidAmountMagnitudeString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return false;
  if (!moneyFracOk(s, 2)) return false;
  return Math.abs(n) <= MAX_AMOUNT_12_2;
}

/** `numeric(8, 2)` strictly positive when present. */
function isValidQuantityString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return false;
  if (!moneyFracOk(s, 2)) return false;
  return n <= MAX_QUANTITY_8_2;
}

/** `numeric(12, 4)` non-negative when present. */
function isValidRateString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return false;
  const frac = s.split(".")[1];
  if (frac !== undefined && frac.length > 4) return false;
  return n <= MAX_RATE_12_4;
}

function parseN(s: string): number {
  return Number.parseFloat(s);
}

function quantityStringForCalc(quantity: string | null | undefined): string {
  if (quantity == null || quantity === "") return "1";
  return quantity;
}

function refineAmountMatchesQuantityTimesRate(
  amount: string,
  quantity: string | null | undefined,
  rate: string | null | undefined,
  ctx: z.RefinementCtx,
  entryType?: EntryType
): void {
  if (entryType === "ADJUSTMENT") return;
  const a0 = parseN(amount);
  if (!Number.isFinite(a0) || a0 < 0) return;
  if (rate == null || rate === "") return;
  const qStr = quantityStringForCalc(quantity);
  if (!isValidQuantityString(qStr)) return;
  const q = parseN(qStr);
  const r = parseN(rate);
  const a = parseN(amount);
  if (!Number.isFinite(q) || !Number.isFinite(r) || !Number.isFinite(a)) return;
  const expected = q * r;
  if (Math.abs(a - expected) > 0.02) {
    ctx.addIssue({
      code: "custom",
      message: "amount must equal quantity × rate within 0.02 (rounding)",
      path: ["amount"],
    });
  }
}

function refineAmountSignForEntryType(
  entryType: EntryType,
  amount: string,
  ctx: z.RefinementCtx
): void {
  const a = parseN(amount);
  if (!Number.isFinite(a)) return;
  if (entryType === "ADJUSTMENT") {
    if (a === 0) {
      ctx.addIssue({
        code: "custom",
        message: "ADJUSTMENT amount must be non-zero",
        path: ["amount"],
      });
    }
    return;
  }
  if (a <= 0) {
    ctx.addIssue({
      code: "custom",
      message: "amount must be positive for EARNING, DEDUCTION, and EMPLOYER_CONTRIBUTION",
      path: ["amount"],
    });
  }
}

const descriptionSchema = z.string().trim().min(2).max(500);

const amountString = z.string().refine(isValidAmountMagnitudeString, {
  message: `amount must be a finite decimal with at most 2 decimal places and |amount| ≤ ${MAX_AMOUNT_12_2} (numeric 12,2)`,
});

const optionalQuantityString = z
  .string()
  .optional()
  .nullable()
  .refine((s) => s === undefined || s === null || isValidQuantityString(s), {
    message: "quantity must be positive with at most 2 decimal places (numeric 8,2)",
  });

const optionalRateString = z
  .string()
  .optional()
  .nullable()
  .refine((s) => s === undefined || s === null || s === "" || isValidRateString(s), {
    message: "rate must be non-negative with at most 4 decimal places (numeric 12,4)",
  });

const optionalAmountPatch = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidAmountMagnitudeString(s), {
    message: `amount must be a finite decimal with at most 2 decimal places and |amount| ≤ ${MAX_AMOUNT_12_2}`,
  });

export const payrollEntries = payrollSchema.table(
  "payroll_entries",
  {
    payrollEntryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    payrollRunId: integer().notNull(),
    employeeId: integer().notNull(),
    payComponentId: integer(),
    statutorySchemeId: integer(),
    entryType: entryTypeEnum().notNull(),
    description: text().notNull(),
    quantity: numeric({ precision: 8, scale: 2 }).default("1"),
    rate: numeric({ precision: 12, scale: 4 }),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    index("idx_payroll_entries_tenant").on(t.tenantId),
    index("idx_payroll_entries_run").on(t.tenantId, t.payrollRunId),
    index("idx_payroll_entries_employee").on(t.tenantId, t.employeeId),
    index("idx_payroll_entries_type").on(t.tenantId, t.entryType),
    index("idx_payroll_entries_component").on(t.tenantId, t.payComponentId),
    index("idx_payroll_entries_statutory_scheme").on(t.tenantId, t.statutorySchemeId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_payroll_entries_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payrollRunId],
      foreignColumns: [payrollRuns.payrollRunId],
      name: "fk_payroll_entries_run",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payComponentId],
      foreignColumns: [payComponents.payComponentId],
      name: "fk_payroll_entries_component",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.statutorySchemeId],
      foreignColumns: [statutorySchemes.statutorySchemeId],
      name: "fk_payroll_entries_statutory_scheme",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_payroll_entries_quantity", sql`${t.quantity} IS NULL OR ${t.quantity} > 0`),
  ]
);

export const PayrollEntryIdSchema = z.number().int().positive().brand<"PayrollEntryId">();
export type PayrollEntryId = z.infer<typeof PayrollEntryIdSchema>;

export const payrollEntrySelectSchema = createSelectSchema(payrollEntries);

const payrollEntryInsertSchemaBase = createInsertSchema(payrollEntries, {
  tenantId: z.number().int().positive(),
  payrollRunId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  payComponentId: z.number().int().positive().optional().nullable(),
  statutorySchemeId: z.number().int().positive().optional().nullable(),
  entryType: EntryTypeSchema,
  description: descriptionSchema,
  quantity: optionalQuantityString,
  rate: optionalRateString,
  amount: amountString,
});

export const payrollEntryInsertSchema = payrollEntryInsertSchemaBase.superRefine((data, ctx) => {
  refineAmountSignForEntryType(data.entryType, data.amount, ctx);
  refineAmountMatchesQuantityTimesRate(
    data.amount,
    data.quantity ?? undefined,
    data.rate ?? undefined,
    ctx,
    data.entryType
  );
});

export const payrollEntryUpdateSchema = createUpdateSchema(payrollEntries, {
  payComponentId: z.number().int().positive().optional().nullable(),
  statutorySchemeId: z.number().int().positive().optional().nullable(),
  entryType: EntryTypeSchema.optional(),
  description: descriptionSchema.optional(),
  quantity: optionalQuantityString,
  rate: optionalRateString,
  amount: optionalAmountPatch,
})
  .omit({ tenantId: true, employeeId: true, payrollRunId: true })
  .superRefine((data, ctx) => {
    const d = data as Record<string, unknown>;

    if (
      Object.prototype.hasOwnProperty.call(d, "entryType") &&
      Object.prototype.hasOwnProperty.call(d, "amount")
    ) {
      const et = d.entryType as EntryType | undefined;
      const am = d.amount as string | undefined;
      if (et !== undefined && am !== undefined) {
        refineAmountSignForEntryType(et, am, ctx);
      }
    }

    const hasAmt = Object.prototype.hasOwnProperty.call(d, "amount");
    const hasQty = Object.prototype.hasOwnProperty.call(d, "quantity");
    const hasRate = Object.prototype.hasOwnProperty.call(d, "rate");
    if (hasAmt && hasQty && hasRate) {
      const am = d.amount as string | undefined;
      const qty = d.quantity as string | null | undefined;
      const rate = d.rate as string | null | undefined;
      const et = Object.prototype.hasOwnProperty.call(d, "entryType")
        ? (d.entryType as EntryType | undefined)
        : undefined;
      if (am !== undefined && rate != null && rate !== "") {
        refineAmountMatchesQuantityTimesRate(am, qty, rate, ctx, et);
      }
    }
  });

export type PayrollEntry = typeof payrollEntries.$inferSelect;
export type NewPayrollEntry = typeof payrollEntries.$inferInsert;
