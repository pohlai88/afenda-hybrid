import { integer, smallint, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { leaveTypes } from "./leaveTypes";

/**
 * Leave Balances - Accrued and used leave tracking per employee per year.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const leaveBalances = hrSchema.table(
  "leave_balances",
  {
    leaveBalanceId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    leaveTypeId: integer().notNull(),
    year: smallint().notNull(),
    entitled: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    used: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    pending: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    carriedOver: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    adjustment: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_leave_balances_tenant").on(t.tenantId),
    index("idx_leave_balances_employee").on(t.tenantId, t.employeeId),
    index("idx_leave_balances_type").on(t.tenantId, t.leaveTypeId),
    index("idx_leave_balances_year").on(t.tenantId, t.year),
    uniqueIndex("uq_leave_balances_employee_type_year")
      .on(t.tenantId, t.employeeId, t.leaveTypeId, t.year)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_leave_balances_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.leaveTypeId],
      foreignColumns: [leaveTypes.leaveTypeId],
      name: "fk_leave_balances_leave_type",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_leave_balances_entitled",
      sql`${t.entitled} >= 0`
    ),
    check(
      "chk_leave_balances_used",
      sql`${t.used} >= 0`
    ),
    check(
      "chk_leave_balances_pending",
      sql`${t.pending} >= 0`
    ),
    check(
      "chk_leave_balances_carried_over",
      sql`${t.carriedOver} >= 0`
    ),
  ]
);

export const LeaveBalanceIdSchema = z.number().int().brand<"LeaveBalanceId">();
export type LeaveBalanceId = z.infer<typeof LeaveBalanceIdSchema>;

export const leaveBalanceSelectSchema = createSelectSchema(leaveBalances);

export const leaveBalanceInsertSchema = createInsertSchema(leaveBalances, {
  year: z.number().int().min(2000).max(2100),
  entitled: z.string().optional(),
  used: z.string().optional(),
  pending: z.string().optional(),
  carriedOver: z.string().optional(),
  adjustment: z.string().optional(),
});

export const leaveBalanceUpdateSchema = createUpdateSchema(leaveBalances);

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type NewLeaveBalance = typeof leaveBalances.$inferInsert;
