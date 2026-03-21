import { integer, text, numeric, boolean, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { salaryStructures } from "./salaryStructures";
import { payComponents } from "./payComponents";
import { zMoney12_2NonNegative, zMoney12_2NonNegativeOptionalNullable } from "../_zodShared";

/**
 * Salary Structure Details - Component rows defining salary structure composition.
 * Each row specifies a pay component with either a formula or fixed amount.
 */
export const salaryStructureDetails = payrollSchema.table(
  "salary_structure_details",
  {
    detailId: integer().primaryKey().generatedAlwaysAsIdentity(),
    structureId: integer().notNull(),
    payComponentId: integer().notNull(),
    formula: text(),
    amount: numeric({ precision: 12, scale: 2 }),
    isEarning: boolean().notNull(),
    sequenceNumber: integer().notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_salary_structure_details_structure").on(t.structureId),
    index("idx_salary_structure_details_component").on(t.payComponentId),
    foreignKey({
      columns: [t.structureId],
      foreignColumns: [salaryStructures.structureId],
      name: "fk_salary_structure_details_structure",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payComponentId],
      foreignColumns: [payComponents.payComponentId],
      name: "fk_salary_structure_details_component",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_salary_structure_details_sequence",
      sql`${t.sequenceNumber} > 0`
    ),
  ]
);

export const SalaryStructureDetailIdSchema = z.number().int().positive().brand<"SalaryStructureDetailId">();
export type SalaryStructureDetailId = z.infer<typeof SalaryStructureDetailIdSchema>;

export const salaryStructureDetailSelectSchema = createSelectSchema(salaryStructureDetails);

export const salaryStructureDetailInsertSchema = createInsertSchema(salaryStructureDetails, {
  structureId: z.number().int().positive(),
  payComponentId: z.number().int().positive(),
  formula: z.string().max(500).optional().nullable(),
  amount: zMoney12_2NonNegative().optional().nullable(),
  isEarning: z.boolean(),
  sequenceNumber: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const salaryStructureDetailUpdateSchema = createUpdateSchema(salaryStructureDetails, {
  formula: z.string().max(500).optional().nullable(),
  amount: zMoney12_2NonNegativeOptionalNullable(),
  isEarning: z.boolean().optional(),
  sequenceNumber: z.number().int().positive().optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ structureId: true, payComponentId: true });

export type SalaryStructureDetail = typeof salaryStructureDetails.$inferSelect;
export type NewSalaryStructureDetail = typeof salaryStructureDetails.$inferInsert;
