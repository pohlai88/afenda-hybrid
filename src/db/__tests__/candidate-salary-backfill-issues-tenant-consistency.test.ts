/**
 * Service-layer guard: salary backfill issue tenantId must match candidate row.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/candidate-salary-backfill-issues-tenant-consistency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { candidateSalaryBackfillIssues } from "../schema-hrm/recruitment/operations/candidateSalaryBackfillIssues";
import { createCandidateSalaryBackfillIssue } from "@db/_services/recruitment";

describe.skipIf(!process.env.DATABASE_URL)(
  "candidate_salary_backfill_issues create — tenant consistency (service)",
  () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let tenantAId: number;
    let tenantBId: number;
    let candidateOnAId: number;

    beforeAll(async () => {
      const [ta] = await db
        .insert(tenants)
        .values({
          tenantCode: `CSBI_TA_${suffix}`,
          name: "Tenant A",
          status: "ACTIVE",
        })
        .returning();
      const [tb] = await db
        .insert(tenants)
        .values({
          tenantCode: `CSBI_TB_${suffix}`,
          name: "Tenant B",
          status: "ACTIVE",
        })
        .returning();
      tenantAId = ta.tenantId;
      tenantBId = tb.tenantId;

      const [c] = await db
        .insert(candidates)
        .values({
          tenantId: tenantAId,
          candidateCode: `CSBI_TC_${suffix}`,
          firstName: "Sam",
          lastName: "Backfill",
          email: `csbi.tcon.${suffix}@example.com`,
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();
      candidateOnAId = c.candidateId;
    });

    afterAll(async () => {
      await db
        .delete(candidateSalaryBackfillIssues)
        .where(eq(candidateSalaryBackfillIssues.candidateId, candidateOnAId));
      await db.delete(candidates).where(eq(candidates.tenantId, tenantAId));
      await db.delete(candidates).where(eq(candidates.tenantId, tenantBId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantAId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantBId));
    });

    const baseRow = () => ({
      reason: "integration_tenant_consistency",
      normalizedDigits: "50000",
    });

    it("rejects when tenantId disagrees with candidate.tenantId", async () => {
      await expect(
        createCandidateSalaryBackfillIssue(db, {
          ...baseRow(),
          tenantId: tenantBId,
          candidateId: candidateOnAId,
        }),
      ).rejects.toMatchObject({
        name: "CandidateSalaryBackfillIssueTenantMismatchError",
        code: "CANDIDATE_SALARY_BACKFILL_ISSUE_TENANT_MISMATCH",
        message: expect.stringMatching(/Candidate tenant mismatch/i),
      });
    });

    it("inserts when tenantId matches candidate", async () => {
      const row = await createCandidateSalaryBackfillIssue(db, {
        ...baseRow(),
        tenantId: tenantAId,
        candidateId: candidateOnAId,
        expectedSalary: "unparseable",
      });
      expect(row.tenantId).toBe(tenantAId);
      expect(row.candidateId).toBe(candidateOnAId);

      await db
        .delete(candidateSalaryBackfillIssues)
        .where(eq(candidateSalaryBackfillIssues.issueId, row.issueId));
    });
  },
);
