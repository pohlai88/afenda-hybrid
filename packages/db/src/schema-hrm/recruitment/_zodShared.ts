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
 * Recruitment domain Zod building blocks (candidates, requisitions, interviews, offers).
 * Numeric limits: **`recruitmentBounds`** is the single source of truth — reuse in Zod and in Drizzle `check()`.
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

// ---------------------------------------------------------------------------
// Numeric bounds (Zod + DB CHECK)
// ---------------------------------------------------------------------------

export const recruitmentBounds = {
  /** Interview rating: 0-10 scale with 2 decimal places (`numeric(4,2)`). */
  interviewRating: { min: 0, max: 10, precision: 4, scale: 2 },
  /** Salary amounts: `numeric(12,2)` for offers, `numeric(14,2)` for candidates. */
  salaryAmount: { maxOffer: 9_999_999_999.99, maxCandidate: 999_999_999_999.99 },
  /** Notice period in days (typical range). */
  noticePeriodDays: { min: 0, max: 365 },
  /** Headcount per requisition. */
  headcount: { min: 1, max: 100 },
  /** Years of experience requirements. */
  yearsExperience: { min: 0, max: 50 },
} as const;

// ---------------------------------------------------------------------------
// Salary validation
// ---------------------------------------------------------------------------

/** Matches `numeric(12,2)` string inputs (up to 10 integer digits + 2 decimals). */
const SALARY_OFFER_REGEX = /^\d{1,10}(\.\d{1,2})?$/;

/** Matches `numeric(14,2)` string inputs (up to 12 integer digits + 2 decimals). */
const SALARY_CANDIDATE_REGEX = /^\d{1,12}(\.\d{1,2})?$/;

export function isValidOfferSalary(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t)) return false;
  if (!SALARY_OFFER_REGEX.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n > 0 && n <= recruitmentBounds.salaryAmount.maxOffer;
}

export function isValidCandidateSalary(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t)) return false;
  if (!SALARY_CANDIDATE_REGEX.test(t)) return false;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n <= recruitmentBounds.salaryAmount.maxCandidate;
}

/** Offer salary: positive `numeric(12,2)` as string. */
export const offerSalaryStringSchema = z
  .string()
  .refine(isValidOfferSalary, "must be positive salary up to 10 digits with max 2 decimals");

/** Candidate expected salary: non-negative `numeric(14,2)` as string. */
export const candidateSalaryStringSchema = z
  .string()
  .refine(
    isValidCandidateSalary,
    "must be non-negative salary up to 12 digits with max 2 decimals"
  );

/** Salary range object with min/max and currency validation. */
export const SalaryRangeSchema = z
  .object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().length(3),
  })
  .refine((data) => data.max >= data.min, {
    message: "Max salary must be >= min salary",
    path: ["max"],
  });

export type SalaryRange = z.infer<typeof SalaryRangeSchema>;

// ---------------------------------------------------------------------------
// Interview rating validation
// ---------------------------------------------------------------------------

const CANONICAL_INTERVIEW_RATING = /^(0|[1-9]|10)(\.\d{1,2})?$/;

/** Validates interview rating string: 0-10 with max 2 decimal places. */
export function isValidInterviewRating(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return false;
  if (!CANONICAL_INTERVIEW_RATING.test(t)) return false;
  const n = Number.parseFloat(t);
  return (
    Number.isFinite(n) &&
    n >= recruitmentBounds.interviewRating.min &&
    n <= recruitmentBounds.interviewRating.max
  );
}

/** Interview rating as decimal string (for `numeric(4,2)` columns). */
export const interviewRatingStringSchema = z
  .string()
  .refine(
    isValidInterviewRating,
    `must be valid rating ${recruitmentBounds.interviewRating.min}-${recruitmentBounds.interviewRating.max} with max 2 decimals`
  );

/** Interview rating as number (0-10). */
export const InterviewRatingSchema = z
  .number()
  .min(recruitmentBounds.interviewRating.min)
  .max(recruitmentBounds.interviewRating.max);

export const interviewRatingOptionalSchema = interviewRatingStringSchema.optional().nullable();

// ---------------------------------------------------------------------------
// Interview recommendation
// ---------------------------------------------------------------------------

export const InterviewRecommendations = [
  "STRONG_HIRE",
  "HIRE",
  "NEUTRAL",
  "NO_HIRE",
  "STRONG_NO_HIRE",
] as const;

export const InterviewRecommendationSchema = z.enum(InterviewRecommendations);
export type InterviewRecommendation = z.infer<typeof InterviewRecommendationSchema>;

// ---------------------------------------------------------------------------
// Candidate score (composite interview assessment)
// ---------------------------------------------------------------------------

export const CandidateScoreSchema = z.object({
  technical: InterviewRatingSchema.optional(),
  cultural: InterviewRatingSchema.optional(),
  communication: InterviewRatingSchema.optional(),
  problemSolving: InterviewRatingSchema.optional(),
  leadership: InterviewRatingSchema.optional(),
  overall: InterviewRatingSchema.optional(),
});

export type CandidateScore = z.infer<typeof CandidateScoreSchema>;

// ---------------------------------------------------------------------------
// Salary expectation (candidate profile)
// ---------------------------------------------------------------------------

export const salaryFrequencies = [
  "HOURLY",
  "WEEKLY",
  "BIWEEKLY",
  "SEMI_MONTHLY",
  "MONTHLY",
  "ANNUAL",
] as const;
export const SalaryFrequencySchema = z.enum(salaryFrequencies);
export type SalaryFrequency = z.infer<typeof SalaryFrequencySchema>;

export const SalaryExpectationSchema = z.object({
  amount: z.number().min(0).max(recruitmentBounds.salaryAmount.maxCandidate),
  currency: z.string().length(3),
  frequency: SalaryFrequencySchema,
});

export type SalaryExpectation = z.infer<typeof SalaryExpectationSchema>;

// ---------------------------------------------------------------------------
// Notice period validation
// ---------------------------------------------------------------------------

export const noticePeriodDaysSchema = z
  .number()
  .int()
  .min(recruitmentBounds.noticePeriodDays.min)
  .max(recruitmentBounds.noticePeriodDays.max);

export const noticePeriodDaysOptionalSchema = noticePeriodDaysSchema.optional().nullable();

/** Common notice period presets in days. */
export const NOTICE_PERIOD_PRESETS = {
  IMMEDIATE: 0,
  ONE_WEEK: 7,
  TWO_WEEKS: 14,
  ONE_MONTH: 30,
  TWO_MONTHS: 60,
  THREE_MONTHS: 90,
} as const;

// ---------------------------------------------------------------------------
// Years of experience
// ---------------------------------------------------------------------------

export const yearsExperienceSchema = z
  .number()
  .int()
  .min(recruitmentBounds.yearsExperience.min)
  .max(recruitmentBounds.yearsExperience.max);

export const yearsExperienceOptionalSchema = yearsExperienceSchema.optional().nullable();

// ---------------------------------------------------------------------------
// Headcount validation
// ---------------------------------------------------------------------------

export const headcountSchema = z
  .number()
  .int()
  .min(recruitmentBounds.headcount.min)
  .max(recruitmentBounds.headcount.max);

// ---------------------------------------------------------------------------
// Text field schemas
// ---------------------------------------------------------------------------

export const jobDescriptionSchema = z.string().max(10000);
export const requirementsSchema = z.string().max(5000);
export const interviewStrengthsSchema = z.string().max(2000);
export const interviewConcernsSchema = z.string().max(2000);
export const offerBenefitsSchema = z.string().max(4000);
export const offerTermsSchema = z.string().max(10000);
export const declineReasonSchema = z.string().max(1000);

// ---------------------------------------------------------------------------
// Cross-field refinements
// ---------------------------------------------------------------------------

/** Normalize enum-like / unknown values for cross-field status checks (undefined if nullish). */
export function normEnumString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return String(v);
}

/**
 * **Offer Letters:** when `status` is `DECLINED`, `declineReason` and `respondedAt` are required.
 * Matches offer letter lifecycle rules.
 */
export function refineOfferDeclinedRequiresReason<
  T extends { status?: unknown; declineReason?: unknown; respondedAt?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const st = normEnumString(data.status);
  if (st !== "DECLINED") return;

  const dr = data.declineReason;
  if (dr === undefined || dr === null || (typeof dr === "string" && dr.trim() === "")) {
    ctx.addIssue({
      code: "custom",
      message: "declineReason is required when status is DECLINED",
      path: ["declineReason"],
    });
  }

  if (data.respondedAt === undefined || data.respondedAt === null) {
    ctx.addIssue({
      code: "custom",
      message: "respondedAt is required when status is DECLINED",
      path: ["respondedAt"],
    });
  }
}

/**
 * **Offer Letters:** when `status` is `APPROVED`, `approvedBy` and `approvedAt` are required.
 */
export function refineOfferApprovedRequiresApprover<
  T extends { status?: unknown; approvedBy?: unknown; approvedAt?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const st = normEnumString(data.status);
  if (st !== "APPROVED") return;

  if (data.approvedBy === undefined || data.approvedBy === null) {
    ctx.addIssue({
      code: "custom",
      message: "approvedBy is required when status is APPROVED",
      path: ["approvedBy"],
    });
  }
  if (data.approvedAt === undefined || data.approvedAt === null) {
    ctx.addIssue({
      code: "custom",
      message: "approvedAt is required when status is APPROVED",
      path: ["approvedAt"],
    });
  }
}

/**
 * **Offer Letters:** `expiryDate` must be on or after `startDate`.
 * Matches `chk_offer_letters_expiry`.
 */
export function refineOfferExpiryOnOrAfterStart<
  T extends { startDate?: unknown; expiryDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const s = isoDateWireString(data.startDate);
  const e = isoDateWireString(data.expiryDate);
  if (s === null || e === null) return;
  if (e < s) {
    ctx.addIssue({
      code: "custom",
      message: "expiryDate must be on or after startDate",
      path: ["expiryDate"],
    });
  }
}

/**
 * **Job Requisitions:** when both `minSalary` and `maxSalary` are set, `minSalary <= maxSalary`.
 * Matches `chk_job_requisitions_salary_range`.
 */
export function refineRequisitionSalaryRange<
  T extends { minSalary?: unknown; maxSalary?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const minRaw = data.minSalary;
  const maxRaw = data.maxSalary;
  const minStr = typeof minRaw === "string" && minRaw !== "" ? minRaw : null;
  const maxStr = typeof maxRaw === "string" && maxRaw !== "" ? maxRaw : null;
  if (minStr === null || maxStr === null) return;

  const minVal = parseFloat(minStr);
  const maxVal = parseFloat(maxStr);
  if (Number.isFinite(minVal) && Number.isFinite(maxVal) && minVal > maxVal) {
    ctx.addIssue({
      code: "custom",
      message: "maxSalary must be greater than or equal to minSalary",
      path: ["maxSalary"],
    });
  }
}

/**
 * **Candidates:** when `expectedSalaryAmount` is set, `expectedSalaryCurrencyId` and `expectedSalaryPeriod` are required.
 */
export function refineCandidateSalaryBundle<
  T extends {
    expectedSalaryAmount?: unknown;
    expectedSalaryCurrencyId?: unknown;
    expectedSalaryPeriod?: unknown;
  },
>(data: T, ctx: z.RefinementCtx): void {
  const amount = data.expectedSalaryAmount;
  if (amount === undefined || amount === null || amount === "") return;

  if (data.expectedSalaryCurrencyId === undefined || data.expectedSalaryCurrencyId === null) {
    ctx.addIssue({
      code: "custom",
      message: "expectedSalaryCurrencyId is required when expectedSalaryAmount is set",
      path: ["expectedSalaryCurrencyId"],
    });
  }
  if (data.expectedSalaryPeriod === undefined || data.expectedSalaryPeriod === null) {
    ctx.addIssue({
      code: "custom",
      message: "expectedSalaryPeriod is required when expectedSalaryAmount is set",
      path: ["expectedSalaryPeriod"],
    });
  }
}

/**
 * **Candidates:** when `status` is `HIRED`, both `personId` and `convertedEmployeeId` are required.
 * Matches `chk_candidates_hired_requires_hr_bridge`.
 */
export function refineCandidateHiredRequiresHrBridge<
  T extends {
    status?: unknown;
    personId?: unknown;
    convertedEmployeeId?: unknown;
  },
>(data: T, ctx: z.RefinementCtx): void {
  const st = normEnumString(data.status);
  if (st !== "HIRED") return;

  const pid = data.personId;
  const eid = data.convertedEmployeeId;

  if (pid === undefined || pid === null || (typeof pid === "number" && pid <= 0)) {
    ctx.addIssue({
      code: "custom",
      message: "personId is required when status is HIRED",
      path: ["personId"],
    });
  }
  if (eid === undefined || eid === null || (typeof eid === "number" && eid <= 0)) {
    ctx.addIssue({
      code: "custom",
      message: "convertedEmployeeId is required when status is HIRED",
      path: ["convertedEmployeeId"],
    });
  }
}

/**
 * Calculate average interview score from a candidate score object.
 */
export function calculateAverageInterviewScore(score: CandidateScore): number | null {
  const values = [
    score.technical,
    score.cultural,
    score.communication,
    score.problemSolving,
    score.leadership,
    score.overall,
  ].filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
