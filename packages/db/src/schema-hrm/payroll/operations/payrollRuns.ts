import {
  integer,
  text,
  date,
  numeric,
  timestamp,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { moneyFracOk } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";
import { payrollPeriods } from "./payrollPeriods";
import { legalEntities } from "../../../schema-platform/core/legalEntities";

/**
 * Payroll runs — execution batches per period.
 * `runCode` uniqueness is case-insensitive (`lower(runCode)`); Zod normalizes to uppercase on write.
 * `totalNet` should equal `totalGross − totalDeductions` (Zod, within rounding). Non-zero totals require `employeeCount ≥ 1`.
 * Migrated from hr.payroll_runs with enhanced structure.
 * Circular FK note: processedBy FK added via custom SQL.
 */
export const payrollRunStatuses = [
  "DRAFT",
  "CALCULATING",
  "PENDING_APPROVAL",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

export const payrollRunStatusEnum = payrollSchema.enum("payroll_run_status", [
  ...payrollRunStatuses,
]);

export const PayrollRunStatusSchema = z.enum(payrollRunStatuses);
export type PayrollRunStatus = z.infer<typeof PayrollRunStatusSchema>;

const MAX_MONEY_14_2 = 999_999_999_999.99;

function isValidMoney14_2NonNegative(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return false;
  if (!moneyFracOk(s, 2)) return false;
  return n <= MAX_MONEY_14_2;
}

function parseMoney(s: string): number {
  return Number.parseFloat(s);
}

function defaultMoney(v: string | undefined): string {
  return v ?? "0";
}

function refineTotalsNetEqualsGrossMinusDeductions(
  totalGross: string | undefined,
  totalDeductions: string | undefined,
  totalNet: string | undefined,
  ctx: z.RefinementCtx
): void {
  const g = defaultMoney(totalGross);
  const d = defaultMoney(totalDeductions);
  const n = defaultMoney(totalNet);
  if (
    !isValidMoney14_2NonNegative(g) ||
    !isValidMoney14_2NonNegative(d) ||
    !isValidMoney14_2NonNegative(n)
  )
    return;
  const gross = parseMoney(g);
  const ded = parseMoney(d);
  const net = parseMoney(n);
  if (!Number.isFinite(gross) || !Number.isFinite(ded) || !Number.isFinite(net)) return;
  if (Math.abs(net - (gross - ded)) > 0.02) {
    ctx.addIssue({
      code: "custom",
      message: "totalNet must equal totalGross − totalDeductions within 0.02 (rounding)",
      path: ["totalNet"],
    });
  }
}

function anyTotalPositive(g?: string, d?: string, n?: string): boolean {
  return (
    parseMoney(defaultMoney(g)) > 0.015 ||
    parseMoney(defaultMoney(d)) > 0.015 ||
    parseMoney(defaultMoney(n)) > 0.015
  );
}

function refineEmployeeCountVsTotalsInsert(
  employeeCount: number | undefined,
  totalGross: string | undefined,
  totalDeductions: string | undefined,
  totalNet: string | undefined,
  ctx: z.RefinementCtx
): void {
  const ec = employeeCount ?? 0;
  if (anyTotalPositive(totalGross, totalDeductions, totalNet) && ec < 1) {
    ctx.addIssue({
      code: "custom",
      message: "employeeCount must be at least 1 when any total is greater than zero",
      path: ["employeeCount"],
    });
  }
}

function refineEmployeeCountVsTotalsUpdate(
  data: Record<string, unknown>,
  ctx: z.RefinementCtx
): void {
  if (
    !Object.prototype.hasOwnProperty.call(data, "employeeCount") ||
    (data.employeeCount as number) !== 0
  ) {
    return;
  }
  for (const key of ["totalGross", "totalDeductions", "totalNet"] as const) {
    if (!Object.prototype.hasOwnProperty.call(data, key) || data[key] == null) continue;
    const v = parseMoney(String(data[key]));
    if (Number.isFinite(v) && v > 0.015) {
      ctx.addIssue({
        code: "custom",
        message: "employeeCount must be at least 1 when any total in this patch is positive",
        path: ["employeeCount"],
      });
      return;
    }
  }
}

const runCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

const optionalMoney14_2 = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidMoney14_2NonNegative(s), {
    message: `Totals must be non-negative decimals with at most 2 decimal places and ≤ ${MAX_MONEY_14_2} (numeric 14,2)`,
  });

const optionalMoney14_2Nullable = z
  .string()
  .optional()
  .nullable()
  .refine((s) => s === undefined || s === null || isValidMoney14_2NonNegative(s), {
    message: `Totals must be non-negative decimals with at most 2 decimal places and ≤ ${MAX_MONEY_14_2} (numeric 14,2)`,
  });

type PayrollRunInsertWorkflow = {
  status?: PayrollRunStatus;
  approvedBy?: number | null;
  approvedAt?: Date | null;
  processedBy?: number | null;
  processedAt?: Date | null;
};

function refinePayrollRunInsertWorkflow(
  data: PayrollRunInsertWorkflow,
  ctx: z.RefinementCtx
): void {
  const status = data.status ?? "DRAFT";
  const hasApprovedBy = data.approvedBy != null;
  const hasApprovedAt = data.approvedAt != null;
  const hasProcessedBy = data.processedBy != null;
  const hasProcessedAt = data.processedAt != null;

  const preApproval =
    status === "DRAFT" || status === "CALCULATING" || status === "PENDING_APPROVAL";
  if (preApproval) {
    if (hasApprovedBy || hasApprovedAt || hasProcessedBy || hasProcessedAt) {
      ctx.addIssue({
        code: "custom",
        message:
          "Approval and processing fields must be unset for DRAFT, CALCULATING, and PENDING_APPROVAL",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "APPROVED") {
    if (!hasApprovedBy || !hasApprovedAt) {
      ctx.addIssue({
        code: "custom",
        message: "approvedBy and approvedAt are required when status is APPROVED",
        path: ["approvedBy"],
      });
    }
    if (hasProcessedBy || hasProcessedAt) {
      ctx.addIssue({
        code: "custom",
        message:
          "processedBy and processedAt must be unset until status is PROCESSING or COMPLETED",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "PROCESSING" || status === "COMPLETED") {
    if (!hasApprovedBy || !hasApprovedAt) {
      ctx.addIssue({
        code: "custom",
        message:
          "approvedBy and approvedAt are required (run must be approved before PROCESSING/COMPLETED)",
        path: ["approvedBy"],
      });
    }
    if (!hasProcessedBy || !hasProcessedAt) {
      ctx.addIssue({
        code: "custom",
        message: "processedBy and processedAt are required when status is PROCESSING or COMPLETED",
        path: ["processedBy"],
      });
    }
    return;
  }

  /* CANCELLED, FAILED — optional audit metadata */
}

function refinePayrollRunUpdateWorkflow(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  if (!Object.prototype.hasOwnProperty.call(data, "status") || data.status === undefined) {
    if (Object.prototype.hasOwnProperty.call(data, "approvedBy") && data.approvedBy != null) {
      ctx.addIssue({
        code: "custom",
        message: "Include status (e.g. APPROVED) in the same patch when setting approvedBy",
        path: ["approvedBy"],
      });
    }
    if (Object.prototype.hasOwnProperty.call(data, "approvedAt") && data.approvedAt != null) {
      ctx.addIssue({
        code: "custom",
        message: "Include status (e.g. APPROVED) in the same patch when setting approvedAt",
        path: ["approvedAt"],
      });
    }
    if (Object.prototype.hasOwnProperty.call(data, "processedBy") && data.processedBy != null) {
      ctx.addIssue({
        code: "custom",
        message: "Include status (e.g. PROCESSING) in the same patch when setting processedBy",
        path: ["processedBy"],
      });
    }
    if (Object.prototype.hasOwnProperty.call(data, "processedAt") && data.processedAt != null) {
      ctx.addIssue({
        code: "custom",
        message: "Include status (e.g. PROCESSING) in the same patch when setting processedAt",
        path: ["processedAt"],
      });
    }
    return;
  }

  const status = data.status as PayrollRunStatus;
  const approvedByTouched = Object.prototype.hasOwnProperty.call(data, "approvedBy");
  const approvedAtTouched = Object.prototype.hasOwnProperty.call(data, "approvedAt");
  const processedByTouched = Object.prototype.hasOwnProperty.call(data, "processedBy");
  const processedAtTouched = Object.prototype.hasOwnProperty.call(data, "processedAt");

  const approvedBy = data.approvedBy as number | null | undefined;
  const approvedAt = data.approvedAt as Date | null | undefined;
  const processedBy = data.processedBy as number | null | undefined;
  const processedAt = data.processedAt as Date | null | undefined;

  const preApproval =
    status === "DRAFT" || status === "CALCULATING" || status === "PENDING_APPROVAL";
  if (preApproval) {
    if (
      (approvedByTouched && approvedBy !== null) ||
      (approvedAtTouched && approvedAt !== null) ||
      (processedByTouched && processedBy !== null) ||
      (processedAtTouched && processedAt !== null)
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Cannot set approval or processing fields when moving to DRAFT, CALCULATING, or PENDING_APPROVAL",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "APPROVED") {
    if (
      !approvedByTouched ||
      approvedBy == null ||
      !Number.isFinite(approvedBy) ||
      approvedBy <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to APPROVED, include approvedBy in the same patch",
        path: ["approvedBy"],
      });
    }
    if (!approvedAtTouched || approvedAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "When setting status to APPROVED, include approvedAt in the same patch",
        path: ["approvedAt"],
      });
    }
    if (
      (processedByTouched && processedBy !== null) ||
      (processedAtTouched && processedAt !== null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "processedBy and processedAt must be null or omitted when status is APPROVED",
        path: ["status"],
      });
    }
    return;
  }

  if (status === "PROCESSING" || status === "COMPLETED") {
    if (
      !approvedByTouched ||
      approvedBy == null ||
      !Number.isFinite(approvedBy) ||
      approvedBy <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "When setting status to PROCESSING or COMPLETED, include approvedBy in the same patch",
        path: ["approvedBy"],
      });
    }
    if (!approvedAtTouched || approvedAt == null) {
      ctx.addIssue({
        code: "custom",
        message:
          "When setting status to PROCESSING or COMPLETED, include approvedAt in the same patch",
        path: ["approvedAt"],
      });
    }
    if (
      !processedByTouched ||
      processedBy == null ||
      !Number.isFinite(processedBy) ||
      processedBy <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "When setting status to PROCESSING or COMPLETED, include processedBy in the same patch",
        path: ["processedBy"],
      });
    }
    if (!processedAtTouched || processedAt == null) {
      ctx.addIssue({
        code: "custom",
        message:
          "When setting status to PROCESSING or COMPLETED, include processedAt in the same patch",
        path: ["processedAt"],
      });
    }
  }
}

function refinePayrollRunUpdateTotals(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const hasG = Object.prototype.hasOwnProperty.call(data, "totalGross");
  const hasD = Object.prototype.hasOwnProperty.call(data, "totalDeductions");
  const hasN = Object.prototype.hasOwnProperty.call(data, "totalNet");
  if (!hasG || !hasD || !hasN) return;
  const g = data.totalGross as string | undefined;
  const d = data.totalDeductions as string | undefined;
  const n = data.totalNet as string | undefined;
  if (g === undefined || d === undefined || n === undefined) return;
  refineTotalsNetEqualsGrossMinusDeductions(g, d, n, ctx);
}

export const payrollRuns = payrollSchema.table(
  "payroll_runs",
  {
    payrollRunId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    payrollPeriodId: integer().notNull(),
    legalEntityId: integer(),
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
    index("idx_payroll_runs_tenant_op_date").on(t.tenantId, t.status, t.processedAt),
    index("idx_payroll_runs_period").on(t.tenantId, t.payrollPeriodId),
    index("idx_payroll_runs_date").on(t.tenantId, t.runDate),
    index("idx_payroll_runs_status").on(t.tenantId, t.status),
    index("idx_payroll_runs_created").on(t.tenantId, t.createdAt),
    index("idx_payroll_runs_legal_entity").on(t.tenantId, t.legalEntityId),
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
      columns: [t.legalEntityId],
      foreignColumns: [legalEntities.legalEntityId],
      name: "fk_payroll_runs_legal_entity",
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
    check("chk_payroll_runs_employee_count", sql`${t.employeeCount} >= 0`),
  ]
);

export const PayrollRunIdSchema = z.number().int().positive().brand<"PayrollRunId">();
export type PayrollRunId = z.infer<typeof PayrollRunIdSchema>;

export const payrollRunSelectSchema = createSelectSchema(payrollRuns);

const payrollRunInsertSchemaBase = createInsertSchema(payrollRuns, {
  tenantId: z.number().int().positive(),
  payrollPeriodId: z.number().int().positive(),
  legalEntityId: z.number().int().positive().optional().nullable(),
  runCode: runCodeSchema,
  runDate: z.coerce.date(),
  totalGross: optionalMoney14_2,
  totalDeductions: optionalMoney14_2,
  totalNet: optionalMoney14_2,
  employeeCount: z.number().int().min(0).optional(),
  currencyId: z.number().int().positive(),
  status: PayrollRunStatusSchema.optional(),
  processedBy: z.number().int().positive().optional().nullable(),
  processedAt: z.coerce.date().optional().nullable(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const payrollRunInsertSchema = payrollRunInsertSchemaBase.superRefine((data, ctx) => {
  refineTotalsNetEqualsGrossMinusDeductions(
    data.totalGross,
    data.totalDeductions,
    data.totalNet,
    ctx
  );
  refineEmployeeCountVsTotalsInsert(
    data.employeeCount,
    data.totalGross,
    data.totalDeductions,
    data.totalNet,
    ctx
  );
  refinePayrollRunInsertWorkflow(data, ctx);
});

export const payrollRunUpdateSchema = createUpdateSchema(payrollRuns, {
  legalEntityId: z.number().int().positive().optional().nullable(),
  runCode: runCodeSchema.optional(),
  runDate: z.coerce.date().optional(),
  totalGross: optionalMoney14_2Nullable,
  totalDeductions: optionalMoney14_2Nullable,
  totalNet: optionalMoney14_2Nullable,
  employeeCount: z.number().int().min(0).optional(),
  currencyId: z.number().int().positive().optional(),
  status: PayrollRunStatusSchema.optional(),
  processedBy: z.number().int().positive().optional().nullable(),
  processedAt: z.coerce.date().optional().nullable(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})
  .omit({ tenantId: true, payrollPeriodId: true })
  .superRefine((data, ctx) => {
    refinePayrollRunUpdateTotals(data as Record<string, unknown>, ctx);
    refineEmployeeCountVsTotalsUpdate(data as Record<string, unknown>, ctx);
    refinePayrollRunUpdateWorkflow(data as Record<string, unknown>, ctx);
  });

export type PayrollRun = typeof payrollRuns.$inferSelect;
export type NewPayrollRun = typeof payrollRuns.$inferInsert;
