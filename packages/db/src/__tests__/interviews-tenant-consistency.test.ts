/**
 * Service-layer guard: interview tenantId must match applications.tenantId.
 * Run: pnpm test:db -- src/__tests__/interviews-tenant-consistency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { jobRequisitions } from "../schema-hrm/recruitment/operations/jobRequisitions";
import { applications } from "../schema-hrm/recruitment/operations/applications";
import { interviews } from "../schema-hrm/recruitment/operations/interviews";
import { createInterview } from "@db/_services/recruitment";

describe.skipIf(!process.env.DATABASE_URL)(
  "interviews create — tenant consistency (service)",
  () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const interviewerId = 700_000 + Math.floor(Math.random() * 10_000);
    let tenantAId: number;
    let tenantBId: number;
    let applicationId: number;

    beforeAll(async () => {
      const [ta] = await db
        .insert(tenants)
        .values({
          tenantCode: `INTV_TA_${suffix}`,
          name: "Tenant A",
          status: "ACTIVE",
        })
        .returning();
      const [tb] = await db
        .insert(tenants)
        .values({
          tenantCode: `INTV_TB_${suffix}`,
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
          candidateCode: `INTV_C_${suffix}`,
          firstName: "Ivy",
          lastName: "Interview",
          email: `intv.${suffix}@example.com`,
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      const [req] = await db
        .insert(jobRequisitions)
        .values({
          tenantId: tenantAId,
          requisitionCode: `INTV_REQ_${suffix}`,
          title: "Role",
          status: "OPEN",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      const [app] = await db
        .insert(applications)
        .values({
          tenantId: tenantAId,
          candidateId: c.candidateId,
          requisitionId: req.requisitionId,
          applicationDate: "2026-03-20",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();
      applicationId = app.applicationId;
    });

    afterAll(async () => {
      await db.delete(interviews).where(eq(interviews.applicationId, applicationId));
      await db.delete(applications).where(eq(applications.applicationId, applicationId));
      await db.delete(jobRequisitions).where(eq(jobRequisitions.tenantId, tenantAId));
      await db.delete(candidates).where(eq(candidates.tenantId, tenantAId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantAId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantBId));
    });

    const baseRow = () => ({
      applicationId,
      interviewType: "VIDEO" as const,
      interviewerId,
      scheduledDate: "2026-03-21",
      createdBy: 1,
      updatedBy: 1,
    });

    it("rejects when tenantId disagrees with applications.tenantId", async () => {
      await expect(
        createInterview(db, {
          ...baseRow(),
          tenantId: tenantBId,
        })
      ).rejects.toMatchObject({
        name: "InterviewTenantMismatchError",
        code: "INTERVIEW_TENANT_MISMATCH",
        message: expect.stringMatching(/Application tenant mismatch/i),
      });
    });

    it("inserts when tenantId matches application", async () => {
      const row = await createInterview(db, {
        ...baseRow(),
        tenantId: tenantAId,
      });
      expect(row.tenantId).toBe(tenantAId);
      expect(row.applicationId).toBe(applicationId);

      await db.delete(interviews).where(eq(interviews.interviewId, row.interviewId));
    });
  }
);
