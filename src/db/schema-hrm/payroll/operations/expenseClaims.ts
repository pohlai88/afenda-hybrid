import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { zMoney10_2Positive, zMoney10_2PositiveOptional } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";
import { expenseTypes } from "../fundamentals/expenseTypes";

/**
 * Expense Claims — reimbursement requests from employees.
 * `claimNumber` uniqueness is case-insensitive (`lower(claimNumber)`); Zod normalizes to uppercase on write.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const expenseClaimStatuses = ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PROCESSING", "PAID", "CANCELLED"] as const;

export const expenseClaimStatusEnum = payrollSchema.enum("expense_claim_status", [...expenseClaimStatuses]);

export const ExpenseClaimStatusSchema = z.enum(expenseClaimStatuses);
export type ExpenseClaimStatus = z.infer<typeof ExpenseClaimStatusSchema>;

const claimNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .transform((s) => s.toUpperCase());

function rejectionReasonNonEmpty(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

type ExpenseClaimInsertWorkflow = {
  status?: ExpenseClaimStatus;
  rejectionReason?: string | null;
  approvedBy?: number | null;
  approvedAt?: Date | null;
  paidAt?: Date | null;
};

function refineExpenseClaimInsertWorkflow(data: ExpenseClaimInsertWorkflow, ctx: z.RefinementCtx): void {
  const status = data.status ?? "DRAFT";
  const hasRejection = rejectionReasonNonEmpty(data.rejectionReason);
  const hasApprovedBy = data.approvedBy != null;
  const hasApprovedAt = data.approvedAt != null;
  const hasPaidAt = data.paidAt != null;

  if (hasRejection && status !== "REJECTED") {
    ctx.addIssue({
      code: "custom",
      message: "rejectionReason is only allowed when status is REJECTED",
      path: ["rejectionReason"],
    });
  }

  if (status === "REJECTED") {
    if (!hasRejection) {
      ctx.addIssue({
        code: "custom",
        message: "rejectionReason is required when status is REJECTED",
        path: ["rejectionReason"],
      });
    }
    if (hasApprovedBy || hasApprovedAt || hasPaidAt) {
      ctx.addIssue({
        code: "custom",
        message: "approvedBy, approvedAt, and paidAt must be unset when status is REJECTED",
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
  } else {
    if (hasApprovedBy || hasApprovedAt) {
      ctx.addIssue({
        code: "custom",
        message: "approvedBy and approvedAt are only allowed when status is APPROVED, PROCESSING, or PAID",
        path: ["approvedBy"],
      });
    }
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

  if (hasRejection) {
    return;
  }

  const terminalNoRejection = ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "CANCELLED"];
  if (terminalNoRejection.includes(status) && data.rejectionReason != null && String(data.rejectionReason).trim() === "") {
    ctx.addIssue({
      code: "custom",
      message: "Clear rejectionReason with null, not an empty string",
      path: ["rejectionReason"],
    });
  }
}

function refineExpenseClaimUpdateWorkflow(data: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const statusTouched = Object.prototype.hasOwnProperty.call(data, "status");
  const status = data.status as ExpenseClaimStatus | undefined;

  if (statusTouched && status !== undefined) {
    const rrTouched = Object.prototype.hasOwnProperty.call(data, "rejectionReason");
    const rejectionVal = data.rejectionReason;
    const hasRejection = rejectionReasonNonEmpty(rejectionVal);

    const approvedByTouched = Object.prototype.hasOwnProperty.call(data, "approvedBy");
    const approvedAtTouched = Object.prototype.hasOwnProperty.call(data, "approvedAt");
    const paidAtTouched = Object.prototype.hasOwnProperty.call(data, "paidAt");

    const approvedBy = data.approvedBy as number | null | undefined;
    const approvedAt = data.approvedAt as Date | null | undefined;
    const paidAt = data.paidAt as Date | null | undefined;

    const hasApprovedBy = approvedBy != null;
    const hasApprovedAt = approvedAt != null;

    if (status === "REJECTED") {
      if (!rrTouched || !hasRejection) {
        ctx.addIssue({
          code: "custom",
          message: "When setting status to REJECTED, include a non-empty rejectionReason in the same patch",
          path: ["rejectionReason"],
        });
      }
      if (
        (approvedByTouched && approvedBy !== null) ||
        (approvedAtTouched && approvedAt !== null) ||
        (paidAtTouched && paidAt !== null)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Cannot set approval or paid fields when status is REJECTED",
          path: ["status"],
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
      if (!Object.prototype.hasOwnProperty.call(data, "approvedAt") || approvedAt == null) {
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

    if (hasRejection) {
      ctx.addIssue({
        code: "custom",
        message: "rejectionReason is only allowed when status is REJECTED",
        path: ["rejectionReason"],
      });
    }

    return;
  }

  /* status not in patch: block orphan workflow fields */
  if (Object.prototype.hasOwnProperty.call(data, "rejectionReason") && rejectionReasonNonEmpty(data.rejectionReason)) {
    ctx.addIssue({
      code: "custom",
      message: "Include status: REJECTED in the same patch when setting rejectionReason",
      path: ["rejectionReason"],
    });
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

export const expenseClaims = payrollSchema.table(
  "expense_claims",
  {
    expenseClaimId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    claimNumber: text().notNull(),
    expenseTypeId: integer().notNull(),
    expenseDate: date().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    description: text().notNull(),
    receiptPath: text(),
    status: expenseClaimStatusEnum().notNull().default("DRAFT"),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    paidAt: timestamp({ withTimezone: true }),
    rejectionReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_expense_claims_tenant").on(t.tenantId),
    index("idx_expense_claims_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_expense_claims_employee").on(t.tenantId, t.employeeId),
    index("idx_expense_claims_type").on(t.tenantId, t.expenseTypeId),
    index("idx_expense_claims_date").on(t.tenantId, t.expenseDate),
    index("idx_expense_claims_status").on(t.tenantId, t.status),
    uniqueIndex("uq_expense_claims_number")
      .on(t.tenantId, sql`lower(${t.claimNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_expense_claims_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.expenseTypeId],
      foreignColumns: [expenseTypes.expenseTypeId],
      name: "fk_expense_claims_type",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_expense_claims_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_expense_claims_amount",
      sql`${t.amount} > 0`
    ),
  ]
);

export const ExpenseClaimIdSchema = z.number().int().positive().brand<"ExpenseClaimId">();
export type ExpenseClaimId = z.infer<typeof ExpenseClaimIdSchema>;

export const expenseClaimSelectSchema = createSelectSchema(expenseClaims);

const expenseClaimInsertSchemaBase = createInsertSchema(expenseClaims, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  claimNumber: claimNumberSchema,
  expenseTypeId: z.number().int().positive(),
  expenseDate: z.coerce.date(),
  amount: zMoney10_2Positive(),
  currencyId: z.number().int().positive(),
  description: z.string().trim().min(1).max(1000),
  receiptPath: z.string().max(500).optional().nullable(),
  status: ExpenseClaimStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const expenseClaimInsertSchema = expenseClaimInsertSchemaBase.superRefine((data, ctx) => {
  refineExpenseClaimInsertWorkflow(data, ctx);
});

export const expenseClaimUpdateSchema = createUpdateSchema(expenseClaims, {
  claimNumber: claimNumberSchema.optional(),
  expenseTypeId: z.number().int().positive().optional(),
  expenseDate: z.coerce.date().optional(),
  amount: zMoney10_2PositiveOptional(),
  currencyId: z.number().int().positive().optional(),
  description: z.string().trim().min(1).max(1000).optional(),
  receiptPath: z.string().max(500).optional().nullable(),
  status: ExpenseClaimStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
})
  .omit({ tenantId: true, employeeId: true })
  .superRefine((data, ctx) => {
    refineExpenseClaimUpdateWorkflow(data as Record<string, unknown>, ctx);
  });

export type ExpenseClaim = typeof expenseClaims.$inferSelect;
export type NewExpenseClaim = typeof expenseClaims.$inferInsert;
