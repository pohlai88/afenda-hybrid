import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Social Insurance Profiles - Government insurance scheme enrollment.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const socialInsuranceStatuses = ["ACTIVE", "INACTIVE", "EXEMPT", "PENDING"] as const;

export const socialInsuranceStatusEnum = payrollSchema.enum("social_insurance_status", [...socialInsuranceStatuses]);

export const socialInsuranceStatusZodEnum = createSelectSchema(socialInsuranceStatusEnum);

export const socialInsuranceProfiles = payrollSchema.table(
  "social_insurance_profiles",
  {
    socialInsuranceProfileId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    insuranceNumber: text(),
    schemeName: text().notNull(),
    employeeContributionRate: numeric({ precision: 5, scale: 4 }).notNull(),
    employerContributionRate: numeric({ precision: 5, scale: 4 }).notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    status: socialInsuranceStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_social_insurance_profiles_tenant").on(t.tenantId),
    index("idx_social_insurance_profiles_employee").on(t.tenantId, t.employeeId),
    index("idx_social_insurance_profiles_status").on(t.tenantId, t.status),
    uniqueIndex("uq_social_insurance_profiles_active")
      .on(t.tenantId, t.employeeId, t.schemeName)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'ACTIVE' AND ${t.effectiveTo} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_social_insurance_profiles_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
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

export const SocialInsuranceProfileIdSchema = z.number().int().brand<"SocialInsuranceProfileId">();
export type SocialInsuranceProfileId = z.infer<typeof SocialInsuranceProfileIdSchema>;

export const socialInsuranceProfileSelectSchema = createSelectSchema(socialInsuranceProfiles);

export const socialInsuranceProfileInsertSchema = createInsertSchema(socialInsuranceProfiles, {
  insuranceNumber: z.string().max(50).optional(),
  schemeName: z.string().min(1).max(200),
  employeeContributionRate: z.string().refine((val) => {
    const num = parseFloat(val);
    return num >= 0 && num <= 1;
  }, "Rate must be between 0 and 1"),
  employerContributionRate: z.string().refine((val) => {
    const num = parseFloat(val);
    return num >= 0 && num <= 1;
  }, "Rate must be between 0 and 1"),
});

export const socialInsuranceProfileUpdateSchema = createUpdateSchema(socialInsuranceProfiles);

export type SocialInsuranceProfile = typeof socialInsuranceProfiles.$inferSelect;
export type NewSocialInsuranceProfile = typeof socialInsuranceProfiles.$inferInsert;
