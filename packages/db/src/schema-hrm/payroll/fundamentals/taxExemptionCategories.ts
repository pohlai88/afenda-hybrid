import { integer, text, numeric, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { zMoney12_2NonNegative, zMoney12_2NonNegativeOptionalNullable } from "../_zodShared";

/**
 * Tax Exemption Categories - Statutory tax exemption types (e.g., HRA, LTA, 80C investments).
 * Defines maximum exemption amounts per category for employee tax declarations.
 */
export const taxExemptionCategoryStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const taxExemptionCategoryStatusEnum = payrollSchema.enum("tax_exemption_category_status", [
  ...taxExemptionCategoryStatuses,
]);

export const TaxExemptionCategoryStatusSchema = z.enum(taxExemptionCategoryStatuses);
export type TaxExemptionCategoryStatus = z.infer<typeof TaxExemptionCategoryStatusSchema>;

export const taxExemptionCategories = payrollSchema.table(
  "tax_exemption_categories",
  {
    categoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    categoryCode: text().notNull(),
    ...nameColumn,
    description: text(),
    maxExemptionAmount: numeric({ precision: 12, scale: 2 }),
    status: taxExemptionCategoryStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_tax_exemption_categories_tenant").on(t.tenantId),
    index("idx_tax_exemption_categories_status").on(t.tenantId, t.status),
    uniqueIndex("uq_tax_exemption_categories_code")
      .on(t.tenantId, sql`lower(${t.categoryCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_tax_exemption_categories_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const TaxExemptionCategoryIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"TaxExemptionCategoryId">();
export type TaxExemptionCategoryId = z.infer<typeof TaxExemptionCategoryIdSchema>;

const categoryCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const taxExemptionCategorySelectSchema = createSelectSchema(taxExemptionCategories);

export const taxExemptionCategoryInsertSchema = createInsertSchema(taxExemptionCategories, {
  tenantId: z.number().int().positive(),
  categoryCode: categoryCodeSchema,
  name: z.string().min(1).max(200),
  maxExemptionAmount: zMoney12_2NonNegative().optional().nullable(),
  status: TaxExemptionCategoryStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const taxExemptionCategoryUpdateSchema = createUpdateSchema(taxExemptionCategories, {
  categoryCode: categoryCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  maxExemptionAmount: zMoney12_2NonNegativeOptionalNullable(),
  status: TaxExemptionCategoryStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type TaxExemptionCategory = typeof taxExemptionCategories.$inferSelect;
export type NewTaxExemptionCategory = typeof taxExemptionCategories.$inferInsert;
