import { integer, text, date, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Onboarding Checklists - Joining formalities tracking.
 * Circular FK note: employeeId and assignedTo FKs added via custom SQL.
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const taskCategories = ["DOCUMENTATION", "IT_SETUP", "TRAINING", "COMPLIANCE", "INTRODUCTION", "EQUIPMENT", "ACCESS", "OTHER"] as const;

export const taskCategoryEnum = recruitmentSchema.enum("task_category", [...taskCategories]);

/** Joining-checklist task category — aligned with `task_category` / `taskCategories`. */
export const OnboardingChecklistTaskCategorySchema = z.enum(taskCategories);
export type OnboardingChecklistTaskCategory = z.infer<typeof OnboardingChecklistTaskCategorySchema>;

export const taskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "SKIPPED"] as const;

export const taskStatusEnum = recruitmentSchema.enum("onboarding_task_status", [...taskStatuses]);

/** Shared by `onboarding_checklists` and `offboarding_checklists` (`onboarding_task_status`). */
export const ChecklistTaskStatusSchema = z.enum(taskStatuses);
export type ChecklistTaskStatus = z.infer<typeof ChecklistTaskStatusSchema>;

export const onboardingChecklists = recruitmentSchema.table(
  "onboarding_checklists",
  {
    checklistId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    taskName: text().notNull(),
    taskCategory: taskCategoryEnum().notNull(),
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
    index("idx_onboarding_checklists_tenant").on(t.tenantId),
    index("idx_onboarding_checklists_employee").on(t.tenantId, t.employeeId),
    index("idx_onboarding_checklists_category").on(t.tenantId, t.taskCategory),
    index("idx_onboarding_checklists_status").on(t.tenantId, t.status),
    index("idx_onboarding_checklists_assigned").on(t.tenantId, t.assignedTo),
    uniqueIndex("uq_onboarding_checklists_sequence")
      .on(t.tenantId, t.employeeId, t.sequenceNumber)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_onboarding_checklists_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_onboarding_checklists_sequence",
      sql`${t.sequenceNumber} >= 1`
    ),
  ]
);

export const OnboardingChecklistIdSchema = z.number().int().brand<"OnboardingChecklistId">();
export type OnboardingChecklistId = z.infer<typeof OnboardingChecklistIdSchema>;

export const onboardingChecklistSelectSchema = createSelectSchema(onboardingChecklists);

export const onboardingChecklistInsertSchema = createInsertSchema(onboardingChecklists, {
  taskCategory: OnboardingChecklistTaskCategorySchema,
  /** Omit to use DB default `PENDING`. */
  status: ChecklistTaskStatusSchema.optional(),
  taskName: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sequenceNumber: z.number().int().min(1).max(100),
  notes: z.string().max(1000).optional(),
});

export const onboardingChecklistUpdateSchema = createUpdateSchema(onboardingChecklists, {
  taskCategory: OnboardingChecklistTaskCategorySchema.optional(),
  status: ChecklistTaskStatusSchema.optional(),
  taskName: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  sequenceNumber: z.number().int().min(1).max(100).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type NewOnboardingChecklist = typeof onboardingChecklists.$inferInsert;
