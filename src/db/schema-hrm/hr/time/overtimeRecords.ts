import { integer, text, date, timestamp, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateStringSchema,
  hrBounds,
  nullableOptional,
  overtimeHoursStringSchema,
  overtimeMultiplierStringSchema,
  timestamptzWireNullableOptionalSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Overtime Records - Extra work hours tracking for payroll calculation.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const overtimeTypes = ["REGULAR", "WEEKEND", "HOLIDAY", "NIGHT", "EMERGENCY"] as const;

export const overtimeTypeEnum = hrSchema.enum("overtime_type", [...overtimeTypes]);

export const overtimeTypeZodEnum = z.enum(overtimeTypes);

export const overtimeStatuses = ["PENDING", "APPROVED", "REJECTED", "PROCESSED"] as const;

export const overtimeStatusEnum = hrSchema.enum("overtime_status", [...overtimeStatuses]);

export const overtimeStatusZodEnum = z.enum(overtimeStatuses);

export const overtimeRecords = hrSchema.table(
  "overtime_records",
  {
    overtimeRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    overtimeDate: date().notNull(),
    overtimeType: overtimeTypeEnum().notNull().default("REGULAR"),
    hours: numeric({ precision: 4, scale: 2 }).notNull(),
    multiplier: numeric({ precision: 3, scale: 2 }).notNull().default("1.50"),
    reason: text(),
    status: overtimeStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_overtime_records_tenant").on(t.tenantId),
    index("idx_overtime_records_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_overtime_records_employee").on(t.tenantId, t.employeeId),
    index("idx_overtime_records_date").on(t.tenantId, t.overtimeDate),
    index("idx_overtime_records_status").on(t.tenantId, t.status),
    index("idx_overtime_records_type").on(t.tenantId, t.overtimeType),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_overtime_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_overtime_records_hours",
      sql`${t.hours} > 0 AND ${t.hours} <= 24`
    ),
    check(
      "chk_overtime_records_multiplier",
      sql`${t.multiplier} >= 1`
    ),
  ]
);

export const OvertimeRecordIdSchema = z.number().int().brand<"OvertimeRecordId">();
export type OvertimeRecordId = z.infer<typeof OvertimeRecordIdSchema>;

export const overtimeRecordSelectSchema = createSelectSchema(overtimeRecords);

export const overtimeRecordInsertSchema = createInsertSchema(overtimeRecords, {
  hours: overtimeHoursStringSchema,
  multiplier: overtimeMultiplierStringSchema,
  reason: z.string().max(hrBounds.notesMax).optional(),
});

export const overtimeRecordUpdateSchema = createUpdateSchema(overtimeRecords, {
  overtimeDate: dateStringSchema.optional(),
  hours: nullableOptional(overtimeHoursStringSchema),
  multiplier: nullableOptional(overtimeMultiplierStringSchema),
  reason: nullableOptional(z.string().max(hrBounds.notesMax)),
  approvedBy: nullableOptional(z.number().int()),
  approvedAt: timestamptzWireNullableOptionalSchema,
});

export type OvertimeRecord = typeof overtimeRecords.$inferSelect;
export type NewOvertimeRecord = typeof overtimeRecords.$inferInsert;
