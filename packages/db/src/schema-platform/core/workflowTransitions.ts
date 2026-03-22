import { integer, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns } from "../../_shared";
import { workflowDefinitions } from "./workflowDefinitions";
import { workflowStates } from "./workflowStates";
import { roles } from "../security/roles";

/**
 * Workflow Transitions - Allowed state transitions within a workflow.
 * Defines valid paths between states with action labels and optional role requirements.
 */
export const workflowTransitions = coreSchema.table(
  "workflow_transitions",
  {
    transitionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    workflowId: integer().notNull(),
    fromStateId: integer().notNull(),
    toStateId: integer().notNull(),
    action: text().notNull(),
    requiredRoleId: integer(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_workflow_transitions_workflow").on(t.workflowId),
    index("idx_workflow_transitions_from_state").on(t.fromStateId),
    index("idx_workflow_transitions_to_state").on(t.toStateId),
    foreignKey({
      columns: [t.workflowId],
      foreignColumns: [workflowDefinitions.workflowId],
      name: "fk_workflow_transitions_workflow",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.fromStateId],
      foreignColumns: [workflowStates.stateId],
      name: "fk_workflow_transitions_from_state",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.toStateId],
      foreignColumns: [workflowStates.stateId],
      name: "fk_workflow_transitions_to_state",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.requiredRoleId],
      foreignColumns: [roles.roleId],
      name: "fk_workflow_transitions_required_role",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  ]
);

export const WorkflowTransitionIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"WorkflowTransitionId">();
export type WorkflowTransitionId = z.infer<typeof WorkflowTransitionIdSchema>;

export const workflowTransitionSelectSchema = createSelectSchema(workflowTransitions);

export const workflowTransitionInsertSchema = createInsertSchema(workflowTransitions, {
  workflowId: z.number().int().positive(),
  fromStateId: z.number().int().positive(),
  toStateId: z.number().int().positive(),
  action: z.string().min(1).max(100),
  requiredRoleId: z.number().int().positive().optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const workflowTransitionUpdateSchema = createUpdateSchema(workflowTransitions, {
  action: z.string().min(1).max(100).optional(),
  requiredRoleId: z.number().int().positive().optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ workflowId: true, fromStateId: true, toStateId: true });

export type WorkflowTransition = typeof workflowTransitions.$inferSelect;
export type NewWorkflowTransition = typeof workflowTransitions.$inferInsert;
