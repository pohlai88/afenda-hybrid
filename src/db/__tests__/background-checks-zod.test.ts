/**
 * Background check Zod rules (result vs status, id fields).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/background-checks-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  backgroundCheckInsertSchema,
  backgroundCheckUpdateSchema,
} from "../schema-hrm/recruitment/operations/backgroundChecks";

const validInsertBase = {
  tenantId: 1,
  candidateId: 2,
  checkType: "CRIMINAL" as const,
  requestedDate: "2026-03-20",
  createdBy: 1,
  updatedBy: 1,
};

describe("background check Zod schemas", () => {
  describe("backgroundCheckInsertSchema", () => {
    it("accepts minimal valid insert", () => {
      expect(backgroundCheckInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("accepts COMPLETED with result set", () => {
      const r = backgroundCheckInsertSchema.safeParse({
        ...validInsertBase,
        status: "COMPLETED" as const,
        result: "CLEAR" as const,
      });
      expect(r.success).toBe(true);
    });

    it("rejects result when status is not COMPLETED", () => {
      const r = backgroundCheckInsertSchema.safeParse({
        ...validInsertBase,
        status: "IN_PROGRESS" as const,
        result: "CLEAR" as const,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "result")).toBe(true);
      }
    });

    it("rejects result when status omitted (defaults to PENDING at insert)", () => {
      const r = backgroundCheckInsertSchema.safeParse({
        ...validInsertBase,
        result: "CLEAR" as const,
      });
      expect(r.success).toBe(false);
    });

    it("rejects non-positive tenantId", () => {
      expect(backgroundCheckInsertSchema.safeParse({ ...validInsertBase, tenantId: 0 }).success).toBe(
        false,
      );
    });
  });

  describe("backgroundCheckUpdateSchema", () => {
    it("accepts empty partial update", () => {
      expect(backgroundCheckUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects result without status COMPLETED in same patch", () => {
      const r = backgroundCheckUpdateSchema.safeParse({ result: "CLEAR" });
      expect(r.success).toBe(false);
    });

    it("accepts result with status COMPLETED in same patch", () => {
      expect(
        backgroundCheckUpdateSchema.safeParse({ status: "COMPLETED", result: "CLEAR" }).success,
      ).toBe(true);
    });
  });
});
