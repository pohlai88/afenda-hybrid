import { integer, text, boolean, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns } from "../../_shared";
import { notificationChannelEnum } from "./notificationTemplates";
import { users } from "../security/users";

/**
 * Notification Subscriptions - User preferences for notification delivery.
 * Tracks which notification types and channels each user has enabled.
 * userId → security.users (enforced FK).
 */
export const notificationSubscriptions = coreSchema.table(
  "notification_subscriptions",
  {
    subscriptionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull(),
    eventType: text().notNull(),
    channelType: notificationChannelEnum().notNull(),
    isEnabled: boolean().notNull().default(true),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_notification_subscriptions_user").on(t.userId),
    index("idx_notification_subscriptions_event").on(t.eventType),
    index("idx_notification_subscriptions_channel").on(t.channelType),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.userId],
      name: "fk_notification_subscriptions_user",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const NotificationSubscriptionIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"NotificationSubscriptionId">();
export type NotificationSubscriptionId = z.infer<typeof NotificationSubscriptionIdSchema>;

export const notificationSubscriptionSelectSchema = createSelectSchema(notificationSubscriptions);

export const notificationSubscriptionInsertSchema = createInsertSchema(notificationSubscriptions, {
  userId: z.number().int().positive(),
  eventType: z.string().min(1).max(100),
  isEnabled: z.boolean().optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const notificationSubscriptionUpdateSchema = createUpdateSchema(notificationSubscriptions, {
  isEnabled: z.boolean().optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ userId: true, eventType: true, channelType: true });

export type NotificationSubscription = typeof notificationSubscriptions.$inferSelect;
export type NewNotificationSubscription = typeof notificationSubscriptions.$inferInsert;
