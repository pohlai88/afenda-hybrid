/**
 * Dependent coverage Zod rules (enums, date range, TERMINATED + terminationReason).
 * Run: pnpm test:db -- src/__tests__/dependent-coverages-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  dependentCoverageInsertSchema,
  dependentCoverageUpdateSchema,
} from "../schema-hrm/benefits/operations/dependentCoverages";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  enrollmentId: 10,
  dependentId: 20,
  effectiveFrom: new Date("2026-02-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("dependent coverage Zod schemas", () => {
  describe("dependentCoverageInsertSchema — enums", () => {
    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(dependentCoverageInsertSchema, validInsertBase, "status", "EXPIRED");
    });

    it("accepts each coverage status with TERMINATED carrying terminationReason", () => {
      for (const status of ["ACTIVE", "SUSPENDED", "TERMINATED"] as const) {
        const extra =
          status === "TERMINATED"
            ? { terminationReason: "Plan ended" as const }
            : ({} as Record<string, never>);
        expect(
          dependentCoverageInsertSchema.safeParse({
            ...validInsertBase,
            enrollmentId: 10 + status.length,
            status,
            ...extra,
          }).success
        ).toBe(true);
      }
    });

    it("omitting status is valid (DB default ACTIVE)", () => {
      expect(dependentCoverageInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("dependentCoverageInsertSchema — effective range", () => {
    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        dependentCoverageInsertSchema,
        {
          ...validInsertBase,
          enrollmentId: 11,
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo"
      );
    });
  });

  describe("dependentCoverageInsertSchema — TERMINATED lifecycle", () => {
    it("rejects TERMINATED without terminationReason", () => {
      expectZodIssueAtPath(
        dependentCoverageInsertSchema,
        {
          ...validInsertBase,
          enrollmentId: 12,
          status: "TERMINATED" as const,
        },
        "terminationReason"
      );
    });

    it("rejects TERMINATED with blank terminationReason", () => {
      expectZodIssueAtPath(
        dependentCoverageInsertSchema,
        {
          ...validInsertBase,
          enrollmentId: 13,
          status: "TERMINATED" as const,
          terminationReason: "   ",
        },
        "terminationReason"
      );
    });

    it("accepts TERMINATED with terminationReason", () => {
      expect(
        dependentCoverageInsertSchema.safeParse({
          ...validInsertBase,
          enrollmentId: 14,
          status: "TERMINATED",
          terminationReason: "Dependent aged out",
        }).success
      ).toBe(true);
    });

    it("accepts SUSPENDED without terminationReason", () => {
      expect(
        dependentCoverageInsertSchema.safeParse({
          ...validInsertBase,
          enrollmentId: 15,
          status: "SUSPENDED",
        }).success
      ).toBe(true);
    });
  });

  describe("dependentCoverageUpdateSchema", () => {
    it("rejects effectiveTo before effectiveFrom when both are in the patch", () => {
      expectZodIssueAtPath(
        dependentCoverageUpdateSchema,
        {
          effectiveFrom: new Date("2027-01-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo"
      );
    });

    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(dependentCoverageUpdateSchema, { status: "DONE" }, "status");
    });

    it("rejects TERMINATED without terminationReason in the same patch", () => {
      expectZodIssueAtPath(
        dependentCoverageUpdateSchema,
        { status: "TERMINATED" as const },
        "terminationReason"
      );
    });

    it("allows clearing terminationReason with null when not setting TERMINATED", () => {
      expect(dependentCoverageUpdateSchema.safeParse({ terminationReason: null }).success).toBe(
        true
      );
    });
  });
});
