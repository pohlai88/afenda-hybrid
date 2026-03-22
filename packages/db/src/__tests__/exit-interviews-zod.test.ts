/**
 * Exit interview Zod rules (COMPLETED vs conductedAt, ids).
 * Run: pnpm test:db -- src/__tests__/exit-interviews-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  exitInterviewInsertSchema,
  exitInterviewUpdateSchema,
} from "../schema-hrm/recruitment/operations/exitInterviews";

const validInsertBase = {
  tenantId: 1,
  employeeId: 2,
  linkedOffboardingChecklistId: 3,
  format: "VIDEO" as const,
  createdBy: 1,
  updatedBy: 1,
};

describe("exit interview Zod schemas", () => {
  describe("exitInterviewInsertSchema", () => {
    it("accepts minimal valid insert", () => {
      expect(exitInterviewInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("accepts COMPLETED when conductedAt is set", () => {
      expect(
        exitInterviewInsertSchema.safeParse({
          ...validInsertBase,
          status: "COMPLETED" as const,
          conductedAt: new Date("2026-03-20T12:00:00.000Z"),
        }).success
      ).toBe(true);
    });

    it("rejects COMPLETED without conductedAt", () => {
      const r = exitInterviewInsertSchema.safeParse({
        ...validInsertBase,
        status: "COMPLETED" as const,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "conductedAt")).toBe(true);
      }
    });

    it("rejects non-positive tenantId", () => {
      expect(exitInterviewInsertSchema.safeParse({ ...validInsertBase, tenantId: 0 }).success).toBe(
        false
      );
    });
  });

  describe("exitInterviewUpdateSchema", () => {
    it("accepts empty partial update", () => {
      expect(exitInterviewUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects status COMPLETED without conductedAt in same patch", () => {
      const r = exitInterviewUpdateSchema.safeParse({ status: "COMPLETED" });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "conductedAt")).toBe(true);
      }
    });

    it("accepts status COMPLETED with conductedAt in same patch", () => {
      expect(
        exitInterviewUpdateSchema.safeParse({
          status: "COMPLETED",
          conductedAt: new Date("2026-03-20T15:00:00.000Z"),
        }).success
      ).toBe(true);
    });
  });
});
