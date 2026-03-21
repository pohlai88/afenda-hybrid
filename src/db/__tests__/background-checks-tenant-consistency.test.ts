/**
 * Service-layer guard: background check tenantId must match candidate row.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/background-checks-tenant-consistency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ZodError } from "zod/v4";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { backgroundChecks } from "../schema-hrm/recruitment/operations/backgroundChecks";
import { createBackgroundCheck } from "@db/_services/recruitment";

describe.skipIf(!process.env.DATABASE_URL)("background checks create — tenant consistency (service)", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let tenantAId: number;
  let tenantBId: number;
  let candidateOnAId: number;

  beforeAll(async () => {
    const [ta] = await db
      .insert(tenants)
      .values({
        tenantCode: `BC_TEN_A_${suffix}`,
        name: "Tenant A",
        status: "ACTIVE",
      })
      .returning();
    const [tb] = await db
      .insert(tenants)
      .values({
        tenantCode: `BC_TEN_B_${suffix}`,
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
        candidateCode: `BC_C_${suffix}`,
        firstName: "Blair",
        lastName: "Check",
        email: `bc.tcon.${suffix}@example.com`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    candidateOnAId = c.candidateId;
  });

  afterAll(async () => {
    await db.delete(backgroundChecks).where(eq(backgroundChecks.tenantId, tenantAId));
    await db.delete(backgroundChecks).where(eq(backgroundChecks.tenantId, tenantBId));
    await db.delete(candidates).where(eq(candidates.tenantId, tenantAId));
    await db.delete(candidates).where(eq(candidates.tenantId, tenantBId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantAId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantBId));
  });

  const baseRow = () => ({
    checkType: "IDENTITY" as const,
    requestedDate: "2026-03-20",
    createdBy: 1,
    updatedBy: 1,
  });

  it("throws ZodError when result is set without status COMPLETED (insert schema)", async () => {
    const err = await createBackgroundCheck(db, {
      ...baseRow(),
      tenantId: tenantAId,
      candidateId: candidateOnAId,
      result: "CLEAR",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ZodError);
    if (err instanceof ZodError) {
      expect(err.issues.some((i) => i.path.join(".") === "result")).toBe(true);
    }
  });

  it("rejects when tenantId disagrees with candidate.tenantId", async () => {
    await expect(
      createBackgroundCheck(db, {
        ...baseRow(),
        tenantId: tenantBId,
        candidateId: candidateOnAId,
      }),
    ).rejects.toMatchObject({
      name: "BackgroundCheckTenantMismatchError",
      code: "BACKGROUND_CHECK_TENANT_MISMATCH",
      message: expect.stringMatching(/Candidate tenant mismatch/i),
    });
  });

  it("inserts when tenantId matches candidate", async () => {
    const row = await createBackgroundCheck(db, {
      ...baseRow(),
      tenantId: tenantAId,
      candidateId: candidateOnAId,
    });
    expect(row.tenantId).toBe(tenantAId);
    expect(row.candidateId).toBe(candidateOnAId);

    await db.delete(backgroundChecks).where(eq(backgroundChecks.backgroundCheckId, row.backgroundCheckId));
  });
});
