import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "./tenants";

/**
 * Email Templates - Reusable email templates for transactional emails.
 * Supports both HTML and plain text versions with variable substitution.
 */
export const emailTemplates = coreSchema.table(
  "email_templates",
  {
    templateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    templateCode: text().notNull(),
    ...nameColumn,
    subject: text().notNull(),
    bodyHtml: text().notNull(),
    bodyText: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_email_templates_tenant").on(t.tenantId),
    uniqueIndex("uq_email_templates_code")
      .on(t.tenantId, sql`lower(${t.templateCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_email_templates_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const EmailTemplateIdSchema = z.number().int().positive().brand<"EmailTemplateId">();
export type EmailTemplateId = z.infer<typeof EmailTemplateIdSchema>;

const templateCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const emailTemplateSelectSchema = createSelectSchema(emailTemplates);

export const emailTemplateInsertSchema = createInsertSchema(emailTemplates, {
  tenantId: z.number().int().positive(),
  templateCode: templateCodeSchema,
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1).max(50000),
  bodyText: z.string().max(50000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const emailTemplateUpdateSchema = createUpdateSchema(emailTemplates, {
  templateCode: templateCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  bodyHtml: z.string().min(1).max(50000).optional(),
  bodyText: z.string().max(50000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
