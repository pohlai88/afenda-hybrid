import { integer, text, boolean, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Bank Accounts - Employee payment accounts.
 * Sensitive data - should be encrypted at rest in production.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const bankAccountStatuses = [
  "ACTIVE",
  "INACTIVE",
  "CLOSED",
  "PENDING_VERIFICATION",
] as const;

export const bankAccountStatusEnum = payrollSchema.enum("bank_account_status", [
  ...bankAccountStatuses,
]);

export const BankAccountStatusSchema = z.enum(bankAccountStatuses);
export type BankAccountStatus = z.infer<typeof BankAccountStatusSchema>;

/**
 * Table `bank_accounts` — employee disbursement destinations; at most one ACTIVE primary per employee (partial unique index).
 */
export const bankAccounts = payrollSchema.table(
  "bank_accounts",
  {
    bankAccountId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    bankName: text().notNull(),
    /** Country-specific bank identifier (e.g. BIC branch bank code) */
    bankCode: text(),
    branchCode: text(),
    branchName: text(),
    accountNumber: text().notNull(),
    accountHolderName: text().notNull(),
    routingNumber: text(),
    swiftCode: text(),
    iban: text(),
    currencyId: integer(),
    isPrimary: boolean().notNull().default(false),
    /** Lifecycle: `ACTIVE` | `INACTIVE` | `CLOSED` | `PENDING_VERIFICATION`. */
    status: bankAccountStatusEnum().notNull().default("PENDING_VERIFICATION"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_bank_accounts_tenant").on(t.tenantId),
    index("idx_bank_accounts_employee").on(t.tenantId, t.employeeId),
    index("idx_bank_accounts_status").on(t.tenantId, t.status),
    uniqueIndex("uq_bank_accounts_primary")
      .on(t.tenantId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.isPrimary} = true AND ${t.status} = 'ACTIVE'`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_bank_accounts_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_bank_accounts_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const BankAccountIdSchema = z.number().int().positive().brand<"BankAccountId">();
export type BankAccountId = z.infer<typeof BankAccountIdSchema>;

export const bankAccountSelectSchema = createSelectSchema(bankAccounts);

export const bankAccountInsertSchema = createInsertSchema(bankAccounts, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  bankName: z.string().min(1).max(200),
  bankCode: z.string().max(32).optional(),
  branchCode: z.string().max(32).optional(),
  branchName: z.string().max(200).optional(),
  accountNumber: z.string().min(1).max(50),
  accountHolderName: z.string().min(1).max(200),
  routingNumber: z.string().max(20).optional(),
  swiftCode: z.string().max(11).optional(),
  iban: z.string().max(34).optional(),
  currencyId: z.number().int().positive().optional(),
  isPrimary: z.boolean().optional(),
  status: BankAccountStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

/** Patch payload: `tenantId` / `employeeId` are immutable after insert. */
export const bankAccountUpdateSchema = createUpdateSchema(bankAccounts, {
  bankName: z.string().min(1).max(200).optional(),
  bankCode: z.string().max(32).optional().nullable(),
  branchCode: z.string().max(32).optional().nullable(),
  branchName: z.string().max(200).optional().nullable(),
  accountNumber: z.string().min(1).max(50).optional(),
  accountHolderName: z.string().min(1).max(200).optional(),
  routingNumber: z.string().max(20).optional().nullable(),
  swiftCode: z.string().max(11).optional().nullable(),
  iban: z.string().max(34).optional().nullable(),
  currencyId: z.number().int().positive().optional().nullable(),
  isPrimary: z.boolean().optional(),
  status: BankAccountStatusSchema.optional(),
}).omit({ tenantId: true, employeeId: true });

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
