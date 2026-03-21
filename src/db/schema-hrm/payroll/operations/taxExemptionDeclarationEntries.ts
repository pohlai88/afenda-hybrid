import { integer, numeric, boolean, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { taxExemptionDeclarations } from "./taxExemptionDeclarations";
import { taxExemptionCategories } from "../fundamentals/taxExemptionCategories";
import { zMoney12_2NonNegative, zMoney12_2NonNegativeOptionalNullable } from "../_zodShared";

/**
 * Tax Exemption Declaration Entries - Line items for employee tax exemption declarations.
 * Each entry links a declaration to a specific exemption category with declared amount and proof.
 */
export const taxExemptionDeclarationEntries = payrollSchema.table(
  "tax_exemption_declaration_entries",
  {
    entryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    declarationId: integer().notNull(),
    categoryId: integer().notNull(),
    declaredAmount: numeric({ precision: 12, scale: 2 }).notNull(),
    proofSubmitted: boolean().notNull().default(false),
    proofDocumentPath: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_tax_exemption_declaration_entries_declaration").on(t.declarationId),
    index("idx_tax_exemption_declaration_entries_category").on(t.categoryId),
    foreignKey({
      columns: [t.declarationId],
      foreignColumns: [taxExemptionDeclarations.declarationId],
      name: "fk_tax_exemption_declaration_entries_declaration",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.categoryId],
      foreignColumns: [taxExemptionCategories.categoryId],
      name: "fk_tax_exemption_declaration_entries_category",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const TaxExemptionDeclarationEntryIdSchema = z.number().int().positive().brand<"TaxExemptionDeclarationEntryId">();
export type TaxExemptionDeclarationEntryId = z.infer<typeof TaxExemptionDeclarationEntryIdSchema>;

export const taxExemptionDeclarationEntrySelectSchema = createSelectSchema(taxExemptionDeclarationEntries);

export const taxExemptionDeclarationEntryInsertSchema = createInsertSchema(taxExemptionDeclarationEntries, {
  declarationId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  declaredAmount: zMoney12_2NonNegative(),
  proofSubmitted: z.boolean().optional(),
  proofDocumentPath: z.string().max(500).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const taxExemptionDeclarationEntryUpdateSchema = createUpdateSchema(taxExemptionDeclarationEntries, {
  declaredAmount: zMoney12_2NonNegative().optional(),
  proofSubmitted: z.boolean().optional(),
  proofDocumentPath: z.string().max(500).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ declarationId: true, categoryId: true });

export type TaxExemptionDeclarationEntry = typeof taxExemptionDeclarationEntries.$inferSelect;
export type NewTaxExemptionDeclarationEntry = typeof taxExemptionDeclarationEntries.$inferInsert;
