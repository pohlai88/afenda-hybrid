import { integer, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "./tenants";

/**
 * Announcement Posts - Organization-wide or targeted announcements.
 * Supports publishing, expiry, and archival of company communications.
 */
export const announcementStatuses = ["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"] as const;

export const announcementStatusEnum = coreSchema.enum("announcement_status", [
  ...announcementStatuses,
]);

export const AnnouncementStatusSchema = z.enum(announcementStatuses);
export type AnnouncementStatus = z.infer<typeof AnnouncementStatusSchema>;

/**
 * announcement_posts — tenant-scoped announcements with publish/expiry and lifecycle status.
 */
export const announcementPosts = coreSchema.table(
  "announcement_posts",
  {
    announcementId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    title: text().notNull(),
    content: text().notNull(),
    publishedAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
    // status: announcement_status — DRAFT (default), PUBLISHED, EXPIRED, ARCHIVED
    status: announcementStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_announcement_posts_tenant").on(t.tenantId),
    index("idx_announcement_posts_status").on(t.tenantId, t.status),
    index("idx_announcement_posts_published_at").on(t.tenantId, t.publishedAt),
    index("idx_announcement_posts_expires_at").on(t.tenantId, t.expiresAt),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_announcement_posts_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const AnnouncementPostIdSchema = z.number().int().positive().brand<"AnnouncementPostId">();
export type AnnouncementPostId = z.infer<typeof AnnouncementPostIdSchema>;

export const announcementPostSelectSchema = createSelectSchema(announcementPosts);

export const announcementPostInsertSchema = createInsertSchema(announcementPosts, {
  tenantId: z.number().int().positive(),
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(50000),
  status: AnnouncementStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const announcementPostUpdateSchema = createUpdateSchema(announcementPosts, {
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).max(50000).optional(),
  status: AnnouncementStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type AnnouncementPost = typeof announcementPosts.$inferSelect;
export type NewAnnouncementPost = typeof announcementPosts.$inferInsert;
