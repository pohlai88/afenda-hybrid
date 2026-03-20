import { integer, text, boolean, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Bank Accounts - Employee payment accounts.
 * Sensitive data - should be encrypted at rest in production.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const bankAccountStatuses = ["ACTIVE", "INACTIVE", "CLOSED", "PENDING_VERIFICATION"] as const;

export const bankAccountStatusEnum = payrollSchema.enum("bank_account_status", [...bankAccountStatuses]);

export const bankAccountStatusZodEnum = createSelectSchema(bankAccountStatusEnum);

export const bankAccounts = payrollSchema.table(
  "bank_accounts",
  {
    bankAccountId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    bankName: text().notNull(),
    branchName: text(),
    accountNumber: text().notNull(),
    accountHolderName: text().notNull(),
    routingNumber: text(),
    swiftCode: text(),
    iban: text(),
    currencyId: integer(),
    isPrimary: boolean().notNull().default(false),
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

export const BankAccountIdSchema = z.number().int().brand<"BankAccountId">();
export type BankAccountId = z.infer<typeof BankAccountIdSchema>;

export const bankAccountSelectSchema = createSelectSchema(bankAccounts);

export const bankAccountInsertSchema = createInsertSchema(bankAccounts, {
  bankName: z.string().min(1).max(200),
  branchName: z.string().max(200).optional(),
  accountNumber: z.string().min(1).max(50),
  accountHolderName: z.string().min(1).max(200),
  routingNumber: z.string().max(20).optional(),
  swiftCode: z.string().max(11).optional(),
  iban: z.string().max(34).optional(),
});

export const bankAccountUpdateSchema = createUpdateSchema(bankAccounts);

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
