import { integer, text, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns } from "../../_shared";

/**
 * Statutory schemes — global catalog (no tenant): EPF, SOCSO, EIS, NI, CPF, etc.
 * Rates live in statutory_scheme_rates. Employee enrollment uses social_insurance_profiles.
 */
export const statutorySchemeCategories = ["PENSION", "HEALTH", "UNEMPLOYMENT", "DISABILITY", "LEVY", "OTHER"] as const;

export const statutorySchemeCategoryEnum = payrollSchema.enum("statutory_scheme_category", [
  ...statutorySchemeCategories,
]);

export const statutorySchemeCategoryZodEnum = createSelectSchema(statutorySchemeCategoryEnum);

export const statutorySchemes = payrollSchema.table(
  "statutory_schemes",
  {
    statutorySchemeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    schemeCode: text().notNull(),
    name: text().notNull(),
    country: text().notNull(),
    category: statutorySchemeCategoryEnum().notNull(),
    authority: text(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    index("idx_statutory_schemes_country").on(t.country),
    index("idx_statutory_schemes_category").on(t.category),
    uniqueIndex("uq_statutory_schemes_country_code")
      .on(sql`lower(${t.country})`, sql`lower(${t.schemeCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
  ]
);

export const StatutorySchemeIdSchema = z.number().int().brand<"StatutorySchemeId">();
export type StatutorySchemeId = z.infer<typeof StatutorySchemeIdSchema>;

export const statutorySchemeSelectSchema = createSelectSchema(statutorySchemes);

export const statutorySchemeInsertSchema = createInsertSchema(statutorySchemes, {
  schemeCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i),
  name: z.string().min(1).max(200),
  country: z.string().length(2).regex(/^[A-Z]{2}$/),
  authority: z.string().max(200).optional(),
});

export const statutorySchemeUpdateSchema = createUpdateSchema(statutorySchemes);

export type StatutoryScheme = typeof statutorySchemes.$inferSelect;
export type NewStatutoryScheme = typeof statutorySchemes.$inferInsert;
