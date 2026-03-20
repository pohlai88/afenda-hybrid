import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { expenseTypes } from "../fundamentals/expenseTypes";

/**
 * Expense Claims - Reimbursement requests from employees.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const expenseClaimStatuses = ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PROCESSING", "PAID", "CANCELLED"] as const;

export const expenseClaimStatusEnum = payrollSchema.enum("expense_claim_status", [...expenseClaimStatuses]);

export const expenseClaimStatusZodEnum = createSelectSchema(expenseClaimStatusEnum);

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

export const ExpenseClaimIdSchema = z.number().int().brand<"ExpenseClaimId">();
export type ExpenseClaimId = z.infer<typeof ExpenseClaimIdSchema>;

export const expenseClaimSelectSchema = createSelectSchema(expenseClaims);

export const expenseClaimInsertSchema = createInsertSchema(expenseClaims, {
  claimNumber: z.string().min(1).max(50),
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be positive"),
  description: z.string().min(1).max(1000),
  receiptPath: z.string().max(500).optional(),
  rejectionReason: z.string().max(1000).optional(),
});

export const expenseClaimUpdateSchema = createUpdateSchema(expenseClaims);

export type ExpenseClaim = typeof expenseClaims.$inferSelect;
export type NewExpenseClaim = typeof expenseClaims.$inferInsert;
