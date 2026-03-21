import { integer, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { appendOnlyTimestampColumns } from "../../_shared";
import { workflowInstances } from "./workflowInstances";
import { workflowTransitions } from "./workflowTransitions";
import { workflowStates } from "./workflowStates";

/**
 * Workflow Action Logs - Audit trail of workflow state transitions.
 * Immutable log of who performed which action and when.
 */
export const workflowActionLogs = coreSchema.table(
  "workflow_action_logs",
  {
    logId: integer().primaryKey().generatedAlwaysAsIdentity(),
    instanceId: integer().notNull(),
    transitionId: integer(),
    fromStateId: integer().notNull(),
    toStateId: integer().notNull(),
    actorId: integer().notNull(),
    actionedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    comment: text(),
    ...appendOnlyTimestampColumns,
  },
  (t) => [
    index("idx_workflow_action_logs_instance").on(t.instanceId),
    index("idx_workflow_action_logs_actor").on(t.actorId),
    index("idx_workflow_action_logs_actioned_at").on(t.actionedAt),
    foreignKey({
      columns: [t.instanceId],
      foreignColumns: [workflowInstances.instanceId],
      name: "fk_workflow_action_logs_instance",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.transitionId],
      foreignColumns: [workflowTransitions.transitionId],
      name: "fk_workflow_action_logs_transition",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.fromStateId],
      foreignColumns: [workflowStates.stateId],
      name: "fk_workflow_action_logs_from_state",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.toStateId],
      foreignColumns: [workflowStates.stateId],
      name: "fk_workflow_action_logs_to_state",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const WorkflowActionLogIdSchema = z.number().int().positive().brand<"WorkflowActionLogId">();
export type WorkflowActionLogId = z.infer<typeof WorkflowActionLogIdSchema>;

export const workflowActionLogSelectSchema = createSelectSchema(workflowActionLogs);

export const workflowActionLogInsertSchema = createInsertSchema(workflowActionLogs, {
  instanceId: z.number().int().positive(),
  transitionId: z.number().int().positive().optional().nullable(),
  fromStateId: z.number().int().positive(),
  toStateId: z.number().int().positive(),
  actorId: z.number().int().positive(),
  comment: z.string().max(2000).optional().nullable(),
});

export const workflowActionLogUpdateSchema = createUpdateSchema(workflowActionLogs, {
  comment: z.string().max(2000).optional().nullable(),
})
  .omit({ instanceId: true, transitionId: true, fromStateId: true, toStateId: true, actorId: true, actionedAt: true });

export type WorkflowActionLog = typeof workflowActionLogs.$inferSelect;
export type NewWorkflowActionLog = typeof workflowActionLogs.$inferInsert;
