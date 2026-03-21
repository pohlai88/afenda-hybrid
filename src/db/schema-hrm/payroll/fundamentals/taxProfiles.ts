import { integer, text, date, smallint, varchar, jsonb, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { dateValue } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Tax Profiles — employee tax settings for payroll calculation.
 * `filingStatus` is meaningful for `US_FEDERAL`; other regimes should keep `SINGLE` as a neutral placeholder (enforced in Zod).
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const filingStatuses = ["SINGLE", "MARRIED_FILING_JOINTLY", "MARRIED_FILING_SEPARATELY", "HEAD_OF_HOUSEHOLD", "QUALIFYING_WIDOW"] as const;

export const filingStatusEnum = payrollSchema.enum("filing_status", [...filingStatuses]);

export const FilingStatusSchema = z.enum(filingStatuses);
export type FilingStatus = z.infer<typeof FilingStatusSchema>;

export const taxProfileStatuses = ["ACTIVE", "INACTIVE", "SUPERSEDED"] as const;

export const taxProfileStatusEnum = payrollSchema.enum("tax_profile_status", [...taxProfileStatuses]);

export const TaxProfileStatusSchema = z.enum(taxProfileStatuses);
export type TaxProfileStatus = z.infer<typeof TaxProfileStatusSchema>;

/** Which payroll tax engine / form family applies (filingStatus is US_FEDERAL-only). */
export const taxRegimes = ["US_FEDERAL", "MY_LHDN", "GENERIC", "OTHER"] as const;

export const taxRegimeEnum = payrollSchema.enum("tax_regime", [...taxRegimes]);

export const TaxRegimeSchema = z.enum(taxRegimes);
export type TaxRegime = z.infer<typeof TaxRegimeSchema>;

/** ISO 3166-1 alpha-2; normalized to uppercase for storage. */
const taxJurisdictionCountrySchema = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/, "Country must be ISO 3166-1 alpha-2")
  .transform((s) => s.toUpperCase());

const regimePayloadSchema = z.record(z.string(), z.unknown());

export const taxProfiles = payrollSchema.table(
  "tax_profiles",
  {
    taxProfileId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    taxYear: smallint().notNull(),
    taxJurisdictionCountry: varchar({ length: 2 }).notNull().default("US"),
    taxRegime: taxRegimeEnum().notNull().default("US_FEDERAL"),
    regimePayload: jsonb().$type<Record<string, unknown>>(),
    taxIdNumber: text(),
    filingStatus: filingStatusEnum().notNull().default("SINGLE"),
    allowances: smallint().notNull().default(0),
    additionalWithholding: integer().default(0),
    isExempt: integer().notNull().default(0),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    status: taxProfileStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_tax_profiles_tenant").on(t.tenantId),
    index("idx_tax_profiles_employee").on(t.tenantId, t.employeeId),
    index("idx_tax_profiles_year").on(t.tenantId, t.taxYear),
    index("idx_tax_profiles_status").on(t.tenantId, t.status),
    index("idx_tax_profiles_regime").on(t.tenantId, t.taxRegime),
    index("idx_tax_profiles_country").on(t.tenantId, t.taxJurisdictionCountry),
    uniqueIndex("uq_tax_profiles_employee_year")
      .on(t.tenantId, t.employeeId, t.taxYear)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'ACTIVE'`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_tax_profiles_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_tax_profiles_allowances",
      sql`${t.allowances} >= 0`
    ),
    check(
      "chk_tax_profiles_withholding",
      sql`${t.additionalWithholding} IS NULL OR ${t.additionalWithholding} >= 0`
    ),
    check(
      "chk_tax_profiles_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const TaxProfileIdSchema = z.number().int().positive().brand<"TaxProfileId">();
export type TaxProfileId = z.infer<typeof TaxProfileIdSchema>;

export const taxProfileSelectSchema = createSelectSchema(taxProfiles);

function refineFilingStatusForRegime(
  taxRegime: TaxRegime | undefined,
  filingStatus: FilingStatus | undefined,
  ctx: z.RefinementCtx,
): void {
  const regime = taxRegime ?? "US_FEDERAL";
  const filing = filingStatus ?? "SINGLE";
  if (regime !== "US_FEDERAL" && filing !== "SINGLE") {
    ctx.addIssue({
      code: "custom",
      message: "filingStatus applies only to US_FEDERAL; use SINGLE for other tax regimes",
      path: ["filingStatus"],
    });
  }
}

export const taxProfileInsertSchema = createInsertSchema(taxProfiles, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  taxYear: z.number().int().min(2000).max(2100),
  taxJurisdictionCountry: taxJurisdictionCountrySchema.optional(),
  taxRegime: TaxRegimeSchema.optional(),
  regimePayload: regimePayloadSchema.optional().nullable(),
  taxIdNumber: z.string().max(50).optional(),
  filingStatus: FilingStatusSchema.optional(),
  allowances: z.number().int().min(0).max(99).optional(),
  additionalWithholding: z.number().int().min(0).optional().nullable(),
  isExempt: z.number().int().min(0).max(1).optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: TaxProfileStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  refineFilingStatusForRegime(data.taxRegime, data.filingStatus, ctx);

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
});

export const taxProfileUpdateSchema = createUpdateSchema(taxProfiles, {
  taxYear: z.number().int().min(2000).max(2100).optional(),
  taxJurisdictionCountry: taxJurisdictionCountrySchema.optional(),
  taxRegime: TaxRegimeSchema.optional(),
  regimePayload: regimePayloadSchema.optional().nullable(),
  taxIdNumber: z.string().max(50).optional().nullable(),
  filingStatus: FilingStatusSchema.optional(),
  allowances: z.number().int().min(0).max(99).optional(),
  additionalWithholding: z.number().int().min(0).optional().nullable(),
  isExempt: z.number().int().min(0).max(1).optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: TaxProfileStatusSchema.optional(),
})
  .omit({ tenantId: true, employeeId: true })
  .superRefine((data, ctx) => {
    if (data.taxRegime !== undefined && data.filingStatus !== undefined) {
      refineFilingStatusForRegime(data.taxRegime, data.filingStatus, ctx);
    }

    if (data.effectiveFrom !== undefined && data.effectiveTo !== undefined && data.effectiveTo !== null) {
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
  });

export type TaxProfile = typeof taxProfiles.$inferSelect;
export type NewTaxProfile = typeof taxProfiles.$inferInsert;
