import { integer, text, date, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Tax Profiles - Employee tax settings for payroll calculation.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const filingStatuses = ["SINGLE", "MARRIED_FILING_JOINTLY", "MARRIED_FILING_SEPARATELY", "HEAD_OF_HOUSEHOLD", "QUALIFYING_WIDOW"] as const;

export const filingStatusEnum = payrollSchema.enum("filing_status", [...filingStatuses]);

export const filingStatusZodEnum = createSelectSchema(filingStatusEnum);

export const taxProfileStatuses = ["ACTIVE", "INACTIVE", "SUPERSEDED"] as const;

export const taxProfileStatusEnum = payrollSchema.enum("tax_profile_status", [...taxProfileStatuses]);

export const taxProfileStatusZodEnum = createSelectSchema(taxProfileStatusEnum);

export const taxProfiles = payrollSchema.table(
  "tax_profiles",
  {
    taxProfileId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    taxYear: smallint().notNull(),
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

export const TaxProfileIdSchema = z.number().int().brand<"TaxProfileId">();
export type TaxProfileId = z.infer<typeof TaxProfileIdSchema>;

export const taxProfileSelectSchema = createSelectSchema(taxProfiles);

export const taxProfileInsertSchema = createInsertSchema(taxProfiles, {
  taxYear: z.number().int().min(2000).max(2100),
  taxIdNumber: z.string().max(50).optional(),
  allowances: z.number().int().min(0).max(99),
  additionalWithholding: z.number().int().min(0).optional(),
});

export const taxProfileUpdateSchema = createUpdateSchema(taxProfiles);

export type TaxProfile = typeof taxProfiles.$inferSelect;
export type NewTaxProfile = typeof taxProfiles.$inferInsert;
