import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Appraisal Templates - Reusable performance review templates.
 * Defines standard goal sets for different roles or appraisal types.
 */
export const appraisalTemplateStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const appraisalTemplateStatusEnum = talentSchema.enum("appraisal_template_status", [
  ...appraisalTemplateStatuses,
]);

export const AppraisalTemplateStatusSchema = z.enum(appraisalTemplateStatuses);
export type AppraisalTemplateStatus = z.infer<typeof AppraisalTemplateStatusSchema>;

export const appraisalTemplates = talentSchema.table(
  "appraisal_templates",
  {
    templateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    templateCode: text().notNull(),
    ...nameColumn,
    description: text(),
    status: appraisalTemplateStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_appraisal_templates_tenant").on(t.tenantId),
    index("idx_appraisal_templates_status").on(t.tenantId, t.status),
    uniqueIndex("uq_appraisal_templates_code")
      .on(t.tenantId, sql`lower(${t.templateCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_appraisal_templates_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const AppraisalTemplateIdSchema = z.number().int().positive().brand<"AppraisalTemplateId">();
export type AppraisalTemplateId = z.infer<typeof AppraisalTemplateIdSchema>;

const templateCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const appraisalTemplateSelectSchema = createSelectSchema(appraisalTemplates);

export const appraisalTemplateInsertSchema = createInsertSchema(appraisalTemplates, {
  tenantId: z.number().int().positive(),
  templateCode: templateCodeSchema,
  name: z.string().min(1).max(200),
  status: AppraisalTemplateStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const appraisalTemplateUpdateSchema = createUpdateSchema(appraisalTemplates, {
  templateCode: templateCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  status: AppraisalTemplateStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type AppraisalTemplate = typeof appraisalTemplates.$inferSelect;
export type NewAppraisalTemplate = typeof appraisalTemplates.$inferInsert;
