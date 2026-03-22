import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "./tenants";

export const letterTypes = [
  "APPOINTMENT",
  "CONFIRMATION",
  "PROMOTION",
  "TRANSFER",
  "WARNING",
  "TERMINATION",
  "EXPERIENCE",
  "SALARY_REVISION",
  "OTHER",
] as const;

export const letterTypeEnum = coreSchema.enum("letter_type", [...letterTypes]);

export const LetterTypeSchema = z.enum(letterTypes);
export type LetterType = z.infer<typeof LetterTypeSchema>;

/** Reusable HR letter body templates per tenant (`letter_type` discriminates use case). */
export const letterTemplates = coreSchema.table(
  "letter_templates",
  {
    templateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    templateCode: text().notNull(),
    ...nameColumn,
    letterType: letterTypeEnum().notNull(),
    bodyTemplate: text().notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_letter_templates_tenant").on(t.tenantId),
    index("idx_letter_templates_type").on(t.tenantId, t.letterType),
    uniqueIndex("uq_letter_templates_code")
      .on(t.tenantId, sql`lower(${t.templateCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_letter_templates_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const LetterTemplateIdSchema = z.number().int().positive().brand<"LetterTemplateId">();
export type LetterTemplateId = z.infer<typeof LetterTemplateIdSchema>;

const templateCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const letterTemplateSelectSchema = createSelectSchema(letterTemplates);

export const letterTemplateInsertSchema = createInsertSchema(letterTemplates, {
  tenantId: z.number().int().positive(),
  templateCode: templateCodeSchema,
  name: z.string().min(1).max(200),
  letterType: LetterTypeSchema,
  bodyTemplate: z.string().min(1).max(50000),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const letterTemplateUpdateSchema = createUpdateSchema(letterTemplates, {
  templateCode: templateCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  letterType: LetterTypeSchema.optional(),
  bodyTemplate: z.string().min(1).max(50000).optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type LetterTemplate = typeof letterTemplates.$inferSelect;
export type NewLetterTemplate = typeof letterTemplates.$inferInsert;
