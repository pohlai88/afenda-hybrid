import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Final Settlements - End-of-employment payout calculations.
 * Circular FK note: employeeId, processedBy, approvedBy FKs added via custom SQL.
 */
export const settlementStatuses = ["DRAFT", "CALCULATING", "PENDING_APPROVAL", "APPROVED", "PROCESSING", "PAID", "CANCELLED"] as const;

export const settlementStatusEnum = payrollSchema.enum("settlement_status", [...settlementStatuses]);

/** Application Zod for `settlement_status` (DB-first guideline Appendix C: pgEnum → z.enum). */
export const SettlementStatusSchema = z.enum(settlementStatuses);
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;

/** Matches `numeric(12, 2)`: 0 .. 9_999_999_999.99, at most two fractional digits. */
function isValidNonNegativeSettlementMoneyString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 9_999_999_999.99) return false;
  const frac = s.split(".")[1];
  return frac === undefined || frac.length <= 2;
}

const settlementMoneyString = z.string().refine(isValidNonNegativeSettlementMoneyString, {
  message: "must be a non-negative decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
});

const optionalSettlementMoneyString = z
  .string()
  .optional()
  .refine((v) => v === undefined || isValidNonNegativeSettlementMoneyString(v), {
    message: "must be a non-negative decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
  });

const settlementNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .transform((s) => s.toUpperCase());

function moneyStringToCents(s: string): number {
  const [intPart, frac = ""] = s.trim().split(".");
  const frac2 = (frac + "00").slice(0, 2);
  return Number.parseInt(intPart, 10) * 100 + Number.parseInt(frac2, 10);
}

function settlementTotalsBalance(totalEarnings: string, totalDeductions: string, netSettlement: string): boolean {
  if (
    !isValidNonNegativeSettlementMoneyString(totalEarnings) ||
    !isValidNonNegativeSettlementMoneyString(totalDeductions) ||
    !isValidNonNegativeSettlementMoneyString(netSettlement)
  ) {
    return false;
  }
  const netCents = moneyStringToCents(netSettlement);
  const expected = moneyStringToCents(totalEarnings) - moneyStringToCents(totalDeductions);
  return netCents === expected;
}

function lastWorkingDayNotAfterTermination(lastWorkingDay: Date, terminationDate: Date): boolean {
  return lastWorkingDay.getTime() <= terminationDate.getTime();
}

type FinalSettlementInsertWorkflow = {
  status?: SettlementStatus;
  processedBy?: number | null;
  processedAt?: Date | null;
  approvedBy?: number | null;
  approvedAt?: Date | null;
  paidAt?: Date | null;
};

function refineFinalSettlementInsertWorkflow(data: FinalSettlementInsertWorkflow, ctx: z.RefinementCtx): void {
  const status = data.status ?? "DRAFT";
  const hasProcessedBy = data.processedBy != null;
  const hasProcessedAt = data.processedAt != null;
  const hasApprovedBy = data.approvedBy != null;
  const hasApprovedAt = data.approvedAt != null;
  const hasPaidAt = data.paidAt != null;

  if (status === "CANCELLED") {
    if (hasProcessedBy || hasProcessedAt || hasApprovedBy || hasApprovedAt || hasPaidAt) {
      ctx.addIssue({
        code: "custom",
        message: "processedBy, processedAt, approvedBy, approvedAt, and paidAt must be unset when status is CANCELLED",
        path: ["status"],
      });
    }
    return;
  }

  const needsApprovalMeta = status === "APPROVED" || status === "PROCESSING" || status === "PAID";
  if (needsApprovalMeta) {
    if (!hasApprovedBy || !hasApprovedAt) {
      ctx.addIssue({
        code: "custom",
        message: "approvedBy and approvedAt are required when status is APPROVED, PROCESSING, or PAID",
        path: ["approvedBy"],
      });
    }
  } else if (hasApprovedBy || hasApprovedAt) {
    ctx.addIssue({
      code: "custom",
      message: "approvedBy and approvedAt are only allowed when status is APPROVED, PROCESSING, or PAID",
      path: ["approvedBy"],
    });
  }

  if (status === "PAID") {
    if (!hasPaidAt) {
      ctx.addIssue({
        code: "custom",
        message: "paidAt is required when status is PAID",
        path: ["paidAt"],
      });
    }
  } else if (hasPaidAt) {
    ctx.addIssue({
      code: "custom",
      message: "paidAt is only allowed when status is PAID",
      path: ["paidAt"],
    });
  }
}

function refineFinalSettlementUpdateWorkflow(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const statusTouched = Object.prototype.hasOwnProperty.call(data, "status");
  const status = data.status as SettlementStatus | undefined;

  if (statusTouched && status !== undefined) {
    const processedByTouched = Object.prototype.hasOwnProperty.call(data, "processedBy");
    const processedAtTouched = Object.prototype.hasOwnProperty.call(data, "processedAt");
    const approvedByTouched = Object.prototype.hasOwnProperty.call(data, "approvedBy");
    const approvedAtTouched = Object.prototype.hasOwnProperty.call(data, "approvedAt");
    const paidAtTouched = Object.prototype.hasOwnProperty.call(data, "paidAt");

    const processedBy = data.processedBy as number | null | undefined;
    const processedAt = data.processedAt as Date | null | undefined;
    const approvedBy = data.approvedBy as number | null | undefined;
    const approvedAt = data.approvedAt as Date | null | undefined;
    const paidAt = data.paidAt as Date | null | undefined;

    const hasApprovedBy = approvedBy != null;
    const hasApprovedAt = approvedAt != null;
    const hasPaidAt = paidAt != null;

    if (status === "CANCELLED") {
      if (paidAtTouched && paidAt != null) {
        ctx.addIssue({
          code: "custom",
          message: "paidAt must be null when status is CANCELLED",
          path: ["paidAt"],
        });
      }
      if ((approvedByTouched && approvedBy != null) || (approvedAtTouched && approvedAt != null)) {
        ctx.addIssue({
          code: "custom",
          message: "Cannot set approval fields when status is CANCELLED",
          path: ["approvedBy"],
        });
      }
      if ((processedByTouched && processedBy != null) || (processedAtTouched && processedAt != null)) {
        ctx.addIssue({
          code: "custom",
          message: "Cannot set processedBy/processedAt when status is CANCELLED",
          path: ["processedBy"],
        });
      }
      return;
    }

    const needsApprovalMeta = status === "APPROVED" || status === "PROCESSING" || status === "PAID";
    if (needsApprovalMeta) {
      if (!approvedByTouched || approvedBy == null || !Number.isFinite(approvedBy) || approvedBy <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to APPROVED, PROCESSING, or PAID, include approvedBy in the same patch",
          path: ["approvedBy"],
        });
      }
      if (!approvedAtTouched || approvedAt == null) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to APPROVED, PROCESSING, or PAID, include approvedAt in the same patch",
          path: ["approvedAt"],
        });
      }
    } else {
      if (hasApprovedBy || hasApprovedAt) {
        ctx.addIssue({
          code: "custom",
          message: "approvedBy and approvedAt are only valid for APPROVED, PROCESSING, or PAID",
          path: ["approvedBy"],
        });
      }
    }

    if (status === "PAID") {
      if (!paidAtTouched || paidAt == null) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to PAID, include paidAt in the same patch",
          path: ["paidAt"],
        });
      }
    } else if (paidAtTouched && paidAt != null) {
      ctx.addIssue({
        code: "custom",
        message: "paidAt is only allowed when status is PAID",
        path: ["paidAt"],
      });
    }

    return;
  }

  if (Object.prototype.hasOwnProperty.call(data, "paidAt") && data.paidAt != null) {
    ctx.addIssue({
      code: "custom",
      message: "Include status: PAID in the same patch when setting paidAt",
      path: ["paidAt"],
    });
  }

  const abTouched = Object.prototype.hasOwnProperty.call(data, "approvedBy");
  const aaTouched = Object.prototype.hasOwnProperty.call(data, "approvedAt");
  const ab = data.approvedBy as number | null | undefined;
  const aa = data.approvedAt as Date | null | undefined;

  if ((abTouched && ab != null) || (aaTouched && aa != null)) {
    ctx.addIssue({
      code: "custom",
      message: "Include status (APPROVED, PROCESSING, or PAID) in the same patch when setting approval fields",
      path: ["approvedBy"],
    });
  }
}

export const finalSettlements = payrollSchema.table(
  "final_settlements",
  {
    finalSettlementId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    settlementNumber: text().notNull(),
    terminationDate: date().notNull(),
    lastWorkingDay: date().notNull(),
    unpaidSalary: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    leaveEncashment: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    gratuity: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    bonus: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    otherEarnings: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    totalEarnings: numeric({ precision: 12, scale: 2 }).notNull(),
    loanRecovery: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    advanceRecovery: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    otherDeductions: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    totalDeductions: numeric({ precision: 12, scale: 2 }).notNull(),
    netSettlement: numeric({ precision: 12, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    status: settlementStatusEnum().notNull().default("DRAFT"),
    processedBy: integer(),
    processedAt: timestamp({ withTimezone: true }),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    paidAt: timestamp({ withTimezone: true }),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_final_settlements_tenant").on(t.tenantId),
    index("idx_final_settlements_tenant_op_date").on(t.tenantId, t.status, t.processedAt),
    index("idx_final_settlements_employee").on(t.tenantId, t.employeeId),
    index("idx_final_settlements_status").on(t.tenantId, t.status),
    index("idx_final_settlements_date").on(t.tenantId, t.terminationDate),
    uniqueIndex("uq_final_settlements_number")
      .on(t.tenantId, sql`lower(${t.settlementNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_final_settlements_employee")
      .on(t.tenantId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} != 'CANCELLED'`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_final_settlements_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_final_settlements_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_final_settlements_earnings",
      sql`${t.unpaidSalary} >= 0 AND ${t.leaveEncashment} >= 0 AND ${t.gratuity} >= 0 AND ${t.bonus} >= 0 AND ${t.otherEarnings} >= 0`
    ),
    check(
      "chk_final_settlements_deductions",
      sql`${t.loanRecovery} >= 0 AND ${t.advanceRecovery} >= 0 AND ${t.otherDeductions} >= 0`
    ),
    check(
      "chk_final_settlements_totals",
      sql`${t.totalEarnings} >= 0 AND ${t.totalDeductions} >= 0`
    ),
    check(
      "chk_final_settlements_dates",
      sql`${t.lastWorkingDay} <= ${t.terminationDate}`
    ),
  ]
);

export const FinalSettlementIdSchema = z.number().int().positive().brand<"FinalSettlementId">();
export type FinalSettlementId = z.infer<typeof FinalSettlementIdSchema>;

export const finalSettlementSelectSchema = createSelectSchema(finalSettlements);

const finalSettlementInsertSchemaBase = createInsertSchema(finalSettlements, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  settlementNumber: settlementNumberSchema,
  terminationDate: z.coerce.date(),
  lastWorkingDay: z.coerce.date(),
  unpaidSalary: optionalSettlementMoneyString,
  leaveEncashment: optionalSettlementMoneyString,
  gratuity: optionalSettlementMoneyString,
  bonus: optionalSettlementMoneyString,
  otherEarnings: optionalSettlementMoneyString,
  totalEarnings: settlementMoneyString,
  loanRecovery: optionalSettlementMoneyString,
  advanceRecovery: optionalSettlementMoneyString,
  otherDeductions: optionalSettlementMoneyString,
  totalDeductions: settlementMoneyString,
  netSettlement: settlementMoneyString,
  currencyId: z.number().int().positive(),
  status: SettlementStatusSchema.optional(),
  processedBy: z.number().int().positive().optional().nullable(),
  processedAt: z.coerce.date().optional().nullable(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const finalSettlementInsertSchema = finalSettlementInsertSchemaBase.superRefine((data, ctx) => {
  refineFinalSettlementInsertWorkflow(data, ctx);

  if (!lastWorkingDayNotAfterTermination(data.lastWorkingDay, data.terminationDate)) {
    ctx.addIssue({
      code: "custom",
      message: "lastWorkingDay must be on or before terminationDate",
      path: ["lastWorkingDay"],
    });
  }

  const te = data.totalEarnings ?? "";
  const td = data.totalDeductions ?? "";
  const ns = data.netSettlement ?? "";
  if (!settlementTotalsBalance(te, td, ns)) {
    ctx.addIssue({
      code: "custom",
      message: "netSettlement must equal totalEarnings minus totalDeductions (to cents)",
      path: ["netSettlement"],
    });
  }

  const netCents = moneyStringToCents(ns);
  if (netCents < 0) {
    ctx.addIssue({
      code: "custom",
      message: "netSettlement must be non-negative",
      path: ["netSettlement"],
    });
  }
});

export const finalSettlementUpdateSchema = createUpdateSchema(finalSettlements, {
  settlementNumber: settlementNumberSchema.optional(),
  terminationDate: z.coerce.date().optional(),
  lastWorkingDay: z.coerce.date().optional(),
  unpaidSalary: optionalSettlementMoneyString,
  leaveEncashment: optionalSettlementMoneyString,
  gratuity: optionalSettlementMoneyString,
  bonus: optionalSettlementMoneyString,
  otherEarnings: optionalSettlementMoneyString,
  totalEarnings: optionalSettlementMoneyString,
  loanRecovery: optionalSettlementMoneyString,
  advanceRecovery: optionalSettlementMoneyString,
  otherDeductions: optionalSettlementMoneyString,
  totalDeductions: optionalSettlementMoneyString,
  netSettlement: optionalSettlementMoneyString,
  currencyId: z.number().int().positive().optional(),
  status: SettlementStatusSchema.optional(),
  processedBy: z.number().int().positive().optional().nullable(),
  processedAt: z.coerce.date().optional().nullable(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true, employeeId: true })
  .superRefine((data, ctx) => {
    refineFinalSettlementUpdateWorkflow(data as Record<string, unknown>, ctx);

    const d = data as Record<string, unknown>;
    const teT = Object.prototype.hasOwnProperty.call(d, "totalEarnings");
    const tdT = Object.prototype.hasOwnProperty.call(d, "totalDeductions");
    const nsT = Object.prototype.hasOwnProperty.call(d, "netSettlement");
    if (teT || tdT || nsT) {
      if (!teT || !tdT || !nsT) {
        ctx.addIssue({
          code: "custom",
          message: "totalEarnings, totalDeductions, and netSettlement must be updated together",
          path: ["netSettlement"],
        });
        return;
      }
      const te = d.totalEarnings as string;
      const td = d.totalDeductions as string;
      const ns = d.netSettlement as string;
      if (typeof te !== "string" || typeof td !== "string" || typeof ns !== "string") {
        return;
      }
      if (!settlementTotalsBalance(te, td, ns)) {
        ctx.addIssue({
          code: "custom",
          message: "netSettlement must equal totalEarnings minus totalDeductions (to cents)",
          path: ["netSettlement"],
        });
      }
      if (moneyStringToCents(ns) < 0) {
        ctx.addIssue({
          code: "custom",
          message: "netSettlement must be non-negative",
          path: ["netSettlement"],
        });
      }
    }

    const lwT = Object.prototype.hasOwnProperty.call(d, "lastWorkingDay");
    const termT = Object.prototype.hasOwnProperty.call(d, "terminationDate");
    if (lwT || termT) {
      if (!lwT || !termT) {
        ctx.addIssue({
          code: "custom",
          message: "lastWorkingDay and terminationDate must be updated together",
          path: ["lastWorkingDay"],
        });
        return;
      }
      const lw = d.lastWorkingDay as Date;
      const term = d.terminationDate as Date;
      if (!(lw instanceof Date) || !(term instanceof Date) || Number.isNaN(lw.getTime()) || Number.isNaN(term.getTime())) {
        return;
      }
      if (!lastWorkingDayNotAfterTermination(lw, term)) {
        ctx.addIssue({
          code: "custom",
          message: "lastWorkingDay must be on or before terminationDate",
          path: ["lastWorkingDay"],
        });
      }
    }
  });

export type FinalSettlement = typeof finalSettlements.$inferSelect;
export type NewFinalSettlement = typeof finalSettlements.$inferInsert;
