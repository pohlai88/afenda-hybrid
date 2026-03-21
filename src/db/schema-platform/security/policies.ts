import { sql } from "drizzle-orm";
import { boolean, foreignKey, index, integer, jsonb, smallint, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { tenants } from "../core/tenants";
import { securitySchema } from "./users";

/**
 * Policy Rule - A single condition in a policy.
 * 
 * Supports template variables like ${user.id}, ${user.departmentId}, ${resource.ownerId}
 * that are resolved at runtime.
 */
export interface PolicyRule {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains" | "startsWith" | "endsWith";
  value: unknown;
  logic?: "and" | "or";
}

export const PolicyRuleSchema = z.object({
  field: z.string().min(1).max(100),
  operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains", "startsWith", "endsWith"]),
  value: z.unknown(),
  logic: z.enum(["and", "or"]).optional(),
});

export type PolicyRuleType = z.infer<typeof PolicyRuleSchema>;

/**
 * Authorization Policies - Dynamic PBAC rules with conditions and priority.
 * 
 * Policies enable fine-grained access control beyond static role-based permissions:
 * - Department managers can only approve leave for their department
 * - Employees can only view their own payslips
 * - Company-wide deny policies override department-level allows (priority-based)
 * 
 * Evaluation order:
 * 1. Policies are sorted by priority (higher = evaluated first)
 * 2. First matching policy determines the outcome
 * 3. If no policy matches, deny by default
 * 
 * Template variables in conditions:
 * - ${user.id} - Current user's ID
 * - ${user.departmentId} - Current user's department
 * - ${user.roles} - Array of user's role codes
 * - ${resource.ownerId} - Owner of the resource being accessed
 * - ${resource.departmentId} - Department of the resource
 */
export const policies = securitySchema.table(
  "policies",
  {
    policyId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    policyCode: text().notNull(),
    name: text().notNull(),
    description: text(),
    resource: text().notNull(),
    actions: text().array().notNull(),
    roles: text().array(),
    effect: text().$type<"allow" | "deny">().notNull().default("allow"),
    conditions: jsonb().$type<PolicyRule[]>().notNull().default([]),
    priority: smallint().notNull().default(0),
    enabled: boolean().notNull().default(true),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_policies_tenant").on(t.tenantId),
    index("idx_policies_resource").on(t.tenantId, t.resource),
    index("idx_policies_enabled").on(t.tenantId, t.enabled),
    index("idx_policies_priority").on(t.tenantId, t.priority),
    uniqueIndex("uq_policies_code")
      .on(t.tenantId, sql`lower(${t.policyCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_policies_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const PolicyIdSchema = z.number().int().positive().brand<"PolicyId">();
export type PolicyId = z.infer<typeof PolicyIdSchema>;

export const PolicyCodeSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed");

export const PolicyEffectSchema = z.enum(["allow", "deny"]);
export type PolicyEffect = z.infer<typeof PolicyEffectSchema>;

export const policySelectSchema = createSelectSchema(policies);

export const policyInsertSchema = createInsertSchema(policies, {
  tenantId: z.number().int().positive(),
  policyCode: PolicyCodeSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  resource: z.string().min(1).max(100),
  actions: z.array(z.string().min(1).max(50)).min(1),
  roles: z.array(z.string().min(1).max(50)).optional(),
  effect: PolicyEffectSchema.optional(),
  conditions: z.array(PolicyRuleSchema).optional(),
  priority: z.number().int().min(-32768).max(32767).optional(),
  enabled: z.boolean().optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const policyUpdateSchema = createUpdateSchema(policies, {
  policyCode: PolicyCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  resource: z.string().min(1).max(100).optional(),
  actions: z.array(z.string().min(1).max(50)).min(1).optional(),
  roles: z.array(z.string().min(1).max(50)).optional().nullable(),
  effect: PolicyEffectSchema.optional(),
  conditions: z.array(PolicyRuleSchema).optional(),
  priority: z.number().int().min(-32768).max(32767).optional(),
  enabled: z.boolean().optional(),
});

export type Policy = typeof policies.$inferSelect;
export type NewPolicy = typeof policies.$inferInsert;
