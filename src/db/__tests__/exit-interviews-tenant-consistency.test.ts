/**
 * Service-layer guard: exit interview tenantId/employeeId align with linked offboarding checklist.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/exit-interviews-tenant-consistency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { offboardingChecklists } from "../schema-hrm/recruitment/operations/offboardingChecklists";
import { exitInterviews } from "../schema-hrm/recruitment/operations/exitInterviews";
import { createExitInterview } from "@db/_services/recruitment";

describe.skipIf(!process.env.DATABASE_URL)("exit_interviews create — linked checklist alignment (service)", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const employeeId = 800_000 + Math.floor(Math.random() * 10_000);
  let tenantAId: number;
  let tenantBId: number;
  let checklistId: number;

  beforeAll(async () => {
    const [ta] = await db
      .insert(tenants)
      .values({
        tenantCode: `EXIT_TA_${suffix}`,
        name: "Tenant A",
        status: "ACTIVE",
      })
      .returning();
    const [tb] = await db
      .insert(tenants)
      .values({
        tenantCode: `EXIT_TB_${suffix}`,
        name: "Tenant B",
        status: "ACTIVE",
      })
      .returning();
    tenantAId = ta.tenantId;
    tenantBId = tb.tenantId;

    const [cl] = await db
      .insert(offboardingChecklists)
      .values({
        tenantId: tenantAId,
        employeeId,
        taskName: "Exit conversation",
        taskCategory: "EXIT_INTERVIEW",
        sequenceNumber: 1,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    checklistId = cl.offboardingChecklistId;
  });

  afterAll(async () => {
    await db.delete(exitInterviews).where(eq(exitInterviews.linkedOffboardingChecklistId, checklistId));
    await db.delete(offboardingChecklists).where(eq(offboardingChecklists.offboardingChecklistId, checklistId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantAId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantBId));
  });

  const baseRow = () => ({
    employeeId,
    linkedOffboardingChecklistId: checklistId,
    format: "VIDEO" as const,
    createdBy: 1,
    updatedBy: 1,
  });

  it("rejects when tenantId disagrees with linked checklist.tenantId", async () => {
    await expect(
      createExitInterview(db, {
        ...baseRow(),
        tenantId: tenantBId,
      }),
    ).rejects.toMatchObject({
      name: "ExitInterviewLinkedChecklistMismatchError",
      code: "EXIT_INTERVIEW_LINKED_CHECKLIST_MISMATCH",
      message: expect.stringMatching(/Checklist tenant mismatch/i),
    });
  });

  it("rejects when employeeId disagrees with linked checklist.employeeId", async () => {
    await expect(
      createExitInterview(db, {
        ...baseRow(),
        tenantId: tenantAId,
        employeeId: employeeId + 99_999,
      }),
    ).rejects.toMatchObject({
      name: "ExitInterviewLinkedChecklistMismatchError",
      code: "EXIT_INTERVIEW_LINKED_CHECKLIST_MISMATCH",
      message: expect.stringMatching(/Checklist employee mismatch/i),
    });
  });

  it("inserts when tenantId and employeeId match linked checklist", async () => {
    const row = await createExitInterview(db, {
      ...baseRow(),
      tenantId: tenantAId,
    });
    expect(row.tenantId).toBe(tenantAId);
    expect(row.employeeId).toBe(employeeId);
    expect(row.linkedOffboardingChecklistId).toBe(checklistId);

    await db.delete(exitInterviews).where(eq(exitInterviews.exitInterviewId, row.exitInterviewId));
  });
});
