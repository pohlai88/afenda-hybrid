import { sql } from "drizzle-orm";
import { integer, text, bigint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { coreSchema } from "./tenants";
import { tenants } from "./tenants";
import { users } from "../security/users";

/**
 * Attachments - Polymorphic file attachments for any entity.
 *
 * Links uploaded files (stored in R2/S3) to any table via (`resourceSchema`, `resourceTable`, `resourceId`).
 * Similar to Odoo's `ir.attachment` but with explicit schema/table/id instead of model name.
 *
 * DESIGN EXCEPTION: This is the ONLY polymorphic table in AFENDA. All other
 * relationships use explicit foreign keys. Attachments require polymorphism
 * because enforcing FK constraints for 100+ tables is impractical.
 *
 * SECURITY: `resourceSchema`, `resourceTable`, and `resourceId` must be validated against
 * a whitelist of allowed tables before insertion to prevent unauthorized access.
 */
export const attachments = coreSchema.table(
  "attachments",
  {
    attachmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    resourceSchema: text().notNull(),
    resourceTable: text().notNull(),
    resourceId: integer().notNull(),
    fileName: text().notNull(),
    fileSize: bigint({ mode: "number" }).notNull(),
    mimeType: text().notNull(),
    filePath: text().notNull(),
    category: text(),
    description: text(),
    uploadedBy: integer().notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_attachments_tenant").on(t.tenantId),
    index("idx_attachments_reference").on(
      t.tenantId,
      t.resourceSchema,
      t.resourceTable,
      t.resourceId
    ),
    index("idx_attachments_created_at").on(t.tenantId, t.createdAt),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_attachments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.uploadedBy],
      foreignColumns: [users.userId],
      name: "fk_attachments_uploaded_by",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_attachments_file_size", sql`${t.fileSize} > 0`),
  ]
);

export const AttachmentIdSchema = z.number().int().positive().brand<"AttachmentId">();
export type AttachmentId = z.infer<typeof AttachmentIdSchema>;

export const ResourceSchemaSchema = z.enum([
  "core",
  "security",
  "audit",
  "hr",
  "payroll",
  "benefits",
  "talent",
  "learning",
  "recruitment",
]);

/** @deprecated Use `ResourceSchemaSchema` */
export const RefSchemaSchema = ResourceSchemaSchema;

export const attachmentSelectSchema = createSelectSchema(attachments);

export const attachmentInsertSchema = createInsertSchema(attachments, {
  tenantId: z.number().int().positive(),
  resourceSchema: ResourceSchemaSchema,
  resourceTable: z.string().min(1).max(100),
  resourceId: z.number().int().positive(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(100),
  filePath: z.string().min(1).max(500),
  category: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  uploadedBy: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const attachmentUpdateSchema = createUpdateSchema(attachments, {
  fileName: z.string().min(1).max(255).optional(),
  filePath: z.string().min(1).max(500).optional(),
  category: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
