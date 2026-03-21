/**
 * Pay grade structure Zod rules (status, salaries, effective range, immutable tenant/jobGrade).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/pay-grade-structures-zod.test.ts
 *
 * Duplicate (structureCode, jobGradeId, effectiveFrom) is enforced by DB unique index, not Zod.
 */
import { describe, expect, it } from "vitest";
import {
  payGradeStructureInsertSchema,
  payGradeStructureUpdateSchema,
} from "../schema-hrm/payroll/fundamentals/payGradeStructures";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  structureCode: "L6",
  name: "Level 6 band",
  jobGradeId: 5,
  currencyId: 1,
  effectiveFrom: new Date("2026-01-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("pay grade structure Zod schemas", () => {
  describe("payGradeStructureInsertSchema", () => {
    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(payGradeStructureInsertSchema, validInsertBase, "status", "PENDING");
    });

    it("rejects negative minSalary", () => {
      expectZodIssueAtPath(
        payGradeStructureInsertSchema,
        { ...validInsertBase, structureCode: "A1", minSalary: "-1.00" },
        "minSalary",
      );
    });

    it("rejects minSalary greater than maxSalary", () => {
      expectZodIssueAtPath(
        payGradeStructureInsertSchema,
        {
          ...validInsertBase,
          structureCode: "A2",
          minSalary: "100.00",
          maxSalary: "50.00",
        },
        "maxSalary",
      );
    });

    it("rejects midSalary below minSalary", () => {
      expectZodIssueAtPath(
        payGradeStructureInsertSchema,
        {
          ...validInsertBase,
          structureCode: "A3",
          minSalary: "100.00",
          midSalary: "50.00",
          maxSalary: "200.00",
        },
        "midSalary",
      );
    });

    it("rejects midSalary above maxSalary", () => {
      expectZodIssueAtPath(
        payGradeStructureInsertSchema,
        {
          ...validInsertBase,
          structureCode: "A4",
          minSalary: "100.00",
          midSalary: "250.00",
          maxSalary: "200.00",
        },
        "midSalary",
      );
    });

    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        payGradeStructureInsertSchema,
        {
          ...validInsertBase,
          structureCode: "A5",
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });

    it("accepts consistent salaries and omits optional status", () => {
      expect(
        payGradeStructureInsertSchema.safeParse({
          ...validInsertBase,
          structureCode: "A6",
          minSalary: "80000.00",
          midSalary: "95000.00",
          maxSalary: "110000.00",
        }).success,
      ).toBe(true);
    });

    it("normalizes structureCode to uppercase", () => {
      const r = payGradeStructureInsertSchema.safeParse({
        ...validInsertBase,
        structureCode: "l7_band",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.structureCode).toBe("L7_BAND");
    });
  });

  describe("payGradeStructureUpdateSchema", () => {
    it("rejects minSalary > maxSalary when both in patch", () => {
      expectZodIssueAtPath(
        payGradeStructureUpdateSchema,
        { minSalary: "200.00", maxSalary: "100.00" },
        "maxSalary",
      );
    });

    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(payGradeStructureUpdateSchema, { status: "UNKNOWN" }, "status");
    });

    it("allows clearing description and salary fields with null", () => {
      expect(
        payGradeStructureUpdateSchema.safeParse({
          description: null,
          minSalary: null,
          midSalary: null,
          maxSalary: null,
          effectiveTo: null,
        }).success,
      ).toBe(true);
    });

    it("strips tenantId and jobGradeId from the patch shape", () => {
      const r = payGradeStructureUpdateSchema.safeParse({
        tenantId: 99,
        jobGradeId: 88,
        name: "Renamed",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("jobGradeId");
      expect(r.data.name).toBe("Renamed");
    });

    it("allows name-only patch without salary validation", () => {
      expect(payGradeStructureUpdateSchema.safeParse({ name: "Only name" }).success).toBe(true);
    });
  });
});
