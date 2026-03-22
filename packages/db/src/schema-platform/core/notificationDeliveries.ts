import { integer, timestamp, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { appendOnlyTimestampColumns } from "../../_shared";
import { notifications } from "./notifications";
import { notificationChannelEnum } from "./notificationTemplates";

/**
 * Notification Deliveries - Delivery attempts and status per channel.
 * Immutable log of notification delivery attempts across different channels.
 */
export const notificationDeliveryStatuses = [
  "PENDING",
  "SENT",
  "DELIVERED",
  "FAILED",
  "BOUNCED",
] as const;

export const notificationDeliveryStatusEnum = coreSchema.enum("notification_delivery_status", [
  ...notificationDeliveryStatuses,
]);

export const NotificationDeliveryStatusSchema = z.enum(notificationDeliveryStatuses);
export type NotificationDeliveryStatus = z.infer<typeof NotificationDeliveryStatusSchema>;

/**
 * notification_deliveries — per-channel delivery attempts and outcomes for a notification.
 */
export const notificationDeliveries = coreSchema.table(
  "notification_deliveries",
  {
    deliveryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    notificationId: integer().notNull(),
    channelType: notificationChannelEnum().notNull(),
    sentAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    failureReason: text(),
    // status: notification_delivery_status — PENDING (default), SENT, DELIVERED, FAILED, BOUNCED
    status: notificationDeliveryStatusEnum().notNull().default("PENDING"),
    ...appendOnlyTimestampColumns,
  },
  (t) => [
    index("idx_notification_deliveries_notification").on(t.notificationId),
    index("idx_notification_deliveries_channel").on(t.channelType),
    index("idx_notification_deliveries_status").on(t.status),
    index("idx_notification_deliveries_sent_at").on(t.sentAt),
    foreignKey({
      columns: [t.notificationId],
      foreignColumns: [notifications.notificationId],
      name: "fk_notification_deliveries_notification",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const NotificationDeliveryIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"NotificationDeliveryId">();
export type NotificationDeliveryId = z.infer<typeof NotificationDeliveryIdSchema>;

export const notificationDeliverySelectSchema = createSelectSchema(notificationDeliveries);

export const notificationDeliveryInsertSchema = createInsertSchema(notificationDeliveries, {
  notificationId: z.number().int().positive(),
  failureReason: z.string().max(1000).optional().nullable(),
  status: NotificationDeliveryStatusSchema.optional(),
});

export const notificationDeliveryUpdateSchema = createUpdateSchema(notificationDeliveries, {
  failureReason: z.string().max(1000).optional().nullable(),
  status: NotificationDeliveryStatusSchema.optional(),
}).omit({ notificationId: true, channelType: true });

export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NewNotificationDelivery = typeof notificationDeliveries.$inferInsert;
