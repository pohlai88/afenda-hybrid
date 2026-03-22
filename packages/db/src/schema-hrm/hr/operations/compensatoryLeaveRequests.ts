import { integer, date, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { hrSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../fundamentals/employees";
import { leaveTypes } from "../time/leaveTypes";

/**
 * Compensatory Leave Requests - Requests for comp-off leave for overtime/holiday work.
 * Tracks work date and requested leave type for compensation.
 */
export const compensatoryLeaveRequestStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const;

export const compensatoryLeaveRequestStatusEnum = hrSchema.enum(
  "compensatory_leave_request_status",
  [...compensatoryLeaveRequestStatuses]
);

export const CompensatoryLeaveRequestStatusSchema = z.enum(compensatoryLeaveRequestStatuses);
export type CompensatoryLeaveRequestStatus = z.infer<typeof CompensatoryLeaveRequestStatusSchema>;

export const compensatoryLeaveRequests = hrSchema.table(
  "compensatory_leave_requests",
  {
    requestId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    workDate: date().notNull(),
    leaveTypeId: integer().notNull(),
    reason: text().notNull(),
    status: compensatoryLeaveRequestStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    expiryDate: date(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_compensatory_leave_requests_tenant").on(t.tenantId),
    index("idx_compensatory_leave_requests_employee").on(t.tenantId, t.employeeId),
    index("idx_compensatory_leave_requests_work_date").on(t.tenantId, t.workDate),
    index("idx_compensatory_leave_requests_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_compensatory_leave_requests_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_compensatory_leave_requests_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.leaveTypeId],
      foreignColumns: [leaveTypes.leaveTypeId],
      name: "fk_compensatory_leave_requests_leave_type",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const CompensatoryLeaveRequestIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"CompensatoryLeaveRequestId">();
export type CompensatoryLeaveRequestId = z.infer<typeof CompensatoryLeaveRequestIdSchema>;

export const compensatoryLeaveRequestSelectSchema = createSelectSchema(compensatoryLeaveRequests);

export const compensatoryLeaveRequestInsertSchema = createInsertSchema(compensatoryLeaveRequests, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  workDate: z.coerce.date(),
  leaveTypeId: z.number().int().positive(),
  reason: z.string().min(10).max(500),
  status: CompensatoryLeaveRequestStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const compensatoryLeaveRequestUpdateSchema = createUpdateSchema(compensatoryLeaveRequests, {
  reason: z.string().min(10).max(500).optional(),
  status: CompensatoryLeaveRequestStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, employeeId: true, workDate: true, leaveTypeId: true });

export type CompensatoryLeaveRequest = typeof compensatoryLeaveRequests.$inferSelect;
export type NewCompensatoryLeaveRequest = typeof compensatoryLeaveRequests.$inferInsert;
