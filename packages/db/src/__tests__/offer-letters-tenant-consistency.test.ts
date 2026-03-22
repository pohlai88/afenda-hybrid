/**
 * Service-layer guard: offer letter tenantId must match applications.tenantId.
 * Run: pnpm test:db -- src/__tests__/offer-letters-tenant-consistency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { candidates } from "../schema-hrm/recruitment/fundamentals/candidates";
import { jobRequisitions } from "../schema-hrm/recruitment/operations/jobRequisitions";
import { applications } from "../schema-hrm/recruitment/operations/applications";
import { offerLetters } from "../schema-hrm/recruitment/operations/offerLetters";
import { createOfferLetter } from "@db/_services/recruitment";

describe.skipIf(!process.env.DATABASE_URL)(
  "offer_letters create — tenant consistency (service)",
  () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let tenantAId: number;
    let tenantBId: number;
    let applicationId: number;
    let currencyId: number;

    beforeAll(async () => {
      const [ta] = await db
        .insert(tenants)
        .values({
          tenantCode: `OFF_TA_${suffix}`,
          name: "Tenant A",
          status: "ACTIVE",
        })
        .returning();
      const [tb] = await db
        .insert(tenants)
        .values({
          tenantCode: `OFF_TB_${suffix}`,
          name: "Tenant B",
          status: "ACTIVE",
        })
        .returning();
      tenantAId = ta.tenantId;
      tenantBId = tb.tenantId;

      const [cur] = await db
        .insert(currencies)
        .values({
          currencyCode: `ZZ${suffix.slice(0, 5)}`,
          name: "Test currency",
          symbol: "Z",
        })
        .returning();
      currencyId = cur.currencyId;

      const [c] = await db
        .insert(candidates)
        .values({
          tenantId: tenantAId,
          candidateCode: `OFF_C_${suffix}`,
          firstName: "Olivia",
          lastName: "Offer",
          email: `offer.${suffix}@example.com`,
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      const [req] = await db
        .insert(jobRequisitions)
        .values({
          tenantId: tenantAId,
          requisitionCode: `OFF_REQ_${suffix}`,
          title: "Engineer",
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
      await db.delete(offerLetters).where(eq(offerLetters.applicationId, applicationId));
      await db.delete(applications).where(eq(applications.applicationId, applicationId));
      await db.delete(jobRequisitions).where(eq(jobRequisitions.tenantId, tenantAId));
      await db.delete(candidates).where(eq(candidates.tenantId, tenantAId));
      await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantAId));
      await db.delete(tenants).where(eq(tenants.tenantId, tenantBId));
    });

    const baseRow = () => ({
      applicationId,
      offerCode: `OFF-${suffix}`,
      baseSalary: "95000.00",
      currencyId,
      startDate: "2026-06-01",
      expiryDate: "2026-07-01",
      createdBy: 1,
      updatedBy: 1,
    });

    it("rejects when tenantId disagrees with applications.tenantId", async () => {
      await expect(
        createOfferLetter(db, {
          ...baseRow(),
          tenantId: tenantBId,
        })
      ).rejects.toMatchObject({
        name: "OfferLetterTenantMismatchError",
        code: "OFFER_LETTER_TENANT_MISMATCH",
        message: expect.stringMatching(/Application tenant mismatch/i),
      });
    });

    it("inserts when tenantId matches application", async () => {
      const row = await createOfferLetter(db, {
        ...baseRow(),
        offerCode: `OFF-OK-${suffix}`,
        tenantId: tenantAId,
      });
      expect(row.tenantId).toBe(tenantAId);
      expect(row.applicationId).toBe(applicationId);

      await db.delete(offerLetters).where(eq(offerLetters.offerLetterId, row.offerLetterId));
    });
  }
);
