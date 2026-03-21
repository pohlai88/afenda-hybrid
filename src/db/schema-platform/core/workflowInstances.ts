import { integer, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns } from "../../_shared";
import { tenants } from "./tenants";
import { workflowDefinitions } from "./workflowDefinitions";
import { workflowStates } from "./workflowStates";

/**
 * Workflow Instances - Active workflow executions for specific records.
 * Tracks the current state and lifecycle of a workflow for a given business record.
 */
export const workflowInstanceStatuses = ["ACTIVE", "COMPLETED", "CANCELLED", "TIMED_OUT"] as const;

export const workflowInstanceStatusEnum = coreSchema.enum("workflow_instance_status", [...workflowInstanceStatuses]);

export const WorkflowInstanceStatusSchema = z.enum(workflowInstanceStatuses);
export type WorkflowInstanceStatus = z.infer<typeof WorkflowInstanceStatusSchema>;

export const workflowInstances = coreSchema.table(
  "workflow_instances",
  {
    instanceId: integer().primaryKey().generatedAlwaysAsIdentity(),
    workflowId: integer().notNull(),
    tenantId: integer().notNull(),
    recordId: integer().notNull(),
    recordTable: text().notNull(),
    currentStateId: integer().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp({ withTimezone: true }),
    status: workflowInstanceStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_workflow_instances_tenant").on(t.tenantId),
    index("idx_workflow_instances_workflow").on(t.workflowId),
    index("idx_workflow_instances_record").on(t.tenantId, t.recordTable, t.recordId),
    index("idx_workflow_instances_current_state").on(t.currentStateId),
    index("idx_workflow_instances_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_workflow_instances_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.workflowId],
      foreignColumns: [workflowDefinitions.workflowId],
      name: "fk_workflow_instances_workflow",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currentStateId],
      foreignColumns: [workflowStates.stateId],
      name: "fk_workflow_instances_current_state",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const WorkflowInstanceIdSchema = z.number().int().positive().brand<"WorkflowInstanceId">();
export type WorkflowInstanceId = z.infer<typeof WorkflowInstanceIdSchema>;

export const workflowInstanceSelectSchema = createSelectSchema(workflowInstances);

export const workflowInstanceInsertSchema = createInsertSchema(workflowInstances, {
  workflowId: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  recordId: z.number().int().positive(),
  recordTable: z.string().min(1).max(100),
  currentStateId: z.number().int().positive(),
  status: WorkflowInstanceStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const workflowInstanceUpdateSchema = createUpdateSchema(workflowInstances, {
  currentStateId: z.number().int().positive().optional(),
  status: WorkflowInstanceStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ workflowId: true, tenantId: true, recordId: true, recordTable: true });

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type NewWorkflowInstance = typeof workflowInstances.$inferInsert;
