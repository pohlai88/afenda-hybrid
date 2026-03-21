/**
 * Social insurance profile Zod rules (scheme vs legacy name, rates, dates, immutable tenant/employee).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/social-insurance-profiles-zod.test.ts
 *
 * Duplicate ACTIVE enrollment per employee/scheme is enforced by DB partial unique indexes, not Zod.
 */
import { describe, expect, it } from "vitest";
import {
  socialInsuranceProfileInsertSchema,
  socialInsuranceProfileUpdateSchema,
} from "../schema-hrm/payroll/fundamentals/socialInsuranceProfiles";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertWithScheme = {
  tenantId: 1,
  employeeId: 10,
  statutorySchemeId: 3,
  employeeContributionRate: "0.0500",
  employerContributionRate: "0.0500",
  effectiveFrom: new Date("2026-01-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("social insurance profile Zod schemas", () => {
  describe("socialInsuranceProfileInsertSchema", () => {
    it("rejects missing statutorySchemeId and schemeName", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileInsertSchema,
        {
          tenantId: 1,
          employeeId: 11,
          employeeContributionRate: "0.01",
          employerContributionRate: "0.01",
          effectiveFrom: new Date("2026-01-01"),
          createdBy: 1,
          updatedBy: 1,
        },
        "statutorySchemeId",
      );
    });

    it("accepts legacy schemeName without statutorySchemeId", () => {
      expect(
        socialInsuranceProfileInsertSchema.safeParse({
          tenantId: 1,
          employeeId: 12,
          schemeName: "Legacy national pension",
          employeeContributionRate: "0.01",
          employerContributionRate: "0.01",
          effectiveFrom: new Date("2026-01-01"),
          createdBy: 1,
          updatedBy: 1,
        }).success,
      ).toBe(true);
    });

    it("rejects employeeContributionRate above 1", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileInsertSchema,
        { ...validInsertWithScheme, employeeId: 13, employeeContributionRate: "1.0001" },
        "employeeContributionRate",
      );
    });

    it("rejects negative employerContributionRate", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileInsertSchema,
        { ...validInsertWithScheme, employeeId: 14, employerContributionRate: "-0.01" },
        "employerContributionRate",
      );
    });

    it("rejects rate with more than 4 decimal places", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileInsertSchema,
        { ...validInsertWithScheme, employeeId: 15, employeeContributionRate: "0.12345" },
        "employeeContributionRate",
      );
    });

    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileInsertSchema,
        {
          ...validInsertWithScheme,
          employeeId: 16,
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(
        socialInsuranceProfileInsertSchema,
        validInsertWithScheme,
        "status",
        "RETIRED",
      );
    });

    it("accepts statutorySchemeId path with valid rates", () => {
      expect(socialInsuranceProfileInsertSchema.safeParse(validInsertWithScheme).success).toBe(true);
    });
  });

  describe("socialInsuranceProfileUpdateSchema", () => {
    it("rejects clearing both statutorySchemeId and schemeName in one patch", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileUpdateSchema,
        { statutorySchemeId: null, schemeName: null },
        "statutorySchemeId",
      );
    });

    it("rejects clearing both when schemeName is blank string", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileUpdateSchema,
        { statutorySchemeId: null, schemeName: "   " },
        "statutorySchemeId",
      );
    });

    it("allows clearing insuranceNumber and effectiveTo with null", () => {
      expect(
        socialInsuranceProfileUpdateSchema.safeParse({
          insuranceNumber: null,
          effectiveTo: null,
        }).success,
      ).toBe(true);
    });

    it("strips tenantId and employeeId from the patch shape", () => {
      const r = socialInsuranceProfileUpdateSchema.safeParse({
        tenantId: 99,
        employeeId: 88,
        insuranceNumber: "NEW-123",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data.insuranceNumber).toBe("NEW-123");
    });

    it("rejects invalid rate on patch", () => {
      expectZodIssueAtPath(
        socialInsuranceProfileUpdateSchema,
        { employeeContributionRate: "2" },
        "employeeContributionRate",
      );
    });
  });
});
