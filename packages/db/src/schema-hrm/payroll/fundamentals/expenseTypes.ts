import {
  integer,
  text,
  numeric,
  boolean,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Expense Types - Travel, meals, equipment reimbursement categories.
 */
export const expenseCategories = [
  "TRAVEL",
  "MEALS",
  "ACCOMMODATION",
  "TRANSPORT",
  "EQUIPMENT",
  "COMMUNICATION",
  "TRAINING",
  "OTHER",
] as const;

export const expenseCategoryEnum = payrollSchema.enum("expense_category", [...expenseCategories]);

export const ExpenseCategorySchema = z.enum(expenseCategories);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const expenseTypeStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const expenseTypeStatusEnum = payrollSchema.enum("expense_type_status", [
  ...expenseTypeStatuses,
]);

export const ExpenseTypeStatusSchema = z.enum(expenseTypeStatuses);
export type ExpenseTypeStatus = z.infer<typeof ExpenseTypeStatusSchema>;

/** Matches `numeric(10, 2)` and DB check: NULL in DB; when set, must be **> 0**. */
function isValidMaxAmountString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return false;
  const frac = s.split(".")[1];
  if (frac !== undefined && frac.length > 2) return false;
  return n <= 99_999_999.99;
}

const expenseCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

/**
 * Table `expense_types` — tenant catalog of expense codes; unique per tenant on `lower(expenseCode)` among non-deleted rows.
 */
export const expenseTypes = payrollSchema.table(
  "expense_types",
  {
    expenseTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    /** Normalized to uppercase in Zod insert/update for consistent storage and uniqueness. */
    expenseCode: text().notNull(),
    ...nameColumn,
    category: expenseCategoryEnum().notNull(),
    description: text(),
    maxAmount: numeric({ precision: 10, scale: 2 }),
    requiresReceipt: boolean().notNull().default(true),
    requiresApproval: boolean().notNull().default(true),
    /** Lifecycle: `ACTIVE` | `INACTIVE` | `ARCHIVED`. */
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
    check("chk_expense_types_max_amount", sql`${t.maxAmount} IS NULL OR ${t.maxAmount} > 0`),
  ]
);

export const ExpenseTypeIdSchema = z.number().int().positive().brand<"ExpenseTypeId">();
export type ExpenseTypeId = z.infer<typeof ExpenseTypeIdSchema>;

export const expenseTypeSelectSchema = createSelectSchema(expenseTypes);

export const expenseTypeInsertSchema = createInsertSchema(expenseTypes, {
  tenantId: z.number().int().positive(),
  expenseCode: expenseCodeSchema,
  name: z.string().min(1).max(200),
  category: ExpenseCategorySchema,
  description: z.string().max(1000).optional(),
  maxAmount: z
    .string()
    .optional()
    .refine((s) => s === undefined || isValidMaxAmountString(s), {
      message:
        "maxAmount must be a positive decimal up to 99,999,999.99 with at most 2 decimal places",
    }),
  requiresReceipt: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  status: ExpenseTypeStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

/** Patch payload: `tenantId` is immutable after insert. `expenseCode` is uppercased. */
export const expenseTypeUpdateSchema = createUpdateSchema(expenseTypes, {
  expenseCode: expenseCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  category: ExpenseCategorySchema.optional(),
  description: z.string().max(1000).optional().nullable(),
  maxAmount: z
    .string()
    .optional()
    .nullable()
    .refine((s) => s === undefined || s === null || isValidMaxAmountString(s), {
      message:
        "maxAmount must be a positive decimal up to 99,999,999.99 with at most 2 decimal places",
    }),
  requiresReceipt: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  status: ExpenseTypeStatusSchema.optional(),
}).omit({ tenantId: true });

export type ExpenseType = typeof expenseTypes.$inferSelect;
export type NewExpenseType = typeof expenseTypes.$inferInsert;
