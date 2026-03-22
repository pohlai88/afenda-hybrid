import { integer, varchar, date, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  complianceCodeSchema,
  dateNullableOptionalSchema,
  dateOptionalSchema,
  dateStringSchema,
  nullableOptional,
  refineDueByOnOrAfterAssignedAt,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { learningPaths } from "../fundamentals/learningPaths";

/**
 * Learning path assignments — assign a path to an employee (lifecycle + optional compliance).
 *
 * Circular FK note: `employeeId` → `hr.employees` may be added via custom SQL if desired.
 * Bootstrap `learning_path_course_progress` rows in the application when an assignment is created.
 */
export const pathAssignmentStatuses = [
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const pathAssignmentStatusEnum = learningSchema.enum("path_assignment_status", [
  ...pathAssignmentStatuses,
]);

export const pathAssignmentStatusZodEnum = z.enum(pathAssignmentStatuses);

export const learningPathAssignments = learningSchema.table(
  "learning_path_assignments",
  {
    pathAssignmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    learningPathId: integer().notNull(),
    employeeId: integer().notNull(),
    assignedAt: date().notNull(),
    status: pathAssignmentStatusEnum().notNull().default("ASSIGNED"),
    dueBy: date(),
    complianceCode: varchar({ length: 100 }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_learning_path_assignments_tenant").on(t.tenantId),
    index("idx_learning_path_assignments_path").on(t.tenantId, t.learningPathId),
    index("idx_learning_path_assignments_employee").on(t.tenantId, t.employeeId),
    index("idx_learning_path_assignments_status").on(t.tenantId, t.status),
    index("idx_learning_path_assignments_due")
      .on(t.tenantId, t.dueBy)
      .where(sql`${t.deletedAt} IS NULL AND ${t.dueBy} IS NOT NULL`),
    uniqueIndex("uq_learning_path_assignments_path_employee")
      .on(t.tenantId, t.learningPathId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_learning_path_assignments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.learningPathId],
      foreignColumns: [learningPaths.learningPathId],
      name: "fk_learning_path_assignments_path",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const PathAssignmentIdSchema = z.number().int().brand<"PathAssignmentId">();
export type PathAssignmentId = z.infer<typeof PathAssignmentIdSchema>;

/** Read model: trust DB; use insert/update for normalized writes. */
export const learningPathAssignmentSelectSchema = createSelectSchema(learningPathAssignments);

export const learningPathAssignmentInsertSchema = createInsertSchema(learningPathAssignments, {
  assignedAt: dateStringSchema,
  dueBy: dateOptionalSchema,
  complianceCode: complianceCodeSchema.optional(),
  status: pathAssignmentStatusZodEnum.optional(),
}).superRefine(refineDueByOnOrAfterAssignedAt);

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const learningPathAssignmentUpdateSchema = createUpdateSchema(learningPathAssignments, {
  complianceCode: nullableOptional(complianceCodeSchema),
  assignedAt: dateStringSchema.optional(),
  dueBy: dateNullableOptionalSchema,
  status: pathAssignmentStatusZodEnum.optional(),
}).superRefine(refineDueByOnOrAfterAssignedAt);

export type LearningPathAssignment = typeof learningPathAssignments.$inferSelect;
export type NewLearningPathAssignment = typeof learningPathAssignments.$inferInsert;
