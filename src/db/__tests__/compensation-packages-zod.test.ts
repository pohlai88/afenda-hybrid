/**
 * Compensation package Zod rules (enums, salary, effective range, immutable tenant/employee on update).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/compensation-packages-zod.test.ts
 *
 * Note: Only one ACTIVE open-ended package per employee is enforced by DB partial unique index, not Zod.
 */
import { describe, expect, it } from "vitest";
import {
  compensationPackageInsertSchema,
  compensationPackageUpdateSchema,
} from "../schema-hrm/payroll/fundamentals/compensationPackages";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  employeeId: 10,
  baseSalary: "75000.00",
  currencyId: 1,
  effectiveFrom: new Date("2026-01-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("compensation package Zod schemas", () => {
  describe("compensationPackageInsertSchema", () => {
    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(compensationPackageInsertSchema, validInsertBase, "status", "ARCHIVED");
    });

    it("rejects invalid payFrequency when provided", () => {
      expectInvalidEnumField(compensationPackageInsertSchema, validInsertBase, "payFrequency", "DAILY");
    });

    it("rejects negative baseSalary string", () => {
      expectZodIssueAtPath(
        compensationPackageInsertSchema,
        { ...validInsertBase, employeeId: 11, baseSalary: "-1.00" },
        "baseSalary",
      );
    });

    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        compensationPackageInsertSchema,
        {
          ...validInsertBase,
          employeeId: 12,
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });

    it("accepts each status and payFrequency", () => {
      const statuses = ["DRAFT", "ACTIVE", "SUPERSEDED", "TERMINATED"] as const;
      const freqs = ["MONTHLY", "BIWEEKLY", "WEEKLY", "SEMI_MONTHLY", "ANNUAL"] as const;
      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i]!;
        const payFrequency = freqs[i % freqs.length]!;
        expect(
          compensationPackageInsertSchema.safeParse({
            ...validInsertBase,
            employeeId: 20 + i,
            status,
            payFrequency,
          }).success,
        ).toBe(true);
      }
    });

    it("omitting status and payFrequency is valid (DB defaults)", () => {
      expect(compensationPackageInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("compensationPackageUpdateSchema", () => {
    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(compensationPackageUpdateSchema, { status: "UNKNOWN" }, "status");
    });

    it("rejects effectiveTo before effectiveFrom when both in patch", () => {
      expectZodIssueAtPath(
        compensationPackageUpdateSchema,
        {
          effectiveFrom: new Date("2027-01-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });

    it("rejects negative baseSalary on patch", () => {
      expectZodIssueAtPath(compensationPackageUpdateSchema, { baseSalary: "-0.01" }, "baseSalary");
    });

    it("allows clearing reason and effectiveTo with null", () => {
      expect(
        compensationPackageUpdateSchema.safeParse({
          reason: null,
          effectiveTo: null,
        }).success,
      ).toBe(true);
    });

    it("strips tenantId and employeeId from the patch shape", () => {
      const r = compensationPackageUpdateSchema.safeParse({
        tenantId: 99,
        employeeId: 88,
        reason: "Cost of living",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data.reason).toBe("Cost of living");
    });
  });
});
