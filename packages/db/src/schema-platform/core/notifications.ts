import { integer, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns } from "../../_shared";
import { tenants } from "./tenants";
import { notificationTemplates } from "./notificationTemplates";
import { users } from "../security/users";

/**
 * Notifications - Individual notification instances sent to users.
 * Tracks notification delivery status and read receipts.
 * Note: recipientUserId FK added via custom SQL to avoid circular dependencies.
 */
export const notificationStatuses = ["PENDING", "SENT", "READ", "FAILED", "EXPIRED"] as const;

export const notificationStatusEnum = coreSchema.enum("notification_status", [
  ...notificationStatuses,
]);

export const NotificationStatusSchema = z.enum(notificationStatuses);
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

/**
 * notifications — user-targeted messages; optional template, reference entity, read receipt.
 */
export const notifications = coreSchema.table(
  "notifications",
  {
    notificationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    recipientUserId: integer().notNull(),
    templateId: integer(),
    title: text().notNull(),
    body: text().notNull(),
    referenceTable: text(),
    referenceId: integer(),
    readAt: timestamp({ withTimezone: true }),
    // status: notification_status — PENDING (default), SENT, READ, FAILED, EXPIRED
    status: notificationStatusEnum().notNull().default("PENDING"),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_notifications_tenant").on(t.tenantId),
    index("idx_notifications_recipient").on(t.tenantId, t.recipientUserId),
    index("idx_notifications_template").on(t.tenantId, t.templateId),
    index("idx_notifications_status").on(t.tenantId, t.status),
    index("idx_notifications_reference").on(t.tenantId, t.referenceTable, t.referenceId),
    index("idx_notifications_created").on(t.tenantId, t.createdAt),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_notifications_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.templateId],
      foreignColumns: [notificationTemplates.templateId],
      name: "fk_notifications_template",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.recipientUserId],
      foreignColumns: [users.userId],
      name: "fk_notifications_recipient_user",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const NotificationIdSchema = z.number().int().positive().brand<"NotificationId">();
export type NotificationId = z.infer<typeof NotificationIdSchema>;

export const notificationSelectSchema = createSelectSchema(notifications);

export const notificationInsertSchema = createInsertSchema(notifications, {
  tenantId: z.number().int().positive(),
  recipientUserId: z.number().int().positive(),
  templateId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  referenceTable: z.string().max(100).optional().nullable(),
  referenceId: z.number().int().positive().optional().nullable(),
  status: NotificationStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const notificationUpdateSchema = createUpdateSchema(notifications, {
  status: NotificationStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, recipientUserId: true, templateId: true, title: true, body: true });

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
