import {
  integer,
  text,
  date,
  timestamp,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateStringSchema,
  hrBounds,
  nullableOptional,
  timestamptzWireNullableOptionalSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Document Requests - Certificate issuance requests from employees.
 * Circular FK note: employeeId and processedBy FKs added via custom SQL.
 */
export const documentRequestTypes = [
  "EMPLOYMENT_CERTIFICATE",
  "SALARY_CERTIFICATE",
  "EXPERIENCE_LETTER",
  "NOC",
  "REFERENCE_LETTER",
  "TAX_DOCUMENT",
  "OTHER",
] as const;

export const documentRequestTypeEnum = hrSchema.enum("document_request_type", [
  ...documentRequestTypes,
]);

export const documentRequestTypeZodEnum = z.enum(documentRequestTypes);

export const documentRequestStatuses = [
  "PENDING",
  "PROCESSING",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;

export const documentRequestStatusEnum = hrSchema.enum("document_request_status", [
  ...documentRequestStatuses,
]);

export const documentRequestStatusZodEnum = z.enum(documentRequestStatuses);

export const documentRequests = hrSchema.table(
  "document_requests",
  {
    documentRequestId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    requestNumber: text().notNull(),
    documentType: documentRequestTypeEnum().notNull(),
    purpose: text(),
    addressedTo: text(),
    requiredBy: date(),
    status: documentRequestStatusEnum().notNull().default("PENDING"),
    processedBy: integer(),
    processedAt: timestamp({ withTimezone: true }),
    documentPath: text(),
    deliveredAt: timestamp({ withTimezone: true }),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_document_requests_tenant").on(t.tenantId),
    index("idx_document_requests_tenant_op_date").on(t.tenantId, t.status, t.processedAt),
    index("idx_document_requests_employee").on(t.tenantId, t.employeeId),
    index("idx_document_requests_type").on(t.tenantId, t.documentType),
    index("idx_document_requests_status").on(t.tenantId, t.status),
    uniqueIndex("uq_document_requests_number")
      .on(t.tenantId, sql`lower(${t.requestNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_document_requests_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const DocumentRequestIdSchema = z.number().int().brand<"DocumentRequestId">();
export type DocumentRequestId = z.infer<typeof DocumentRequestIdSchema>;

export const documentRequestSelectSchema = createSelectSchema(documentRequests);

export const documentRequestInsertSchema = createInsertSchema(documentRequests, {
  requestNumber: z.string().min(1).max(50),
  purpose: z.string().max(500).optional(),
  addressedTo: z.string().max(200).optional(),
  requiredBy: dateStringSchema.optional(),
  documentPath: z.string().max(500).optional(),
  notes: z.string().max(hrBounds.notesMax).optional(),
});

export const documentRequestUpdateSchema = createUpdateSchema(documentRequests, {
  requestNumber: z.string().min(1).max(50).optional(),
  purpose: nullableOptional(z.string().max(500)),
  addressedTo: nullableOptional(z.string().max(200)),
  requiredBy: dateNullableOptionalSchema,
  processedBy: nullableOptional(z.number().int()),
  processedAt: timestamptzWireNullableOptionalSchema,
  documentPath: nullableOptional(z.string().max(500)),
  deliveredAt: timestamptzWireNullableOptionalSchema,
  notes: nullableOptional(z.string().max(hrBounds.notesMax)),
});

export type DocumentRequest = typeof documentRequests.$inferSelect;
export type NewDocumentRequest = typeof documentRequests.$inferInsert;
