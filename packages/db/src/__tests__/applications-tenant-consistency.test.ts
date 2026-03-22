/**
 * Service-layer guard: application tenantId must match candidate and requisition rows.
 * Run: pnpm test:db -- src/__tests__/applications-tenant-consistency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { jobRequisitions } from "../schema-hrm/recruitment/operations/jobRequisitions";
import { applications } from "../schema-hrm/recruitment/operations/applications";
import { createApplication } from "@db/_services/recruitment";

describe.skipIf(!process.env.DATABASE_URL)(
  "applications create — tenant consistency (service)",
  () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let tenantAId: number;
    let tenantBId: number;
    let candidateOnAId: number;
    let requisitionOnAId: number;
    let requisitionOnBId: number;

    beforeAll(async () => {
      const [ta] = await db
        .insert(tenants)
        .values({
          tenantCode: `APP_TEN_A_${suffix}`,
          name: "Tenant A",
          status: "ACTIVE",
        })
        .returning();
      const [tb] = await db
        .insert(tenants)
        .values({
          tenantCode: `APP_TEN_B_${suffix}`,
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
          candidateCode: `APP_TCON_C_${suffix}`,
          firstName: "Casey",
          lastName: "Applicant",
          email: `app.tcon.${suffix}@example.com`,
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();
      candidateOnAId = c.candidateId;

      const [rA] = await db
        .insert(jobRequisitions)
        .values({
          tenantId: tenantAId,
          requisitionCode: `REQ_A_${suffix}`,
          title: "Engineer A",
          status: "OPEN",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();
      requisitionOnAId = rA.requisitionId;

      const [rB] = await db
        .insert(jobRequisitions)
        .values({
          tenantId: tenantBId,
          requisitionCode: `REQ_B_${suffix}`,
          title: "Engineer B",
          status: "OPEN",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();
      requisitionOnBId = rB.requisitionId;
    });

    afterAll(async () => {
      await db.delete(applications).where(eq(applications.tenantId, tenantAId));
      await db.delete(applications).where(eq(applications.tenantId, tenantBId));
      await db.delete(jobRequisitions).where(eq(jobRequisitions.tenantId, tenantAId));
      await db.delete(jobRequisitions).where(eq(jobRequisitions.tenantId, tenantBId));
      await db.delete(candidates).where(eq(candidates.tenantId, tenantAId));
      await db.delete(candidates).where(eq(candidates.tenantId, tenantBId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantAId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantBId));
    });

    const baseRow = () => ({
      applicationDate: "2026-03-20",
      createdBy: 1,
      updatedBy: 1,
    });

    it("rejects when tenantId disagrees with candidate.tenantId", async () => {
      await expect(
        createApplication(db, {
          ...baseRow(),
          tenantId: tenantBId,
          candidateId: candidateOnAId,
          requisitionId: requisitionOnAId,
        })
      ).rejects.toMatchObject({
        name: "ApplicationTenantMismatchError",
        code: "APPLICATION_TENANT_MISMATCH",
        message: expect.stringMatching(/Candidate tenant mismatch/i),
      });
    });

    it("rejects when tenantId disagrees with requisition.tenantId", async () => {
      await expect(
        createApplication(db, {
          ...baseRow(),
          tenantId: tenantAId,
          candidateId: candidateOnAId,
          requisitionId: requisitionOnBId,
        })
      ).rejects.toMatchObject({
        name: "ApplicationTenantMismatchError",
        code: "APPLICATION_TENANT_MISMATCH",
        message: expect.stringMatching(/Requisition tenant mismatch/i),
      });
    });

    it("inserts when tenantId matches candidate and requisition", async () => {
      const row = await createApplication(db, {
        ...baseRow(),
        tenantId: tenantAId,
        candidateId: candidateOnAId,
        requisitionId: requisitionOnAId,
      });
      expect(row.tenantId).toBe(tenantAId);
      expect(row.candidateId).toBe(candidateOnAId);
      expect(row.requisitionId).toBe(requisitionOnAId);

      await db.delete(applications).where(eq(applications.applicationId, row.applicationId));
    });
  }
);
