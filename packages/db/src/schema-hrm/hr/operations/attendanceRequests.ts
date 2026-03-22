import { integer, date, timestamp, text, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../fundamentals/employees";

/**
 * Attendance Requests - Employee requests to regularize attendance records.
 * Handles missed punches, late check-ins, or attendance corrections.
 */
export const attendanceRequestStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;

export const attendanceRequestStatusEnum = hrSchema.enum("attendance_request_status", [
  ...attendanceRequestStatuses,
]);

export const AttendanceRequestStatusSchema = z.enum(attendanceRequestStatuses);
export type AttendanceRequestStatus = z.infer<typeof AttendanceRequestStatusSchema>;

export const attendanceRequests = hrSchema.table(
  "attendance_requests",
  {
    requestId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    attendanceDate: date().notNull(),
    reason: text().notNull(),
    checkInAt: timestamp({ withTimezone: true }),
    checkOutAt: timestamp({ withTimezone: true }),
    status: attendanceRequestStatusEnum().notNull().default("PENDING"),
    approvedAt: timestamp({ withTimezone: true }),
    approvedBy: integer(),
    rejectionReason: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_attendance_requests_tenant").on(t.tenantId),
    index("idx_attendance_requests_employee").on(t.tenantId, t.employeeId),
    index("idx_attendance_requests_date").on(t.tenantId, t.attendanceDate),
    index("idx_attendance_requests_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_attendance_requests_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_attendance_requests_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_attendance_requests_time_order",
      sql`${t.checkOutAt} IS NULL OR ${t.checkInAt} IS NULL OR ${t.checkOutAt} >= ${t.checkInAt}`
    ),
  ]
);

export const AttendanceRequestIdSchema = z.number().int().positive().brand<"AttendanceRequestId">();
export type AttendanceRequestId = z.infer<typeof AttendanceRequestIdSchema>;

export const attendanceRequestSelectSchema = createSelectSchema(attendanceRequests);

export const attendanceRequestInsertSchema = createInsertSchema(attendanceRequests, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  attendanceDate: z.coerce.date(),
  reason: z.string().min(10).max(500),
  status: AttendanceRequestStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const attendanceRequestUpdateSchema = createUpdateSchema(attendanceRequests, {
  reason: z.string().min(10).max(500).optional(),
  status: AttendanceRequestStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, employeeId: true, attendanceDate: true });

export type AttendanceRequest = typeof attendanceRequests.$inferSelect;
export type NewAttendanceRequest = typeof attendanceRequests.$inferInsert;
