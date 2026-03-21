/**
 * Partial unique uq_applications_candidate_requisition (deletedAt IS NULL) — concurrent inserts can race.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/applications-concurrency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { jobRequisitions } from "../schema-hrm/recruitment/operations/jobRequisitions";
import { applications } from "../schema-hrm/recruitment/operations/applications";
import { matchesPgError } from "./pg-error";

describe.skipIf(!process.env.DATABASE_URL)("applications partial unique (concurrent inserts)", () => {
  let tenantId: number;
  let candidateId: number;
  let requisitionId: number;
  let pool: Pool;
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `APP_CT_${suffix}`,
        name: "Application concurrency tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const [c] = await db
      .insert(candidates)
      .values({
        tenantId,
        candidateCode: `APP_C_${suffix}`,
        firstName: "Pat",
        lastName: "Applicant",
        email: `app.conc.${suffix}@example.com`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    candidateId = c.candidateId;

    const [req] = await db
      .insert(jobRequisitions)
      .values({
        tenantId,
        requisitionCode: `REQ_${suffix}`,
        title: "Engineer",
        status: "OPEN",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    requisitionId = req.requisitionId;

    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL?.trim() ||
        "postgresql://postgres:postgres@localhost:5433/afenda_test",
      max: 4,
    });
  });

  afterAll(async () => {
    await db.delete(applications).where(eq(applications.tenantId, tenantId));
    await db.delete(jobRequisitions).where(eq(jobRequisitions.tenantId, tenantId));
    await db.delete(candidates).where(eq(candidates.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
    await pool.end();
  });

  it("same triple: one concurrent insert succeeds, the other hits unique violation (23505)", async () => {
    const appDate = "2026-03-20";
    const insertSql = `
      INSERT INTO "recruitment"."applications"
        ("tenantId", "candidateId", "requisitionId", "applicationDate", "createdBy", "updatedBy")
      VALUES ($1, $2, $3, $4::date, 1, 1)
    `;

    const [r1, r2] = await Promise.allSettled([
      pool.query(insertSql, [tenantId, candidateId, requisitionId, appDate]),
      pool.query(insertSql, [tenantId, candidateId, requisitionId, appDate]),
    ]);

    const fulfilled = [r1, r2].filter((x) => x.status === "fulfilled");
    const rejected = [r1, r2].filter((x) => x.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const err = (rejected[0] as PromiseRejectedResult).reason;
    const isPgUnique =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505";

    expect(
      isPgUnique || matchesPgError(/23505|uq_applications_candidate_requisition|duplicate key|unique/i)(err),
    ).toBe(true);
  });
});
