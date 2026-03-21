import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { dateValue } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { legalEntities } from "../../../schema-platform/core/legalEntities";
import { statutorySchemes } from "./statutorySchemes";

/**
 * Social Insurance Profiles — employee enrollment in a statutory scheme.
 * Prefer statutorySchemeId + rates from statutory_scheme_rates; schemeName legacy when scheme row absent.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const socialInsuranceStatuses = ["ACTIVE", "INACTIVE", "EXEMPT", "PENDING"] as const;

export const socialInsuranceStatusEnum = payrollSchema.enum("social_insurance_status", [...socialInsuranceStatuses]);

export const SocialInsuranceStatusSchema = z.enum(socialInsuranceStatuses);
export type SocialInsuranceStatus = z.infer<typeof SocialInsuranceStatusSchema>;

/** `numeric(5, 4)` contribution rate in [0, 1], at most four decimal places. */
function isValidContributionRateString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 1) return false;
  const frac = s.split(".")[1];
  return frac === undefined || frac.length <= 4;
}

const contributionRateString = z.string().refine(isValidContributionRateString, {
  message: "Rate must be between 0 and 1 with at most 4 decimal places (numeric 5,4)",
});

/**
 * Table `social_insurance_profiles` — one ACTIVE open-ended row per employee per scheme (or per legacy scheme name) via partial unique indexes.
 */
export const socialInsuranceProfiles = payrollSchema.table(
  "social_insurance_profiles",
  {
    socialInsuranceProfileId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    statutorySchemeId: integer(),
    legalEntityId: integer(),
    insuranceNumber: text(),
    /** @deprecated Prefer statutorySchemeId; retained for legacy rows */
    schemeName: text(),
    employeeContributionRate: numeric({ precision: 5, scale: 4 }).notNull(),
    employerContributionRate: numeric({ precision: 5, scale: 4 }).notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    /** Lifecycle: `ACTIVE` | `INACTIVE` | `EXEMPT` | `PENDING`. */
    status: socialInsuranceStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_social_insurance_profiles_tenant").on(t.tenantId),
    index("idx_social_insurance_profiles_employee").on(t.tenantId, t.employeeId),
    index("idx_social_insurance_profiles_status").on(t.tenantId, t.status),
    index("idx_social_insurance_profiles_scheme").on(t.tenantId, t.statutorySchemeId),
    index("idx_social_insurance_profiles_legal_entity").on(t.tenantId, t.legalEntityId),
    uniqueIndex("uq_social_insurance_profiles_active_scheme")
      .on(t.tenantId, t.employeeId, t.statutorySchemeId)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = 'ACTIVE' AND ${t.effectiveTo} IS NULL AND ${t.statutorySchemeId} IS NOT NULL`
      ),
    uniqueIndex("uq_social_insurance_profiles_active_legacy_name")
      .on(t.tenantId, t.employeeId, sql`lower(${t.schemeName})`)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = 'ACTIVE' AND ${t.effectiveTo} IS NULL AND ${t.statutorySchemeId} IS NULL`
      ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_social_insurance_profiles_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.statutorySchemeId],
      foreignColumns: [statutorySchemes.statutorySchemeId],
      name: "fk_social_insurance_profiles_statutory_scheme",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.legalEntityId],
      foreignColumns: [legalEntities.legalEntityId],
      name: "fk_social_insurance_profiles_legal_entity",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_social_insurance_profiles_scheme_or_name",
      sql`(${t.statutorySchemeId} IS NOT NULL) OR (${t.schemeName} IS NOT NULL AND length(trim(${t.schemeName})) > 0)`
    ),
    check(
      "chk_social_insurance_profiles_employee_rate",
      sql`${t.employeeContributionRate} >= 0 AND ${t.employeeContributionRate} <= 1`
    ),
    check(
      "chk_social_insurance_profiles_employer_rate",
      sql`${t.employerContributionRate} >= 0 AND ${t.employerContributionRate} <= 1`
    ),
    check(
      "chk_social_insurance_profiles_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const SocialInsuranceProfileIdSchema = z.number().int().positive().brand<"SocialInsuranceProfileId">();
export type SocialInsuranceProfileId = z.infer<typeof SocialInsuranceProfileIdSchema>;

export const socialInsuranceProfileSelectSchema = createSelectSchema(socialInsuranceProfiles);

export const socialInsuranceProfileInsertSchema = createInsertSchema(socialInsuranceProfiles, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  statutorySchemeId: z.number().int().positive().optional(),
  legalEntityId: z.number().int().positive().optional(),
  insuranceNumber: z.string().max(50).optional(),
  schemeName: z.string().min(1).max(200).optional(),
  employeeContributionRate: contributionRateString,
  employerContributionRate: contributionRateString,
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: SocialInsuranceStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.statutorySchemeId == null && (data.schemeName == null || String(data.schemeName).trim() === "")) {
    ctx.addIssue({
      code: "custom",
      message: "Provide statutorySchemeId or schemeName",
      path: ["statutorySchemeId"],
    });
  }
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

const optionalContributionRateString = z
  .string()
  .optional()
  .nullable()
  .refine((s) => s === undefined || s === null || isValidContributionRateString(s), {
    message: "Rate must be between 0 and 1 with at most 4 decimal places (numeric 5,4)",
  });

/** Patch payload: `tenantId` / `employeeId` immutable. Do not clear both scheme keys in one patch. */
export const socialInsuranceProfileUpdateSchema = createUpdateSchema(socialInsuranceProfiles, {
  statutorySchemeId: z.number().int().positive().optional().nullable(),
  legalEntityId: z.number().int().positive().optional().nullable(),
  insuranceNumber: z.string().max(50).optional().nullable(),
  schemeName: z.string().min(1).max(200).optional().nullable(),
  employeeContributionRate: optionalContributionRateString,
  employerContributionRate: optionalContributionRateString,
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: SocialInsuranceStatusSchema.optional(),
})
  .omit({ tenantId: true, employeeId: true })
  .superRefine((data, ctx) => {
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

    const sidTouched = data.statutorySchemeId !== undefined;
    const nameTouched = data.schemeName !== undefined;
    if (
      sidTouched &&
      nameTouched &&
      data.statutorySchemeId === null &&
      (data.schemeName === null || String(data.schemeName).trim() === "")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot clear both statutorySchemeId and schemeName in the same patch",
        path: ["statutorySchemeId"],
      });
    }
  });

export type SocialInsuranceProfile = typeof socialInsuranceProfiles.$inferSelect;
export type NewSocialInsuranceProfile = typeof socialInsuranceProfiles.$inferInsert;
