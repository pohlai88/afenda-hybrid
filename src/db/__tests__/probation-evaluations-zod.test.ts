/**
 * Probation evaluation Zod enums and EXTEND / extensionDays lifecycle.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/probation-evaluations-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  probationEvaluationInsertSchema,
  probationEvaluationUpdateSchema,
} from "../schema-hrm/recruitment/operations/probationEvaluations";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  employeeId: 2,
  evaluatorId: 3,
  evaluationDate: "2026-06-01",
  evaluationPeriodStart: "2026-01-01",
  evaluationPeriodEnd: "2026-05-31",
  createdBy: 1,
  updatedBy: 1,
};

describe("probation evaluation Zod schemas", () => {
  describe("probationEvaluationInsertSchema", () => {
    it("accepts minimal insert (default status)", () => {
      expect(probationEvaluationInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("rejects invalid status", () => {
      expectInvalidEnumField(probationEvaluationInsertSchema, validInsertBase, "status", "NOT_A_STATUS");
    });

    it("rejects invalid outcome", () => {
      expectInvalidEnumField(probationEvaluationInsertSchema, validInsertBase, "outcome", "MAYBE");
    });

    it("rejects EXTEND without extensionDays", () => {
      const r = probationEvaluationInsertSchema.safeParse({
        ...validInsertBase,
        outcome: "EXTEND" as const,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "extensionDays")).toBe(true);
      }
    });

    it("accepts EXTEND with extensionDays", () => {
      expect(
        probationEvaluationInsertSchema.safeParse({
          ...validInsertBase,
          outcome: "EXTEND" as const,
          extensionDays: 30,
        }).success,
      ).toBe(true);
    });

    it("rejects PASS with extensionDays", () => {
      expectZodIssueAtPath(
        probationEvaluationInsertSchema,
        { ...validInsertBase, outcome: "PASS" as const, extensionDays: 14 },
        "extensionDays",
      );
    });

    it("rejects extensionDays without outcome EXTEND (outcome omitted)", () => {
      expectZodIssueAtPath(probationEvaluationInsertSchema, { ...validInsertBase, extensionDays: 7 }, "extensionDays");
    });
  });

  describe("probationEvaluationUpdateSchema", () => {
    it("accepts empty partial update", () => {
      expect(probationEvaluationUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects invalid status", () => {
      expectZodIssueAtPath(probationEvaluationUpdateSchema, { status: "DONE" }, "status");
    });

    it("rejects invalid outcome", () => {
      expectZodIssueAtPath(probationEvaluationUpdateSchema, { outcome: "WIN" }, "outcome");
    });

    it("rejects EXTEND without extensionDays in same patch", () => {
      const r = probationEvaluationUpdateSchema.safeParse({ outcome: "EXTEND" });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "extensionDays")).toBe(true);
      }
    });

    it("accepts EXTEND with extensionDays in same patch", () => {
      expect(
        probationEvaluationUpdateSchema.safeParse({
          outcome: "EXTEND",
          extensionDays: 45,
        }).success,
      ).toBe(true);
    });

    it("rejects non-EXTEND outcome with non-null extensionDays in same patch", () => {
      expectZodIssueAtPath(
        probationEvaluationUpdateSchema,
        { outcome: "PASS" as const, extensionDays: 10 },
        "extensionDays",
      );
    });

    it("rejects extensionDays without outcome in same patch", () => {
      expectZodIssueAtPath(probationEvaluationUpdateSchema, { extensionDays: 21 }, "outcome");
    });

    it("allows extensionDays: null alone", () => {
      expect(probationEvaluationUpdateSchema.safeParse({ extensionDays: null }).success).toBe(true);
    });
  });
});
