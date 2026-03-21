import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import {
  dateValue,
  isValidNonNegativeMoney12_2,
  zMoney12_2NonNegative,
  zMoney12_2NonNegativeOptionalNullable,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";
import { payrollRuns } from "./payrollRuns";

/**
 * Payslips — official pay statements per employee per payroll run.
 * `payslipNumber` uniqueness is case-insensitive (`lower(payslipNumber)`); Zod normalizes to uppercase on write.
 * One row per (`tenantId`, `employeeId`, `payrollRunId`) among non-deleted rows (`uq_payslips_employee_run`).
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const payslipStatuses = ["DRAFT", "GENERATED", "SENT", "VIEWED", "ARCHIVED"] as const;

export const payslipStatusEnum = payrollSchema.enum("payslip_status", [...payslipStatuses]);

export const PayslipStatusSchema = z.enum(payslipStatuses);
export type PayslipStatus = z.infer<typeof PayslipStatusSchema>;

function parseMoney(s: string): number {
  return Number.parseFloat(s);
}

function refineNetEqualsGrossMinusDeductions(
  grossPay: string,
  totalDeductions: string,
  netPay: string,
  ctx: z.RefinementCtx,
): void {
  if (
    !isValidNonNegativeMoney12_2(grossPay) ||
    !isValidNonNegativeMoney12_2(totalDeductions) ||
    !isValidNonNegativeMoney12_2(netPay)
  ) {
    return;
  }
  const g = parseMoney(grossPay);
  const d = parseMoney(totalDeductions);
  const n = parseMoney(netPay);
  if (!Number.isFinite(g) || !Number.isFinite(d) || !Number.isFinite(n)) return;
  if (Math.abs(n - (g - d)) > 0.02) {
    ctx.addIssue({
      code: "custom",
      message: "netPay must equal grossPay − totalDeductions within 0.02 (rounding)",
      path: ["netPay"],
    });
  }
}

const payslipNumberSchema = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

const money12_2String = zMoney12_2NonNegative(
  "Amount must be a non-negative money string (numeric 12,2, canonical form)",
);

const optionalMoney12_2Nullable = zMoney12_2NonNegativeOptionalNullable(
  "Amount must be a non-negative money string (numeric 12,2, canonical form)",
);

type PayslipInsertWorkflow = {
  status?: PayslipStatus;
  generatedAt?: Date | null;
  sentAt?: Date | null;
  viewedAt?: Date | null;
};

function refinePayslipInsertWorkflow(data: PayslipInsertWorkflow, ctx: z.RefinementCtx): void {
  const status = data.status ?? "DRAFT";
  const hasGen = data.generatedAt != null;
  const hasSent = data.sentAt != null;
  const hasViewed = data.viewedAt != null;

  if (status === "DRAFT") {
    if (hasGen || hasSent || hasViewed) {
      ctx.addIssue({
        code: "custom",
        message: "generatedAt, sentAt, and viewedAt must be unset when status is DRAFT",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "GENERATED") {
    if (!hasGen) {
      ctx.addIssue({
        code: "custom",
        message: "generatedAt is required when status is GENERATED",
        path: ["generatedAt"],
      });
    }
    if (hasSent || hasViewed) {
      ctx.addIssue({
        code: "custom",
        message: "sentAt and viewedAt must be unset when status is GENERATED",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "SENT") {
    if (!hasGen || !hasSent) {
      ctx.addIssue({
        code: "custom",
        message: "generatedAt and sentAt are required when status is SENT",
        path: ["sentAt"],
      });
    }
    if (hasViewed) {
      ctx.addIssue({
        code: "custom",
        message: "viewedAt must be unset when status is SENT",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "VIEWED" || status === "ARCHIVED") {
    if (!hasGen || !hasSent || !hasViewed) {
      ctx.addIssue({
        code: "custom",
        message: "generatedAt, sentAt, and viewedAt are required when status is VIEWED or ARCHIVED",
        path: ["viewedAt"],
      });
    }
  }
}

function refinePayslipUpdateWorkflow(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const touch = (k: string) => Object.prototype.hasOwnProperty.call(data, k);

  if (!touch("status") || data.status === undefined) {
    if (touch("generatedAt") && data.generatedAt != null) {
      ctx.addIssue({
        code: "custom",
        message: "Include status (e.g. GENERATED) in the same patch when setting generatedAt",
        path: ["generatedAt"],
      });
    }
    if (touch("sentAt") && data.sentAt != null) {
      ctx.addIssue({
        code: "custom",
        message: "Include status (e.g. SENT) in the same patch when setting sentAt",
        path: ["sentAt"],
      });
    }
    if (touch("viewedAt") && data.viewedAt != null) {
      ctx.addIssue({
        code: "custom",
        message: "Include status (e.g. VIEWED) in the same patch when setting viewedAt",
        path: ["viewedAt"],
      });
    }
    return;
  }

  const status = data.status as PayslipStatus;
  const genT = touch("generatedAt");
  const sentT = touch("sentAt");
  const viewedT = touch("viewedAt");
  const generatedAt = data.generatedAt as Date | null | undefined;
  const sentAt = data.sentAt as Date | null | undefined;
  const viewedAt = data.viewedAt as Date | null | undefined;

  if (status === "DRAFT") {
    if (
      (genT && generatedAt !== null) ||
      (sentT && sentAt !== null) ||
      (viewedT && viewedAt !== null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot set workflow timestamps when moving to DRAFT",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "GENERATED") {
    if (!genT || generatedAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to GENERATED, include generatedAt in the same patch",
        path: ["generatedAt"],
      });
    }
    if ((sentT && sentAt !== null) || (viewedT && viewedAt !== null)) {
      ctx.addIssue({
        code: "custom",
        message: "sentAt and viewedAt must be null or omitted when status is GENERATED",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "SENT") {
    if (!genT || generatedAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to SENT, include generatedAt in the same patch",
        path: ["generatedAt"],
      });
    }
    if (!sentT || sentAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to SENT, include sentAt in the same patch",
        path: ["sentAt"],
      });
    }
    if (viewedT && viewedAt !== null) {
      ctx.addIssue({
        code: "custom",
        message: "viewedAt must be null or omitted when status is SENT",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "VIEWED" || status === "ARCHIVED") {
    if (!genT || generatedAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to VIEWED or ARCHIVED, include generatedAt in the same patch",
        path: ["generatedAt"],
      });
    }
    if (!sentT || sentAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to VIEWED or ARCHIVED, include sentAt in the same patch",
        path: ["sentAt"],
      });
    }
    if (!viewedT || viewedAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to VIEWED or ARCHIVED, include viewedAt in the same patch",
        path: ["viewedAt"],
      });
    }
  }
}

function refinePayslipInsertPeriod(data: { periodStart: Date; periodEnd: Date }, ctx: z.RefinementCtx): void {
  const a = dateValue(data.periodStart);
  const b = dateValue(data.periodEnd);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    ctx.addIssue({ code: "custom", message: "Invalid period dates", path: ["periodEnd"] });
    return;
  }
  if (b < a) {
    ctx.addIssue({
      code: "custom",
      message: "periodEnd must be on or after periodStart",
      path: ["periodEnd"],
    });
  }
}

function refinePayslipUpdatePeriod(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const hasStart = Object.prototype.hasOwnProperty.call(data, "periodStart");
  const hasEnd = Object.prototype.hasOwnProperty.call(data, "periodEnd");
  if (!hasStart || !hasEnd) return;
  const periodStart = data.periodStart as Date;
  const periodEnd = data.periodEnd as Date;
  if (periodStart === undefined || periodEnd === undefined) return;
  const a = dateValue(periodStart);
  const b = dateValue(periodEnd);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    ctx.addIssue({ code: "custom", message: "Invalid period dates", path: ["periodEnd"] });
    return;
  }
  if (b < a) {
    ctx.addIssue({
      code: "custom",
      message: "periodEnd must be on or after periodStart",
      path: ["periodEnd"],
    });
  }
}

function refinePayslipUpdateAmounts(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const hasG = Object.prototype.hasOwnProperty.call(data, "grossPay");
  const hasD = Object.prototype.hasOwnProperty.call(data, "totalDeductions");
  const hasN = Object.prototype.hasOwnProperty.call(data, "netPay");
  if (!hasG || !hasD || !hasN) return;
  const g = data.grossPay as string | undefined;
  const d = data.totalDeductions as string | undefined;
  const n = data.netPay as string | undefined;
  if (g === undefined || d === undefined || n === undefined) return;
  refineNetEqualsGrossMinusDeductions(g, d, n, ctx);
}

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
    index("idx_payslips_tenant_op_date").on(t.tenantId, t.status, t.generatedAt),
    index("idx_payslips_run").on(t.tenantId, t.payrollRunId),
    index("idx_payslips_employee").on(t.tenantId, t.employeeId),
    index("idx_payslips_period").on(t.tenantId, t.periodStart, t.periodEnd),
    index("idx_payslips_status").on(t.tenantId, t.status),
    index("idx_payslips_created").on(t.tenantId, t.createdAt),
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

export const PayslipIdSchema = z.number().int().positive().brand<"PayslipId">();
export type PayslipId = z.infer<typeof PayslipIdSchema>;

export const payslipSelectSchema = createSelectSchema(payslips);

const payslipInsertSchemaBase = createInsertSchema(payslips, {
  tenantId: z.number().int().positive(),
  payrollRunId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  payslipNumber: payslipNumberSchema,
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  payDate: z.coerce.date(),
  grossPay: money12_2String,
  totalDeductions: money12_2String,
  netPay: money12_2String,
  currencyId: z.number().int().positive(),
  status: PayslipStatusSchema.optional(),
  generatedAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  viewedAt: z.coerce.date().optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const payslipInsertSchema = payslipInsertSchemaBase.superRefine((data, ctx) => {
  refinePayslipInsertPeriod(data, ctx);
  refineNetEqualsGrossMinusDeductions(data.grossPay, data.totalDeductions, data.netPay, ctx);
  refinePayslipInsertWorkflow(data, ctx);
});

export const payslipUpdateSchema = createUpdateSchema(payslips, {
  payslipNumber: payslipNumberSchema.optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  payDate: z.coerce.date().optional(),
  grossPay: optionalMoney12_2Nullable,
  totalDeductions: optionalMoney12_2Nullable,
  netPay: optionalMoney12_2Nullable,
  currencyId: z.number().int().positive().optional(),
  status: PayslipStatusSchema.optional(),
  generatedAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  viewedAt: z.coerce.date().optional().nullable(),
})
  .omit({ tenantId: true, employeeId: true, payrollRunId: true })
  .superRefine((data, ctx) => {
    refinePayslipUpdatePeriod(data as Record<string, unknown>, ctx);
    refinePayslipUpdateAmounts(data as Record<string, unknown>, ctx);
    refinePayslipUpdateWorkflow(data as Record<string, unknown>, ctx);
  });

export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;
