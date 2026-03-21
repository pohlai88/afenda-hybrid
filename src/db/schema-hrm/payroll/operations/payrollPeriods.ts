import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { dateValue } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { legalEntities } from "../../../schema-platform/core/legalEntities";

/**
 * Payroll Periods - Monthly/biweekly payroll cycles.
 * Zod aligns with `chk_payroll_periods_dates` and `chk_payroll_periods_pay_date`.
 */
export const periodStatuses = ["OPEN", "PROCESSING", "CLOSED", "LOCKED"] as const;

export const periodStatusEnum = payrollSchema.enum("period_status", [...periodStatuses]);

export const PeriodStatusSchema = z.enum(periodStatuses);
export type PeriodStatus = z.infer<typeof PeriodStatusSchema>;

export const payrollPeriods = payrollSchema.table(
  "payroll_periods",
  {
    payrollPeriodId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    legalEntityId: integer(),
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
    index("idx_payroll_periods_legal_entity").on(t.tenantId, t.legalEntityId),
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
    foreignKey({
      columns: [t.legalEntityId],
      foreignColumns: [legalEntities.legalEntityId],
      name: "fk_payroll_periods_legal_entity",
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

export const PayrollPeriodIdSchema = z.number().int().positive().brand<"PayrollPeriodId">();
export type PayrollPeriodId = z.infer<typeof PayrollPeriodIdSchema>;

const periodCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

function refinePayrollPeriodDates(
  periodStart: Date,
  periodEnd: Date,
  payDate: Date,
  ctx: z.RefinementCtx,
): void {
  const fromT = dateValue(periodStart);
  const toT = dateValue(periodEnd);
  const payT = dateValue(payDate);
  if (Number.isNaN(fromT) || Number.isNaN(toT) || Number.isNaN(payT)) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid period or pay dates",
      path: ["periodEnd"],
    });
    return;
  }
  if (toT < fromT) {
    ctx.addIssue({
      code: "custom",
      message: "periodEnd must be on or after periodStart",
      path: ["periodEnd"],
    });
  }
  if (payT < toT) {
    ctx.addIssue({
      code: "custom",
      message: "payDate must be on or after periodEnd",
      path: ["payDate"],
    });
  }
}

export const payrollPeriodSelectSchema = createSelectSchema(payrollPeriods);

export const payrollPeriodInsertSchema = createInsertSchema(payrollPeriods, {
  tenantId: z.number().int().positive(),
  legalEntityId: z.number().int().positive().optional().nullable(),
  periodCode: periodCodeSchema,
  name: z.string().min(1).max(200),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  payDate: z.coerce.date(),
  status: PeriodStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  refinePayrollPeriodDates(data.periodStart, data.periodEnd, data.payDate, ctx);
});

/** Patch: `tenantId` immutable; when any of `periodStart` / `periodEnd` / `payDate` is set, all three must appear (DB CHECK applies to full row). */
export const payrollPeriodUpdateSchema = createUpdateSchema(payrollPeriods, {
  legalEntityId: z.number().int().positive().optional().nullable(),
  periodCode: periodCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  payDate: z.coerce.date().optional(),
  status: PeriodStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true })
  .superRefine((data, ctx) => {
    const d = data as Record<string, unknown>;
    const keys = ["periodStart", "periodEnd", "payDate"] as const;
    const anyTouched = keys.some((k) => Object.prototype.hasOwnProperty.call(d, k));
    if (!anyTouched) return;
    const allTouched = keys.every((k) => Object.prototype.hasOwnProperty.call(d, k));
    if (!allTouched) {
      ctx.addIssue({
        code: "custom",
        message: "periodStart, periodEnd, and payDate must be updated together",
        path: ["periodStart"],
      });
      return;
    }
    refinePayrollPeriodDates(
      d.periodStart as Date,
      d.periodEnd as Date,
      d.payDate as Date,
      ctx,
    );
  });

export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type NewPayrollPeriod = typeof payrollPeriods.$inferInsert;
