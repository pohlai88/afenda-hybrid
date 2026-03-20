import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Timesheets - Work hour summaries for payroll processing.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const timesheetStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PROCESSED"] as const;

export const timesheetStatusEnum = hrSchema.enum("timesheet_status", [...timesheetStatuses]);

export const timesheetStatusZodEnum = createSelectSchema(timesheetStatusEnum);

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
    approvedAt: date(),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_timesheets_tenant").on(t.tenantId),
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
  regularHours: z.string().optional(),
  overtimeHours: z.string().optional(),
  totalHours: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const timesheetUpdateSchema = createUpdateSchema(timesheets);

export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;
