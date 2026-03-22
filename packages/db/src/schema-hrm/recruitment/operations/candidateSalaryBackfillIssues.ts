import { integer, text, timestamp, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { recruitmentSchema } from "../_schema";
import { timestampColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { candidates } from "../fundamentals/candidates";

/**
 * Rows where legacy `candidates.expectedSalary` text could not be conservatively parsed into
 * `expectedSalaryAmount` during backfill (see migration `20260320172746_volatile_hiroim`).
 *
 * **Tenancy:** `tenantId` should match the referenced `candidates.tenantId`; PostgreSQL does not enforce
 * that equality. For application-layer inserts, use `createCandidateSalaryBackfillIssue` in
 * `_services/recruitment/candidateSalaryBackfillIssuesService.ts`.
 *
 * **Uniqueness:** at most one issue row per tenant + `candidateId` (`uq_candidate_salary_backfill_issues_tenant_candidate`).
 * **`normalizedDigits`:** when present and non-empty, Zod allows only digits with an optional decimal fraction
 * (migration-era raw strings may still exist in the table from historical SQL).
 *
 * **Timestamps:** `timestampColumns` per DB-first guideline §5.1. No `auditColumns` — attribution remains
 * `capturedAt` + service context where user ids are unavailable for system backfill rows.
 */
export const candidateSalaryBackfillIssues = recruitmentSchema.table(
  "candidate_salary_backfill_issues",
  {
    issueId: integer().primaryKey().generatedAlwaysAsIdentity(),
    candidateId: integer().notNull(),
    tenantId: integer().notNull(),
    expectedSalary: text(),
    normalizedDigits: text(),
    reason: text().notNull(),
    capturedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestampColumns,
  },
  (t) => [
    uniqueIndex("uq_candidate_salary_backfill_issues_tenant_candidate").on(
      t.tenantId,
      t.candidateId
    ),
    index("idx_candidate_salary_backfill_issues_tenant").on(t.tenantId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_candidate_salary_backfill_issues_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.candidateId],
      foreignColumns: [candidates.candidateId],
      name: "fk_candidate_salary_backfill_issues_candidate",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const CandidateSalaryBackfillIssueIdSchema = z
  .number()
  .int()
  .brand<"CandidateSalaryBackfillIssueId">();
export type CandidateSalaryBackfillIssueId = z.infer<typeof CandidateSalaryBackfillIssueIdSchema>;

export const candidateSalaryBackfillIssueSelectSchema = createSelectSchema(
  candidateSalaryBackfillIssues
);

function refineNormalizedDigits(row: Record<string, unknown>, ctx: z.RefinementCtx) {
  const v = row.normalizedDigits;
  if (v === undefined || v === null || v === "") return;
  if (typeof v !== "string") return;
  if (!/^\d+(\.\d+)?$/.test(v)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "normalizedDigits must be digits with an optional decimal fraction (e.g. 50000 or 50000.50)",
      path: ["normalizedDigits"],
    });
  }
}

export const candidateSalaryBackfillIssueInsertSchema = createInsertSchema(
  candidateSalaryBackfillIssues,
  {
    tenantId: z.number().int().positive(),
    candidateId: z.number().int().positive(),
    reason: z.string().min(1).max(4000),
    expectedSalary: z.string().max(10000).optional(),
    normalizedDigits: z.string().max(500).optional(),
  }
).superRefine((row, ctx) => refineNormalizedDigits(row as Record<string, unknown>, ctx));

export const candidateSalaryBackfillIssueUpdateSchema = createUpdateSchema(
  candidateSalaryBackfillIssues,
  {
    tenantId: z.number().int().positive().optional(),
    candidateId: z.number().int().positive().optional(),
    reason: z.string().min(1).max(4000).optional(),
    expectedSalary: z.string().max(10000).optional(),
    normalizedDigits: z.string().max(500).optional(),
  }
).superRefine((row, ctx) => refineNormalizedDigits(row as Record<string, unknown>, ctx));

export type CandidateSalaryBackfillIssue = typeof candidateSalaryBackfillIssues.$inferSelect;
export type NewCandidateSalaryBackfillIssue = typeof candidateSalaryBackfillIssues.$inferInsert;
