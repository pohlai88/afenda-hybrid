/**
 * Optional `one` relations on benefits RQB: plan provider/currency, claim reviewer.
 * Run: pnpm test:db -- src/__tests__/benefits-optional-relations.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { persons } from "../schema-hrm/hr/people/persons";
import { employees } from "../schema-hrm/hr/fundamentals/employees";
import { benefitsProviders } from "../schema-hrm/benefits/fundamentals/benefitsProviders";
import { benefitPlans } from "../schema-hrm/benefits/fundamentals/benefitPlans";
import { benefitEnrollments } from "../schema-hrm/benefits/operations/benefitEnrollments";
import { claimsRecords } from "../schema-hrm/benefits/operations/claimsRecords";

describe("benefits optional RQB relations", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let tenantId: number;
  let currencyId: number;
  let providerId: number;
  let employeeId: number;
  let reviewerEmployeeId: number;
  let planFullId: number;
  let planMinId: number;
  let enrollmentId: number;
  let claimNoReviewerId: number;
  let claimWithReviewerId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `BR_OPT_${suffix}`,
        name: "Benefits relation test tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = `TST${suffix.replace(/\W/g, "")}`.toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Test tender",
        symbol: "T",
      })
      .returning();
    currencyId = cur.currencyId;

    const [pClaim] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_CLM_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    const [pRev] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_REV_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [eClaim] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: pClaim.personId,
        employeeCode: `E_CLM_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId = eClaim.employeeId;

    const [eRev] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: pRev.personId,
        employeeCode: `E_REV_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    reviewerEmployeeId = eRev.employeeId;

    const [prov] = await db
      .insert(benefitsProviders)
      .values({
        tenantId,
        providerCode: `PRV_${suffix}`,
        name: "Test Provider",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    providerId = prov.providerId;

    const [pf] = await db
      .insert(benefitPlans)
      .values({
        tenantId,
        planCode: `P_FULL_${suffix}`,
        name: "Plan with provider and currency",
        planType: "HEALTH_INSURANCE",
        effectiveFrom: "2026-01-01",
        providerId,
        currencyId,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    planFullId = pf.benefitPlanId;

    const [pm] = await db
      .insert(benefitPlans)
      .values({
        tenantId,
        planCode: `P_MIN_${suffix}`,
        name: "Plan without provider or currency",
        planType: "WELLNESS",
        effectiveFrom: "2026-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    planMinId = pm.benefitPlanId;

    const [en] = await db
      .insert(benefitEnrollments)
      .values({
        tenantId,
        employeeId,
        benefitPlanId: planFullId,
        enrollmentDate: "2026-02-01",
        effectiveFrom: "2026-02-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    enrollmentId = en.enrollmentId;

    const [c0] = await db
      .insert(claimsRecords)
      .values({
        tenantId,
        enrollmentId,
        employeeId,
        claimNumber: `CLM-NR-${suffix}`,
        claimDate: "2026-03-01",
        serviceDate: "2026-02-20",
        claimAmount: "100.00",
        currencyId,
        description: "No reviewer",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    claimNoReviewerId = c0.claimRecordId;

    const [c1] = await db
      .insert(claimsRecords)
      .values({
        tenantId,
        enrollmentId,
        employeeId,
        claimNumber: `CLM-RV-${suffix}`,
        claimDate: "2026-03-02",
        serviceDate: "2026-02-21",
        claimAmount: "200.00",
        currencyId,
        description: "With reviewer",
        reviewedBy: reviewerEmployeeId,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    claimWithReviewerId = c1.claimRecordId;
  });

  afterAll(async () => {
    await db.delete(claimsRecords).where(eq(claimsRecords.tenantId, tenantId));
    await db.delete(benefitEnrollments).where(eq(benefitEnrollments.tenantId, tenantId));
    await db.delete(benefitPlans).where(eq(benefitPlans.tenantId, tenantId));
    await db.delete(benefitsProviders).where(eq(benefitsProviders.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
  });

  it("benefitPlan loads null provider and currency when FKs are unset", async () => {
    const row = await db.query.benefitPlans.findFirst({
      where: { AND: [{ tenantId: { eq: tenantId } }, { benefitPlanId: { eq: planMinId } }] },
      with: { provider: true, currency: true },
    });
    expect(row).toBeDefined();
    expect(row!.provider == null).toBe(true);
    expect(row!.currency == null).toBe(true);
  });

  it("benefitPlan resolves provider and currency when FKs are set", async () => {
    const row = await db.query.benefitPlans.findFirst({
      where: { AND: [{ tenantId: { eq: tenantId } }, { benefitPlanId: { eq: planFullId } }] },
      with: { provider: true, currency: true },
    });
    expect(row).toBeDefined();
    expect(row!.provider).toBeDefined();
    expect(row!.provider!.providerId).toBe(providerId);
    expect(row!.currency).toBeDefined();
    expect(row!.currency!.currencyId).toBe(currencyId);
  });

  it("claimsRecord reviewer is absent when reviewedBy is null", async () => {
    const row = await db.query.claimsRecords.findFirst({
      where: {
        AND: [{ tenantId: { eq: tenantId } }, { claimRecordId: { eq: claimNoReviewerId } }],
      },
      with: { reviewer: true },
    });
    expect(row).toBeDefined();
    expect(row!.reviewer == null).toBe(true);
  });

  it("claimsRecord resolves reviewer employee when reviewedBy is set", async () => {
    const row = await db.query.claimsRecords.findFirst({
      where: {
        AND: [{ tenantId: { eq: tenantId } }, { claimRecordId: { eq: claimWithReviewerId } }],
      },
      with: { reviewer: true },
    });
    expect(row).toBeDefined();
    expect(row!.reviewer).toBeDefined();
    expect(row!.reviewer!.employeeId).toBe(reviewerEmployeeId);
  });
});
