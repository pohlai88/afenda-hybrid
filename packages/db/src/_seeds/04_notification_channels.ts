import { db } from "../db";
import { notificationChannels } from "../schema-platform";
import { and, eq, sql } from "drizzle-orm";

/**
 * Seed: Notification Channels (EMAIL, IN_APP, SMS, PUSH, WEBHOOK)
 *
 * Idempotent: Match on (tenantId, channelType, name) among non-deleted rows, then update or insert.
 */
export async function seedNotificationChannels(tenantId: number, systemUserId: number) {
  const channels = [
    {
      channelType: "EMAIL" as const,
      name: "Email Notifications",
      config: {
        smtpHost: "smtp.example.com",
        smtpPort: 587,
        fromAddress: "noreply@afenda.com",
        fromName: "AFENDA HRM",
      },
      status: "ACTIVE" as const,
    },
    {
      channelType: "IN_APP" as const,
      name: "In-App Notifications",
      config: {
        retentionDays: 30,
        maxUnread: 100,
      },
      status: "ACTIVE" as const,
    },
    {
      channelType: "SMS" as const,
      name: "SMS Notifications",
      config: {
        provider: "twilio",
        fromNumber: "+1234567890",
      },
      status: "INACTIVE" as const,
    },
    {
      channelType: "PUSH" as const,
      name: "Push Notifications",
      config: {
        provider: "firebase",
      },
      status: "INACTIVE" as const,
    },
    {
      channelType: "WEBHOOK" as const,
      name: "Webhook Notifications",
      config: {
        defaultTimeout: 5000,
        retryAttempts: 3,
      },
      status: "INACTIVE" as const,
    },
  ];

  for (const channel of channels) {
    const existing = await db
      .select({ channelId: notificationChannels.channelId })
      .from(notificationChannels)
      .where(
        and(
          eq(notificationChannels.tenantId, tenantId),
          eq(notificationChannels.channelType, channel.channelType),
          eq(notificationChannels.name, channel.name),
          sql`${notificationChannels.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(notificationChannels)
        .set({
          config: channel.config,
          status: channel.status,
          updatedAt: sql`now()`,
          updatedBy: systemUserId,
        })
        .where(eq(notificationChannels.channelId, existing[0].channelId));
    } else {
      await db.insert(notificationChannels).values({
        tenantId,
        channelType: channel.channelType,
        name: channel.name,
        config: channel.config,
        status: channel.status,
        createdBy: systemUserId,
        updatedBy: systemUserId,
      });
    }
  }

  console.log(`✓ Seeded ${channels.length} notification channels for tenant ${tenantId}`);
}
