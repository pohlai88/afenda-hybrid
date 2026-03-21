import { integer, text, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { appraisalTemplates } from "./appraisalTemplates";

/**
 * Appraisal Template Goals - Predefined goals within appraisal templates.
 * Each goal has a weight (percentage) and sequence for display order.
 */

const CANONICAL_WEIGHT = /^(0|[1-9]\d{0,2})(\.\d{1,2})?$/;

function isValidWeight(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_WEIGHT.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

export const appraisalTemplateGoals = talentSchema.table(
  "appraisal_template_goals",
  {
    goalId: integer().primaryKey().generatedAlwaysAsIdentity(),
    templateId: integer().notNull(),
    description: text().notNull(),
    weight: numeric({ precision: 5, scale: 2 }).notNull(),
    sequenceNumber: integer().notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_appraisal_template_goals_template").on(t.templateId),
    foreignKey({
      columns: [t.templateId],
      foreignColumns: [appraisalTemplates.templateId],
      name: "fk_appraisal_template_goals_template",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_appraisal_template_goals_weight",
      sql`${t.weight} >= 0 AND ${t.weight} <= 100`
    ),
    check(
      "chk_appraisal_template_goals_sequence",
      sql`${t.sequenceNumber} > 0`
    ),
  ]
);

export const AppraisalTemplateGoalIdSchema = z.number().int().positive().brand<"AppraisalTemplateGoalId">();
export type AppraisalTemplateGoalId = z.infer<typeof AppraisalTemplateGoalIdSchema>;

export const appraisalTemplateGoalSelectSchema = createSelectSchema(appraisalTemplateGoals);

export const appraisalTemplateGoalInsertSchema = createInsertSchema(appraisalTemplateGoals, {
  templateId: z.number().int().positive(),
  description: z.string().min(10).max(2000),
  weight: z.string().refine(isValidWeight, "must be valid percentage 0-100 with max 2 decimals"),
  sequenceNumber: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const appraisalTemplateGoalUpdateSchema = createUpdateSchema(appraisalTemplateGoals, {
  description: z.string().min(10).max(2000).optional(),
  weight: z.string().refine(isValidWeight, "must be valid percentage 0-100 with max 2 decimals").optional(),
  sequenceNumber: z.number().int().positive().optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ templateId: true });

export type AppraisalTemplateGoal = typeof appraisalTemplateGoals.$inferSelect;
export type NewAppraisalTemplateGoal = typeof appraisalTemplateGoals.$inferInsert;
