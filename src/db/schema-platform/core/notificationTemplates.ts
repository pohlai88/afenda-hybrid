import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "./tenants";

/**
 * Notification Templates - Reusable notification message templates.
 * Defines templates for different notification channels with variable substitution.
 */
export const notificationChannelValues = ["EMAIL", "IN_APP", "SMS", "PUSH", "WEBHOOK"] as const;

export const notificationChannelEnum = coreSchema.enum("notification_channel", [...notificationChannelValues]);

export const NotificationChannelSchema = z.enum(notificationChannelValues);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const notificationTemplates = coreSchema.table(
  "notification_templates",
  {
    templateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    templateCode: text().notNull(),
    ...nameColumn,
    subject: text(),
    bodyTemplate: text().notNull(),
    channel: notificationChannelEnum().notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_notification_templates_tenant").on(t.tenantId),
    index("idx_notification_templates_channel").on(t.tenantId, t.channel),
    uniqueIndex("uq_notification_templates_code")
      .on(t.tenantId, sql`lower(${t.templateCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_notification_templates_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const NotificationTemplateIdSchema = z.number().int().positive().brand<"NotificationTemplateId">();
export type NotificationTemplateId = z.infer<typeof NotificationTemplateIdSchema>;

const templateCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const notificationTemplateSelectSchema = createSelectSchema(notificationTemplates);

export const notificationTemplateInsertSchema = createInsertSchema(notificationTemplates, {
  tenantId: z.number().int().positive(),
  templateCode: templateCodeSchema,
  name: z.string().min(1).max(200),
  subject: z.string().max(500).optional().nullable(),
  bodyTemplate: z.string().min(1).max(10000),
  channel: NotificationChannelSchema,
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const notificationTemplateUpdateSchema = createUpdateSchema(notificationTemplates, {
  templateCode: templateCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  subject: z.string().max(500).optional().nullable(),
  bodyTemplate: z.string().min(1).max(10000).optional(),
  channel: NotificationChannelSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true });

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
