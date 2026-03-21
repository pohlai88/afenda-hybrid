import { integer, text, date, timestamp, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateStringSchema,
  hrBounds,
  nullableOptional,
  refineOptionalIsoEndOnOrAfterStart,
  refineTimesheetHoursNonNegative,
  timesheetHoursStringSchema,
  timestamptzWireNullableOptionalSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Timesheets - Work hour summaries for payroll processing.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const timesheetStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PROCESSED"] as const;

export const timesheetStatusEnum = hrSchema.enum("timesheet_status", [...timesheetStatuses]);

export const timesheetStatusZodEnum = z.enum(timesheetStatuses);

export const timesheets = hrSchema.table(
  "timesheets",
  {
    timesheetId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    periodStart: date().notNull(),
    periodEnd: date().notNull(),
    regularHours: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    overtimeHours: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    totalHours: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    status: timesheetStatusEnum().notNull().default("DRAFT"),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_timesheets_tenant").on(t.tenantId),
    index("idx_timesheets_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_timesheets_employee").on(t.tenantId, t.employeeId),
    index("idx_timesheets_period").on(t.tenantId, t.periodStart, t.periodEnd),
    index("idx_timesheets_status").on(t.tenantId, t.status),
    uniqueIndex("uq_timesheets_employee_period")
      .on(t.tenantId, t.employeeId, t.periodStart, t.periodEnd)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_timesheets_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_timesheets_period",
      sql`${t.periodEnd} >= ${t.periodStart}`
    ),
    check(
      "chk_timesheets_hours_positive",
      sql`${t.regularHours} >= 0 AND ${t.overtimeHours} >= 0 AND ${t.totalHours} >= 0`
    ),
  ]
);

export const TimesheetIdSchema = z.number().int().brand<"TimesheetId">();
export type TimesheetId = z.infer<typeof TimesheetIdSchema>;

export const timesheetSelectSchema = createSelectSchema(timesheets);

export const timesheetInsertSchema = createInsertSchema(timesheets, {
  regularHours: timesheetHoursStringSchema.optional(),
  overtimeHours: timesheetHoursStringSchema.optional(),
  totalHours: timesheetHoursStringSchema.optional(),
  notes: z.string().max(hrBounds.notesMax).optional(),
}).superRefine((data, ctx) => {
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "periodStart",
    endKey: "periodEnd",
    issuePath: "periodEnd",
  });
  refineTimesheetHoursNonNegative(data as Record<string, unknown>, ctx, [
    "regularHours",
    "overtimeHours",
    "totalHours",
  ]);
});

export const timesheetUpdateSchema = createUpdateSchema(timesheets, {
  periodStart: dateStringSchema.optional(),
  periodEnd: dateStringSchema.optional(),
  regularHours: nullableOptional(timesheetHoursStringSchema),
  overtimeHours: nullableOptional(timesheetHoursStringSchema),
  totalHours: nullableOptional(timesheetHoursStringSchema),
  approvedBy: nullableOptional(z.number().int()),
  approvedAt: timestamptzWireNullableOptionalSchema,
  notes: nullableOptional(z.string().max(hrBounds.notesMax)),
}).superRefine((data, ctx) => {
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "periodStart",
    endKey: "periodEnd",
    issuePath: "periodEnd",
  });
  refineTimesheetHoursNonNegative(data as Record<string, unknown>, ctx, [
    "regularHours",
    "overtimeHours",
    "totalHours",
  ]);
});

export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;
