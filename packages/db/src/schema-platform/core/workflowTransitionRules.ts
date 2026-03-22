import { integer, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns } from "../../_shared";
import { workflowTransitions } from "./workflowTransitions";

/**
 * Workflow Transition Rules - Conditional rules for workflow transitions.
 * Defines field-based conditions that must be met for a transition to be allowed.
 */
export const workflowRuleOperators = [
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "LESS_THAN",
  "CONTAINS",
  "IN",
] as const;

export const workflowRuleOperatorEnum = coreSchema.enum("workflow_rule_operator", [
  ...workflowRuleOperators,
]);

export const WorkflowRuleOperatorSchema = z.enum(workflowRuleOperators);
export type WorkflowRuleOperator = z.infer<typeof WorkflowRuleOperatorSchema>;

/**
 * workflow_transition_rules — conditions on a transition (field, operator, value).
 */
export const workflowTransitionRules = coreSchema.table(
  "workflow_transition_rules",
  {
    ruleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    transitionId: integer().notNull(),
    field: text().notNull(),
    operator: workflowRuleOperatorEnum().notNull(),
    value: text().notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_workflow_transition_rules_transition").on(t.transitionId),
    foreignKey({
      columns: [t.transitionId],
      foreignColumns: [workflowTransitions.transitionId],
      name: "fk_workflow_transition_rules_transition",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const WorkflowTransitionRuleIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"WorkflowTransitionRuleId">();
export type WorkflowTransitionRuleId = z.infer<typeof WorkflowTransitionRuleIdSchema>;

export const workflowTransitionRuleSelectSchema = createSelectSchema(workflowTransitionRules);

export const workflowTransitionRuleInsertSchema = createInsertSchema(workflowTransitionRules, {
  transitionId: z.number().int().positive(),
  field: z.string().min(1).max(100),
  operator: WorkflowRuleOperatorSchema,
  value: z.string().max(1000),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const workflowTransitionRuleUpdateSchema = createUpdateSchema(workflowTransitionRules, {
  field: z.string().min(1).max(100).optional(),
  operator: WorkflowRuleOperatorSchema.optional(),
  value: z.string().max(1000).optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ transitionId: true });

export type WorkflowTransitionRule = typeof workflowTransitionRules.$inferSelect;
export type NewWorkflowTransitionRule = typeof workflowTransitionRules.$inferInsert;
