import { eq } from "drizzle-orm";
import type { Database } from "@db/db";
import { candidates } from "@db/schema-hrm/recruitment/fundamentals/candidates";
import {
  candidateSalaryBackfillIssueInsertSchema,
  candidateSalaryBackfillIssues,
  type CandidateSalaryBackfillIssue,
  type NewCandidateSalaryBackfillIssue,
} from "@db/schema-hrm/recruitment/operations/candidateSalaryBackfillIssues";

/** Thrown when `tenantId` on the insert does not match `candidates.tenantId`. */
export class CandidateSalaryBackfillIssueTenantMismatchError extends Error {
  readonly code = "CANDIDATE_SALARY_BACKFILL_ISSUE_TENANT_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "CandidateSalaryBackfillIssueTenantMismatchError";
  }
}

export type CreateCandidateSalaryBackfillIssueInput = Omit<NewCandidateSalaryBackfillIssue, "issueId">;

/**
 * Inserts a backfill issue row only if `row.tenantId` matches `candidates.tenantId` for `candidateId`.
 * Rows are parsed with `candidateSalaryBackfillIssueInsertSchema` before insert.
 */
export async function createCandidateSalaryBackfillIssue(
  dbOrTx: Database,
  row: CreateCandidateSalaryBackfillIssueInput,
): Promise<CandidateSalaryBackfillIssue> {
  const parsed = candidateSalaryBackfillIssueInsertSchema.parse(row);
  const { tenantId, candidateId } = parsed;

  const [candidate] = await dbOrTx
    .select({ tenantId: candidates.tenantId })
    .from(candidates)
    .where(eq(candidates.candidateId, candidateId))
    .limit(1);

  if (!candidate) {
    throw new Error("Candidate not found for salary backfill issue");
  }
  if (candidate.tenantId !== tenantId) {
    throw new CandidateSalaryBackfillIssueTenantMismatchError("Candidate tenant mismatch");
  }

  const [created] = await dbOrTx.insert(candidateSalaryBackfillIssues).values(parsed).returning();
  if (!created) {
    throw new Error("Salary backfill issue insert returned no row");
  }
  return created;
}
