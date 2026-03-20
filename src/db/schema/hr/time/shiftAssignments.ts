import { integer, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { workSchedules } from "./workSchedules";

/**
 * Shift Assignments - Employee to work schedule mapping with effective dating.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const shiftAssignments = hrSchema.table(
  "shift_assignments",
  {
    shiftAssignmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    scheduleId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_shift_assignments_tenant").on(t.tenantId),
    index("idx_shift_assignments_employee").on(t.tenantId, t.employeeId),
    index("idx_shift_assignments_schedule").on(t.tenantId, t.scheduleId),
    index("idx_shift_assignments_effective").on(t.tenantId, t.employeeId, t.effectiveFrom),
    uniqueIndex("uq_shift_assignments_active")
      .on(t.tenantId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.effectiveTo} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_shift_assignments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.scheduleId],
      foreignColumns: [workSchedules.scheduleId],
      name: "fk_shift_assignments_schedule",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_shift_assignments_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const ShiftAssignmentIdSchema = z.number().int().brand<"ShiftAssignmentId">();
export type ShiftAssignmentId = z.infer<typeof ShiftAssignmentIdSchema>;

export const shiftAssignmentSelectSchema = createSelectSchema(shiftAssignments);

export const shiftAssignmentInsertSchema = createInsertSchema(shiftAssignments);

export const shiftAssignmentUpdateSchema = createUpdateSchema(shiftAssignments);

export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type NewShiftAssignment = typeof shiftAssignments.$inferInsert;
