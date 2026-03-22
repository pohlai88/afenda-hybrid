import { z } from "zod/v4";

import {
  nullableOptional,
  dateStringSchema,
  dateOptionalSchema,
  dateNullableOptionalSchema,
  timestamptzStringSchema,
  timestamptzOptionalSchema,
  timestamptzNullableOptionalSchema,
  isoDateWireString,
} from "../../_shared/zodWire";

/**
 * Talent domain Zod building blocks (skills, appraisals, performance reviews, goals).
 * Numeric limits: **`talentBounds`** is the single source of truth — reuse in Zod and in Drizzle `check()`.
 */

export {
  nullableOptional,
  dateStringSchema,
  dateOptionalSchema,
  dateNullableOptionalSchema,
  timestamptzStringSchema,
  timestamptzOptionalSchema,
  timestamptzNullableOptionalSchema,
};

// Re-export proficiency from canonical location
export {
  proficiencyCodes,
  skillProficiencyEnum,
  skillProficiencyZodEnum,
  type SkillProficiencyCode,
} from "./_shared/proficiency";

// ---------------------------------------------------------------------------
// Numeric bounds (Zod + DB CHECK)
// ---------------------------------------------------------------------------

export const talentBounds = {
  /** Appraisal scores: `numeric(5,2)` with 0-100 range. */
  appraisalScore: { min: 0, max: 100, precision: 5, scale: 2 },
  /** Performance review ratings: 1-5 scale (smallint). */
  reviewRating: { min: 1, max: 5 },
  /** Performance review overall score: `numeric(3,2)` with 0-5 range. */
  reviewOverallScore: { min: 0, max: 5, precision: 3, scale: 2 },
  /** Goal/KRA weights: 0-100 percentage. */
  weight: { min: 0, max: 100 },
  /** Goal target values: reasonable upper bound for numeric targets. */
  goalTarget: { min: 0, max: 999_999_999 },
  /** Competency rating: 0-100 scale. */
  competencyRating: { min: 0, max: 100 },
  /** Years of experience for skills/certifications. */
  yearsExperience: { min: 0, max: 50 },
} as const;

// ---------------------------------------------------------------------------
// Proficiency levels (enum + Zod)
// ---------------------------------------------------------------------------

export const proficiencyLevels = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
  "MASTER",
] as const;
export const ProficiencyLevelSchema = z.enum(proficiencyLevels);
export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>;

// ---------------------------------------------------------------------------
// Rating scales
// ---------------------------------------------------------------------------

/** 0-100 rating scale (appraisals, competencies). */
export const RatingScaleSchema = z
  .number()
  .min(talentBounds.appraisalScore.min)
  .max(talentBounds.appraisalScore.max);

/** 1-5 rating scale (performance reviews). */
export const ReviewRatingSchema = z
  .number()
  .int()
  .min(talentBounds.reviewRating.min)
  .max(talentBounds.reviewRating.max);

/** 0-5 overall score (performance reviews, `numeric(3,2)`). */
export const ReviewOverallScoreSchema = z
  .number()
  .min(talentBounds.reviewOverallScore.min)
  .max(talentBounds.reviewOverallScore.max);

// ---------------------------------------------------------------------------
// Appraisal score validation (numeric(5,2) as string)
// ---------------------------------------------------------------------------

const CANONICAL_APPRAISAL_SCORE = /^(0|[1-9]\d{0,2})(\.\d{1,2})?$/;

/** Validates appraisal score string: 0-100 with max 2 decimal places. */
export function isValidAppraisalScore(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_APPRAISAL_SCORE.test(t)) return false;
  const n = Number.parseFloat(t);
  return (
    Number.isFinite(n) &&
    n >= talentBounds.appraisalScore.min &&
    n <= talentBounds.appraisalScore.max
  );
}

/** Appraisal score as decimal string (for `numeric(5,2)` columns). */
export const appraisalScoreStringSchema = z
  .string()
  .refine(
    isValidAppraisalScore,
    `must be valid score ${talentBounds.appraisalScore.min}-${talentBounds.appraisalScore.max} with max 2 decimals`
  );

export const appraisalScoreOptionalSchema = appraisalScoreStringSchema.optional().nullable();

// ---------------------------------------------------------------------------
// Self/Reviewer/Final score schemas (appraisals)
// ---------------------------------------------------------------------------

export const SelfScoreSchema = appraisalScoreOptionalSchema;
export const ReviewerScoreSchema = appraisalScoreOptionalSchema;
export const FinalScoreSchema = appraisalScoreOptionalSchema;

// ---------------------------------------------------------------------------
// Weight validation (0-100%)
// ---------------------------------------------------------------------------

export const WeightSchema = z.number().min(talentBounds.weight.min).max(talentBounds.weight.max);
export const WeightOptionalSchema = WeightSchema.optional().nullable();

// ---------------------------------------------------------------------------
// Goal target validation
// ---------------------------------------------------------------------------

export const GoalTargetSchema = z
  .number()
  .min(talentBounds.goalTarget.min)
  .max(talentBounds.goalTarget.max);
export const GoalTargetOptionalSchema = GoalTargetSchema.optional().nullable();

// ---------------------------------------------------------------------------
// Competency rating
// ---------------------------------------------------------------------------

export const CompetencyRatingSchema = z.object({
  competency: z.string().min(1).max(100),
  rating: RatingScaleSchema,
  comment: z.string().max(500).optional(),
});

export type CompetencyRating = z.infer<typeof CompetencyRatingSchema>;

// ---------------------------------------------------------------------------
// Text field schemas
// ---------------------------------------------------------------------------

export const strengthsSchema = z.string().max(4000);
export const areasForImprovementSchema = z.string().max(4000);
export const commentsSchema = z.string().max(4000);
export const goalDescriptionSchema = z.string().max(2000);
export const goalTitleSchema = z.string().min(1).max(200);

// ---------------------------------------------------------------------------
// Years of experience
// ---------------------------------------------------------------------------

export const yearsExperienceSchema = z
  .number()
  .int()
  .min(talentBounds.yearsExperience.min)
  .max(talentBounds.yearsExperience.max);
export const yearsExperienceOptionalSchema = yearsExperienceSchema.optional().nullable();

// ---------------------------------------------------------------------------
// Cross-field refinements
// ---------------------------------------------------------------------------

/** Normalize enum-like / unknown values for cross-field status checks (undefined if nullish). */
export function normEnumString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return String(v);
}

/**
 * **Appraisals:** when `status` is `COMPLETED`, `finalScore` must be set.
 * Zod-only — add a DB `CHECK` if this becomes a hard invariant.
 */
export function refineAppraisalCompletedRequiresFinalScore<
  T extends { status?: unknown; finalScore?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const st = normEnumString(data.status);
  if (st !== "COMPLETED") return;
  const fs = data.finalScore;
  if (fs === undefined || fs === null || fs === "") {
    ctx.addIssue({
      code: "custom",
      message: "finalScore is required when status is COMPLETED",
      path: ["finalScore"],
    });
  }
}

/**
 * **Performance Reviews:** when `status` is `COMPLETED` or `ACKNOWLEDGED`, `completedDate` must be set.
 * Matches `chk_performance_reviews_completed_date_vs_status`.
 */
export function refineReviewCompletedRequiresDate<
  T extends { status?: unknown; completedDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const st = normEnumString(data.status);
  if (st !== "COMPLETED" && st !== "ACKNOWLEDGED") return;
  const cd = data.completedDate;
  if (cd === undefined || cd === null || cd === "") {
    ctx.addIssue({
      code: "custom",
      message: "completedDate is required when status is COMPLETED or ACKNOWLEDGED",
      path: ["completedDate"],
    });
  }
}

/**
 * **Performance Reviews:** when `status` is `ACKNOWLEDGED`, `acknowledgedDate` must be set.
 * Matches `chk_performance_reviews_acknowledged_date_vs_status`.
 */
export function refineReviewAcknowledgedRequiresDate<
  T extends { status?: unknown; acknowledgedDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const st = normEnumString(data.status);
  if (st !== "ACKNOWLEDGED") return;
  const ad = data.acknowledgedDate;
  if (ad === undefined || ad === null || ad === "") {
    ctx.addIssue({
      code: "custom",
      message: "acknowledgedDate is required when status is ACKNOWLEDGED",
      path: ["acknowledgedDate"],
    });
  }
}

/**
 * **Performance Reviews:** `reviewPeriodEnd` must be on or after `reviewPeriodStart`.
 * Matches `chk_performance_reviews_period`.
 */
export function refineReviewPeriodEndOnOrAfterStart<
  T extends { reviewPeriodStart?: unknown; reviewPeriodEnd?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const s = isoDateWireString(data.reviewPeriodStart);
  const e = isoDateWireString(data.reviewPeriodEnd);
  if (s === null || e === null) return;
  if (e < s) {
    ctx.addIssue({
      code: "custom",
      message: "reviewPeriodEnd must be on or after reviewPeriodStart",
      path: ["reviewPeriodEnd"],
    });
  }
}

/**
 * **Goals:** when both `targetValue` and `actualValue` are set, validate they're non-negative.
 * Zod-only convenience for goal tracking.
 */
export function refineGoalValuesNonNegative<
  T extends { targetValue?: unknown; actualValue?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const tv = data.targetValue;
  const av = data.actualValue;
  if (typeof tv === "number" && tv < 0) {
    ctx.addIssue({
      code: "custom",
      message: "targetValue must be non-negative",
      path: ["targetValue"],
    });
  }
  if (typeof av === "number" && av < 0) {
    ctx.addIssue({
      code: "custom",
      message: "actualValue must be non-negative",
      path: ["actualValue"],
    });
  }
}

/**
 * **Appraisal Goals:** total weight of goals should sum to 100%.
 * Use this on arrays of goals, not individual rows.
 */
export function validateGoalWeightsSum(goals: Array<{ weight?: number | null }>): {
  valid: boolean;
  total: number;
} {
  const total = goals.reduce((sum, g) => sum + (g.weight ?? 0), 0);
  return { valid: Math.abs(total - 100) < 0.01, total };
}
