/**
 * FK on candidate_salary_backfill_issues.tenantId → core.tenants.
 * Run: pnpm test:db -- src/__tests__/candidate-salary-backfill-issues-fk.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { candidateSalaryBackfillIssues } from "../schema-hrm/recruitment/operations/candidateSalaryBackfillIssues";
import { matchesPgError } from "./pg-error";

describe.skipIf(!process.env.DATABASE_URL)("candidate_salary_backfill_issues tenant FK", () => {
  let tenantId: number;
  let candidateId: number;
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `CSBI_${suffix}`,
        name: "Backfill FK test tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const [c] = await db
      .insert(candidates)
      .values({
        tenantId,
        candidateCode: `CSBI-C-${suffix}`,
        firstName: "Test",
        lastName: "Candidate",
        email: `csbi.${suffix}@example.com`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    candidateId = c.candidateId;
  });

  afterAll(async () => {
    await db
      .delete(candidateSalaryBackfillIssues)
      .where(eq(candidateSalaryBackfillIssues.candidateId, candidateId));
    await db.delete(candidates).where(eq(candidates.candidateId, candidateId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects insert when tenantId does not exist in core.tenants", async () => {
    await expect(
      db.insert(candidateSalaryBackfillIssues).values({
        candidateId,
        tenantId: 2_147_000_001,
        expectedSalary: "n/a",
        normalizedDigits: null,
        reason: "integration_test_invalid_tenant",
      })
    ).rejects.toSatisfy(
      matchesPgError(/23503|foreign key|fk_candidate_salary_backfill_issues_tenant/i)
    );
  });

  it("accepts insert when tenantId matches an existing tenant", async () => {
    await db.insert(candidateSalaryBackfillIssues).values({
      candidateId,
      tenantId,
      expectedSalary: "unparseable",
      normalizedDigits: "???",
      reason: "integration_test_ok",
    });

    const rows = await db
      .select()
      .from(candidateSalaryBackfillIssues)
      .where(eq(candidateSalaryBackfillIssues.candidateId, candidateId));
    expect(rows.length).toBeGreaterThanOrEqual(1);

    await db
      .delete(candidateSalaryBackfillIssues)
      .where(eq(candidateSalaryBackfillIssues.candidateId, candidateId));
  });
});
