import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { payrollPeriods } from "./payrollPeriods";

/**
 * Payroll Runs - Payroll execution batches.
 * Migrated from hr.payroll_runs with enhanced structure.
 * Circular FK note: processedBy FK added via custom SQL.
 */
export const payrollRunStatuses = ["DRAFT", "CALCULATING", "PENDING_APPROVAL", "APPROVED", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED"] as const;

export const payrollRunStatusEnum = payrollSchema.enum("payroll_run_status", [...payrollRunStatuses]);

export const payrollRunStatusZodEnum = createSelectSchema(payrollRunStatusEnum);

export const payrollRuns = payrollSchema.table(
  "payroll_runs",
  {
    payrollRunId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    payrollPeriodId: integer().notNull(),
    runCode: text().notNull(),
    runDate: date().notNull(),
    totalGross: numeric({ precision: 14, scale: 2 }).notNull().default("0"),
    totalDeductions: numeric({ precision: 14, scale: 2 }).notNull().default("0"),
    totalNet: numeric({ precision: 14, scale: 2 }).notNull().default("0"),
    employeeCount: integer().notNull().default(0),
    currencyId: integer().notNull(),
    status: payrollRunStatusEnum().notNull().default("DRAFT"),
    processedBy: integer(),
    processedAt: timestamp({ withTimezone: true }),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_payroll_runs_tenant").on(t.tenantId),
    index("idx_payroll_runs_period").on(t.tenantId, t.payrollPeriodId),
    index("idx_payroll_runs_date").on(t.tenantId, t.runDate),
    index("idx_payroll_runs_status").on(t.tenantId, t.status),
    uniqueIndex("uq_payroll_runs_code")
      .on(t.tenantId, sql`lower(${t.runCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_payroll_runs_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payrollPeriodId],
      foreignColumns: [payrollPeriods.payrollPeriodId],
      name: "fk_payroll_runs_period",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_payroll_runs_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_payroll_runs_totals",
      sql`${t.totalGross} >= 0 AND ${t.totalDeductions} >= 0 AND ${t.totalNet} >= 0`
    ),
    check(
      "chk_payroll_runs_employee_count",
      sql`${t.employeeCount} >= 0`
    ),
  ]
);

export const PayrollRunIdSchema = z.number().int().brand<"PayrollRunId">();
export type PayrollRunId = z.infer<typeof PayrollRunIdSchema>;

export const payrollRunSelectSchema = createSelectSchema(payrollRuns);

export const payrollRunInsertSchema = createInsertSchema(payrollRuns, {
  runCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  totalGross: z.string().optional(),
  totalDeductions: z.string().optional(),
  totalNet: z.string().optional(),
  employeeCount: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export const payrollRunUpdateSchema = createUpdateSchema(payrollRuns);

export type PayrollRun = typeof payrollRuns.$inferSelect;
export type NewPayrollRun = typeof payrollRuns.$inferInsert;
