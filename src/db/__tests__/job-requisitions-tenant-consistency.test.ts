/**
 * Service-layer guard: job requisition tenantId must match optional department.tenantId.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/job-requisitions-tenant-consistency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { departments } from "../schema-hrm/hr/fundamentals/departments";
import { jobRequisitions } from "../schema-hrm/recruitment/operations/jobRequisitions";
import { createJobRequisition } from "@db/_services/recruitment";

describe.skipIf(!process.env.DATABASE_URL)("job_requisitions create — reference tenant alignment (service)", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let tenantAId: number;
  let tenantBId: number;
  let departmentAId: number;

  beforeAll(async () => {
    const [ta] = await db
      .insert(tenants)
      .values({
        tenantCode: `JR_TA_${suffix}`,
        name: "Tenant A",
        status: "ACTIVE",
      })
      .returning();
    const [tb] = await db
      .insert(tenants)
      .values({
        tenantCode: `JR_TB_${suffix}`,
        name: "Tenant B",
        status: "ACTIVE",
      })
      .returning();
    tenantAId = ta.tenantId;
    tenantBId = tb.tenantId;

    const [d] = await db
      .insert(departments)
      .values({
        tenantId: tenantAId,
        departmentCode: `JR_DEPT_${suffix}`,
        name: "Engineering",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    departmentAId = d.departmentId;
  });

  afterAll(async () => {
    await db.delete(jobRequisitions).where(eq(jobRequisitions.tenantId, tenantAId));
    await db.delete(jobRequisitions).where(eq(jobRequisitions.tenantId, tenantBId));
    await db.delete(departments).where(eq(departments.departmentId, departmentAId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantAId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantBId));
  });

  const baseRow = () => ({
    requisitionCode: `JR-${suffix}`,
    title: "Backend role",
    headcount: 1,
    createdBy: 1,
    updatedBy: 1,
  });

  it("rejects when tenantId disagrees with department.tenantId", async () => {
    await expect(
      createJobRequisition(db, {
        ...baseRow(),
        requisitionCode: `JR-MIS-${suffix}`,
        tenantId: tenantBId,
        departmentId: departmentAId,
      }),
    ).rejects.toMatchObject({
      name: "JobRequisitionReferenceTenantMismatchError",
      code: "JOB_REQUISITION_REFERENCE_TENANT_MISMATCH",
      message: expect.stringMatching(/Department tenant mismatch/i),
    });
  });

  it("inserts when tenantId matches department", async () => {
    const row = await createJobRequisition(db, {
      ...baseRow(),
      requisitionCode: `JR-OK-${suffix}`,
      tenantId: tenantAId,
      departmentId: departmentAId,
    });
    expect(row.tenantId).toBe(tenantAId);
    expect(row.departmentId).toBe(departmentAId);

    await db.delete(jobRequisitions).where(eq(jobRequisitions.requisitionId, row.requisitionId));
  });
});
