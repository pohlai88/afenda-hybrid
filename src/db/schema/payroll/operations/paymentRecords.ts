import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { payslips } from "./payslips";
import { bankAccounts } from "../fundamentals/bankAccounts";

/**
 * Payment Records - Bank transfer details for salary payments.
 */
export const paymentMethods = ["BANK_TRANSFER", "CHECK", "CASH", "DIRECT_DEPOSIT"] as const;

export const paymentMethodEnum = payrollSchema.enum("payment_method", [...paymentMethods]);

export const paymentMethodZodEnum = createSelectSchema(paymentMethodEnum);

export const paymentStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REVERSED"] as const;

export const paymentStatusEnum = payrollSchema.enum("payment_status", [...paymentStatuses]);

export const paymentStatusZodEnum = createSelectSchema(paymentStatusEnum);

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

export const PaymentRecordIdSchema = z.number().int().brand<"PaymentRecordId">();
export type PaymentRecordId = z.infer<typeof PaymentRecordIdSchema>;

export const paymentRecordSelectSchema = createSelectSchema(paymentRecords);

export const paymentRecordInsertSchema = createInsertSchema(paymentRecords, {
  paymentReference: z.string().min(1).max(100),
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be positive"),
  failureReason: z.string().max(1000).optional(),
});

export const paymentRecordUpdateSchema = createUpdateSchema(paymentRecords);

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type NewPaymentRecord = typeof paymentRecords.$inferInsert;
