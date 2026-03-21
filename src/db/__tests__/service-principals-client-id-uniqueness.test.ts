/**
 * Partial unique on clientId where deletedAt IS NULL — reuse clientId after soft delete.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/service-principals-client-id-uniqueness.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { servicePrincipals } from "../schema-platform/security/servicePrincipals";
import { matchesPgError } from "./pg-error";

describe.skipIf(!process.env.DATABASE_URL)("service_principals clientId partial unique index", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  /** Fixed UUID so two rows intentionally share clientId across lifecycle scenarios */
  const sharedClientId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  let tenantId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `SP_CI_${suffix}`,
        name: "Service principal uniqueness tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;
  });

  afterAll(async () => {
    await db.delete(servicePrincipals).where(eq(servicePrincipals.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects a second active row with the same clientId", async () => {
    await db.insert(servicePrincipals).values({
      tenantId,
      clientId: sharedClientId,
      name: `SP-first-${suffix}`,
      createdBy: 1,
      updatedBy: 1,
    });

    let err: unknown;
    try {
      await db.insert(servicePrincipals).values({
        tenantId,
        clientId: sharedClientId,
        name: `SP-dup-${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      });
    } catch (e) {
      err = e;
    }

    const isPgUnique =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505";

    expect(
      isPgUnique ||
        matchesPgError(/23505|uq_service_principals_client_id|duplicate key|unique/i)(err),
    ).toBe(true);
  });

  it("allows inserting the same clientId after the prior row is soft-deleted", async () => {
    await db.delete(servicePrincipals).where(eq(servicePrincipals.tenantId, tenantId));

    const [first] = await db
      .insert(servicePrincipals)
      .values({
        tenantId,
        clientId: sharedClientId,
        name: `SP-soft-${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    await db
      .update(servicePrincipals)
      .set({ deletedAt: new Date(), updatedBy: 1 })
      .where(eq(servicePrincipals.servicePrincipalId, first.servicePrincipalId));

    const [second] = await db
      .insert(servicePrincipals)
      .values({
        tenantId,
        clientId: sharedClientId,
        name: `SP-reuse-${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    expect(second.clientId).toBe(sharedClientId);
    expect(second.servicePrincipalId).not.toBe(first.servicePrincipalId);
  });
});
