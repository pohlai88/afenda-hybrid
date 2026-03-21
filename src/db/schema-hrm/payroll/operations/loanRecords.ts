import { integer, text, date, timestamp, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { dateValue, moneyFracOk } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Loan records — employee loans and repayment schedules.
 * `loanNumber` uniqueness is case-insensitive (`lower(loanNumber)`); Zod normalizes to uppercase on write.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const loanTypes = ["SALARY_ADVANCE", "PERSONAL_LOAN", "EMERGENCY_LOAN", "HOUSING_LOAN", "EDUCATION_LOAN", "OTHER"] as const;

export const loanTypeEnum = payrollSchema.enum("loan_type", [...loanTypes]);

export const LoanTypeSchema = z.enum(loanTypes);
export type LoanType = z.infer<typeof LoanTypeSchema>;

export const loanStatuses = ["PENDING", "APPROVED", "ACTIVE", "COMPLETED", "DEFAULTED", "CANCELLED"] as const;

export const loanStatusEnum = payrollSchema.enum("loan_status", [...loanStatuses]);

export const LoanStatusSchema = z.enum(loanStatuses);
export type LoanStatus = z.infer<typeof LoanStatusSchema>;

const MAX_MONEY_12_2 = 9_999_999_999.99;
const MAX_MONEY_10_2 = 99_999_999.99;

/** `numeric(12, 2)` strictly positive. */
function isValidPrincipalString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return false;
  if (!moneyFracOk(s, 2)) return false;
  return n <= MAX_MONEY_12_2;
}

/** `numeric(12, 2)` non-negative. */
function isValidMoney12_2NonNegative(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return false;
  if (!moneyFracOk(s, 2)) return false;
  return n <= MAX_MONEY_12_2;
}

/** `numeric(10, 2)` strictly positive. */
function isValidMonthlyDeductionString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return false;
  if (!moneyFracOk(s, 2)) return false;
  return n <= MAX_MONEY_10_2;
}

/** `numeric(5, 4)` rate, >= 0, max 9.9999. */
function isValidInterestRateString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 9.9999) return false;
  const frac = s.split(".")[1];
  return frac === undefined || frac.length <= 4;
}

const loanNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .transform((s) => s.toUpperCase());

const principalString = z.string().refine(isValidPrincipalString, {
  message: "principalAmount must be a positive decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
});

const totalAmountString = z.string().refine(isValidMoney12_2NonNegative, {
  message: "totalAmount must be a non-negative decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
});

const outstandingString = z.string().refine(isValidMoney12_2NonNegative, {
  message: "outstandingBalance must be a non-negative decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
});

const monthlyDeductionString = z.string().refine(isValidMonthlyDeductionString, {
  message: "monthlyDeduction must be a positive decimal up to 99,999,999.99 with at most 2 decimal places (numeric 10,2)",
});

const optionalInterestString = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidInterestRateString(s), {
    message: "interestRate must be between 0 and 9.9999 with at most 4 decimal places (numeric 5,4)",
  });

const optionalTotalPaidString = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidMoney12_2NonNegative(s), {
    message: "totalPaid must be a non-negative decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
  });

const optionalMoney12_2Patch = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidMoney12_2NonNegative(s), {
    message: "Must be a non-negative decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
  });

const optionalPrincipalPatch = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidPrincipalString(s), {
    message: "principalAmount must be a positive decimal up to 9,999,999,999.99 with at most 2 decimal places (numeric 12,2)",
  });

const optionalMonthlyPatch = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidMonthlyDeductionString(s), {
    message: "monthlyDeduction must be a positive decimal up to 99,999,999.99 with at most 2 decimal places (numeric 10,2)",
  });

const optionalInterestPatch = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidInterestRateString(s), {
    message: "interestRate must be between 0 and 9.9999 with at most 4 decimal places (numeric 5,4)",
  });

function parseMoney2(s: string): number {
  return Number.parseFloat(s);
}

function balancesAligned(totalAmount: string, totalPaid: string, outstandingBalance: string): boolean {
  const ta = parseMoney2(totalAmount);
  const tp = parseMoney2(totalPaid);
  const ob = parseMoney2(outstandingBalance);
  if (!Number.isFinite(ta) || !Number.isFinite(tp) || !Number.isFinite(ob)) return false;
  return Math.abs(ob - (ta - tp)) <= 0.015;
}

function isZeroMoney(s: string): boolean {
  const n = parseMoney2(s);
  return Number.isFinite(n) && Math.abs(n) <= 0.000_000_1;
}

type LoanInsertWorkflow = {
  status?: LoanStatus;
  approvedBy?: number | null;
  approvedAt?: Date | null;
  disbursementDate?: Date | null;
  outstandingBalance?: string;
  totalAmount?: string;
  totalPaid?: string;
  startDate?: Date;
  endDate?: Date;
};

function refineLoanInsertWorkflow(data: LoanInsertWorkflow, ctx: z.RefinementCtx): void {
  const status = data.status ?? "PENDING";
  const hasApprovedBy = data.approvedBy != null;
  const hasApprovedAt = data.approvedAt != null;
  const hasDisbursement = data.disbursementDate != null;

  if (status === "PENDING") {
    if (hasApprovedBy || hasApprovedAt) {
      ctx.addIssue({
        code: "custom",
        message: "approvedBy and approvedAt must be unset when status is PENDING",
        path: ["status"],
      });
    }
  }

  const needsApproval = status === "APPROVED" || status === "ACTIVE" || status === "COMPLETED" || status === "DEFAULTED";
  if (needsApproval) {
    if (!hasApprovedBy || !hasApprovedAt) {
      ctx.addIssue({
        code: "custom",
        message: "approvedBy and approvedAt are required for APPROVED, ACTIVE, COMPLETED, and DEFAULTED loans",
        path: ["approvedBy"],
      });
    }
  }

  if (status === "ACTIVE" || status === "COMPLETED" || status === "DEFAULTED") {
    if (!hasDisbursement) {
      ctx.addIssue({
        code: "custom",
        message: "disbursementDate is required when status is ACTIVE, COMPLETED, or DEFAULTED",
        path: ["disbursementDate"],
      });
    }
  }

  if (status === "COMPLETED") {
    const ob = data.outstandingBalance;
    if (ob === undefined || !isZeroMoney(ob)) {
      ctx.addIssue({
        code: "custom",
        message: "outstandingBalance must be 0 when status is COMPLETED",
        path: ["outstandingBalance"],
      });
    }
  }
}

function refineLoanInsertCrossChecks(
  data: {
    principalAmount: string;
    totalAmount: string;
    totalPaid?: string;
    outstandingBalance: string;
    startDate: Date;
    endDate: Date;
  },
  ctx: z.RefinementCtx,
): void {
  const principal = parseMoney2(data.principalAmount);
  const total = parseMoney2(data.totalAmount);
  const paid = parseMoney2(data.totalPaid ?? "0");
  const out = parseMoney2(data.outstandingBalance);

  if (!Number.isFinite(principal) || !Number.isFinite(total) || !Number.isFinite(paid) || !Number.isFinite(out)) {
    ctx.addIssue({ code: "custom", message: "Invalid numeric fields", path: ["principalAmount"] });
    return;
  }

  if (total < principal) {
    ctx.addIssue({
      code: "custom",
      message: "totalAmount must be greater than or equal to principalAmount",
      path: ["totalAmount"],
    });
  }

  if (paid > total + 0.015) {
    ctx.addIssue({
      code: "custom",
      message: "totalPaid must not exceed totalAmount",
      path: ["totalPaid"],
    });
  }

  if (out < -0.015) {
    ctx.addIssue({
      code: "custom",
      message: "outstandingBalance must be non-negative",
      path: ["outstandingBalance"],
    });
  }

  if (!balancesAligned(data.totalAmount, data.totalPaid ?? "0", data.outstandingBalance)) {
    ctx.addIssue({
      code: "custom",
      message: "outstandingBalance must equal totalAmount minus totalPaid (within 0.01)",
      path: ["outstandingBalance"],
    });
  }

  const startT = dateValue(data.startDate);
  const endT = dateValue(data.endDate);
  if (!Number.isNaN(startT) && !Number.isNaN(endT) && endT <= startT) {
    ctx.addIssue({
      code: "custom",
      message: "endDate must be after startDate",
      path: ["endDate"],
    });
  }
}

function refineLoanUpdateWorkflow(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const statusTouched = Object.prototype.hasOwnProperty.call(data, "status");
  const status = data.status as LoanStatus | undefined;

  if (statusTouched && status !== undefined) {
    const approvedByTouched = Object.prototype.hasOwnProperty.call(data, "approvedBy");
    const approvedAtTouched = Object.prototype.hasOwnProperty.call(data, "approvedAt");
    const disbursementTouched = Object.prototype.hasOwnProperty.call(data, "disbursementDate");
    const outstandingTouched = Object.prototype.hasOwnProperty.call(data, "outstandingBalance");

    const approvedBy = data.approvedBy as number | null | undefined;
    const approvedAt = data.approvedAt as Date | null | undefined;
    const disbursementDate = data.disbursementDate as Date | null | undefined;
    const outstandingBalance = data.outstandingBalance as string | undefined;

    const hasApprovedBy = approvedBy != null;
    const hasApprovedAt = approvedAt != null;
    const hasDisbursement = disbursementDate != null;

    if (status === "PENDING") {
      if ((approvedByTouched && approvedBy !== null) || (approvedAtTouched && approvedAt !== null)) {
        ctx.addIssue({
          code: "custom",
          message: "Cannot set approval fields when moving to PENDING",
          path: ["status"],
        });
      }
    }

    const needsApproval = status === "APPROVED" || status === "ACTIVE" || status === "COMPLETED" || status === "DEFAULTED";
    if (needsApproval) {
      if (!approvedByTouched || approvedBy == null || !Number.isFinite(approvedBy) || approvedBy <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to APPROVED, ACTIVE, COMPLETED, or DEFAULTED, include approvedBy in the same patch",
          path: ["approvedBy"],
        });
      }
      if (!approvedAtTouched || approvedAt == null) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to APPROVED, ACTIVE, COMPLETED, or DEFAULTED, include approvedAt in the same patch",
          path: ["approvedAt"],
        });
      }
    }

    if (status === "ACTIVE" || status === "COMPLETED" || status === "DEFAULTED") {
      if (!disbursementTouched || disbursementDate == null) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to ACTIVE, COMPLETED, or DEFAULTED, include disbursementDate in the same patch",
          path: ["disbursementDate"],
        });
      }
    }

    if (status === "COMPLETED") {
      if (!outstandingTouched || outstandingBalance === undefined || !isZeroMoney(outstandingBalance)) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to COMPLETED, include outstandingBalance: 0 in the same patch",
          path: ["outstandingBalance"],
        });
      }
    }

    return;
  }

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
}

function refineLoanUpdateCrossChecks(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const hasPrincipal = Object.prototype.hasOwnProperty.call(data, "principalAmount");
  const hasTotal = Object.prototype.hasOwnProperty.call(data, "totalAmount");
  const hasPaid = Object.prototype.hasOwnProperty.call(data, "totalPaid");
  const hasOut = Object.prototype.hasOwnProperty.call(data, "outstandingBalance");
  const hasStart = Object.prototype.hasOwnProperty.call(data, "startDate");
  const hasEnd = Object.prototype.hasOwnProperty.call(data, "endDate");

  const principal = hasPrincipal ? parseMoney2(data.principalAmount as string) : null;
  const total = hasTotal ? parseMoney2(data.totalAmount as string) : null;
  const paid = hasPaid ? parseMoney2((data.totalPaid as string) ?? "0") : null;
  const out = hasOut ? parseMoney2(data.outstandingBalance as string) : null;

  if (
    hasPrincipal &&
    hasTotal &&
    principal != null &&
    total != null &&
    Number.isFinite(principal) &&
    Number.isFinite(total) &&
    total < principal - 0.015
  ) {
    ctx.addIssue({
      code: "custom",
      message: "totalAmount must be greater than or equal to principalAmount",
      path: ["totalAmount"],
    });
  }

  if (
    hasTotal &&
    hasPaid &&
    total != null &&
    paid != null &&
    Number.isFinite(total) &&
    Number.isFinite(paid) &&
    paid > total + 0.015
  ) {
    ctx.addIssue({
      code: "custom",
      message: "totalPaid must not exceed totalAmount",
      path: ["totalPaid"],
    });
  }

  if (hasOut && out !== null && Number.isFinite(out) && out < -0.015) {
    ctx.addIssue({
      code: "custom",
      message: "outstandingBalance must be non-negative",
      path: ["outstandingBalance"],
    });
  }

  if (hasTotal && hasPaid && hasOut) {
    const ta = data.totalAmount as string;
    const tp = (data.totalPaid as string) ?? "0";
    const ob = data.outstandingBalance as string;
    if (!balancesAligned(ta, tp, ob)) {
      ctx.addIssue({
        code: "custom",
        message: "outstandingBalance must equal totalAmount minus totalPaid (within 0.01)",
        path: ["outstandingBalance"],
      });
    }
  }

  if (hasStart && hasEnd) {
    const startT = dateValue(data.startDate as Date);
    const endT = dateValue(data.endDate as Date);
    if (!Number.isNaN(startT) && !Number.isNaN(endT) && endT <= startT) {
      ctx.addIssue({
        code: "custom",
        message: "endDate must be after startDate",
        path: ["endDate"],
      });
    }
  }
}

export const loanRecords = payrollSchema.table(
  "loan_records",
  {
    loanRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    loanNumber: text().notNull(),
    loanType: loanTypeEnum().notNull(),
    principalAmount: numeric({ precision: 12, scale: 2 }).notNull(),
    interestRate: numeric({ precision: 5, scale: 4 }).notNull().default("0"),
    totalAmount: numeric({ precision: 12, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    disbursementDate: date(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    monthlyDeduction: numeric({ precision: 10, scale: 2 }).notNull(),
    totalPaid: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    outstandingBalance: numeric({ precision: 12, scale: 2 }).notNull(),
    status: loanStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    reason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_loan_records_tenant").on(t.tenantId),
    index("idx_loan_records_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_loan_records_employee").on(t.tenantId, t.employeeId),
    index("idx_loan_records_type").on(t.tenantId, t.loanType),
    index("idx_loan_records_status").on(t.tenantId, t.status),
    index("idx_loan_records_dates").on(t.tenantId, t.startDate, t.endDate),
    uniqueIndex("uq_loan_records_number")
      .on(t.tenantId, sql`lower(${t.loanNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_loan_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_loan_records_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_loan_records_principal",
      sql`${t.principalAmount} > 0`
    ),
    check(
      "chk_loan_records_interest",
      sql`${t.interestRate} >= 0`
    ),
    check(
      "chk_loan_records_total",
      sql`${t.totalAmount} >= ${t.principalAmount}`
    ),
    check(
      "chk_loan_records_deduction",
      sql`${t.monthlyDeduction} > 0`
    ),
    check(
      "chk_loan_records_dates",
      sql`${t.endDate} > ${t.startDate}`
    ),
    check(
      "chk_loan_records_paid",
      sql`${t.totalPaid} >= 0 AND ${t.totalPaid} <= ${t.totalAmount}`
    ),
    check(
      "chk_loan_records_balance",
      sql`${t.outstandingBalance} >= 0`
    ),
  ]
);

export const LoanRecordIdSchema = z.number().int().positive().brand<"LoanRecordId">();
export type LoanRecordId = z.infer<typeof LoanRecordIdSchema>;

export const loanRecordSelectSchema = createSelectSchema(loanRecords);

const loanRecordInsertSchemaBase = createInsertSchema(loanRecords, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  loanNumber: loanNumberSchema,
  loanType: LoanTypeSchema,
  principalAmount: principalString,
  interestRate: optionalInterestString,
  totalAmount: totalAmountString,
  currencyId: z.number().int().positive(),
  disbursementDate: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  monthlyDeduction: monthlyDeductionString,
  totalPaid: optionalTotalPaidString,
  outstandingBalance: outstandingString,
  status: LoanStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const loanRecordInsertSchema = loanRecordInsertSchemaBase.superRefine((data, ctx) => {
  refineLoanInsertCrossChecks(
    {
      principalAmount: data.principalAmount,
      totalAmount: data.totalAmount,
      totalPaid: data.totalPaid,
      outstandingBalance: data.outstandingBalance,
      startDate: data.startDate,
      endDate: data.endDate,
    },
    ctx,
  );
  refineLoanInsertWorkflow(data, ctx);
});

export const loanRecordUpdateSchema = createUpdateSchema(loanRecords, {
  loanNumber: loanNumberSchema.optional(),
  loanType: LoanTypeSchema.optional(),
  principalAmount: optionalPrincipalPatch,
  interestRate: optionalInterestPatch,
  totalAmount: optionalMoney12_2Patch,
  currencyId: z.number().int().positive().optional(),
  disbursementDate: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  monthlyDeduction: optionalMonthlyPatch,
  totalPaid: optionalMoney12_2Patch,
  outstandingBalance: optionalMoney12_2Patch,
  status: LoanStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
})
  .omit({ tenantId: true, employeeId: true })
  .superRefine((data, ctx) => {
    refineLoanUpdateCrossChecks(data as Record<string, unknown>, ctx);
    refineLoanUpdateWorkflow(data as Record<string, unknown>, ctx);
  });

export type LoanRecord = typeof loanRecords.$inferSelect;
export type NewLoanRecord = typeof loanRecords.$inferInsert;
