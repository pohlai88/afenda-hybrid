import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "./tenants";

/**
 * Workflow Definitions - Reusable workflow templates for approval processes.
 * Defines workflow structure for various business processes (leave, expenses, requisitions).
 */
export const workflowDefinitionStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const workflowDefinitionStatusEnum = coreSchema.enum("workflow_definition_status", [
  ...workflowDefinitionStatuses,
]);

export const WorkflowDefinitionStatusSchema = z.enum(workflowDefinitionStatuses);
export type WorkflowDefinitionStatus = z.infer<typeof WorkflowDefinitionStatusSchema>;

/**
 * workflow_definitions — reusable workflow templates targeting a schema/table; versioning via status.
 */
export const workflowDefinitions = coreSchema.table(
  "workflow_definitions",
  {
    workflowId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    workflowCode: text().notNull(),
    ...nameColumn,
    description: text(),
    targetSchema: text().notNull(),
    targetTable: text().notNull(),
    // status: workflow_definition_status — DRAFT (default), ACTIVE, ARCHIVED
    status: workflowDefinitionStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_workflow_definitions_tenant").on(t.tenantId),
    index("idx_workflow_definitions_target").on(t.tenantId, t.targetSchema, t.targetTable),
    index("idx_workflow_definitions_status").on(t.tenantId, t.status),
    uniqueIndex("uq_workflow_definitions_code")
      .on(t.tenantId, sql`lower(${t.workflowCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_workflow_definitions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const WorkflowDefinitionIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"WorkflowDefinitionId">();
export type WorkflowDefinitionId = z.infer<typeof WorkflowDefinitionIdSchema>;

const workflowCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const workflowDefinitionSelectSchema = createSelectSchema(workflowDefinitions);

export const workflowDefinitionInsertSchema = createInsertSchema(workflowDefinitions, {
  tenantId: z.number().int().positive(),
  workflowCode: workflowCodeSchema,
  name: z.string().min(1).max(200),
  targetSchema: z.string().min(1).max(100),
  targetTable: z.string().min(1).max(100),
  status: WorkflowDefinitionStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const workflowDefinitionUpdateSchema = createUpdateSchema(workflowDefinitions, {
  workflowCode: workflowCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  targetSchema: z.string().min(1).max(100).optional(),
  targetTable: z.string().min(1).max(100).optional(),
  status: WorkflowDefinitionStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type NewWorkflowDefinition = typeof workflowDefinitions.$inferInsert;
