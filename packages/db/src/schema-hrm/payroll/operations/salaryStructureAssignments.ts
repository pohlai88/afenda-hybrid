import { integer, date, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";
import { salaryStructures } from "../fundamentals/salaryStructures";
import { zMoney12_2Positive, zMoney12_2PositiveOptionalNullable } from "../_zodShared";

/**
 * Salary Structure Assignments - Links employees to salary structures with effective dates.
 * Tracks when an employee's salary structure changes and their base salary amount.
 */
export const salaryStructureAssignments = payrollSchema.table(
  "salary_structure_assignments",
  {
    assignmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    structureId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    baseSalary: numeric({ precision: 12, scale: 2 }).notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_salary_structure_assignments_tenant").on(t.tenantId),
    index("idx_salary_structure_assignments_employee").on(t.tenantId, t.employeeId),
    index("idx_salary_structure_assignments_structure").on(t.tenantId, t.structureId),
    index("idx_salary_structure_assignments_effective").on(
      t.tenantId,
      t.employeeId,
      t.effectiveFrom
    ),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_salary_structure_assignments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_salary_structure_assignments_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.structureId],
      foreignColumns: [salaryStructures.structureId],
      name: "fk_salary_structure_assignments_structure",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_salary_structure_assignments_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
    check("chk_salary_structure_assignments_base_salary", sql`${t.baseSalary} > 0`),
  ]
);

export const SalaryStructureAssignmentIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"SalaryStructureAssignmentId">();
export type SalaryStructureAssignmentId = z.infer<typeof SalaryStructureAssignmentIdSchema>;

export const salaryStructureAssignmentSelectSchema = createSelectSchema(salaryStructureAssignments);

export const salaryStructureAssignmentInsertSchema = createInsertSchema(
  salaryStructureAssignments,
  {
    tenantId: z.number().int().positive(),
    employeeId: z.number().int().positive(),
    structureId: z.number().int().positive(),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional().nullable(),
    baseSalary: zMoney12_2Positive(),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive(),
  }
).superRefine((data, ctx) => {
  if (data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
    ctx.addIssue({
      code: "custom",
      message: "effectiveTo must be on or after effectiveFrom",
      path: ["effectiveTo"],
    });
  }
});

export const salaryStructureAssignmentUpdateSchema = createUpdateSchema(
  salaryStructureAssignments,
  {
    structureId: z.number().int().positive().optional(),
    effectiveFrom: z.coerce.date().optional(),
    effectiveTo: z.coerce.date().optional().nullable(),
    baseSalary: zMoney12_2PositiveOptionalNullable(),
    updatedBy: z.number().int().positive().optional(),
  }
).omit({ tenantId: true, employeeId: true });

export type SalaryStructureAssignment = typeof salaryStructureAssignments.$inferSelect;
export type NewSalaryStructureAssignment = typeof salaryStructureAssignments.$inferInsert;
