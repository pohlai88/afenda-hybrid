/**
 * Candidate databank Zod rules (salary bundle, referrer).
 * Run: pnpm test:db -- src/__tests__/candidates-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  candidateInsertSchema,
  candidateUpdateSchema,
} from "../schema-hrm/recruitment/fundamentals/candidates";

const validInsertBase = {
  tenantId: 1,
  candidateCode: "C-001",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  createdBy: 1,
  updatedBy: 1,
};

describe("candidate Zod schemas (databank rules)", () => {
  describe("candidateInsertSchema", () => {
    it("accepts expectedSalaryAmount as string with currency and period", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        expectedSalaryAmount: "85000.50",
        expectedSalaryCurrencyId: 1,
        expectedSalaryPeriod: "ANNUAL" as const,
      });
      expect(r.success).toBe(true);
    });

    it("accepts expectedSalaryAmount as number and coerces to decimal string shape", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        expectedSalaryAmount: 85000.5,
        expectedSalaryCurrencyId: 1,
        expectedSalaryPeriod: "ANNUAL" as const,
      });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.expectedSalaryAmount).toBe("85000.5");
      }
    });

    it("rejects amount without currency or period", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        expectedSalaryAmount: "50000",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        const paths = r.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("expectedSalaryCurrencyId");
        expect(paths).toContain("expectedSalaryPeriod");
      }
    });

    it("rejects referredBy zero", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        referredBy: 0,
      });
      expect(r.success).toBe(false);
    });

    it("rejects HIRED without personId and convertedEmployeeId", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        status: "HIRED" as const,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        const paths = r.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("personId");
        expect(paths).toContain("convertedEmployeeId");
      }
    });

    it("accepts HIRED when HR bridge ids are set", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        status: "HIRED" as const,
        personId: 10,
        convertedEmployeeId: 20,
      });
      expect(r.success).toBe(true);
    });
  });

  describe("candidateUpdateSchema", () => {
    it("does not require currency when clearing amount with null", () => {
      const r = candidateUpdateSchema.safeParse({
        expectedSalaryAmount: null,
      });
      expect(r.success).toBe(true);
    });

    it("requires currency and period when setting amount via number", () => {
      const r = candidateUpdateSchema.safeParse({
        expectedSalaryAmount: 1000,
      });
      expect(r.success).toBe(false);
    });

    it("allows status HIRED only (DB validates merged row)", () => {
      const r = candidateUpdateSchema.safeParse({
        status: "HIRED" as const,
      });
      expect(r.success).toBe(true);
    });

    it("rejects status HIRED with only personId in patch", () => {
      const r = candidateUpdateSchema.safeParse({
        status: "HIRED" as const,
        personId: 1,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "convertedEmployeeId")).toBe(true);
      }
    });

    it("accepts status HIRED with both HR ids in patch", () => {
      const r = candidateUpdateSchema.safeParse({
        status: "HIRED" as const,
        personId: 1,
        convertedEmployeeId: 2,
      });
      expect(r.success).toBe(true);
    });

    it("rejects status HIRED with explicit null personId", () => {
      const r = candidateUpdateSchema.safeParse({
        status: "HIRED" as const,
        personId: null,
      });
      expect(r.success).toBe(false);
    });
  });

  describe("salary boundaries", () => {
    it("rejects insert amount with more than 2 decimal places (number)", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        expectedSalaryAmount: 100.123,
        expectedSalaryCurrencyId: 1,
        expectedSalaryPeriod: "ANNUAL" as const,
      });
      expect(r.success).toBe(false);
    });

    it("accepts insert at numeric max boundary", () => {
      const r = candidateInsertSchema.safeParse({
        ...validInsertBase,
        expectedSalaryAmount: "999999999999.99",
        expectedSalaryCurrencyId: 1,
        expectedSalaryPeriod: "ANNUAL" as const,
      });
      expect(r.success).toBe(true);
    });
  });
});
