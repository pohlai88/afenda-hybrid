import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { payrollRuns } from "./payrollRuns";

/**
 * Payslips - Official pay statements for employees.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const payslipStatuses = ["DRAFT", "GENERATED", "SENT", "VIEWED", "ARCHIVED"] as const;

export const payslipStatusEnum = payrollSchema.enum("payslip_status", [...payslipStatuses]);

export const payslipStatusZodEnum = createSelectSchema(payslipStatusEnum);

export const payslips = payrollSchema.table(
  "payslips",
  {
    payslipId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    payrollRunId: integer().notNull(),
    employeeId: integer().notNull(),
    payslipNumber: text().notNull(),
    periodStart: date().notNull(),
    periodEnd: date().notNull(),
    payDate: date().notNull(),
    grossPay: numeric({ precision: 12, scale: 2 }).notNull(),
    totalDeductions: numeric({ precision: 12, scale: 2 }).notNull(),
    netPay: numeric({ precision: 12, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    status: payslipStatusEnum().notNull().default("DRAFT"),
    generatedAt: timestamp({ withTimezone: true }),
    sentAt: timestamp({ withTimezone: true }),
    viewedAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_payslips_tenant").on(t.tenantId),
    index("idx_payslips_run").on(t.tenantId, t.payrollRunId),
    index("idx_payslips_employee").on(t.tenantId, t.employeeId),
    index("idx_payslips_period").on(t.tenantId, t.periodStart, t.periodEnd),
    index("idx_payslips_status").on(t.tenantId, t.status),
    uniqueIndex("uq_payslips_number")
      .on(t.tenantId, sql`lower(${t.payslipNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_payslips_employee_run")
      .on(t.tenantId, t.employeeId, t.payrollRunId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_payslips_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payrollRunId],
      foreignColumns: [payrollRuns.payrollRunId],
      name: "fk_payslips_run",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_payslips_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_payslips_amounts",
      sql`${t.grossPay} >= 0 AND ${t.totalDeductions} >= 0 AND ${t.netPay} >= 0`
    ),
    check(
      "chk_payslips_period",
      sql`${t.periodEnd} >= ${t.periodStart}`
    ),
  ]
);

export const PayslipIdSchema = z.number().int().brand<"PayslipId">();
export type PayslipId = z.infer<typeof PayslipIdSchema>;

export const payslipSelectSchema = createSelectSchema(payslips);

export const payslipInsertSchema = createInsertSchema(payslips, {
  payslipNumber: z.string().min(1).max(50),
  grossPay: z.string(),
  totalDeductions: z.string(),
  netPay: z.string(),
});

export const payslipUpdateSchema = createUpdateSchema(payslips);

export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;
