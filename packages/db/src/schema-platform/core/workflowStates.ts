import { integer, text, boolean, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns, nameColumn } from "../../_shared";
import { workflowDefinitions } from "./workflowDefinitions";

/**
 * Workflow States - States within a workflow definition.
 * Defines the stages a workflow instance can be in (e.g., DRAFT, PENDING, APPROVED).
 */
export const workflowStates = coreSchema.table(
  "workflow_states",
  {
    stateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    workflowId: integer().notNull(),
    stateCode: text().notNull(),
    ...nameColumn,
    isInitial: boolean().notNull().default(false),
    isFinal: boolean().notNull().default(false),
    sequenceNumber: integer().notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_workflow_states_workflow").on(t.workflowId),
    foreignKey({
      columns: [t.workflowId],
      foreignColumns: [workflowDefinitions.workflowId],
      name: "fk_workflow_states_workflow",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check("chk_workflow_states_sequence", sql`${t.sequenceNumber} > 0`),
  ]
);

export const WorkflowStateIdSchema = z.number().int().positive().brand<"WorkflowStateId">();
export type WorkflowStateId = z.infer<typeof WorkflowStateIdSchema>;

const stateCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const workflowStateSelectSchema = createSelectSchema(workflowStates);

export const workflowStateInsertSchema = createInsertSchema(workflowStates, {
  workflowId: z.number().int().positive(),
  stateCode: stateCodeSchema,
  name: z.string().min(1).max(200),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
  sequenceNumber: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const workflowStateUpdateSchema = createUpdateSchema(workflowStates, {
  stateCode: stateCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
  sequenceNumber: z.number().int().positive().optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ workflowId: true });

export type WorkflowState = typeof workflowStates.$inferSelect;
export type NewWorkflowState = typeof workflowStates.$inferInsert;
