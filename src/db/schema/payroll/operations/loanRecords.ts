import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Loan Records - Employee loan tracking with repayment schedule.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const loanTypes = ["SALARY_ADVANCE", "PERSONAL_LOAN", "EMERGENCY_LOAN", "HOUSING_LOAN", "EDUCATION_LOAN", "OTHER"] as const;

export const loanTypeEnum = payrollSchema.enum("loan_type", [...loanTypes]);

export const loanTypeZodEnum = createSelectSchema(loanTypeEnum);

export const loanStatuses = ["PENDING", "APPROVED", "ACTIVE", "COMPLETED", "DEFAULTED", "CANCELLED"] as const;

export const loanStatusEnum = payrollSchema.enum("loan_status", [...loanStatuses]);

export const loanStatusZodEnum = createSelectSchema(loanStatusEnum);

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
    approvedAt: date(),
    reason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_loan_records_tenant").on(t.tenantId),
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

export const LoanRecordIdSchema = z.number().int().brand<"LoanRecordId">();
export type LoanRecordId = z.infer<typeof LoanRecordIdSchema>;

export const loanRecordSelectSchema = createSelectSchema(loanRecords);

export const loanRecordInsertSchema = createInsertSchema(loanRecords, {
  loanNumber: z.string().min(1).max(50),
  principalAmount: z.string().refine((val) => parseFloat(val) > 0, "Principal must be positive"),
  interestRate: z.string().optional(),
  totalAmount: z.string(),
  monthlyDeduction: z.string().refine((val) => parseFloat(val) > 0, "Monthly deduction must be positive"),
  totalPaid: z.string().optional(),
  outstandingBalance: z.string(),
  reason: z.string().max(1000).optional(),
});

export const loanRecordUpdateSchema = createUpdateSchema(loanRecords);

export type LoanRecord = typeof loanRecords.$inferSelect;
export type NewLoanRecord = typeof loanRecords.$inferInsert;
