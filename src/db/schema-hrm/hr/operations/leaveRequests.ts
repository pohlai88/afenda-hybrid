import { integer, text, date, numeric, timestamp, boolean, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateStringSchema,
  hrBounds,
  leaveTotalDaysStringSchema,
  nullableOptional,
  refineEndDateOnOrAfterStartDate,
  refineLeaveApprovedRequiresApproverAndTime,
  refineLeaveRejectedRequiresReason,
  timestamptzWireNullableOptionalSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../fundamentals/employees";

/**
 * Leave Requests - Employee leave applications with approval workflow.
 * Links to leave types master table and leave balances for tracking.
 *
 * Note: leaveTypeId FK added via custom SQL to avoid circular imports with time module.
 * Note: leaveBalanceId FK added via custom SQL for the same boundary.
 */
export const leaveRequestStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "WITHDRAWN"] as const;

export const leaveRequestStatusEnum = hrSchema.enum("leave_request_status", [...leaveRequestStatuses]);

export const leaveRequestStatusZodEnum = z.enum(leaveRequestStatuses);

export const leaveRequests = hrSchema.table(
  "leave_requests",
  {
    leaveRequestId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    leaveTypeId: integer().notNull(),
    leaveBalanceId: integer(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    totalDays: numeric({ precision: 4, scale: 1 }).notNull(),
    isHalfDay: boolean().notNull().default(false),
    status: leaveRequestStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    reason: text(),
    rejectionReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_leave_requests_tenant").on(t.tenantId),
    index("idx_leave_requests_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_leave_requests_employee").on(t.tenantId, t.employeeId, t.startDate),
    index("idx_leave_requests_type").on(t.tenantId, t.leaveTypeId),
    index("idx_leave_requests_balance").on(t.tenantId, t.leaveBalanceId),
    index("idx_leave_requests_status").on(t.tenantId, t.status, t.startDate),
    index("idx_leave_requests_approver").on(t.tenantId, t.approvedBy),
    index("idx_leave_requests_date_range").on(t.tenantId, t.startDate, t.endDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_leave_requests_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_leave_requests_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.approvedBy],
      foreignColumns: [employees.employeeId],
      name: "fk_leave_requests_approver",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_leave_requests_date_range",
      sql`${t.endDate} >= ${t.startDate}`
    ),
    check(
      "chk_leave_requests_total_days",
      sql`${t.totalDays} > 0`
    ),
    check(
      "chk_leave_requests_approval_fields",
      sql`${t.status} != 'APPROVED' OR (${t.approvedBy} IS NOT NULL AND ${t.approvedAt} IS NOT NULL)`
    ),
    check(
      "chk_leave_requests_rejection_reason",
      sql`${t.status} != 'REJECTED' OR ${t.rejectionReason} IS NOT NULL`
    ),
  ]
);

export const LeaveRequestIdSchema = z.number().int().brand<"LeaveRequestId">();
export type LeaveRequestId = z.infer<typeof LeaveRequestIdSchema>;

export const leaveRequestSelectSchema = createSelectSchema(leaveRequests);

export const leaveRequestInsertSchema = createInsertSchema(leaveRequests, {
  totalDays: leaveTotalDaysStringSchema,
  reason: z.string().max(hrBounds.reasonMax).optional(),
  rejectionReason: z.string().max(hrBounds.reasonMax).optional(),
}).superRefine((data, ctx) => {
  refineEndDateOnOrAfterStartDate(data, ctx);
  refineLeaveApprovedRequiresApproverAndTime(data, ctx);
  refineLeaveRejectedRequiresReason(data, ctx);
});

export const leaveRequestUpdateSchema = createUpdateSchema(leaveRequests, {
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  totalDays: leaveTotalDaysStringSchema.optional(),
  leaveBalanceId: nullableOptional(z.number().int()),
  approvedBy: nullableOptional(z.number().int()),
  approvedAt: timestamptzWireNullableOptionalSchema,
  reason: nullableOptional(z.string().max(hrBounds.reasonMax)),
  rejectionReason: nullableOptional(z.string().max(hrBounds.reasonMax)),
}).superRefine((data, ctx) => {
  refineEndDateOnOrAfterStartDate(data, ctx);
  refineLeaveApprovedRequiresApproverAndTime(data, ctx);
  refineLeaveRejectedRequiresReason(data, ctx);
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
