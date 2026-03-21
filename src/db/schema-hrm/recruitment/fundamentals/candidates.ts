/**
 * Recruitment talent profile: enums, `recruitment.candidates` table, and Zod insert/update contracts.
 * Product rules: `docs/recruitment-candidate-databank.md` §0 and ADR `docs/architecture/adr/0001-candidate-hired-hr-bridge.md`.
 */
import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

// --- Enums (PostgreSQL + Zod mirrors) ---

export const candidateSources = ["JOB_BOARD", "REFERRAL", "CAREER_SITE", "SOCIAL_MEDIA", "AGENCY", "UNIVERSITY", "INTERNAL", "OTHER"] as const;

export const candidateSourceEnum = recruitmentSchema.enum("candidate_source", [...candidateSources]);

export const CandidateSourceSchema = z.enum(candidateSources);
export type CandidateSource = z.infer<typeof CandidateSourceSchema>;

export const candidateStatuses = ["NEW", "SCREENING", "INTERVIEWING", "OFFER", "HIRED", "REJECTED", "WITHDRAWN", "ON_HOLD"] as const;

export const candidateStatusEnum = recruitmentSchema.enum("candidate_status", [...candidateStatuses]);

export const CandidateStatusSchema = z.enum(candidateStatuses);
export type CandidateStatus = z.infer<typeof CandidateStatusSchema>;

export const expectedSalaryPeriods = ["MONTHLY", "BIWEEKLY", "WEEKLY", "SEMI_MONTHLY", "ANNUAL"] as const;

export const expectedSalaryPeriodEnum = recruitmentSchema.enum("expected_salary_period", [
  ...expectedSalaryPeriods,
]);

export const ExpectedSalaryPeriodSchema = z.enum(expectedSalaryPeriods);
export type ExpectedSalaryPeriod = z.infer<typeof ExpectedSalaryPeriodSchema>;

// --- Table: `recruitment.candidates` ---

/**
 * Talent databank profile (`recruitment.candidates`).
 *
 * **Grain:** At most one active row per candidate identity per tenant (enforced by partial uniques on
 * normalized email and candidateCode). Do not create a second row when someone applies again.
 *
 * **Reapply / multi-requisition:** Add a row in `recruitment.applications` (same `candidateId`, distinct
 * `requisitionId`). Partial unique `uq_applications_candidate_requisition` prevents duplicate applications
 * to the same requisition while soft-deleted rows are excluded.
 *
 * **Dual status:** `candidates.status` reflects the person in the talent pool / global lifecycle.
 * Per-requisition pipeline state lives on `applications` (and interviews/offers downstream). For funnel
 * and time-in-stage metrics, prefer application-level (and later stage history) over candidate.status alone.
 *
 * **HR bridge:** `personId` and `convertedEmployeeId` link to `hr.persons` / `hr.employees` after hire.
 * **DB + Zod:** `status = HIRED` requires both IDs (CHECK `chk_candidates_hired_requires_hr_bridge`); updates mirror partial-patch rules in ADR 0001. Use another status for phased hire-in-progress if needed.
 * Cross-schema FKs for those columns may be added via custom SQL (circular FK pattern).
 *
 * @see docs/recruitment-candidate-databank.md
 *
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const candidates = recruitmentSchema.table(
  "candidates",
  {
    candidateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    candidateCode: text().notNull(),
    firstName: text().notNull(),
    middleName: text(),
    lastName: text().notNull(),
    email: text().notNull(),
    phone: text(),
    linkedinUrl: text(),
    resumePath: text(),
    source: candidateSourceEnum().notNull().default("JOB_BOARD"),
    /** Referring employee (`hr.employees`); no cross-schema FK in Drizzle — see databank doc. */
    referredBy: integer(),
    currentCompany: text(),
    currentTitle: text(),
    /** @deprecated Use expectedSalaryAmount + currency + period */
    expectedSalary: text(),
    expectedSalaryAmount: numeric({ precision: 14, scale: 2 }),
    expectedSalaryCurrencyId: integer(),
    expectedSalaryPeriod: expectedSalaryPeriodEnum(),
    availableFrom: date(),
    personId: integer(),
    convertedEmployeeId: integer(),
    status: candidateStatusEnum().notNull().default("NEW"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_candidates_tenant").on(t.tenantId),
    index("idx_candidates_source").on(t.tenantId, t.source),
    /**
     * Prefix `(tenantId, status)` is covered by this B-tree; do not add a separate `idx_candidates_status`
     * (redundant writes).
     */
    index("idx_candidates_tenant_status_updated_at").on(t.tenantId, t.status, t.updatedAt),
    index("idx_candidates_person").on(t.tenantId, t.personId),
    uniqueIndex("uq_candidates_code")
      .on(t.tenantId, sql`lower(${t.candidateCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_candidates_email")
      .on(t.tenantId, sql`lower(${t.email})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_candidates_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.expectedSalaryCurrencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_candidates_expected_salary_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_candidates_hired_requires_hr_bridge",
      sql`${t.status}::text <> 'HIRED' OR (${t.personId} IS NOT NULL AND ${t.convertedEmployeeId} IS NOT NULL)`,
    ),
  ]
);

// --- Zod: API / service validation (mirrors important DB rules; not a substitute for constraints) ---

/** Matches `numeric(14,2)`: up to 12 digits before the decimal, up to 2 after. */
const EXPECTED_SALARY_AMOUNT_REGEX = /^\d{1,12}(\.\d{1,2})?$/;

/** Upper bound for `numeric(14, 2)` (12 integer digits + 2 decimals). */
const MAX_EXPECTED_SALARY_AMOUNT = 999_999_999_999.99;

const expectedSalaryAmountStringSchema = z
  .string()
  .trim()
  .regex(EXPECTED_SALARY_AMOUNT_REGEX, "Up to 12 integer digits and at most 2 decimal places")
  .refine((s) => parseFloat(s) >= 0, "Must be non-negative");

/**
 * Accepts finite JS numbers with at most two decimal places (aligns with PostgreSQL scale).
 * Normalizes to the same string shape as API payloads that send decimals as strings.
 */
const expectedSalaryAmountFromNumberSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(MAX_EXPECTED_SALARY_AMOUNT)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6,
    "At most 2 decimal places",
  )
  .refine((n) => Math.abs(Math.trunc(n)).toString().length <= 12, "Up to 12 integer digits")
  .transform((n) => {
    const s = n.toFixed(2).replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
    return s;
  })
  .pipe(expectedSalaryAmountStringSchema);

const expectedSalaryAmountInsertFieldSchema = z
  .union([expectedSalaryAmountStringSchema, expectedSalaryAmountFromNumberSchema])
  .optional();

const expectedSalaryAmountUpdateFieldSchema = z
  .union([expectedSalaryAmountStringSchema, expectedSalaryAmountFromNumberSchema, z.null()])
  .optional();

function expectedSalaryAmountIsSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return false;
}

function refineExpectedSalaryBundle(data: Record<string, unknown>, ctx: z.RefinementCtx, mode: "insert" | "update") {
  const amount = data.expectedSalaryAmount;
  if (mode === "update" && amount === null) return;
  if (!expectedSalaryAmountIsSet(amount)) return;

  if (data.expectedSalaryCurrencyId === undefined || data.expectedSalaryCurrencyId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "expectedSalaryCurrencyId is required when expectedSalaryAmount is set",
      path: ["expectedSalaryCurrencyId"],
    });
  }
  if (data.expectedSalaryPeriod === undefined || data.expectedSalaryPeriod === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "expectedSalaryPeriod is required when expectedSalaryAmount is set",
      path: ["expectedSalaryPeriod"],
    });
  }
}

/** Full insert: `HIRED` must include both HR bridge ids (DB CHECK matches). */
function refineHiredHrBridgeInsert(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  if (data.status !== "HIRED") return;
  const pid = data.personId;
  const eid = data.convertedEmployeeId;
  if (pid === undefined || pid === null || typeof pid !== "number" || pid <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "personId is required when status is HIRED",
      path: ["personId"],
    });
  }
  if (eid === undefined || eid === null || typeof eid !== "number" || eid <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "convertedEmployeeId is required when status is HIRED",
      path: ["convertedEmployeeId"],
    });
  }
}

/**
 * Partial updates: `status = HIRED` cannot clear HR ids (`null`). If either HR id appears in the patch,
 * require both as positive integers in the same request. `{ status: "HIRED" }` alone is allowed — DB CHECK
 * validates the merged row when ids were set earlier (see ADR 0001).
 */
function refineHiredHrBridgeUpdate(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  if (data.status !== "HIRED") return;

  const hasP = Object.prototype.hasOwnProperty.call(data, "personId");
  const hasE = Object.prototype.hasOwnProperty.call(data, "convertedEmployeeId");
  const pid = data.personId;
  const eid = data.convertedEmployeeId;

  if (hasP && pid === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "personId cannot be null when status is HIRED",
      path: ["personId"],
    });
  }
  if (hasE && eid === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "convertedEmployeeId cannot be null when status is HIRED",
      path: ["convertedEmployeeId"],
    });
  }

  if (hasP !== hasE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: hasP
        ? "convertedEmployeeId is required in the same update when personId is set with status HIRED"
        : "personId is required in the same update when convertedEmployeeId is set with status HIRED",
      path: hasP ? ["convertedEmployeeId"] : ["personId"],
    });
    return;
  }

  if (!hasP && !hasE) return;

  if (typeof pid !== "number" || pid <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "personId must be a positive integer when status is HIRED",
      path: ["personId"],
    });
  }
  if (typeof eid !== "number" || eid <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "convertedEmployeeId must be a positive integer when status is HIRED",
      path: ["convertedEmployeeId"],
    });
  }
}

export const CandidateIdSchema = z.number().int().brand<"CandidateId">();
export type CandidateId = z.infer<typeof CandidateIdSchema>;

export const candidateSelectSchema = createSelectSchema(candidates);

export const candidateInsertSchema = createInsertSchema(candidates, {
  /** Omit to use DB default `JOB_BOARD`. */
  source: CandidateSourceSchema.optional(),
  /** Omit to use DB default `NEW`. */
  status: CandidateStatusSchema.optional(),
  candidateCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().max(30).optional(),
  linkedinUrl: z.string().url().max(255).optional(),
  resumePath: z.string().max(500).optional(),
  /** Optional `hr.employees.employeeId` (enforced in app or future custom SQL FK). */
  referredBy: z.number().int().positive().optional(),
  currentCompany: z.string().max(200).optional(),
  currentTitle: z.string().max(200).optional(),
  expectedSalary: z.string().max(100).optional(),
  expectedSalaryAmount: expectedSalaryAmountInsertFieldSchema,
  expectedSalaryCurrencyId: z.number().int().positive().optional(),
  expectedSalaryPeriod: ExpectedSalaryPeriodSchema.optional().nullable(),
}).superRefine((row, ctx) => {
  const d = row as Record<string, unknown>;
  refineExpectedSalaryBundle(d, ctx, "insert");
  refineHiredHrBridgeInsert(d, ctx);
});

export const candidateUpdateSchema = createUpdateSchema(candidates, {
  source: CandidateSourceSchema.optional(),
  status: CandidateStatusSchema.optional(),
  candidateCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed").optional(),
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
  phone: z.string().max(30).optional(),
  linkedinUrl: z.string().url().max(255).optional(),
  resumePath: z.string().max(500).optional(),
  referredBy: z.number().int().positive().nullish(),
  currentCompany: z.string().max(200).optional(),
  currentTitle: z.string().max(200).optional(),
  expectedSalary: z.string().max(100).optional(),
  expectedSalaryAmount: expectedSalaryAmountUpdateFieldSchema,
  expectedSalaryCurrencyId: z.number().int().positive().nullish(),
  expectedSalaryPeriod: ExpectedSalaryPeriodSchema.nullish(),
}).superRefine((row, ctx) => {
  const d = row as Record<string, unknown>;
  refineExpectedSalaryBundle(d, ctx, "update");
  refineHiredHrBridgeUpdate(d, ctx);
});

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
