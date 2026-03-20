import { integer, text, numeric, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Deduction Types - Tax, insurance, loan repayment types.
 * Configures how different deductions are calculated.
 */
export const deductionCategories = ["TAX", "SOCIAL_INSURANCE", "PENSION", "HEALTH_INSURANCE", "LOAN", "GARNISHMENT", "UNION_DUES", "OTHER"] as const;

export const deductionCategoryEnum = payrollSchema.enum("deduction_category", [...deductionCategories]);

export const deductionCategoryZodEnum = createSelectSchema(deductionCategoryEnum);

export const deductionTypeStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const deductionTypeStatusEnum = payrollSchema.enum("deduction_type_status", [...deductionTypeStatuses]);

export const deductionTypeStatusZodEnum = createSelectSchema(deductionTypeStatusEnum);

export const deductionTypes = payrollSchema.table(
  "deduction_types",
  {
    deductionTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    deductionCode: text().notNull(),
    ...nameColumn,
    category: deductionCategoryEnum().notNull(),
    description: text(),
    defaultRate: numeric({ precision: 5, scale: 4 }),
    isPreTax: boolean().notNull().default(false),
    isMandatory: boolean().notNull().default(false),
    status: deductionTypeStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_deduction_types_tenant").on(t.tenantId),
    index("idx_deduction_types_category").on(t.tenantId, t.category),
    index("idx_deduction_types_status").on(t.tenantId, t.status),
    uniqueIndex("uq_deduction_types_code")
      .on(t.tenantId, sql`lower(${t.deductionCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_deduction_types_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_deduction_types_rate",
      sql`${t.defaultRate} IS NULL OR (${t.defaultRate} >= 0 AND ${t.defaultRate} <= 1)`
    ),
  ]
);

export const DeductionTypeIdSchema = z.number().int().brand<"DeductionTypeId">();
export type DeductionTypeId = z.infer<typeof DeductionTypeIdSchema>;

export const deductionTypeSelectSchema = createSelectSchema(deductionTypes);

export const deductionTypeInsertSchema = createInsertSchema(deductionTypes, {
  deductionCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  defaultRate: z.string().optional(),
});

export const deductionTypeUpdateSchema = createUpdateSchema(deductionTypes);

export type DeductionType = typeof deductionTypes.$inferSelect;
export type NewDeductionType = typeof deductionTypes.$inferInsert;
