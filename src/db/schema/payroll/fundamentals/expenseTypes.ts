import { integer, text, numeric, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Expense Types - Travel, meals, equipment reimbursement categories.
 */
export const expenseCategories = ["TRAVEL", "MEALS", "ACCOMMODATION", "TRANSPORT", "EQUIPMENT", "COMMUNICATION", "TRAINING", "OTHER"] as const;

export const expenseCategoryEnum = payrollSchema.enum("expense_category", [...expenseCategories]);

export const expenseCategoryZodEnum = createSelectSchema(expenseCategoryEnum);

export const expenseTypeStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const expenseTypeStatusEnum = payrollSchema.enum("expense_type_status", [...expenseTypeStatuses]);

export const expenseTypeStatusZodEnum = createSelectSchema(expenseTypeStatusEnum);

export const expenseTypes = payrollSchema.table(
  "expense_types",
  {
    expenseTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    expenseCode: text().notNull(),
    ...nameColumn,
    category: expenseCategoryEnum().notNull(),
    description: text(),
    maxAmount: numeric({ precision: 10, scale: 2 }),
    requiresReceipt: boolean().notNull().default(true),
    requiresApproval: boolean().notNull().default(true),
    status: expenseTypeStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_expense_types_tenant").on(t.tenantId),
    index("idx_expense_types_category").on(t.tenantId, t.category),
    index("idx_expense_types_status").on(t.tenantId, t.status),
    uniqueIndex("uq_expense_types_code")
      .on(t.tenantId, sql`lower(${t.expenseCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_expense_types_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_expense_types_max_amount",
      sql`${t.maxAmount} IS NULL OR ${t.maxAmount} > 0`
    ),
  ]
);

export const ExpenseTypeIdSchema = z.number().int().brand<"ExpenseTypeId">();
export type ExpenseTypeId = z.infer<typeof ExpenseTypeIdSchema>;

export const expenseTypeSelectSchema = createSelectSchema(expenseTypes);

export const expenseTypeInsertSchema = createInsertSchema(expenseTypes, {
  expenseCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  maxAmount: z.string().optional(),
});

export const expenseTypeUpdateSchema = createUpdateSchema(expenseTypes);

export type ExpenseType = typeof expenseTypes.$inferSelect;
export type NewExpenseType = typeof expenseTypes.$inferInsert;
