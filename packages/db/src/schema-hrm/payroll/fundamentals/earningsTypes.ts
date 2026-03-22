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
 * Earnings Types - Salary, overtime, bonus, commission types.
 * Configures how different earnings are calculated and taxed.
 */
export const earningsCategories = [
  "SALARY",
  "OVERTIME",
  "BONUS",
  "COMMISSION",
  "ALLOWANCE",
  "INCENTIVE",
  "OTHER",
] as const;

export const earningsCategoryEnum = payrollSchema.enum("earnings_category", [
  ...earningsCategories,
]);

export const EarningsCategorySchema = z.enum(earningsCategories);
export type EarningsCategory = z.infer<typeof EarningsCategorySchema>;

export const earningsTypeStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const earningsTypeStatusEnum = payrollSchema.enum("earnings_type_status", [
  ...earningsTypeStatuses,
]);

export const EarningsTypeStatusSchema = z.enum(earningsTypeStatuses);
export type EarningsTypeStatus = z.infer<typeof EarningsTypeStatusSchema>;

/** Matches `numeric(5, 2)`: 0 .. 999.99, max two fractional digits when provided as string. */
function isValidDefaultRateString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 999.99) return false;
  const frac = s.split(".")[1];
  return frac === undefined || frac.length <= 2;
}

const earningsCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

/**
 * Table `earnings_types` — tenant catalog of earnings codes; unique per tenant on `lower(earningsCode)` among non-deleted rows.
 */
export const earningsTypes = payrollSchema.table(
  "earnings_types",
  {
    earningsTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    /** Normalized to uppercase in Zod insert/update for consistent storage and uniqueness. */
    earningsCode: text().notNull(),
    ...nameColumn,
    category: earningsCategoryEnum().notNull(),
    description: text(),
    defaultRate: numeric({ precision: 5, scale: 2 }),
    isTaxable: boolean().notNull().default(true),
    isPensionable: boolean().notNull().default(true),
    /** Lifecycle: `ACTIVE` | `INACTIVE` | `ARCHIVED`. */
    status: earningsTypeStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_earnings_types_tenant").on(t.tenantId),
    index("idx_earnings_types_category").on(t.tenantId, t.category),
    index("idx_earnings_types_status").on(t.tenantId, t.status),
    uniqueIndex("uq_earnings_types_code")
      .on(t.tenantId, sql`lower(${t.earningsCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_earnings_types_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_earnings_types_rate", sql`${t.defaultRate} IS NULL OR ${t.defaultRate} >= 0`),
  ]
);

export const EarningsTypeIdSchema = z.number().int().positive().brand<"EarningsTypeId">();
export type EarningsTypeId = z.infer<typeof EarningsTypeIdSchema>;

export const earningsTypeSelectSchema = createSelectSchema(earningsTypes);

export const earningsTypeInsertSchema = createInsertSchema(earningsTypes, {
  tenantId: z.number().int().positive(),
  earningsCode: earningsCodeSchema,
  name: z.string().min(1).max(200),
  category: EarningsCategorySchema,
  description: z.string().max(1000).optional(),
  defaultRate: z
    .string()
    .optional()
    .refine((s) => s === undefined || isValidDefaultRateString(s), {
      message: "defaultRate must be between 0 and 999.99 with at most 2 decimal places",
    }),
  isTaxable: z.boolean().optional(),
  isPensionable: z.boolean().optional(),
  status: EarningsTypeStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

/** Patch payload: `tenantId` is immutable after insert. `earningsCode` is uppercased. */
export const earningsTypeUpdateSchema = createUpdateSchema(earningsTypes, {
  earningsCode: earningsCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  category: EarningsCategorySchema.optional(),
  description: z.string().max(1000).optional().nullable(),
  defaultRate: z
    .string()
    .optional()
    .nullable()
    .refine((s) => s === undefined || s === null || isValidDefaultRateString(s), {
      message: "defaultRate must be between 0 and 999.99 with at most 2 decimal places",
    }),
  isTaxable: z.boolean().optional(),
  isPensionable: z.boolean().optional(),
  status: EarningsTypeStatusSchema.optional(),
}).omit({ tenantId: true });

export type EarningsType = typeof earningsTypes.$inferSelect;
export type NewEarningsType = typeof earningsTypes.$inferInsert;
