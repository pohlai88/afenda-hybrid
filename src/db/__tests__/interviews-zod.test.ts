/**
 * Interview Zod rules (result vs status, ids).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/interviews-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { interviewInsertSchema, interviewUpdateSchema } from "../schema-hrm/recruitment/operations/interviews";

const validInsertBase = {
  tenantId: 1,
  applicationId: 2,
  interviewType: "VIDEO" as const,
  interviewerId: 3,
  scheduledDate: "2026-03-20",
  createdBy: 1,
  updatedBy: 1,
};

describe("interview Zod schemas", () => {
  describe("interviewInsertSchema", () => {
    it("accepts minimal valid insert", () => {
      expect(interviewInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("accepts COMPLETED with result set", () => {
      expect(
        interviewInsertSchema.safeParse({
          ...validInsertBase,
          status: "COMPLETED" as const,
          result: "YES" as const,
        }).success,
      ).toBe(true);
    });

    it("rejects result when status is not COMPLETED", () => {
      const r = interviewInsertSchema.safeParse({
        ...validInsertBase,
        status: "SCHEDULED" as const,
        result: "YES" as const,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "result")).toBe(true);
      }
    });

    it("rejects result when status omitted (defaults to SCHEDULED)", () => {
      expect(interviewInsertSchema.safeParse({ ...validInsertBase, result: "MAYBE" as const }).success).toBe(
        false,
      );
    });

    it("rejects non-positive tenantId", () => {
      expect(interviewInsertSchema.safeParse({ ...validInsertBase, tenantId: 0 }).success).toBe(false);
    });
  });

  describe("interviewUpdateSchema", () => {
    it("accepts empty partial update", () => {
      expect(interviewUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects result without status COMPLETED in same patch", () => {
      const r = interviewUpdateSchema.safeParse({ result: "NO" });
      expect(r.success).toBe(false);
    });

    it("accepts result with status COMPLETED in same patch", () => {
      expect(
        interviewUpdateSchema.safeParse({ status: "COMPLETED", result: "STRONG_YES" }).success,
      ).toBe(true);
    });
  });
});
