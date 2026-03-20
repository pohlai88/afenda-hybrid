import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Payroll Periods - Monthly/biweekly payroll cycles.
 */
export const periodStatuses = ["OPEN", "PROCESSING", "CLOSED", "LOCKED"] as const;

export const periodStatusEnum = payrollSchema.enum("period_status", [...periodStatuses]);

export const periodStatusZodEnum = createSelectSchema(periodStatusEnum);

export const payrollPeriods = payrollSchema.table(
  "payroll_periods",
  {
    payrollPeriodId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    periodCode: text().notNull(),
    ...nameColumn,
    periodStart: date().notNull(),
    periodEnd: date().notNull(),
    payDate: date().notNull(),
    status: periodStatusEnum().notNull().default("OPEN"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_payroll_periods_tenant").on(t.tenantId),
    index("idx_payroll_periods_dates").on(t.tenantId, t.periodStart, t.periodEnd),
    index("idx_payroll_periods_status").on(t.tenantId, t.status),
    uniqueIndex("uq_payroll_periods_code")
      .on(t.tenantId, sql`lower(${t.periodCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_payroll_periods_dates")
      .on(t.tenantId, t.periodStart, t.periodEnd)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_payroll_periods_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_payroll_periods_dates",
      sql`${t.periodEnd} >= ${t.periodStart}`
    ),
    check(
      "chk_payroll_periods_pay_date",
      sql`${t.payDate} >= ${t.periodEnd}`
    ),
  ]
);

export const PayrollPeriodIdSchema = z.number().int().brand<"PayrollPeriodId">();
export type PayrollPeriodId = z.infer<typeof PayrollPeriodIdSchema>;

export const payrollPeriodSelectSchema = createSelectSchema(payrollPeriods);

export const payrollPeriodInsertSchema = createInsertSchema(payrollPeriods, {
  periodCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
});

export const payrollPeriodUpdateSchema = createUpdateSchema(payrollPeriods);

export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type NewPayrollPeriod = typeof payrollPeriods.$inferInsert;
