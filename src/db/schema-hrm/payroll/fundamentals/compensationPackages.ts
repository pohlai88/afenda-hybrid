import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { dateValue } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Compensation Packages - Salary structure agreements per employee.
 * Effective-dated for salary history tracking.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const compensationStatuses = ["DRAFT", "ACTIVE", "SUPERSEDED", "TERMINATED"] as const;

export const compensationStatusEnum = payrollSchema.enum("compensation_status", [...compensationStatuses]);

export const CompensationStatusSchema = z.enum(compensationStatuses);
export type CompensationStatus = z.infer<typeof CompensationStatusSchema>;

export const payFrequencies = ["MONTHLY", "BIWEEKLY", "WEEKLY", "SEMI_MONTHLY", "ANNUAL"] as const;

export const payFrequencyEnum = payrollSchema.enum("pay_frequency", [...payFrequencies]);

export const PayFrequencySchema = z.enum(payFrequencies);
export type PayFrequency = z.infer<typeof PayFrequencySchema>;

const nonNegativeDecimalString = z
  .string()
  .refine((v) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 0;
  }, { message: "Base salary must be a non-negative decimal string" });

/**
 * Table `compensation_packages` — per-employee pay terms; one ACTIVE open-ended row per tenant+employee (partial unique index).
 */
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
    /** Lifecycle: `DRAFT` | `ACTIVE` | `SUPERSEDED` | `TERMINATED`. */
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

export const CompensationPackageIdSchema = z.number().int().positive().brand<"CompensationPackageId">();
export type CompensationPackageId = z.infer<typeof CompensationPackageIdSchema>;

export const compensationPackageSelectSchema = createSelectSchema(compensationPackages);

export const compensationPackageInsertSchema = createInsertSchema(compensationPackages, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  baseSalary: nonNegativeDecimalString,
  currencyId: z.number().int().positive(),
  payFrequency: PayFrequencySchema.optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  reason: z.string().max(1000).optional(),
  status: CompensationStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.effectiveTo == null) return;
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
});

/** Patch payload: `tenantId` / `employeeId` are immutable after insert. */
export const compensationPackageUpdateSchema = createUpdateSchema(compensationPackages, {
  baseSalary: nonNegativeDecimalString.optional(),
  currencyId: z.number().int().positive().optional(),
  payFrequency: PayFrequencySchema.optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  status: CompensationStatusSchema.optional(),
})
  .omit({ tenantId: true, employeeId: true })
  .superRefine((data, ctx) => {
    if (data.effectiveFrom === undefined && data.effectiveTo === undefined) return;
    if (data.effectiveFrom === undefined || data.effectiveTo === undefined || data.effectiveTo === null) return;
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
  });

export type CompensationPackage = typeof compensationPackages.$inferSelect;
export type NewCompensationPackage = typeof compensationPackages.$inferInsert;
