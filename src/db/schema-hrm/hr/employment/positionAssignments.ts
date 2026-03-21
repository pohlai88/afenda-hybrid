import { integer, date, boolean, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateStringSchema,
  nullableOptional,
  positionFteStringSchema,
  refineOptionalIsoEndOnOrAfterStart,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Position Assignments - Employee to position mapping with effective dating.
 * Supports multiple positions per employee (primary + secondary assignments).
 * Circular FK note: employeeId and positionId FKs added via custom SQL.
 */
export const positionAssignments = hrSchema.table(
  "position_assignments",
  {
    assignmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    positionId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    isPrimary: boolean().notNull().default(true),
    fte: numeric({ precision: 3, scale: 2 }).notNull().default("1.00"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_position_assignments_tenant").on(t.tenantId),
    index("idx_position_assignments_employee").on(t.tenantId, t.employeeId),
    index("idx_position_assignments_position").on(t.tenantId, t.positionId),
    index("idx_position_assignments_effective").on(t.tenantId, t.employeeId, t.effectiveFrom),
    uniqueIndex("uq_position_assignments_primary")
      .on(t.tenantId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.effectiveTo} IS NULL AND ${t.isPrimary} = true`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_position_assignments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_position_assignments_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
    check(
      "chk_position_assignments_fte",
      sql`${t.fte} > 0 AND ${t.fte} <= 1`
    ),
  ]
);

export const PositionAssignmentIdSchema = z.number().int().brand<"PositionAssignmentId">();
export type PositionAssignmentId = z.infer<typeof PositionAssignmentIdSchema>;

export const positionAssignmentSelectSchema = createSelectSchema(positionAssignments);

export const positionAssignmentInsertSchema = createInsertSchema(positionAssignments, {
  fte: positionFteStringSchema,
}).superRefine((data, ctx) =>
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "effectiveFrom",
    endKey: "effectiveTo",
    issuePath: "effectiveTo",
  })
);

export const positionAssignmentUpdateSchema = createUpdateSchema(positionAssignments, {
  effectiveFrom: dateStringSchema.optional(),
  effectiveTo: dateNullableOptionalSchema,
  fte: nullableOptional(positionFteStringSchema),
}).superRefine((data, ctx) =>
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "effectiveFrom",
    endKey: "effectiveTo",
    issuePath: "effectiveTo",
  })
);

export type PositionAssignment = typeof positionAssignments.$inferSelect;
export type NewPositionAssignment = typeof positionAssignments.$inferInsert;
