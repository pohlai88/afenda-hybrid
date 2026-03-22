import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Income Tax Slabs - Tax bracket definitions per country/fiscal year.
 * Defines progressive tax rates for payroll tax computation.
 */
export const taxSlabStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const taxSlabStatusEnum = payrollSchema.enum("tax_slab_status", [...taxSlabStatuses]);

export const TaxSlabStatusSchema = z.enum(taxSlabStatuses);
export type TaxSlabStatus = z.infer<typeof TaxSlabStatusSchema>;

export const incomeTaxSlabs = payrollSchema.table(
  "income_tax_slabs",
  {
    taxSlabId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    taxSlabCode: text().notNull(),
    ...nameColumn,
    country: text().notNull(),
    currencyId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    status: taxSlabStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_income_tax_slabs_tenant").on(t.tenantId),
    index("idx_income_tax_slabs_country_effective").on(t.tenantId, t.country, t.effectiveFrom),
    index("idx_income_tax_slabs_status").on(t.tenantId, t.status),
    uniqueIndex("uq_income_tax_slabs_code")
      .on(t.tenantId, sql`lower(${t.taxSlabCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_income_tax_slabs_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_income_tax_slabs_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_income_tax_slabs_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const TaxSlabIdSchema = z.number().int().positive().brand<"TaxSlabId">();
export type TaxSlabId = z.infer<typeof TaxSlabIdSchema>;

const taxSlabCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const incomeTaxSlabSelectSchema = createSelectSchema(incomeTaxSlabs);

export const incomeTaxSlabInsertSchema = createInsertSchema(incomeTaxSlabs, {
  tenantId: z.number().int().positive(),
  taxSlabCode: taxSlabCodeSchema,
  name: z.string().min(1).max(200),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 code"),
  currencyId: z.number().int().positive(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: TaxSlabStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
    ctx.addIssue({
      code: "custom",
      message: "effectiveTo must be on or after effectiveFrom",
      path: ["effectiveTo"],
    });
  }
});

export const incomeTaxSlabUpdateSchema = createUpdateSchema(incomeTaxSlabs, {
  taxSlabCode: taxSlabCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .optional(),
  currencyId: z.number().int().positive().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: TaxSlabStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true })
  .superRefine((data, ctx) => {
    const d = data as Record<string, unknown>;
    if (d.effectiveTo && d.effectiveFrom && (d.effectiveTo as Date) < (d.effectiveFrom as Date)) {
      ctx.addIssue({
        code: "custom",
        message: "effectiveTo must be on or after effectiveFrom",
        path: ["effectiveTo"],
      });
    }
  });

export type IncomeTaxSlab = typeof incomeTaxSlabs.$inferSelect;
export type NewIncomeTaxSlab = typeof incomeTaxSlabs.$inferInsert;
