import {
  integer,
  text,
  smallint,
  boolean,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { nullableOptional, refineLeaveTypeCarryOverMaxNonNegative } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Leave Types - Master table for leave categories (vacation, sick, maternity, etc.).
 * Replaces enum-only approach for extensibility per tenant.
 */
export const leaveTypeStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const leaveTypeStatusEnum = hrSchema.enum("leave_type_status", [...leaveTypeStatuses]);

export const leaveTypeStatusZodEnum = z.enum(leaveTypeStatuses);

export const leaveTypes = hrSchema.table(
  "leave_types",
  {
    leaveTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    leaveTypeCode: text().notNull(),
    ...nameColumn,
    description: text(),
    defaultDaysPerYear: smallint(),
    isPaid: boolean().notNull().default(true),
    requiresApproval: boolean().notNull().default(true),
    requiresDocumentation: boolean().notNull().default(false),
    maxConsecutiveDays: smallint(),
    minNoticeDays: smallint().default(0),
    allowCarryOver: boolean().notNull().default(false),
    maxCarryOverDays: smallint(),
    status: leaveTypeStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_leave_types_tenant").on(t.tenantId),
    index("idx_leave_types_status").on(t.tenantId, t.status),
    uniqueIndex("uq_leave_types_code")
      .on(t.tenantId, sql`lower(${t.leaveTypeCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_leave_types_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_leave_types_default_days",
      sql`${t.defaultDaysPerYear} IS NULL OR ${t.defaultDaysPerYear} >= 0`
    ),
    check(
      "chk_leave_types_max_consecutive",
      sql`${t.maxConsecutiveDays} IS NULL OR ${t.maxConsecutiveDays} > 0`
    ),
    check(
      "chk_leave_types_carry_over",
      sql`${t.allowCarryOver} = false OR ${t.maxCarryOverDays} IS NULL OR ${t.maxCarryOverDays} >= 0`
    ),
  ]
);

export const LeaveTypeIdSchema = z.number().int().brand<"LeaveTypeId">();
export type LeaveTypeId = z.infer<typeof LeaveTypeIdSchema>;

export const leaveTypeSelectSchema = createSelectSchema(leaveTypes);

export const leaveTypeInsertSchema = createInsertSchema(leaveTypes, {
  leaveTypeCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  defaultDaysPerYear: z.number().int().min(0).max(365).optional(),
  maxConsecutiveDays: z.number().int().min(1).max(365).optional(),
  minNoticeDays: z.number().int().min(0).max(90).optional(),
  maxCarryOverDays: z.number().int().min(0).max(365).optional(),
}).superRefine((data, ctx) => refineLeaveTypeCarryOverMaxNonNegative(data, ctx));

export const leaveTypeUpdateSchema = createUpdateSchema(leaveTypes, {
  leaveTypeCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  name: z.string().min(1).max(200).optional(),
  description: nullableOptional(z.string().max(1000)),
  defaultDaysPerYear: nullableOptional(z.number().int().min(0).max(365)),
  maxConsecutiveDays: nullableOptional(z.number().int().min(1).max(365)),
  minNoticeDays: z.number().int().min(0).max(90).optional(),
  maxCarryOverDays: nullableOptional(z.number().int().min(0).max(365)),
  isPaid: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  requiresDocumentation: z.boolean().optional(),
  allowCarryOver: z.boolean().optional(),
}).superRefine((data, ctx) => refineLeaveTypeCarryOverMaxNonNegative(data, ctx));

export type LeaveType = typeof leaveTypes.$inferSelect;
export type NewLeaveType = typeof leaveTypes.$inferInsert;
