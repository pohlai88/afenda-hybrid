/**
 * Payroll period Zod vs DB CHECK constraints (period ordering, pay date).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/payroll-periods-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  payrollPeriodInsertSchema,
  payrollPeriodUpdateSchema,
} from "../schema-hrm/payroll/operations/payrollPeriods";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const baseInsert = {
  tenantId: 1,
  periodCode: "jan-2026",
  name: "January 2026",
  periodStart: new Date("2026-01-01"),
  periodEnd: new Date("2026-01-31"),
  payDate: new Date("2026-02-05"),
  createdBy: 1,
  updatedBy: 1,
};

describe("payroll period Zod schemas", () => {
  describe("payrollPeriodInsertSchema", () => {
    it("rejects periodEnd before periodStart", () => {
      expectZodIssueAtPath(
        payrollPeriodInsertSchema,
        {
          ...baseInsert,
          periodCode: "BAD-1",
          periodStart: new Date("2026-01-31"),
          periodEnd: new Date("2026-01-01"),
        },
        "periodEnd",
      );
    });

    it("rejects payDate before periodEnd", () => {
      expectZodIssueAtPath(
        payrollPeriodInsertSchema,
        {
          ...baseInsert,
          periodCode: "BAD-2",
          payDate: new Date("2026-01-15"),
        },
        "payDate",
      );
    });

    it("accepts a valid period row", () => {
      expect(payrollPeriodInsertSchema.safeParse(baseInsert).success).toBe(true);
    });

    it("normalizes periodCode to uppercase", () => {
      const r = payrollPeriodInsertSchema.safeParse({ ...baseInsert, periodCode: "feb-26" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.periodCode).toBe("FEB-26");
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(payrollPeriodInsertSchema, baseInsert, "status", "ARCHIVED_OPEN");
    });
  });

  describe("payrollPeriodUpdateSchema", () => {
    it("strips tenantId from the patch", () => {
      const r = payrollPeriodUpdateSchema.safeParse({ tenantId: 9, name: "Renamed" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data.name).toBe("Renamed");
    });

    it("rejects partial date patch (only periodStart)", () => {
      expectZodIssueAtPath(
        payrollPeriodUpdateSchema,
        { periodStart: new Date("2026-02-01") },
        "periodStart",
      );
    });

    it("validates ordering when all three dates are patched together", () => {
      expectZodIssueAtPath(
        payrollPeriodUpdateSchema,
        {
          periodStart: new Date("2026-03-31"),
          periodEnd: new Date("2026-03-01"),
          payDate: new Date("2026-04-01"),
        },
        "periodEnd",
      );
    });
  });
});
