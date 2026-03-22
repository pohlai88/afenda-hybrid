/**
 * Benefit plan Zod rules (enums, date range, non-negative decimals).
 * Run: pnpm test:db -- src/__tests__/benefit-plans-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  benefitPlanInsertSchema,
  benefitPlanUpdateSchema,
} from "../schema-hrm/benefits/fundamentals/benefitPlans";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  planCode: "BP-001",
  name: "Gold Health",
  planType: "HEALTH_INSURANCE" as const,
  effectiveFrom: new Date("2026-01-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("benefit plan Zod schemas", () => {
  describe("benefitPlanInsertSchema — enums", () => {
    it("rejects invalid planType", () => {
      expectInvalidEnumField(
        benefitPlanInsertSchema,
        validInsertBase,
        "planType",
        "AUTO_INSURANCE"
      );
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(benefitPlanInsertSchema, validInsertBase, "status", "ARCHIVED");
    });

    it("accepts each plan type", () => {
      const types = [
        "HEALTH_INSURANCE",
        "DENTAL",
        "VISION",
        "LIFE_INSURANCE",
        "DISABILITY",
        "RETIREMENT",
        "WELLNESS",
        "OTHER",
      ] as const;
      for (const planType of types) {
        expect(
          benefitPlanInsertSchema.safeParse({
            ...validInsertBase,
            planCode: `BP-${planType}`,
            planType,
          }).success
        ).toBe(true);
      }
    });

    it("omitting status is valid (DB default DRAFT)", () => {
      expect(benefitPlanInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("accepts optional providerId and currencyId when positive", () => {
      expect(
        benefitPlanInsertSchema.safeParse({
          ...validInsertBase,
          planCode: "BP-LINKED",
          providerId: 9,
          currencyId: 3,
        }).success
      ).toBe(true);
    });
  });

  describe("benefitPlanInsertSchema — effective range", () => {
    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        benefitPlanInsertSchema,
        {
          ...validInsertBase,
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo"
      );
    });

    it("accepts effectiveTo equal to effectiveFrom", () => {
      const d = new Date("2026-03-15");
      expect(
        benefitPlanInsertSchema.safeParse({
          ...validInsertBase,
          planCode: "BP-SAME",
          effectiveFrom: d,
          effectiveTo: d,
        }).success
      ).toBe(true);
    });
  });

  describe("benefitPlanInsertSchema — contributions", () => {
    it("rejects negative employeeContribution string", () => {
      expectZodIssueAtPath(
        benefitPlanInsertSchema,
        { ...validInsertBase, planCode: "BP-NEG", employeeContribution: "-1.00" },
        "employeeContribution"
      );
    });

    it("rejects negative coverageAmount string", () => {
      expectZodIssueAtPath(
        benefitPlanInsertSchema,
        { ...validInsertBase, planCode: "BP-COV", coverageAmount: "-100.00" },
        "coverageAmount"
      );
    });
  });

  describe("benefitPlanUpdateSchema", () => {
    it("rejects invalid planType on patch", () => {
      expectZodIssueAtPath(benefitPlanUpdateSchema, { planType: "INVALID" }, "planType");
    });

    it("rejects effectiveTo before effectiveFrom when both are in the patch", () => {
      expectZodIssueAtPath(
        benefitPlanUpdateSchema,
        {
          effectiveFrom: new Date("2027-01-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo"
      );
    });

    it("allows clearing description, coverageAmount, and maxDependents with null", () => {
      expect(
        benefitPlanUpdateSchema.safeParse({
          description: null,
          coverageAmount: null,
          maxDependents: null,
        }).success
      ).toBe(true);
    });
  });
});
