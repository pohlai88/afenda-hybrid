import {
  integer,
  date,
  numeric,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { dateValue } from "../_zodShared";
import { timestampColumns, softDeleteColumns } from "../../../_shared";
import { statutorySchemes } from "./statutorySchemes";

/** `numeric(5, 4)` rate in [0, 1], at most four decimal places. */
function isValidContributionRateString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 1) return false;
  const frac = s.split(".")[1];
  return frac === undefined || frac.length <= 4;
}

const contributionRateString = z.string().refine(isValidContributionRateString, {
  message: "Rate must be between 0 and 1 with at most 4 decimal places (numeric 5,4)",
});

const optionalContributionRateString = z
  .string()
  .optional()
  .nullable()
  .refine((s) => s === undefined || s === null || isValidContributionRateString(s), {
    message: "Rate must be between 0 and 1 with at most 4 decimal places (numeric 5,4)",
  });

/** `numeric(14, 2)` wage bound: non-negative, at most two decimal places. */
function isValidWageBoundString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return false;
  const frac = s.split(".")[1];
  if (frac !== undefined && frac.length > 2) return false;
  return n <= 999_999_999_999.99;
}

const optionalWageBoundString = z
  .string()
  .optional()
  .nullable()
  .refine((s) => s === undefined || s === null || isValidWageBoundString(s), {
    message:
      "Wage bound must be a non-negative decimal up to 999,999,999,999.99 with at most 2 decimal places (numeric 14,2)",
  });

/**
 * Versioned official (or tenant-approved) contribution rates per statutory scheme.
 * Optional JSON for tier tables / country-specific rules.
 * At most one active (non-deleted) row per scheme per `effectiveFrom` (`uq_statutory_scheme_rates_scheme_effective_from`).
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
    uniqueIndex("uq_statutory_scheme_rates_scheme_effective_from")
      .on(t.statutorySchemeId, t.effectiveFrom)
      .where(sql`${t.deletedAt} IS NULL`),
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

export const StatutorySchemeRateIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"StatutorySchemeRateId">();
export type StatutorySchemeRateId = z.infer<typeof StatutorySchemeRateIdSchema>;

export const statutorySchemeRateMetadataSchema = z.record(z.string(), z.unknown());

export const statutorySchemeRateSelectSchema = createSelectSchema(statutorySchemeRates);

export const statutorySchemeRateInsertSchema = createInsertSchema(statutorySchemeRates, {
  statutorySchemeId: z.number().int().positive(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  employeeRate: contributionRateString,
  employerRate: contributionRateString,
  wageCeiling: z
    .string()
    .optional()
    .nullable()
    .refine((s) => s === undefined || s === null || isValidWageBoundString(s), {
      message:
        "wageCeiling must be a non-negative decimal up to 999,999,999,999.99 with at most 2 decimal places (numeric 14,2)",
    }),
  wageFloor: z
    .string()
    .optional()
    .nullable()
    .refine((s) => s === undefined || s === null || isValidWageBoundString(s), {
      message:
        "wageFloor must be a non-negative decimal up to 999,999,999,999.99 with at most 2 decimal places (numeric 14,2)",
    }),
  rateMetadata: statutorySchemeRateMetadataSchema.optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.effectiveTo != null) {
    const fromT = dateValue(data.effectiveFrom);
    const toT = dateValue(data.effectiveTo);
    if (Number.isNaN(fromT) || Number.isNaN(toT)) {
      ctx.addIssue({
        code: "custom",
        message: "effectiveFrom and effectiveTo must be valid dates",
        path: ["effectiveTo"],
      });
      return;
    }
    if (toT < fromT) {
      ctx.addIssue({
        code: "custom",
        message: "effectiveTo must be on or after effectiveFrom",
        path: ["effectiveTo"],
      });
    }
  }

  if (data.wageFloor != null && data.wageCeiling != null) {
    const floorN = Number.parseFloat(data.wageFloor);
    const ceilN = Number.parseFloat(data.wageCeiling);
    if (Number.isFinite(floorN) && Number.isFinite(ceilN) && floorN > ceilN) {
      ctx.addIssue({
        code: "custom",
        message: "wageFloor must be less than or equal to wageCeiling",
        path: ["wageFloor"],
      });
    }
  }
});

export const statutorySchemeRateUpdateSchema = createUpdateSchema(statutorySchemeRates, {
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  employeeRate: optionalContributionRateString,
  employerRate: optionalContributionRateString,
  wageCeiling: optionalWageBoundString,
  wageFloor: optionalWageBoundString,
  rateMetadata: statutorySchemeRateMetadataSchema.optional().nullable(),
})
  .omit({ statutorySchemeId: true })
  .superRefine((data, ctx) => {
    if (
      data.effectiveFrom !== undefined &&
      data.effectiveTo !== undefined &&
      data.effectiveTo !== null
    ) {
      const fromT = dateValue(data.effectiveFrom);
      const toT = dateValue(data.effectiveTo);
      if (Number.isNaN(fromT) || Number.isNaN(toT)) {
        ctx.addIssue({
          code: "custom",
          message: "effectiveFrom and effectiveTo must be valid dates",
          path: ["effectiveTo"],
        });
        return;
      }
      if (toT < fromT) {
        ctx.addIssue({
          code: "custom",
          message: "effectiveTo must be on or after effectiveFrom",
          path: ["effectiveTo"],
        });
      }
    }

    if (
      data.wageFloor !== undefined &&
      data.wageCeiling !== undefined &&
      data.wageFloor !== null &&
      data.wageCeiling !== null
    ) {
      const floorN = Number.parseFloat(data.wageFloor);
      const ceilN = Number.parseFloat(data.wageCeiling);
      if (Number.isFinite(floorN) && Number.isFinite(ceilN) && floorN > ceilN) {
        ctx.addIssue({
          code: "custom",
          message: "wageFloor must be less than or equal to wageCeiling",
          path: ["wageFloor"],
        });
      }
    }
  });

export type StatutorySchemeRate = typeof statutorySchemeRates.$inferSelect;
export type NewStatutorySchemeRate = typeof statutorySchemeRates.$inferInsert;
