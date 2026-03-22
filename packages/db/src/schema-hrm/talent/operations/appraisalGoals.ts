import { integer, text, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { appraisals } from "./appraisals";
import { appraisalKras } from "./appraisalKras";

/**
 * Appraisal Goals - Individual goals within an employee's appraisal.
 * Can be linked to KRA master data or be custom goals.
 */

const CANONICAL_WEIGHT = /^(0|[1-9]\d{0,2})(\.\d{1,2})?$/;
const CANONICAL_SCORE = /^(0|[1-9]\d{0,2})(\.\d{1,2})?$/;

function isValidWeight(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_WEIGHT.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

function isValidScore(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_SCORE.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

export const appraisalGoals = talentSchema.table(
  "appraisal_goals",
  {
    goalId: integer().primaryKey().generatedAlwaysAsIdentity(),
    appraisalId: integer().notNull(),
    kraId: integer(),
    description: text().notNull(),
    weight: numeric({ precision: 5, scale: 2 }).notNull(),
    selfScore: numeric({ precision: 5, scale: 2 }),
    reviewerScore: numeric({ precision: 5, scale: 2 }),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_appraisal_goals_appraisal").on(t.appraisalId),
    index("idx_appraisal_goals_kra").on(t.kraId),
    foreignKey({
      columns: [t.appraisalId],
      foreignColumns: [appraisals.appraisalId],
      name: "fk_appraisal_goals_appraisal",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.kraId],
      foreignColumns: [appraisalKras.kraId],
      name: "fk_appraisal_goals_kra",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_appraisal_goals_weight", sql`${t.weight} >= 0 AND ${t.weight} <= 100`),
    check(
      "chk_appraisal_goals_self_score",
      sql`${t.selfScore} IS NULL OR (${t.selfScore} >= 0 AND ${t.selfScore} <= 100)`
    ),
    check(
      "chk_appraisal_goals_reviewer_score",
      sql`${t.reviewerScore} IS NULL OR (${t.reviewerScore} >= 0 AND ${t.reviewerScore} <= 100)`
    ),
  ]
);

export const AppraisalGoalIdSchema = z.number().int().positive().brand<"AppraisalGoalId">();
export type AppraisalGoalId = z.infer<typeof AppraisalGoalIdSchema>;

export const appraisalGoalSelectSchema = createSelectSchema(appraisalGoals);

export const appraisalGoalInsertSchema = createInsertSchema(appraisalGoals, {
  appraisalId: z.number().int().positive(),
  kraId: z.number().int().positive().optional().nullable(),
  description: z.string().min(10).max(2000),
  weight: z.string().refine(isValidWeight, "must be valid percentage 0-100 with max 2 decimals"),
  selfScore: z
    .string()
    .refine(isValidScore, "must be valid score 0-100 with max 2 decimals")
    .optional()
    .nullable(),
  reviewerScore: z
    .string()
    .refine(isValidScore, "must be valid score 0-100 with max 2 decimals")
    .optional()
    .nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const appraisalGoalUpdateSchema = createUpdateSchema(appraisalGoals, {
  description: z.string().min(10).max(2000).optional(),
  weight: z
    .string()
    .refine(isValidWeight, "must be valid percentage 0-100 with max 2 decimals")
    .optional(),
  selfScore: z
    .string()
    .refine(isValidScore, "must be valid score 0-100 with max 2 decimals")
    .optional()
    .nullable(),
  reviewerScore: z
    .string()
    .refine(isValidScore, "must be valid score 0-100 with max 2 decimals")
    .optional()
    .nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ appraisalId: true, kraId: true });

export type AppraisalGoal = typeof appraisalGoals.$inferSelect;
export type NewAppraisalGoal = typeof appraisalGoals.$inferInsert;
