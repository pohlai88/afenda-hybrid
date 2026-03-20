import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { jobGrades } from "../../hr/employment/jobGrades";

/**
 * Pay grade structures - salary bands per named structure, linked to HR job grades.
 * Rows are effective-dated so historical band definitions can be retained.
 */
export const payGradeStructureStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const payGradeStructureStatusEnum = payrollSchema.enum("pay_grade_structure_status", [...payGradeStructureStatuses]);

export const payGradeStructureStatusZodEnum = createSelectSchema(payGradeStructureStatusEnum);

export const payGradeStructures = payrollSchema.table(
  "pay_grade_structures",
  {
    payGradeStructureId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    structureCode: text().notNull(),
    ...nameColumn,
    description: text(),
    jobGradeId: integer().notNull(),
    minSalary: numeric({ precision: 12, scale: 2 }),
    midSalary: numeric({ precision: 12, scale: 2 }),
    maxSalary: numeric({ precision: 12, scale: 2 }),
    currencyId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    status: payGradeStructureStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_pay_grade_structures_tenant").on(t.tenantId),
    index("idx_pay_grade_structures_structure").on(t.tenantId, t.structureCode),
    index("idx_pay_grade_structures_grade").on(t.tenantId, t.jobGradeId),
    index("idx_pay_grade_structures_effective").on(t.tenantId, t.effectiveFrom, t.effectiveTo),
    uniqueIndex("uq_pay_grade_structures_row")
      .on(t.tenantId, sql`lower(${t.structureCode})`, t.jobGradeId, t.effectiveFrom)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_pay_grade_structures_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.jobGradeId],
      foreignColumns: [jobGrades.jobGradeId],
      name: "fk_pay_grade_structures_job_grade",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_pay_grade_structures_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_pay_grade_structures_salary_range",
      sql`${t.minSalary} IS NULL OR ${t.maxSalary} IS NULL OR ${t.minSalary} <= ${t.maxSalary}`
    ),
    check(
      "chk_pay_grade_structures_mid_salary",
      sql`${t.midSalary} IS NULL OR (
        (${t.minSalary} IS NULL OR ${t.midSalary} >= ${t.minSalary}) AND
        (${t.maxSalary} IS NULL OR ${t.midSalary} <= ${t.maxSalary})
      )`
    ),
    check(
      "chk_pay_grade_structures_salary_positive",
      sql`(${t.minSalary} IS NULL OR ${t.minSalary} >= 0) AND
          (${t.midSalary} IS NULL OR ${t.midSalary} >= 0) AND
          (${t.maxSalary} IS NULL OR ${t.maxSalary} >= 0)`
    ),
    check(
      "chk_pay_grade_structures_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const PayGradeStructureIdSchema = z.number().int().brand<"PayGradeStructureId">();
export type PayGradeStructureId = z.infer<typeof PayGradeStructureIdSchema>;

export const payGradeStructureSelectSchema = createSelectSchema(payGradeStructures);

export const payGradeStructureInsertSchema = createInsertSchema(payGradeStructures, {
  structureCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  minSalary: z.string().optional(),
  midSalary: z.string().optional(),
  maxSalary: z.string().optional(),
});

export const payGradeStructureUpdateSchema = createUpdateSchema(payGradeStructures);

export type PayGradeStructure = typeof payGradeStructures.$inferSelect;
export type NewPayGradeStructure = typeof payGradeStructures.$inferInsert;
