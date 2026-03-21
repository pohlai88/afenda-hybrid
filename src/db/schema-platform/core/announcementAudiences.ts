import { integer, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns } from "../../_shared";
import { announcementPosts } from "./announcementPosts";

/**
 * Announcement Audiences - Target audience definitions for announcements.
 * Defines who should see each announcement (all, department, location, role, individual).
 */
export const audienceTypes = ["ALL", "DEPARTMENT", "LOCATION", "ROLE", "INDIVIDUAL"] as const;

export const audienceTypeEnum = coreSchema.enum("audience_type", [...audienceTypes]);

export const AudienceTypeSchema = z.enum(audienceTypes);
export type AudienceType = z.infer<typeof AudienceTypeSchema>;

export const announcementAudiences = coreSchema.table(
  "announcement_audiences",
  {
    audienceId: integer().primaryKey().generatedAlwaysAsIdentity(),
    announcementId: integer().notNull(),
    audienceType: audienceTypeEnum().notNull(),
    audienceRefId: integer(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_announcement_audiences_announcement").on(t.announcementId),
    index("idx_announcement_audiences_type").on(t.audienceType),
    index("idx_announcement_audiences_ref").on(t.audienceType, t.audienceRefId),
    foreignKey({
      columns: [t.announcementId],
      foreignColumns: [announcementPosts.announcementId],
      name: "fk_announcement_audiences_announcement",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const AnnouncementAudienceIdSchema = z.number().int().positive().brand<"AnnouncementAudienceId">();
export type AnnouncementAudienceId = z.infer<typeof AnnouncementAudienceIdSchema>;

export const announcementAudienceSelectSchema = createSelectSchema(announcementAudiences);

export const announcementAudienceInsertSchema = createInsertSchema(announcementAudiences, {
  announcementId: z.number().int().positive(),
  audienceType: AudienceTypeSchema,
  audienceRefId: z.number().int().positive().optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const announcementAudienceUpdateSchema = createUpdateSchema(announcementAudiences, {
  audienceType: AudienceTypeSchema.optional(),
  audienceRefId: z.number().int().positive().optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ announcementId: true });

export type AnnouncementAudience = typeof announcementAudiences.$inferSelect;
export type NewAnnouncementAudience = typeof announcementAudiences.$inferInsert;
