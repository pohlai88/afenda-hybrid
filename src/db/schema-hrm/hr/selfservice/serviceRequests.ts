import { integer, text, timestamp, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { nullableOptional, timestamptzWireNullableOptionalSchema } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Service Requests - HR helpdesk tickets from employees.
 * Circular FK note: employeeId and assignedTo FKs added via custom SQL.
 */
export const requestCategories = ["PAYROLL", "BENEFITS", "LEAVE", "POLICY", "IT_ACCESS", "DOCUMENT", "COMPLAINT", "GENERAL", "OTHER"] as const;

export const requestCategoryEnum = hrSchema.enum("request_category", [...requestCategories]);

export const requestCategoryZodEnum = z.enum(requestCategories);

export const requestPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const requestPriorityEnum = hrSchema.enum("request_priority", [...requestPriorities]);

export const requestPriorityZodEnum = z.enum(requestPriorities);

export const requestStatuses = ["OPEN", "IN_PROGRESS", "PENDING_INFO", "RESOLVED", "CLOSED", "CANCELLED"] as const;

export const requestStatusEnum = hrSchema.enum("request_status", [...requestStatuses]);

export const requestStatusZodEnum = z.enum(requestStatuses);

export const serviceRequests = hrSchema.table(
  "service_requests",
  {
    serviceRequestId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    requestNumber: text().notNull(),
    category: requestCategoryEnum().notNull(),
    subject: text().notNull(),
    description: text().notNull(),
    priority: requestPriorityEnum().notNull().default("MEDIUM"),
    assignedTo: integer(),
    status: requestStatusEnum().notNull().default("OPEN"),
    resolution: text(),
    resolvedAt: timestamp({ withTimezone: true }),
    closedAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_service_requests_tenant").on(t.tenantId),
    index("idx_service_requests_tenant_op_date").on(t.tenantId, t.status, t.resolvedAt),
    index("idx_service_requests_employee").on(t.tenantId, t.employeeId),
    index("idx_service_requests_category").on(t.tenantId, t.category),
    index("idx_service_requests_status").on(t.tenantId, t.status),
    index("idx_service_requests_priority").on(t.tenantId, t.priority),
    index("idx_service_requests_assigned").on(t.tenantId, t.assignedTo),
    uniqueIndex("uq_service_requests_number")
      .on(t.tenantId, sql`lower(${t.requestNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_service_requests_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const ServiceRequestIdSchema = z.number().int().brand<"ServiceRequestId">();
export type ServiceRequestId = z.infer<typeof ServiceRequestIdSchema>;

export const serviceRequestSelectSchema = createSelectSchema(serviceRequests);

export const serviceRequestInsertSchema = createInsertSchema(serviceRequests, {
  requestNumber: z.string().min(1).max(50),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  resolution: z.string().max(4000).optional(),
});

export const serviceRequestUpdateSchema = createUpdateSchema(serviceRequests, {
  requestNumber: z.string().min(1).max(50).optional(),
  subject: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(4000).optional(),
  assignedTo: nullableOptional(z.number().int()),
  resolution: nullableOptional(z.string().max(4000)),
  resolvedAt: timestamptzWireNullableOptionalSchema,
  closedAt: timestamptzWireNullableOptionalSchema,
});

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;
