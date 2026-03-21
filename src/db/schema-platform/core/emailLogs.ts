import { integer, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { appendOnlyTimestampColumns } from "../../_shared";
import { tenants } from "./tenants";
import { emailTemplates } from "./emailTemplates";

/**
 * Email Logs - Delivery log for all sent emails.
 * Immutable audit trail of email delivery attempts and status.
 */
export const emailLogStatuses = ["PENDING", "SENT", "FAILED", "BOUNCED"] as const;

export const emailLogStatusEnum = coreSchema.enum("email_log_status", [...emailLogStatuses]);

export const EmailLogStatusSchema = z.enum(emailLogStatuses);
export type EmailLogStatus = z.infer<typeof EmailLogStatusSchema>;

export const emailLogs = coreSchema.table(
  "email_logs",
  {
    logId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    recipientEmail: text().notNull(),
    templateId: integer(),
    subject: text().notNull(),
    sentAt: timestamp({ withTimezone: true }),
    failureReason: text(),
    status: emailLogStatusEnum().notNull().default("PENDING"),
    ...appendOnlyTimestampColumns,
  },
  (t) => [
    index("idx_email_logs_tenant").on(t.tenantId),
    index("idx_email_logs_recipient").on(t.tenantId, t.recipientEmail),
    index("idx_email_logs_template").on(t.tenantId, t.templateId),
    index("idx_email_logs_status").on(t.tenantId, t.status),
    index("idx_email_logs_sent_at").on(t.sentAt),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_email_logs_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.templateId],
      foreignColumns: [emailTemplates.templateId],
      name: "fk_email_logs_template",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const EmailLogIdSchema = z.number().int().positive().brand<"EmailLogId">();
export type EmailLogId = z.infer<typeof EmailLogIdSchema>;

export const emailLogSelectSchema = createSelectSchema(emailLogs);

export const emailLogInsertSchema = createInsertSchema(emailLogs, {
  tenantId: z.number().int().positive(),
  recipientEmail: z.string().email().max(255),
  templateId: z.number().int().positive().optional().nullable(),
  subject: z.string().min(1).max(500),
  failureReason: z.string().max(1000).optional().nullable(),
  status: EmailLogStatusSchema.optional(),
});

export const emailLogUpdateSchema = createUpdateSchema(emailLogs, {
  failureReason: z.string().max(1000).optional().nullable(),
  status: EmailLogStatusSchema.optional(),
})
  .omit({ tenantId: true, recipientEmail: true, templateId: true, subject: true });

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
