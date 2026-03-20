import { integer, text, date, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Onboarding Checklists - Joining formalities tracking.
 * Circular FK note: employeeId and assignedTo FKs added via custom SQL.
 */
export const taskCategories = ["DOCUMENTATION", "IT_SETUP", "TRAINING", "COMPLIANCE", "INTRODUCTION", "EQUIPMENT", "ACCESS", "OTHER"] as const;

export const taskCategoryEnum = recruitmentSchema.enum("task_category", [...taskCategories]);

export const taskCategoryZodEnum = createSelectSchema(taskCategoryEnum);

export const taskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "SKIPPED"] as const;

export const taskStatusEnum = recruitmentSchema.enum("onboarding_task_status", [...taskStatuses]);

export const taskStatusZodEnum = createSelectSchema(taskStatusEnum);

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
  taskName: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sequenceNumber: z.number().int().min(1).max(100),
  notes: z.string().max(1000).optional(),
});

export const onboardingChecklistUpdateSchema = createUpdateSchema(onboardingChecklists);

export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type NewOnboardingChecklist = typeof onboardingChecklists.$inferInsert;
