import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Gratuity Rules - Statutory gratuity calculation rules per country/region.
 * Defines how end-of-service gratuity is computed based on years of service.
 */
export const gratuityRuleStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const gratuityRuleStatusEnum = payrollSchema.enum("gratuity_rule_status", [
  ...gratuityRuleStatuses,
]);

export const GratuityRuleStatusSchema = z.enum(gratuityRuleStatuses);
export type GratuityRuleStatus = z.infer<typeof GratuityRuleStatusSchema>;

export const gratuityRules = payrollSchema.table(
  "gratuity_rules",
  {
    ruleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    ruleCode: text().notNull(),
    ...nameColumn,
    country: text().notNull(),
    description: text(),
    status: gratuityRuleStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_gratuity_rules_tenant").on(t.tenantId),
    index("idx_gratuity_rules_country").on(t.tenantId, t.country),
    index("idx_gratuity_rules_status").on(t.tenantId, t.status),
    uniqueIndex("uq_gratuity_rules_code")
      .on(t.tenantId, sql`lower(${t.ruleCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_gratuity_rules_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const GratuityRuleIdSchema = z.number().int().positive().brand<"GratuityRuleId">();
export type GratuityRuleId = z.infer<typeof GratuityRuleIdSchema>;

const ruleCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const gratuityRuleSelectSchema = createSelectSchema(gratuityRules);

export const gratuityRuleInsertSchema = createInsertSchema(gratuityRules, {
  tenantId: z.number().int().positive(),
  ruleCode: ruleCodeSchema,
  name: z.string().min(1).max(200),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 code"),
  status: GratuityRuleStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const gratuityRuleUpdateSchema = createUpdateSchema(gratuityRules, {
  ruleCode: ruleCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .optional(),
  status: GratuityRuleStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true });

export type GratuityRule = typeof gratuityRules.$inferSelect;
export type NewGratuityRule = typeof gratuityRules.$inferInsert;
