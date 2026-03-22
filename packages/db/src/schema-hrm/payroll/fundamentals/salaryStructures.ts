import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { payFrequencyEnum, PayFrequencySchema } from "./compensationPackages";

/**
 * Salary Structures - Template-based pay structures defining salary components.
 * Allows standardized salary packages that can be assigned to employees.
 */

export const salaryStructureStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const salaryStructureStatusEnum = payrollSchema.enum("salary_structure_status", [
  ...salaryStructureStatuses,
]);

export const SalaryStructureStatusSchema = z.enum(salaryStructureStatuses);
export type SalaryStructureStatus = z.infer<typeof SalaryStructureStatusSchema>;

export const salaryStructures = payrollSchema.table(
  "salary_structures",
  {
    structureId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    structureCode: text().notNull(),
    ...nameColumn,
    description: text(),
    payFrequency: payFrequencyEnum().notNull(),
    status: salaryStructureStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_salary_structures_tenant").on(t.tenantId),
    index("idx_salary_structures_status").on(t.tenantId, t.status),
    uniqueIndex("uq_salary_structures_code")
      .on(t.tenantId, sql`lower(${t.structureCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_salary_structures_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const SalaryStructureIdSchema = z.number().int().positive().brand<"SalaryStructureId">();
export type SalaryStructureId = z.infer<typeof SalaryStructureIdSchema>;

const structureCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const salaryStructureSelectSchema = createSelectSchema(salaryStructures);

export const salaryStructureInsertSchema = createInsertSchema(salaryStructures, {
  tenantId: z.number().int().positive(),
  structureCode: structureCodeSchema,
  name: z.string().min(1).max(200),
  payFrequency: PayFrequencySchema,
  status: SalaryStructureStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const salaryStructureUpdateSchema = createUpdateSchema(salaryStructures, {
  structureCode: structureCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  payFrequency: PayFrequencySchema.optional(),
  status: SalaryStructureStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type SalaryStructure = typeof salaryStructures.$inferSelect;
export type NewSalaryStructure = typeof salaryStructures.$inferInsert;
