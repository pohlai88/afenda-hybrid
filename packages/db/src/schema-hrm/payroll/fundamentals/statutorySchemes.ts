import { integer, text, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns } from "../../../_shared";

/**
 * Statutory schemes — global catalog (no tenant): EPF, SOCSO, EIS, NI, CPF, etc.
 * Rates live in statutory_scheme_rates. Employee enrollment uses social_insurance_profiles.
 */
export const statutorySchemeCategories = [
  "PENSION",
  "HEALTH",
  "UNEMPLOYMENT",
  "DISABILITY",
  "LEVY",
  "OTHER",
] as const;

export const statutorySchemeCategoryEnum = payrollSchema.enum("statutory_scheme_category", [
  ...statutorySchemeCategories,
]);

export const StatutorySchemeCategorySchema = z.enum(statutorySchemeCategories);
export type StatutorySchemeCategory = z.infer<typeof StatutorySchemeCategorySchema>;

const schemeCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

const countryIso2Schema = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/, "Country must be ISO 3166-1 alpha-2")
  .transform((s) => s.toUpperCase());

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

export const StatutorySchemeIdSchema = z.number().int().positive().brand<"StatutorySchemeId">();
export type StatutorySchemeId = z.infer<typeof StatutorySchemeIdSchema>;

export const statutorySchemeSelectSchema = createSelectSchema(statutorySchemes);

export const statutorySchemeInsertSchema = createInsertSchema(statutorySchemes, {
  schemeCode: schemeCodeSchema,
  name: z.string().min(1).max(200),
  country: countryIso2Schema,
  category: StatutorySchemeCategorySchema,
  authority: z.string().max(200).optional(),
});

export const statutorySchemeUpdateSchema = createUpdateSchema(statutorySchemes, {
  schemeCode: schemeCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  country: countryIso2Schema.optional(),
  category: StatutorySchemeCategorySchema.optional(),
  authority: z.string().max(200).optional().nullable(),
});

export type StatutoryScheme = typeof statutorySchemes.$inferSelect;
export type NewStatutoryScheme = typeof statutorySchemes.$inferInsert;
