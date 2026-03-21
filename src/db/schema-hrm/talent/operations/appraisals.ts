import { integer, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";
import { appraisalCycles } from "./appraisalCycles";
import { appraisalTemplates } from "./appraisalTemplates";

/**
 * Appraisals - Individual employee performance appraisals.
 * Links employee to appraisal cycle and template, tracks self and reviewer scores.
 */
export const appraisalStatuses = ["DRAFT", "SELF_REVIEW", "MANAGER_REVIEW", "CALIBRATION", "COMPLETED"] as const;

export const appraisalStatusEnum = talentSchema.enum("appraisal_status", [...appraisalStatuses]);

export const AppraisalStatusSchema = z.enum(appraisalStatuses);
export type AppraisalStatus = z.infer<typeof AppraisalStatusSchema>;

const CANONICAL_SCORE = /^(0|[1-9]\d{0,2})(\.\d{1,2})?$/;

function isValidScore(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_SCORE.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

export const appraisals = talentSchema.table(
  "appraisals",
  {
    appraisalId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    cycleId: integer().notNull(),
    templateId: integer().notNull(),
    employeeId: integer().notNull(),
    reviewerId: integer(),
    selfScore: numeric({ precision: 5, scale: 2 }),
    reviewerScore: numeric({ precision: 5, scale: 2 }),
    finalScore: numeric({ precision: 5, scale: 2 }),
    status: appraisalStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_appraisals_tenant").on(t.tenantId),
    index("idx_appraisals_cycle").on(t.tenantId, t.cycleId),
    index("idx_appraisals_employee").on(t.tenantId, t.employeeId),
    index("idx_appraisals_reviewer").on(t.tenantId, t.reviewerId),
    index("idx_appraisals_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_appraisals_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.cycleId],
      foreignColumns: [appraisalCycles.cycleId],
      name: "fk_appraisals_cycle",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.templateId],
      foreignColumns: [appraisalTemplates.templateId],
      name: "fk_appraisals_template",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_appraisals_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.reviewerId],
      foreignColumns: [employees.employeeId],
      name: "fk_appraisals_reviewer",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_appraisals_self_score",
      sql`${t.selfScore} IS NULL OR (${t.selfScore} >= 0 AND ${t.selfScore} <= 100)`
    ),
    check(
      "chk_appraisals_reviewer_score",
      sql`${t.reviewerScore} IS NULL OR (${t.reviewerScore} >= 0 AND ${t.reviewerScore} <= 100)`
    ),
    check(
      "chk_appraisals_final_score",
      sql`${t.finalScore} IS NULL OR (${t.finalScore} >= 0 AND ${t.finalScore} <= 100)`
    ),
  ]
);

export const AppraisalIdSchema = z.number().int().positive().brand<"AppraisalId">();
export type AppraisalId = z.infer<typeof AppraisalIdSchema>;

export const appraisalSelectSchema = createSelectSchema(appraisals);

export const appraisalInsertSchema = createInsertSchema(appraisals, {
  tenantId: z.number().int().positive(),
  cycleId: z.number().int().positive(),
  templateId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  reviewerId: z.number().int().positive().optional().nullable(),
  selfScore: z.string().refine(isValidScore, "must be valid score 0-100 with max 2 decimals").optional().nullable(),
  reviewerScore: z.string().refine(isValidScore, "must be valid score 0-100 with max 2 decimals").optional().nullable(),
  finalScore: z.string().refine(isValidScore, "must be valid score 0-100 with max 2 decimals").optional().nullable(),
  status: AppraisalStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const appraisalUpdateSchema = createUpdateSchema(appraisals, {
  reviewerId: z.number().int().positive().optional().nullable(),
  selfScore: z.string().refine(isValidScore, "must be valid score 0-100 with max 2 decimals").optional().nullable(),
  reviewerScore: z.string().refine(isValidScore, "must be valid score 0-100 with max 2 decimals").optional().nullable(),
  finalScore: z.string().refine(isValidScore, "must be valid score 0-100 with max 2 decimals").optional().nullable(),
  status: AppraisalStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true, cycleId: true, templateId: true, employeeId: true });

export type Appraisal = typeof appraisals.$inferSelect;
export type NewAppraisal = typeof appraisals.$inferInsert;
