import { integer, date, numeric, jsonb, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns } from "../../_shared";
import { statutorySchemes } from "./statutorySchemes";

/**
 * Versioned official (or tenant-approved) contribution rates per statutory scheme.
 * Optional JSON for tier tables / country-specific rules.
 */
export const statutorySchemeRates = payrollSchema.table(
  "statutory_scheme_rates",
  {
    statutorySchemeRateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    statutorySchemeId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    employeeRate: numeric({ precision: 5, scale: 4 }).notNull(),
    employerRate: numeric({ precision: 5, scale: 4 }).notNull(),
    wageCeiling: numeric({ precision: 14, scale: 2 }),
    wageFloor: numeric({ precision: 14, scale: 2 }),
    rateMetadata: jsonb().$type<Record<string, unknown>>(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    index("idx_statutory_scheme_rates_scheme").on(t.statutorySchemeId),
    index("idx_statutory_scheme_rates_effective").on(t.statutorySchemeId, t.effectiveFrom),
    foreignKey({
      columns: [t.statutorySchemeId],
      foreignColumns: [statutorySchemes.statutorySchemeId],
      name: "fk_statutory_scheme_rates_scheme",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_statutory_scheme_rates_employee",
      sql`${t.employeeRate} >= 0 AND ${t.employeeRate} <= 1`
    ),
    check(
      "chk_statutory_scheme_rates_employer",
      sql`${t.employerRate} >= 0 AND ${t.employerRate} <= 1`
    ),
    check(
      "chk_statutory_scheme_rates_effective",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const StatutorySchemeRateIdSchema = z.number().int().brand<"StatutorySchemeRateId">();
export type StatutorySchemeRateId = z.infer<typeof StatutorySchemeRateIdSchema>;

export const statutorySchemeRateMetadataSchema = z.record(z.string(), z.unknown()).optional();

export const statutorySchemeRateSelectSchema = createSelectSchema(statutorySchemeRates);

export const statutorySchemeRateInsertSchema = createInsertSchema(statutorySchemeRates, {
  employeeRate: z.string().refine((v) => {
    const n = parseFloat(v);
    return n >= 0 && n <= 1;
  }),
  employerRate: z.string().refine((v) => {
    const n = parseFloat(v);
    return n >= 0 && n <= 1;
  }),
  rateMetadata: statutorySchemeRateMetadataSchema,
});

export const statutorySchemeRateUpdateSchema = createUpdateSchema(statutorySchemeRates);

export type StatutorySchemeRate = typeof statutorySchemeRates.$inferSelect;
export type NewStatutorySchemeRate = typeof statutorySchemeRates.$inferInsert;
