/**
 * Benefit enrollment Zod rules (enums, date range, TERMINATED + terminationReason).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/benefit-enrollments-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  benefitEnrollmentInsertSchema,
  benefitEnrollmentUpdateSchema,
} from "../schema-hrm/benefits/operations/benefitEnrollments";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  employeeId: 100,
  benefitPlanId: 200,
  enrollmentDate: new Date("2026-01-15"),
  effectiveFrom: new Date("2026-02-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("benefit enrollment Zod schemas", () => {
  describe("benefitEnrollmentInsertSchema — enums", () => {
    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(benefitEnrollmentInsertSchema, validInsertBase, "status", "EXPIRED");
    });

    it("rejects invalid coverageLevel when provided", () => {
      expectInvalidEnumField(benefitEnrollmentInsertSchema, validInsertBase, "coverageLevel", "FULL_FAMILY");
    });

    it("accepts each enrollment status", () => {
      for (const status of ["PENDING", "ACTIVE", "SUSPENDED", "TERMINATED", "CANCELLED"] as const) {
        const extra =
          status === "TERMINATED"
            ? { terminationReason: "Voluntary exit" as const }
            : ({} as Record<string, never>);
        expect(
          benefitEnrollmentInsertSchema.safeParse({
            ...validInsertBase,
            benefitPlanId: 200 + status.length,
            status,
            ...extra,
          }).success,
        ).toBe(true);
      }
    });

    it("omitting status is valid (DB default PENDING)", () => {
      expect(benefitEnrollmentInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("benefitEnrollmentInsertSchema — effective range", () => {
    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        benefitEnrollmentInsertSchema,
        {
          ...validInsertBase,
          benefitPlanId: 201,
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });
  });

  describe("benefitEnrollmentInsertSchema — TERMINATED lifecycle", () => {
    it("rejects TERMINATED without terminationReason", () => {
      expectZodIssueAtPath(
        benefitEnrollmentInsertSchema,
        {
          ...validInsertBase,
          benefitPlanId: 202,
          status: "TERMINATED" as const,
        },
        "terminationReason",
      );
    });

    it("accepts TERMINATED with terminationReason", () => {
      expect(
        benefitEnrollmentInsertSchema.safeParse({
          ...validInsertBase,
          benefitPlanId: 203,
          status: "TERMINATED",
          terminationReason: "Employment ended",
        }).success,
      ).toBe(true);
    });

    it("accepts CANCELLED without terminationReason", () => {
      expect(
        benefitEnrollmentInsertSchema.safeParse({
          ...validInsertBase,
          benefitPlanId: 204,
          status: "CANCELLED",
        }).success,
      ).toBe(true);
    });
  });

  describe("benefitEnrollmentInsertSchema — contribution", () => {
    it("rejects negative employeeContribution string", () => {
      expectZodIssueAtPath(
        benefitEnrollmentInsertSchema,
        { ...validInsertBase, benefitPlanId: 205, employeeContribution: "-10.00" },
        "employeeContribution",
      );
    });
  });

  describe("benefitEnrollmentUpdateSchema", () => {
    it("rejects effectiveTo before effectiveFrom when both are in the patch", () => {
      expectZodIssueAtPath(
        benefitEnrollmentUpdateSchema,
        {
          effectiveFrom: new Date("2027-01-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });

    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(benefitEnrollmentUpdateSchema, { status: "DONE" }, "status");
    });

    it("rejects TERMINATED without terminationReason in the same patch", () => {
      expectZodIssueAtPath(
        benefitEnrollmentUpdateSchema,
        { status: "TERMINATED" as const },
        "terminationReason",
      );
    });

    it("allows clearing terminationReason with null when not setting TERMINATED", () => {
      expect(benefitEnrollmentUpdateSchema.safeParse({ terminationReason: null }).success).toBe(true);
    });
  });
});
