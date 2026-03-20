import { integer, text, date, timestamp, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { employees } from "../fundamentals/employees";

/**
 * Attendance Logs - Clock-in/out timestamps for daily attendance tracking.
 * Links to shift assignments and timesheets for payroll integration.
 */
export const attendanceTypes = ["REGULAR", "OVERTIME", "REMOTE", "ON_SITE", "FIELD_WORK", "TRAINING"] as const;

export const attendanceTypeEnum = hrSchema.enum("attendance_type", [...attendanceTypes]);

export const attendanceTypeZodEnum = createSelectSchema(attendanceTypeEnum);

export const attendanceLogs = hrSchema.table(
  "attendance_logs",
  {
    attendanceLogId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    shiftAssignmentId: integer(),
    timesheetId: integer(),
    attendanceDate: date().notNull(),
    checkInAt: timestamp({ withTimezone: true }),
    checkOutAt: timestamp({ withTimezone: true }),
    attendanceType: attendanceTypeEnum().notNull().default("REGULAR"),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_attendance_logs_tenant").on(t.tenantId),
    index("idx_attendance_logs_employee").on(t.tenantId, t.employeeId, t.attendanceDate),
    index("idx_attendance_logs_date").on(t.tenantId, t.attendanceDate),
    index("idx_attendance_logs_type").on(t.tenantId, t.attendanceType, t.attendanceDate),
    index("idx_attendance_logs_shift").on(t.tenantId, t.shiftAssignmentId),
    index("idx_attendance_logs_timesheet").on(t.tenantId, t.timesheetId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_attendance_logs_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_attendance_logs_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_attendance_checkout_after_checkin",
      sql`${t.checkOutAt} IS NULL OR ${t.checkInAt} IS NULL OR ${t.checkOutAt} > ${t.checkInAt}`
    ),
  ]
);

export const AttendanceLogIdSchema = z.number().int().brand<"AttendanceLogId">();
export type AttendanceLogId = z.infer<typeof AttendanceLogIdSchema>;

export const attendanceLogSelectSchema = createSelectSchema(attendanceLogs);

export const attendanceLogInsertSchema = createInsertSchema(attendanceLogs, {
  notes: z.string().max(2000).optional(),
});

export const attendanceLogUpdateSchema = createUpdateSchema(attendanceLogs);

export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type NewAttendanceLog = typeof attendanceLogs.$inferInsert;
