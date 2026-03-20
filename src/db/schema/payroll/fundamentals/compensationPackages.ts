import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Compensation Packages - Salary structure agreements per employee.
 * Effective-dated for salary history tracking.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const compensationStatuses = ["DRAFT", "ACTIVE", "SUPERSEDED", "TERMINATED"] as const;

export const compensationStatusEnum = payrollSchema.enum("compensation_status", [...compensationStatuses]);

export const compensationStatusZodEnum = createSelectSchema(compensationStatusEnum);

export const payFrequencies = ["MONTHLY", "BIWEEKLY", "WEEKLY", "SEMI_MONTHLY", "ANNUAL"] as const;

export const payFrequencyEnum = payrollSchema.enum("pay_frequency", [...payFrequencies]);

export const payFrequencyZodEnum = createSelectSchema(payFrequencyEnum);

export const compensationPackages = payrollSchema.table(
  "compensation_packages",
  {
    compensationPackageId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    baseSalary: numeric({ precision: 12, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    payFrequency: payFrequencyEnum().notNull().default("MONTHLY"),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    reason: text(),
    status: compensationStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_compensation_packages_tenant").on(t.tenantId),
    index("idx_compensation_packages_employee").on(t.tenantId, t.employeeId),
    index("idx_compensation_packages_effective").on(t.tenantId, t.employeeId, t.effectiveFrom),
    index("idx_compensation_packages_status").on(t.tenantId, t.status),
    uniqueIndex("uq_compensation_packages_active")
      .on(t.tenantId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'ACTIVE' AND ${t.effectiveTo} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_compensation_packages_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_compensation_packages_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_compensation_packages_salary",
      sql`${t.baseSalary} >= 0`
    ),
    check(
      "chk_compensation_packages_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const CompensationPackageIdSchema = z.number().int().brand<"CompensationPackageId">();
export type CompensationPackageId = z.infer<typeof CompensationPackageIdSchema>;

export const compensationPackageSelectSchema = createSelectSchema(compensationPackages);

export const compensationPackageInsertSchema = createInsertSchema(compensationPackages, {
  baseSalary: z.string().refine((val) => parseFloat(val) >= 0, "Base salary must be non-negative"),
  reason: z.string().max(1000).optional(),
});

export const compensationPackageUpdateSchema = createUpdateSchema(compensationPackages);

export type CompensationPackage = typeof compensationPackages.$inferSelect;
export type NewCompensationPackage = typeof compensationPackages.$inferInsert;
