import {
  integer,
  text,
  date,
  smallint,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { taskStatusEnum, ChecklistTaskStatusSchema } from "./onboardingChecklists";

/**
 * Offboarding checklists — exit / separation task tracking (symmetric to onboarding_checklists).
 * Reuses `recruitment.onboarding_task_status` for row status (same lifecycle semantics).
 * For `EXIT_INTERVIEW` tasks, pair with `recruitment.exit_interviews` (CSQL-015: DB blocks drifting category/tenant/employee or soft-delete while an active exit interview references this row). Prefer **`createExitInterview`** (`_services/recruitment/exitInterviewsService.ts`) for creates so tenant/employee align with the checklist before insert.
 * Circular FK note: employeeId and assignedTo FKs added via custom SQL (same pattern as onboarding).
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const offboardingTaskCategories = [
  "IT_DEPROVISION",
  "ACCESS_REVOCATION",
  "ASSET_RETURN",
  "PAYROLL",
  "BENEFITS",
  "STATUTORY_FILING",
  "EXIT_INTERVIEW",
  "KNOWLEDGE_TRANSFER",
  "COMPLIANCE",
  "OTHER",
] as const;

export const offboardingTaskCategoryEnum = recruitmentSchema.enum("offboarding_task_category", [
  ...offboardingTaskCategories,
]);

/** Stricter than `createSelectSchema(enum)` for inserts/updates — single source of truth with `offboardingTaskCategories`. */
export const OffboardingTaskCategorySchema = z.enum(offboardingTaskCategories);
export type OffboardingTaskCategory = z.infer<typeof OffboardingTaskCategorySchema>;

export const offboardingChecklists = recruitmentSchema.table(
  "offboarding_checklists",
  {
    offboardingChecklistId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    taskName: text().notNull(),
    taskCategory: offboardingTaskCategoryEnum().notNull(),
    description: text(),
    assignedTo: integer(),
    dueDate: date(),
    completedDate: date(),
    sequenceNumber: smallint().notNull().default(1),
    status: taskStatusEnum().notNull().default("PENDING"),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_offboarding_checklists_tenant").on(t.tenantId),
    index("idx_offboarding_checklists_employee").on(t.tenantId, t.employeeId),
    index("idx_offboarding_checklists_category").on(t.tenantId, t.taskCategory),
    index("idx_offboarding_checklists_status").on(t.tenantId, t.status),
    index("idx_offboarding_checklists_assigned").on(t.tenantId, t.assignedTo),
    uniqueIndex("uq_offboarding_checklists_sequence")
      .on(t.tenantId, t.employeeId, t.sequenceNumber)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_offboarding_checklists_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_offboarding_checklists_sequence", sql`${t.sequenceNumber} >= 1`),
  ]
);

export const OffboardingChecklistIdSchema = z.number().int().brand<"OffboardingChecklistId">();
export type OffboardingChecklistId = z.infer<typeof OffboardingChecklistIdSchema>;

export const offboardingChecklistSelectSchema = createSelectSchema(offboardingChecklists);

export const offboardingChecklistInsertSchema = createInsertSchema(offboardingChecklists, {
  taskCategory: OffboardingTaskCategorySchema,
  /** Omit to use DB default `PENDING`. */
  status: ChecklistTaskStatusSchema.optional(),
  taskName: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sequenceNumber: z.number().int().min(1).max(100),
  notes: z.string().max(1000).optional(),
});

export const offboardingChecklistUpdateSchema = createUpdateSchema(offboardingChecklists, {
  taskCategory: OffboardingTaskCategorySchema.optional(),
  status: ChecklistTaskStatusSchema.optional(),
  taskName: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  sequenceNumber: z.number().int().min(1).max(100).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type OffboardingChecklist = typeof offboardingChecklists.$inferSelect;
export type NewOffboardingChecklist = typeof offboardingChecklists.$inferInsert;
