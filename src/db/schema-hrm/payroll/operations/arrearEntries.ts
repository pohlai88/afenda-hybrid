import { integer, numeric, text, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { payrollRuns } from "./payrollRuns";
import { employees } from "../../hr/fundamentals/employees";
import { payComponents } from "../fundamentals/payComponents";
import { payrollPeriods } from "./payrollPeriods";

const CANONICAL_MONEY_12_2_SIGNED = /^-?(0|[1-9]\d{0,9})(\.\d{1,2})?$/;
const MAX_MONEY_12_2 = 9_999_999_999.99;

function isValidSignedMoney12_2(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_MONEY_12_2_SIGNED.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && Math.abs(n) <= MAX_MONEY_12_2;
}

/**
 * Arrear Entries - Retroactive pay adjustments for past periods.
 * Links current payroll run to historical period for backdated salary changes.
 */
export const arrearEntries = payrollSchema.table(
  "arrear_entries",
  {
    arrearId: integer().primaryKey().generatedAlwaysAsIdentity(),
    payrollRunId: integer().notNull(),
    employeeId: integer().notNull(),
    payComponentId: integer().notNull(),
    forPeriodId: integer().notNull(),
    arrearAmount: numeric({ precision: 12, scale: 2 }).notNull(),
    notes: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_arrear_entries_run").on(t.payrollRunId),
    index("idx_arrear_entries_employee").on(t.employeeId),
    index("idx_arrear_entries_period").on(t.forPeriodId),
    foreignKey({
      columns: [t.payrollRunId],
      foreignColumns: [payrollRuns.payrollRunId],
      name: "fk_arrear_entries_run",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_arrear_entries_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payComponentId],
      foreignColumns: [payComponents.payComponentId],
      name: "fk_arrear_entries_component",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.forPeriodId],
      foreignColumns: [payrollPeriods.payrollPeriodId],
      name: "fk_arrear_entries_period",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_arrear_entries_amount",
      sql`${t.arrearAmount} != 0`
    ),
  ]
);

export const ArrearEntryIdSchema = z.number().int().positive().brand<"ArrearEntryId">();
export type ArrearEntryId = z.infer<typeof ArrearEntryIdSchema>;

export const arrearEntrySelectSchema = createSelectSchema(arrearEntries);

export const arrearEntryInsertSchema = createInsertSchema(arrearEntries, {
  payrollRunId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  payComponentId: z.number().int().positive(),
  forPeriodId: z.number().int().positive(),
  arrearAmount: z.string().refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)"),
  notes: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const arrearEntryUpdateSchema = createUpdateSchema(arrearEntries, {
  arrearAmount: z.string().refine(isValidSignedMoney12_2, "must be valid signed numeric(12,2)").optional(),
  notes: z.string().max(1000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ payrollRunId: true, employeeId: true, payComponentId: true, forPeriodId: true });

export type ArrearEntry = typeof arrearEntries.$inferSelect;
export type NewArrearEntry = typeof arrearEntries.$inferInsert;
