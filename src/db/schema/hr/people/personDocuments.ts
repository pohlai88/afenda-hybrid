import { integer, text, date, timestamp, bigint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { persons } from "./persons";

/**
 * Person Documents - Stored identity and employment documents.
 * File storage is external (S3, etc.); this table stores metadata and paths.
 */
export const documentTypes = ["ID_CARD", "PASSPORT_COPY", "VISA_COPY", "WORK_PERMIT", "CONTRACT", "CERTIFICATE", "DEGREE", "RESUME", "PHOTO", "OTHER"] as const;

export const documentTypeEnum = hrSchema.enum("document_type", [...documentTypes]);

export const documentTypeZodEnum = createSelectSchema(documentTypeEnum);

export const documentStatuses = ["ACTIVE", "ARCHIVED", "EXPIRED", "PENDING_REVIEW"] as const;

export const documentStatusEnum = hrSchema.enum("document_status", [...documentStatuses]);

export const documentStatusZodEnum = createSelectSchema(documentStatusEnum);

export const personDocuments = hrSchema.table(
  "person_documents",
  {
    documentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    documentType: documentTypeEnum().notNull(),
    title: text().notNull(),
    description: text(),
    filePath: text().notNull(),
    fileName: text().notNull(),
    mimeType: text().notNull(),
    fileSize: bigint({ mode: "number" }),
    uploadedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiryDate: date(),
    status: documentStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_person_documents_tenant").on(t.tenantId),
    index("idx_person_documents_person").on(t.tenantId, t.personId),
    index("idx_person_documents_type").on(t.tenantId, t.personId, t.documentType),
    index("idx_person_documents_expiry").on(t.tenantId, t.expiryDate),
    index("idx_person_documents_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_person_documents_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [persons.personId],
      name: "fk_person_documents_person",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_person_documents_file_size",
      sql`${t.fileSize} IS NULL OR ${t.fileSize} > 0`
    ),
  ]
);

export const PersonDocumentIdSchema = z.number().int().brand<"PersonDocumentId">();
export type PersonDocumentId = z.infer<typeof PersonDocumentIdSchema>;

export const personDocumentSelectSchema = createSelectSchema(personDocuments);

export const personDocumentInsertSchema = createInsertSchema(personDocuments, {
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  filePath: z.string().min(1).max(1000),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive().optional(),
});

export const personDocumentUpdateSchema = createUpdateSchema(personDocuments);

export type PersonDocument = typeof personDocuments.$inferSelect;
export type NewPersonDocument = typeof personDocuments.$inferInsert;
