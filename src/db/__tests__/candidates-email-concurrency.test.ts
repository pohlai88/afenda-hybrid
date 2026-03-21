/**
 * Partial unique on (tenantId, lower(email)) where deletedAt IS NULL — concurrent creates can race.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/candidates-email-concurrency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { matchesPgError } from "./pg-error";

describe.skipIf(!process.env.DATABASE_URL)("candidates email partial unique (concurrent inserts)", () => {
  let tenantId: number;
  let pool: Pool;
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `CCT_${suffix}`,
        name: "Concurrent candidate tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL?.trim() ||
        "postgresql://postgres:postgres@localhost:5433/afenda_test",
      max: 4,
    });
  });

  afterAll(async () => {
    await db.delete(candidates).where(eq(candidates.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
    await pool.end();
  });

  it("exact same email: one concurrent insert succeeds, the other hits Postgres unique violation (23505)", async () => {
    const email = `same.${suffix}@concurrency.test`;
    const insertSql = `
      INSERT INTO "recruitment"."candidates"
        ("tenantId", "candidateCode", "firstName", "lastName", "email", "createdBy", "updatedBy")
      VALUES ($1, $2, $3, $4, $5, 1, 1)
    `;

    const [r1, r2] = await Promise.allSettled([
      pool.query(insertSql, [tenantId, `C-A-${suffix}`, "A", "B", email]),
      pool.query(insertSql, [tenantId, `C-B-${suffix}`, "A", "B", email]),
    ]);

    const fulfilled = [r1, r2].filter((r) => r.status === "fulfilled");
    const rejected = [r1, r2].filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const err = (rejected[0] as PromiseRejectedResult).reason;
    const isPgUnique =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505";

    expect(
      isPgUnique || matchesPgError(/23505|uq_candidates_email|duplicate key|unique/i)(err),
    ).toBe(true);
  });

  it("case-differing emails same normalization: concurrent inserts still collide on uq_candidates_email", async () => {
    const insertSql = `
      INSERT INTO "recruitment"."candidates"
        ("tenantId", "candidateCode", "firstName", "lastName", "email", "createdBy", "updatedBy")
      VALUES ($1, $2, $3, $4, $5, 1, 1)
    `;
    const tag = `${suffix}_ci`;

    const [r1, r2] = await Promise.allSettled([
      pool.query(insertSql, [tenantId, `C-CI1-${tag}`, "A", "B", `Mixed.Case.${tag}@Test.Com`]),
      pool.query(insertSql, [tenantId, `C-CI2-${tag}`, "A", "B", `mixed.case.${tag}@test.com`]),
    ]);

    const fulfilled = [r1, r2].filter((r) => r.status === "fulfilled");
    const rejected = [r1, r2].filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const err = (rejected[0] as PromiseRejectedResult).reason;
    const isPgUnique =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505";

    expect(
      isPgUnique || matchesPgError(/23505|uq_candidates_email|duplicate key|unique/i)(err),
    ).toBe(true);
  });
});
