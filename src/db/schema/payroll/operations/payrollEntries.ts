import { integer, text, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { payrollRuns } from "./payrollRuns";
import { payComponents } from "../fundamentals/payComponents";
import { statutorySchemes } from "../fundamentals/statutorySchemes";

/**
 * Payroll Entries - Line items per employee per payroll run.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const entryTypes = ["EARNING", "DEDUCTION", "EMPLOYER_CONTRIBUTION", "ADJUSTMENT"] as const;

export const entryTypeEnum = payrollSchema.enum("entry_type", [...entryTypes]);

export const entryTypeZodEnum = createSelectSchema(entryTypeEnum);

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
    check(
      "chk_payroll_entries_quantity",
      sql`${t.quantity} IS NULL OR ${t.quantity} > 0`
    ),
  ]
);

export const PayrollEntryIdSchema = z.number().int().brand<"PayrollEntryId">();
export type PayrollEntryId = z.infer<typeof PayrollEntryIdSchema>;

export const payrollEntrySelectSchema = createSelectSchema(payrollEntries);

export const payrollEntryInsertSchema = createInsertSchema(payrollEntries, {
  description: z.string().min(1).max(500),
  quantity: z.string().optional(),
  rate: z.string().optional(),
  amount: z.string(),
});

export const payrollEntryUpdateSchema = createUpdateSchema(payrollEntries);

export type PayrollEntry = typeof payrollEntries.$inferSelect;
export type NewPayrollEntry = typeof payrollEntries.$inferInsert;
