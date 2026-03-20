import { integer, text, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Shift Swaps - Shift swap requests between employees.
 * Circular FK note: requestingEmployeeId, targetEmployeeId, approvedBy FKs added via custom SQL.
 */
export const shiftSwapStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"] as const;

export const shiftSwapStatusEnum = hrSchema.enum("shift_swap_status", [...shiftSwapStatuses]);

export const shiftSwapStatusZodEnum = createSelectSchema(shiftSwapStatusEnum);

export const shiftSwaps = hrSchema.table(
  "shift_swaps",
  {
    shiftSwapId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    requestingEmployeeId: integer().notNull(),
    targetEmployeeId: integer().notNull(),
    originalDate: date().notNull(),
    swapDate: date().notNull(),
    reason: text(),
    status: shiftSwapStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvedAt: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_shift_swaps_tenant").on(t.tenantId),
    index("idx_shift_swaps_requesting").on(t.tenantId, t.requestingEmployeeId),
    index("idx_shift_swaps_target").on(t.tenantId, t.targetEmployeeId),
    index("idx_shift_swaps_dates").on(t.tenantId, t.originalDate, t.swapDate),
    index("idx_shift_swaps_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_shift_swaps_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_shift_swaps_different_employees",
      sql`${t.requestingEmployeeId} != ${t.targetEmployeeId}`
    ),
  ]
);

export const ShiftSwapIdSchema = z.number().int().brand<"ShiftSwapId">();
export type ShiftSwapId = z.infer<typeof ShiftSwapIdSchema>;

export const shiftSwapSelectSchema = createSelectSchema(shiftSwaps);

export const shiftSwapInsertSchema = createInsertSchema(shiftSwaps, {
  reason: z.string().max(1000).optional(),
});

export const shiftSwapUpdateSchema = createUpdateSchema(shiftSwaps);

export type ShiftSwap = typeof shiftSwaps.$inferSelect;
export type NewShiftSwap = typeof shiftSwaps.$inferInsert;
