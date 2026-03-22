import { integer, jsonb, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "./tenants";
import { notificationChannelEnum } from "./notificationTemplates";

export const notificationChannelStatuses = ["ACTIVE", "INACTIVE"] as const;

export const notificationChannelStatusEnum = coreSchema.enum("notification_channel_status", [
  ...notificationChannelStatuses,
]);

export const NotificationChannelStatusSchema = z.enum(notificationChannelStatuses);
export type NotificationChannelStatus = z.infer<typeof NotificationChannelStatusSchema>;

type ChannelConfig = Record<string, unknown>;

/** Per-tenant delivery channel configuration (SMTP, SMS, push, webhook, etc.). */
export const notificationChannels = coreSchema.table(
  "notification_channels",
  {
    channelId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    channelType: notificationChannelEnum().notNull(),
    ...nameColumn,
    config: jsonb().$type<ChannelConfig>(),
    // status: notification_channel_status — ACTIVE (default), INACTIVE
    status: notificationChannelStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_notification_channels_tenant").on(t.tenantId),
    index("idx_notification_channels_type").on(t.tenantId, t.channelType),
    index("idx_notification_channels_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_notification_channels_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const NotificationChannelIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"NotificationChannelId">();
export type NotificationChannelId = z.infer<typeof NotificationChannelIdSchema>;

export const notificationChannelSelectSchema = createSelectSchema(notificationChannels);

export const notificationChannelInsertSchema = createInsertSchema(notificationChannels, {
  tenantId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  status: NotificationChannelStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const notificationChannelUpdateSchema = createUpdateSchema(notificationChannels, {
  name: z.string().min(1).max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  status: NotificationChannelStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, channelType: true });

export type NotificationChannelRecord = typeof notificationChannels.$inferSelect;
export type NewNotificationChannel = typeof notificationChannels.$inferInsert;
