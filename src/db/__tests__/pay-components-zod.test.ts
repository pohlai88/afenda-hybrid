/**
 * Pay component Zod rules (master link XOR, type-specific FKs, code normalization).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/pay-components-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { payComponentInsertSchema, payComponentUpdateSchema } from "../schema-hrm/payroll/fundamentals/payComponents";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validEarningInsert = {
  tenantId: 1,
  componentCode: "BASE",
  name: "Base pay",
  componentType: "EARNING" as const,
  earningsTypeId: 10,
  createdBy: 1,
  updatedBy: 1,
};

describe("pay component Zod schemas", () => {
  describe("payComponentInsertSchema", () => {
    it("rejects both earningsTypeId and deductionTypeId", () => {
      const r = payComponentInsertSchema.safeParse({
        ...validEarningInsert,
        componentCode: "BAD1",
        earningsTypeId: 1,
        deductionTypeId: 2,
      });
      expect(r.success).toBe(false);
      if (r.success) return;
      expect(r.error.issues.some((i) => i.path.join(".") === "deductionTypeId")).toBe(true);
    });

    it("rejects EARNING without earningsTypeId", () => {
      expectZodIssueAtPath(
        payComponentInsertSchema,
        {
          tenantId: 1,
          componentCode: "E1",
          name: "x",
          componentType: "EARNING" as const,
          createdBy: 1,
          updatedBy: 1,
        },
        "earningsTypeId",
      );
    });

    it("rejects EARNING with deductionTypeId set", () => {
      expectZodIssueAtPath(
        payComponentInsertSchema,
        {
          ...validEarningInsert,
          componentCode: "E2",
          earningsTypeId: 10,
          deductionTypeId: 3,
        },
        "deductionTypeId",
      );
    });

    it("rejects DEDUCTION without deductionTypeId", () => {
      expectZodIssueAtPath(
        payComponentInsertSchema,
        {
          tenantId: 1,
          componentCode: "D1",
          name: "Tax",
          componentType: "DEDUCTION" as const,
          createdBy: 1,
          updatedBy: 1,
        },
        "deductionTypeId",
      );
    });

    it("rejects DEDUCTION with earningsTypeId set (without deductionTypeId)", () => {
      expectZodIssueAtPath(
        payComponentInsertSchema,
        {
          tenantId: 1,
          componentCode: "D2",
          name: "Tax",
          componentType: "DEDUCTION" as const,
          earningsTypeId: 1,
          createdBy: 1,
          updatedBy: 1,
        },
        "earningsTypeId",
      );
    });

    it("rejects BENEFIT with earningsTypeId", () => {
      expectZodIssueAtPath(
        payComponentInsertSchema,
        {
          tenantId: 1,
          componentCode: "B1",
          name: "Health",
          componentType: "BENEFIT" as const,
          earningsTypeId: 1,
          createdBy: 1,
          updatedBy: 1,
        },
        "earningsTypeId",
      );
    });

    it("accepts EARNING with earningsTypeId only", () => {
      expect(payComponentInsertSchema.safeParse(validEarningInsert).success).toBe(true);
    });

    it("accepts DEDUCTION with deductionTypeId only", () => {
      expect(
        payComponentInsertSchema.safeParse({
          tenantId: 1,
          componentCode: "TAX_FED",
          name: "Federal tax",
          componentType: "DEDUCTION" as const,
          deductionTypeId: 20,
          createdBy: 1,
          updatedBy: 1,
        }).success,
      ).toBe(true);
    });

    it("accepts BENEFIT without master ids", () => {
      expect(
        payComponentInsertSchema.safeParse({
          tenantId: 1,
          componentCode: "HLTH",
          name: "Health prem",
          componentType: "BENEFIT" as const,
          createdBy: 1,
          updatedBy: 1,
        }).success,
      ).toBe(true);
    });

    it("rejects invalid componentType", () => {
      expectInvalidEnumField(
        payComponentInsertSchema,
        { ...validEarningInsert, componentCode: "X1", componentType: "EARNING" },
        "componentType",
        "SALARY",
      );
    });

    it("normalizes componentCode to uppercase", () => {
      const r = payComponentInsertSchema.safeParse({
        ...validEarningInsert,
        componentCode: "base_pay",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.componentCode).toBe("BASE_PAY");
    });

    it("rejects componentCode that fails pattern", () => {
      expectZodIssueAtPath(
        payComponentInsertSchema,
        { ...validEarningInsert, componentCode: "no spaces!" },
        "componentCode",
      );
    });
  });

  describe("payComponentUpdateSchema", () => {
    it("rejects patch with both master ids set", () => {
      expectZodIssueAtPath(
        payComponentUpdateSchema,
        { earningsTypeId: 1, deductionTypeId: 2 },
        "deductionTypeId",
      );
    });

    it("requires earningsTypeId when patching componentType to EARNING", () => {
      expectZodIssueAtPath(
        payComponentUpdateSchema,
        { componentType: "EARNING" as const },
        "earningsTypeId",
      );
    });

    it("requires deductionTypeId when patching componentType to DEDUCTION", () => {
      expectZodIssueAtPath(
        payComponentUpdateSchema,
        { componentType: "DEDUCTION" as const },
        "deductionTypeId",
      );
    });

    it("rejects BENEFIT patch with earningsTypeId", () => {
      expectZodIssueAtPath(
        payComponentUpdateSchema,
        { componentType: "BENEFIT" as const, earningsTypeId: 1 },
        "earningsTypeId",
      );
    });

    it("allows patch with only name (no componentType)", () => {
      expect(payComponentUpdateSchema.safeParse({ name: "Renamed" }).success).toBe(true);
    });

    it("strips tenantId from the patch shape", () => {
      const r = payComponentUpdateSchema.safeParse({
        tenantId: 99,
        name: "Y",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
    });

    it("allows clearing description with null", () => {
      expect(payComponentUpdateSchema.safeParse({ description: null }).success).toBe(true);
    });
  });
});
