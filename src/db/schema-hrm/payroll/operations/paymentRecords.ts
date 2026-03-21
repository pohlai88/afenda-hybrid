import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { zMoney12_2Positive, zMoney12_2PositiveOptionalNullable } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";
import { payslips } from "./payslips";
import { bankAccounts } from "../fundamentals/bankAccounts";

/**
 * Payment Records - Bank transfer details for salary payments.
 * Zod mirrors `chk_payment_records_amount` and `numeric(12,2)` (DB-first guideline §5 / Appendix C).
 */
export const paymentMethods = ["BANK_TRANSFER", "CHECK", "CASH", "DIRECT_DEPOSIT"] as const;

export const paymentMethodEnum = payrollSchema.enum("payment_method", [...paymentMethods]);

export const PaymentMethodSchema = z.enum(paymentMethods);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const paymentStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REVERSED"] as const;

export const paymentStatusEnum = payrollSchema.enum("payment_status", [...paymentStatuses]);

export const PaymentStatusSchema = z.enum(paymentStatuses);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const paymentRecords = payrollSchema.table(
  "payment_records",
  {
    paymentRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    payslipId: integer().notNull(),
    bankAccountId: integer(),
    paymentMethod: paymentMethodEnum().notNull().default("BANK_TRANSFER"),
    paymentReference: text().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    paymentDate: date().notNull(),
    status: paymentStatusEnum().notNull().default("PENDING"),
    processedAt: timestamp({ withTimezone: true }),
    failureReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_payment_records_tenant").on(t.tenantId),
    index("idx_payment_records_tenant_op_date").on(t.tenantId, t.status, t.processedAt),
    index("idx_payment_records_payslip").on(t.tenantId, t.payslipId),
    index("idx_payment_records_bank_account").on(t.tenantId, t.bankAccountId),
    index("idx_payment_records_date").on(t.tenantId, t.paymentDate),
    index("idx_payment_records_status").on(t.tenantId, t.status),
    uniqueIndex("uq_payment_records_reference")
      .on(t.tenantId, sql`lower(${t.paymentReference})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_payment_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payslipId],
      foreignColumns: [payslips.payslipId],
      name: "fk_payment_records_payslip",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.bankAccountId],
      foreignColumns: [bankAccounts.bankAccountId],
      name: "fk_payment_records_bank_account",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_payment_records_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_payment_records_amount",
      sql`${t.amount} > 0`
    ),
  ]
);

export const PaymentRecordIdSchema = z.number().int().positive().brand<"PaymentRecordId">();
export type PaymentRecordId = z.infer<typeof PaymentRecordIdSchema>;

export const paymentRecordSelectSchema = createSelectSchema(paymentRecords);

export const paymentRecordInsertSchema = createInsertSchema(paymentRecords, {
  tenantId: z.number().int().positive(),
  payslipId: z.number().int().positive(),
  bankAccountId: z.number().int().positive().optional().nullable(),
  paymentMethod: PaymentMethodSchema.optional(),
  paymentReference: z.string().trim().min(1).max(100),
  amount: zMoney12_2Positive(),
  currencyId: z.number().int().positive(),
  paymentDate: z.coerce.date(),
  status: PaymentStatusSchema.optional(),
  processedAt: z.coerce.date().optional().nullable(),
  failureReason: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const paymentRecordUpdateSchema = createUpdateSchema(paymentRecords, {
  bankAccountId: z.number().int().positive().optional().nullable(),
  paymentMethod: PaymentMethodSchema.optional(),
  paymentReference: z.string().trim().min(1).max(100).optional(),
  amount: zMoney12_2PositiveOptionalNullable(),
  currencyId: z.number().int().positive().optional(),
  paymentDate: z.coerce.date().optional(),
  status: PaymentStatusSchema.optional(),
  processedAt: z.coerce.date().optional().nullable(),
  failureReason: z.string().max(1000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true, payslipId: true });

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type NewPaymentRecord = typeof paymentRecords.$inferInsert;
