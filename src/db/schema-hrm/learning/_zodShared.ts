import { z } from "zod/v4";

import {
  nullableOptional,
  dateStringSchema,
  dateOptionalSchema,
  dateNullableOptionalSchema,
  dateCoerceSchema,
  isParseableTimestamptzString,
  timestamptzStringSchema,
  timestamptzOptionalSchema,
  timestamptzNullableOptionalSchema,
  isoDateWireString,
} from "../../_shared/zodWire";

/**
 * Learning domain Zod building blocks (catalog, fundamentals, operations).
 * Numeric limits: **`learningBounds`** is the single source of truth — reuse in Zod and in Drizzle `check()`.
 */

export {
  nullableOptional,
  dateStringSchema,
  dateOptionalSchema,
  dateNullableOptionalSchema,
  dateCoerceSchema,
  isParseableTimestamptzString,
  timestamptzStringSchema,
  timestamptzOptionalSchema,
  timestamptzNullableOptionalSchema,
};

// ---------------------------------------------------------------------------
// Numeric bounds (Zod + DB CHECK)
// ---------------------------------------------------------------------------

export const learningBounds = {
  courseDurationHours: { min: 1, max: 1000 },
  courseMaxParticipants: { min: 1, max: 1000 },
  moduleDurationMinutes: { min: 1, max: 600 },
  orderedSequence: { min: 1, max: 100 },
  /** `courses.cost` / `numeric(10,2)` upper bound (matches Zod cost string). */
  courseCostMax: 99_999_999.99,
} as const;

/** @deprecated Use `learningBounds.courseDurationHours.min` */
export const LEARNING_COURSE_DURATION_HOURS_MIN = learningBounds.courseDurationHours.min;
/** @deprecated Use `learningBounds.courseDurationHours.max` */
export const LEARNING_COURSE_DURATION_HOURS_MAX = learningBounds.courseDurationHours.max;
/** @deprecated Use `learningBounds.courseMaxParticipants.min` */
export const LEARNING_COURSE_MAX_PARTICIPANTS_MIN = learningBounds.courseMaxParticipants.min;
/** @deprecated Use `learningBounds.courseMaxParticipants.max` */
export const LEARNING_COURSE_MAX_PARTICIPANTS_MAX = learningBounds.courseMaxParticipants.max;
/** @deprecated Use `learningBounds.courseCostMax` */
export const LEARNING_COURSE_COST_MAX = learningBounds.courseCostMax;
/** @deprecated Use `learningBounds.moduleDurationMinutes.min` */
export const LEARNING_MODULE_DURATION_MIN = learningBounds.moduleDurationMinutes.min;
/** @deprecated Use `learningBounds.moduleDurationMinutes.max` */
export const LEARNING_MODULE_DURATION_MAX = learningBounds.moduleDurationMinutes.max;
/** @deprecated Use `learningBounds.orderedSequence.min` */
export const LEARNING_ORDERED_SEQUENCE_MIN = learningBounds.orderedSequence.min;
/** @deprecated Use `learningBounds.orderedSequence.max` */
export const LEARNING_ORDERED_SEQUENCE_MAX = learningBounds.orderedSequence.max;
/** @deprecated Use `learningBounds.courseCostMax` */
export const LEARNING_TRAINING_COST_AMOUNT_MAX = learningBounds.courseCostMax;

/** @deprecated Use `nullableOptional` */
export const learningNullableOptional = nullableOptional;

/** Insert/update: field may be omitted (symmetric with `nullableOptional`). */
export function learningOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema.optional();
}

// ---------------------------------------------------------------------------
// Catalog codes (`lower(code)` uniqueness for courses + modules)
// ---------------------------------------------------------------------------

export const catalogCodeInputSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
      .transform((s) => s.toLowerCase())
  );

/** @deprecated Use `catalogCodeInputSchema` */
export const learningCatalogCodeInputSchema = catalogCodeInputSchema;

// ---------------------------------------------------------------------------
// Names & text
// ---------------------------------------------------------------------------

export const nameSchema = z.string().min(1).max(200);

/** `courses.description` */
export const courseDescriptionSchema = z.string().max(4000);

/** `course_modules.description`, `courses.prerequisites` / `objectives`, etc. */
export const longTextSchema = z.string().max(2000);

export const contentUrlSchema = z.string().url().max(500);

/** @deprecated Use `nameSchema` / `courseDescriptionSchema` / `longTextSchema` / `contentUrlSchema` */
export const learningNameSchema = nameSchema;
export const learningCourseDescriptionSchema = courseDescriptionSchema;
export const learningLongTextSchema = longTextSchema;
export const learningContentUrlSchema = contentUrlSchema;

/** @deprecated Use `dateStringSchema` */
export const learningDateStringSchema = dateStringSchema;
/** @deprecated Use `dateOptionalSchema` */
export const learningDateOptionalSchema = dateOptionalSchema;
/** @deprecated Use `dateNullableOptionalSchema` */
export const learningDateNullableOptionalSchema = dateNullableOptionalSchema;

/** @deprecated Use `timestamptzStringSchema` */
export const learningTimestamptzStringSchema = timestamptzStringSchema;
/** @deprecated Use `timestamptzOptionalSchema` */
export const learningTimestamptzOptionalSchema = timestamptzOptionalSchema;
/** @deprecated Use `timestamptzNullableOptionalSchema` */
export const learningTimestamptzNullableOptionalSchema = timestamptzNullableOptionalSchema;

// ---------------------------------------------------------------------------
// Course catalog: duration, capacity, cost (`numeric(10,2)` as decimal string)
// ---------------------------------------------------------------------------

export const courseDurationHoursSchema = z
  .number()
  .int()
  .min(learningBounds.courseDurationHours.min)
  .max(learningBounds.courseDurationHours.max);

export const courseMaxParticipantsSchema = z
  .number()
  .int()
  .min(learningBounds.courseMaxParticipants.min)
  .max(learningBounds.courseMaxParticipants.max);

export function isValidCourseCostString(val: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 && n <= learningBounds.courseCostMax;
}

export const courseCostStringSchema = z.string().refine(isValidCourseCostString, {
  message: `cost must be a non-negative decimal up to ${learningBounds.courseCostMax} with at most 2 decimal places`,
});

/** After validation with `courseCostStringSchema` / `isValidCourseCostString`. */
export function parseValidatedCourseCost(val: string): number {
  return Number(val);
}

/** @deprecated Use `courseDurationHoursSchema` */
export const learningCourseDurationHoursSchema = courseDurationHoursSchema;
/** @deprecated Use `courseMaxParticipantsSchema` */
export const learningCourseMaxParticipantsSchema = courseMaxParticipantsSchema;
/** @deprecated Use `isValidCourseCostString` */
export const isValidLearningCourseCostString = isValidCourseCostString;
/** @deprecated Use `courseCostStringSchema` */
export const learningCourseCostStringSchema = courseCostStringSchema;

// ---------------------------------------------------------------------------
// Module: minutes (`chk_course_modules_duration`)
// ---------------------------------------------------------------------------

export const moduleDurationMinutesSchema = z
  .number()
  .int()
  .min(learningBounds.moduleDurationMinutes.min)
  .max(learningBounds.moduleDurationMinutes.max);

/** @deprecated Use `moduleDurationMinutesSchema` */
export const learningModuleDurationMinutesSchema = moduleDurationMinutesSchema;

// ---------------------------------------------------------------------------
// Ordered children: module within course, course within path (`sequenceNumber`)
// ---------------------------------------------------------------------------

export const orderedSequenceNumberSchema = z
  .number()
  .int()
  .min(learningBounds.orderedSequence.min)
  .max(learningBounds.orderedSequence.max);

/** @deprecated Use `orderedSequenceNumberSchema` */
export const learningOrderedSequenceNumberSchema = orderedSequenceNumberSchema;

// ---------------------------------------------------------------------------
// Common field shapes (operations + fundamentals)
// ---------------------------------------------------------------------------

export const complianceCodeSchema = z.string().max(100);

export const shortLabel500Schema = z.string().max(500);

export const trainerPhoneSchema = z.string().max(30);

export const trainerSpecializationsSchema = z.string().max(1000);

export const certificateNumberSchema = z.string().max(100);

export const invoiceNumberSchema = z.string().max(100);

export const vendorNameSchema = z.string().max(200);

/** `training_cost_records.description` (required on insert). */
export const trainingCostDescriptionSchema = z.string().min(1).max(500);

/** Email columns (trainers, etc.). */
export const emailSchema = z.email();

export const emailOptionalSchema = emailSchema.optional();

/** `learning_paths.estimatedHours` — Zod upper bound; DB only checks `> 0` when set. */
export const pathEstimatedHoursSchema = z
  .number()
  .int()
  .min(1)
  .max(learningBounds.courseDurationHours.max);

export const percent0to100Schema = z.number().int().min(0).max(100);

export const assessmentPointsSchema = z.number().int().min(1).max(1000);

/** `assessments.maxScore` — same bounds as `assessmentPointsSchema`. */
export const assessmentMaxScoreSchema = assessmentPointsSchema;

/** `assessments.passingScore` — same bounds; use with `refineAssessmentPassingVsMaxScore` when both are set. */
export const assessmentPassingScoreSchema = assessmentPointsSchema;

/** `assessments.actualScore` (0…maxScore, max ≤ 1000 in Zod). */
export const assessmentActualScoreSchema = z.number().int().min(0).max(1000);

export const assessmentActualScoreOptionalSchema = assessmentActualScoreSchema.optional();

/** `assessments.attempts` when set (DB `chk_assessments_attempts`: ≥ 1). */
export const assessmentAttemptsBaseSchema = z.number().int().min(1).max(10);

export const assessmentAttemptsSchema = assessmentAttemptsBaseSchema.optional();

export const trainingRating1to5Schema = z.number().int().min(1).max(5);

export const trainingRating1to5OptionalSchema = trainingRating1to5Schema.optional();

/** Non-negative integers (e.g. `training_sessions.enrolledCount`). */
export const nonNegativeIntSchema = z.number().int().min(0);

/** @deprecated Use shorter `*Schema` names above */
export const learningComplianceCodeSchema = complianceCodeSchema;
export const learningShortLabel500Schema = shortLabel500Schema;
export const learningTrainerPhoneSchema = trainerPhoneSchema;
export const learningTrainerSpecializationsSchema = trainerSpecializationsSchema;
export const learningCertificateNumberSchema = certificateNumberSchema;
export const learningInvoiceNumberSchema = invoiceNumberSchema;
export const learningVendorNameSchema = vendorNameSchema;
export const learningTrainingCostDescriptionSchema = trainingCostDescriptionSchema;
/** @deprecated Use `emailSchema` */
export const learningEmailSchema = emailSchema;
export const learningEmailOptionalSchema = emailOptionalSchema;
export const learningPathEstimatedHoursSchema = pathEstimatedHoursSchema;
export const learningPercent0to100Schema = percent0to100Schema;
export const learningAssessmentPointsSchema = assessmentPointsSchema;
/** @deprecated Use `assessmentMaxScoreSchema` */
export const learningAssessmentMaxScoreSchema = assessmentMaxScoreSchema;
/** @deprecated Use `assessmentPassingScoreSchema` */
export const learningAssessmentPassingScoreSchema = assessmentPassingScoreSchema;
/** @deprecated Use `assessmentActualScoreSchema` */
export const learningAssessmentActualScoreSchema = assessmentActualScoreSchema;
export const learningAssessmentActualScoreOptionalSchema = assessmentActualScoreOptionalSchema;
/** @deprecated Use `assessmentAttemptsBaseSchema` */
export const learningAssessmentAttemptsBaseSchema = assessmentAttemptsBaseSchema;
export const learningAssessmentAttemptsSchema = assessmentAttemptsSchema;
export const learningTrainingRating1to5Schema = trainingRating1to5Schema;
export const learningTrainingRating1to5OptionalSchema = trainingRating1to5OptionalSchema;
/** @deprecated Use `nonNegativeIntSchema` */
export const learningNonNegativeIntSchema = nonNegativeIntSchema;

// ---------------------------------------------------------------------------
// Money: positive `numeric(10,2)` as decimal string (training cost lines)
// ---------------------------------------------------------------------------

export function isValidPositiveMoney10_2String(val: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(val)) return false;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 && n <= learningBounds.courseCostMax;
}

export const positiveMoney10_2StringSchema = z.string().refine(isValidPositiveMoney10_2String, {
  message: `amount must be a positive decimal up to ${learningBounds.courseCostMax} with at most 2 decimal places`,
});

/** @deprecated Use `isValidPositiveMoney10_2String` */
export const isValidLearningPositiveMoney10_2String = isValidPositiveMoney10_2String;
/** @deprecated Use `positiveMoney10_2StringSchema` */
export const learningPositiveMoney10_2StringSchema = positiveMoney10_2StringSchema;

// ---------------------------------------------------------------------------
// Cross-field refinements
// ---------------------------------------------------------------------------

/**
 * Reusable cross-field rules (chain with `.superRefine(...)` on insert/update schemas).
 *
 * | Helper | DB-backed | Typical wiring |
 * |--------|-----------|----------------|
 * | `refineRequiresCurrencyIfCost` | yes (`chk_courses_cost`) | `courses` insert/update |
 * | `refineRequiresObjectivesIfActive` | **Zod only** | `courses` insert/update |
 * | `refineRequiresPrerequisitesIfMandatory` | **Zod only** | `courses` insert/update |
 * | `refineRequiresDurationForInstructorLed` | **Zod only** | `courses` (insert uses `applyDefaultFormat: "CLASSROOM"`) |
 * | `refineRequiresCapacityForClassroom` | **Zod only** | `courses` (insert uses default format) |
 * | `refineRequiresContentUrlForOnline` | **Zod only** | composite payloads with `format` + `contentUrl` — not `courses` row alone |
 * | `refineRequiresCompletionDateIfCompleted` | yes (`chk_*_completion_consistency`) | enrollments / path progress (**prefer this import**; alias `refineLearningCompletionRequiresCompletedStatus`) |
 * | `refineEstimatedHoursConsistency` | partial (`chk_learning_paths_hours` > 0) | optional; often redundant with `pathEstimatedHoursSchema` |
 * | `refineAttendanceCompletionConsistency` | yes (`chk_training_enrollments_completed_min_attendance`) | `trainingEnrollment*` |
 * | `refineAssessmentPassingVsMaxScore` | yes (`chk_assessments_passing_score`) | `assessments` insert/update when both scores appear in payload |
 * | `refineEndDateOnOrAfterStartDate` | yes (`chk_training_sessions_dates`) | `training_sessions` insert/update when both dates appear in payload |
 * | `refineCompletionDateOnOrBeforeDueBy` | **Zod only** | `course_enrollments` / `training_enrollments` when both dates appear in payload |
 * | `refineExpiryDateOnOrAfterAwardDate` | yes (`chk_certification_awards_expiry`) | `certification_awards` insert/update |
 * | `refineDueByOnOrAfterAssignedAt` | **Zod only** | `learning_path_assignments` insert/update when both dates appear in payload |
 *
 * **Wire formats:** `dateStringSchema` / `dateOptionalSchema` / **`dateNullableOptionalSchema`** for Postgres `date`; `timestamptzStringSchema` / `timestamptzOptionalSchema` / **`timestamptzNullableOptionalSchema`** for `timestamptz` patches. Optional native `Date`: **`dateCoerceSchema`**.
 *
 * **Pattern:** add a DB `CHECK` → mirror with a constant + refinement + test + README note. Zod-only rules stay documented here until SQL exists.
 */

/** True if `v` is a string with at least one non-whitespace character. */
export function isNonEmptyTrimmedText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/** Normalize enum-like / unknown values for cross-field status checks (undefined if nullish). */
export function normEnumString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return String(v);
}

/** @deprecated Use `normEnumString` */
export const learningNormEnumString = normEnumString;

/**
 * Generic “dependent field iff status” rule: when status equals `whenStatusEquals`, `fieldKey` must be non-empty;
 * when `fieldKey` is non-empty, status must be `whenStatusEquals` (or omitted on partial patches).
 */
export function refineFieldWhenStatusEquals<T extends Record<string, unknown>>(
  data: T,
  ctx: z.RefinementCtx,
  args: {
    statusKey: keyof T & string;
    fieldKey: keyof T & string;
    whenStatusEquals: string;
    isFieldEmpty: (v: unknown) => boolean;
  }
): void {
  const st = normEnumString(data[args.statusKey]);
  const fv = data[args.fieldKey];
  if (st === args.whenStatusEquals && args.isFieldEmpty(fv)) {
    ctx.addIssue({
      code: "custom",
      message: `${String(args.fieldKey)} is required when ${String(args.statusKey)} is ${args.whenStatusEquals}`,
      path: [args.fieldKey],
    });
  }
  if (!args.isFieldEmpty(fv) && st !== undefined && st !== args.whenStatusEquals) {
    ctx.addIssue({
      code: "custom",
      message: `${String(args.fieldKey)} may only be set when ${String(args.statusKey)} is ${args.whenStatusEquals}`,
      path: [args.fieldKey],
    });
  }
}

/**
 * **`courses`:** if `cost` is present and not the empty string (used to clear cost on update), `currencyId` is required.
 * Matches `chk_courses_cost` (currency not null when cost is set).
 */
export function refineCurrencyIdWhenCourseCostSet(
  data: { cost?: unknown; currencyId?: unknown },
  ctx: z.RefinementCtx
): void {
  const c = data.cost;
  if (c !== undefined && c !== null && c !== "") {
    if (data.currencyId === undefined || data.currencyId === null) {
      ctx.addIssue({
        code: "custom",
        message: "currencyId is required when cost is set",
        path: ["currencyId"],
      });
    }
  }
}

/** Same as `refineCurrencyIdWhenCourseCostSet` — stable name for shared refinement lists. */
export function refineRequiresCurrencyIfCost<T extends { cost?: unknown; currencyId?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  refineCurrencyIdWhenCourseCostSet(data, ctx);
}

/** Mirror DB `chk_*_completion_consistency` for L&D enrollment / progress rows. */
export function refineLearningCompletionRequiresCompletedStatus(
  data: { status?: unknown; completionDate?: unknown },
  ctx: z.RefinementCtx
): void {
  const emptyDate = (v: unknown) => v === undefined || v === null || v === "";
  refineFieldWhenStatusEquals(data as Record<string, unknown>, ctx, {
    statusKey: "status",
    fieldKey: "completionDate",
    whenStatusEquals: "COMPLETED",
    isFieldEmpty: emptyDate,
  });
}

/** Same as `refineLearningCompletionRequiresCompletedStatus` (alias for naming consistency with other `refineRequires*` helpers). */
export function refineRequiresCompletionDateIfCompleted<T extends { status?: unknown; completionDate?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  refineLearningCompletionRequiresCompletedStatus(data, ctx);
}

/**
 * When `estimatedHours` is a finite number, require `> 0` (aligns with `chk_learning_paths_hours`).
 * Upper bound is enforced by `pathEstimatedHoursSchema` when that override is used.
 */
export function refineEstimatedHoursConsistency<T extends { estimatedHours?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const eh = data.estimatedHours;
  if (eh === undefined || eh === null) return;
  const n = typeof eh === "number" ? eh : Number(eh);
  if (!Number.isFinite(n)) return;
  if (n <= 0) {
    ctx.addIssue({
      code: "custom",
      message: "estimatedHours must be greater than 0 when set",
      path: ["estimatedHours"],
    });
  }
}

/**
 * Min attendance % to allow `COMPLETED` when `attendancePercent` is set.
 * **Keep in sync** with `chk_training_enrollments_completed_min_attendance` in SQL migrations (literal `80`).
 */
export const LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT = 80;

/**
 * If `attendancePercent` is set and below `minAttendancePercent`, `status` cannot be `COMPLETED`.
 * Mirrored by `chk_training_enrollments_completed_min_attendance` on `learning.training_enrollments`.
 */
export function refineAttendanceCompletionConsistency<
  T extends { attendancePercent?: unknown; status?: unknown },
>(data: T, ctx: z.RefinementCtx, minAttendancePercent = LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT): void {
  const apRaw = data.attendancePercent;
  const ap = typeof apRaw === "number" && Number.isFinite(apRaw) ? apRaw : null;
  const st = normEnumString(data.status);
  if (ap != null && ap < minAttendancePercent && st === "COMPLETED") {
    ctx.addIssue({
      code: "custom",
      message: `status cannot be COMPLETED when attendancePercent is below ${minAttendancePercent}`,
      path: ["status"],
    });
  }
}

/**
 * **`assessments`:** when both `maxScore` and `passingScore` are present, require `passingScore <= maxScore`.
 * Matches `chk_assessments_passing_score`.
 */
export function refineAssessmentPassingVsMaxScore<T extends { maxScore?: unknown; passingScore?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const maxRaw = data.maxScore;
  const passRaw = data.passingScore;
  if (maxRaw === undefined || maxRaw === null || passRaw === undefined || passRaw === null) return;
  const max = typeof maxRaw === "number" ? maxRaw : Number(maxRaw);
  const pass = typeof passRaw === "number" ? passRaw : Number(passRaw);
  if (!Number.isFinite(max) || !Number.isFinite(pass)) return;
  if (pass > max) {
    ctx.addIssue({
      code: "custom",
      message: "passingScore cannot exceed maxScore",
      path: ["passingScore"],
    });
  }
}

/**
 * When both `startDate` and `endDate` are `YYYY-MM-DD` strings, require `endDate >= startDate`.
 * Matches `chk_training_sessions_dates` on `learning.training_sessions`.
 */
export function refineEndDateOnOrAfterStartDate<T extends { startDate?: unknown; endDate?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const s = isoDateWireString(data.startDate);
  const e = isoDateWireString(data.endDate);
  if (s === null || e === null) return;
  if (e < s) {
    ctx.addIssue({
      code: "custom",
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }
}

/**
 * When both `completionDate` and `dueBy` are `YYYY-MM-DD`, require `completionDate <= dueBy` (finished on or before deadline).
 * Zod-only — add a DB `CHECK` if this becomes a hard invariant.
 */
export function refineCompletionDateOnOrBeforeDueBy<
  T extends { completionDate?: unknown; dueBy?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const c = isoDateWireString(data.completionDate);
  const d = isoDateWireString(data.dueBy);
  if (c === null || d === null) return;
  if (c > d) {
    ctx.addIssue({
      code: "custom",
      message: "completionDate must be on or before dueBy",
      path: ["completionDate"],
    });
  }
}

/**
 * When both `expiryDate` and `awardDate` are `YYYY-MM-DD`, require `expiryDate >= awardDate`.
 * Matches `chk_certification_awards_expiry`.
 */
export function refineExpiryDateOnOrAfterAwardDate<
  T extends { awardDate?: unknown; expiryDate?: unknown },
>(data: T, ctx: z.RefinementCtx): void {
  const a = isoDateWireString(data.awardDate);
  const e = isoDateWireString(data.expiryDate);
  if (a === null || e === null) return;
  if (e < a) {
    ctx.addIssue({
      code: "custom",
      message: "expiryDate must be on or after awardDate",
      path: ["expiryDate"],
    });
  }
}

/**
 * When both `dueBy` and `assignedAt` are `YYYY-MM-DD`, require `dueBy >= assignedAt`.
 * Zod-only unless a DB `CHECK` is added.
 */
export function refineDueByOnOrAfterAssignedAt<T extends { assignedAt?: unknown; dueBy?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  const as = isoDateWireString(data.assignedAt);
  const du = isoDateWireString(data.dueBy);
  if (as === null || du === null) return;
  if (du < as) {
    ctx.addIssue({
      code: "custom",
      message: "dueBy must be on or after assignedAt",
      path: ["dueBy"],
    });
  }
}

/**
 * **`courses` (Zod-only):** when `status` is `ACTIVE`, `objectives` must be non-empty after trim.
 * No Postgres `CHECK` yet — add SQL if this becomes a hard invariant.
 *
 * Partial **updates:** if the payload sets `status` to `ACTIVE`, `objectives` must appear in the same payload and be non-empty
 * (clients cannot activate without sending objectives).
 */
export function refineRequiresObjectivesIfActive<T extends { status?: unknown; objectives?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  if (normEnumString(data.status) !== "ACTIVE") return;
  if (!isNonEmptyTrimmedText(data.objectives)) {
    ctx.addIssue({
      code: "custom",
      message: "objectives are required when status is ACTIVE",
      path: ["objectives"],
    });
  }
}

/**
 * **`courses` (Zod-only):** when `isMandatory` is `true`, `prerequisites` must be non-empty after trim.
 * No Postgres `CHECK` yet.
 *
 * Partial **updates:** if the payload sets `isMandatory` to `true`, `prerequisites` must appear in the same payload and be non-empty.
 */
export function refineRequiresPrerequisitesIfMandatory<T extends { isMandatory?: unknown; prerequisites?: unknown }>(
  data: T,
  ctx: z.RefinementCtx
): void {
  if (data.isMandatory !== true) return;
  if (!isNonEmptyTrimmedText(data.prerequisites)) {
    ctx.addIssue({
      code: "custom",
      message: "prerequisites are required when isMandatory is true",
      path: ["prerequisites"],
    });
  }
}

/** `course_format` values treated as instructor-led (expect scheduled seat time). */
export const LEARNING_INSTRUCTOR_LED_COURSE_FORMATS = ["CLASSROOM", "WORKSHOP"] as const;

/** `course_format` values where delivery often expects a URL (use on composite DTOs with `contentUrl`). */
export const LEARNING_ONLINE_LIKE_COURSE_FORMATS = ["ONLINE", "SELF_PACED"] as const;

function isInstructorLedCourseFormat(fmt: string): boolean {
  return (LEARNING_INSTRUCTOR_LED_COURSE_FORMATS as readonly string[]).includes(fmt);
}

function isOnlineLikeCourseFormat(fmt: string): boolean {
  return (LEARNING_ONLINE_LIKE_COURSE_FORMATS as readonly string[]).includes(fmt);
}

export type RefineCourseFormatOptions = {
  /**
   * When set, used if `format` is omitted (matches `courses.format` DB default `CLASSROOM` on insert).
   * Omit on patch schemas so partial updates without `format` skip this rule.
   */
  applyDefaultFormat?: string;
};

/**
 * **`courses` (Zod-only):** CLASSROOM / WORKSHOP require a positive `durationHours`.
 * On **insert**, pass `{ applyDefaultFormat: "CLASSROOM" }` so omitted `format` matches the table default.
 */
export function refineRequiresDurationForInstructorLed<
  T extends { format?: unknown; durationHours?: unknown },
>(data: T, ctx: z.RefinementCtx, options?: RefineCourseFormatOptions): void {
  const fmt = normEnumString(data.format) ?? options?.applyDefaultFormat;
  if (!fmt || !isInstructorLedCourseFormat(fmt)) return;
  const dh = data.durationHours;
  if (dh == null || dh === "" || dh === 0) {
    ctx.addIssue({
      code: "custom",
      message: "durationHours is required for instructor-led formats (CLASSROOM, WORKSHOP)",
      path: ["durationHours"],
    });
    return;
  }
  const n = typeof dh === "number" ? dh : Number(dh);
  if (!Number.isFinite(n) || n < learningBounds.courseDurationHours.min) {
    ctx.addIssue({
      code: "custom",
      message: `durationHours must be at least ${learningBounds.courseDurationHours.min} for instructor-led formats`,
      path: ["durationHours"],
    });
  }
}

/**
 * **`courses` (Zod-only):** CLASSROOM requires a positive `maxParticipants`.
 * On **insert**, pass `{ applyDefaultFormat: "CLASSROOM" }` when relying on the table default format.
 */
export function refineRequiresCapacityForClassroom<
  T extends { format?: unknown; maxParticipants?: unknown },
>(data: T, ctx: z.RefinementCtx, options?: RefineCourseFormatOptions): void {
  const fmt = normEnumString(data.format) ?? options?.applyDefaultFormat;
  if (fmt !== "CLASSROOM") return;
  const mp = data.maxParticipants;
  if (mp == null || mp === "" || mp === 0) {
    ctx.addIssue({
      code: "custom",
      message: "maxParticipants is required for CLASSROOM format",
      path: ["maxParticipants"],
    });
    return;
  }
  const n = typeof mp === "number" ? mp : Number(mp);
  if (!Number.isFinite(n) || n < learningBounds.courseMaxParticipants.min) {
    ctx.addIssue({
      code: "custom",
      message: `maxParticipants must be at least ${learningBounds.courseMaxParticipants.min} for CLASSROOM format`,
      path: ["maxParticipants"],
    });
  }
}

/**
 * **Composite payloads (Zod-only):** when `format` is ONLINE or SELF_PACED, `contentUrl` must be non-empty.
 * `learning.courses` has no `contentUrl` column (URLs live on `course_modules`); use this when validating a DTO
 * that includes parent `format` plus a module URL, or a custom API shape.
 */
export function refineRequiresContentUrlForOnline<T extends { format?: unknown; contentUrl?: unknown }>(
  data: T,
  ctx: z.RefinementCtx,
  options?: RefineCourseFormatOptions
): void {
  const fmt = normEnumString(data.format) ?? options?.applyDefaultFormat;
  if (!fmt || !isOnlineLikeCourseFormat(fmt)) return;
  if (!isNonEmptyTrimmedText(data.contentUrl)) {
    ctx.addIssue({
      code: "custom",
      message: "contentUrl is required for ONLINE or SELF_PACED when validated together with format",
      path: ["contentUrl"],
    });
  }
}
