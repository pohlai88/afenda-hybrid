/**
 * Payroll entry Zod rules (quantity, amount vs quantity×rate, ADJUSTMENT sign).
 * Run: pnpm test:db -- src/__tests__/payroll-entries-zod.test.ts
 *
 * Duplicate lines per run/employee/component are not constrained at DB level — business rule in service if needed.
 */
import { describe, expect, it } from "vitest";
import {
  payrollEntryInsertSchema,
  payrollEntryUpdateSchema,
} from "../schema-hrm/payroll/operations/payrollEntries";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const baseInsert = {
  tenantId: 1,
  payrollRunId: 1,
  employeeId: 1,
  entryType: "EARNING" as const,
  description: "Regular hours",
  amount: "500.00",
};

describe("payroll entry Zod schemas", () => {
  describe("payrollEntryInsertSchema", () => {
    it("rejects description shorter than 2 characters after trim", () => {
      expectZodIssueAtPath(
        payrollEntryInsertSchema,
        { ...baseInsert, description: "x" },
        "description"
      );
    });

    it("rejects zero or negative quantity", () => {
      expectZodIssueAtPath(
        payrollEntryInsertSchema,
        { ...baseInsert, quantity: "0", rate: "10", amount: "100.00" },
        "quantity"
      );
    });

    it("rejects negative quantity", () => {
      expectZodIssueAtPath(payrollEntryInsertSchema, { ...baseInsert, quantity: "-1" }, "quantity");
    });

    it("rejects amount not matching quantity × rate when rate is set (EARNING)", () => {
      expectZodIssueAtPath(
        payrollEntryInsertSchema,
        {
          ...baseInsert,
          quantity: "2",
          rate: "50",
          amount: "99.00",
        },
        "amount"
      );
    });

    it("accepts amount matching quantity × rate within tolerance", () => {
      expect(
        payrollEntryInsertSchema.safeParse({
          ...baseInsert,
          quantity: "2.5",
          rate: "40",
          amount: "100.00",
        }).success
      ).toBe(true);
    });

    it("uses default quantity 1 when omitted and rate is set", () => {
      expect(
        payrollEntryInsertSchema.safeParse({
          ...baseInsert,
          rate: "100.00",
          amount: "100.00",
        }).success
      ).toBe(true);
    });

    it("rejects non-positive amount for EARNING", () => {
      expectZodIssueAtPath(payrollEntryInsertSchema, { ...baseInsert, amount: "0" }, "amount");
    });

    it("rejects negative amount for DEDUCTION entry type", () => {
      expectZodIssueAtPath(
        payrollEntryInsertSchema,
        { ...baseInsert, entryType: "DEDUCTION", amount: "-50.00" },
        "amount"
      );
    });

    it("allows negative amount for ADJUSTMENT and skips quantity×rate check", () => {
      expect(
        payrollEntryInsertSchema.safeParse({
          ...baseInsert,
          entryType: "ADJUSTMENT",
          description: "Correction",
          quantity: "1",
          rate: "100",
          amount: "-75.50",
        }).success
      ).toBe(true);
    });

    it("rejects zero amount for ADJUSTMENT", () => {
      expectZodIssueAtPath(
        payrollEntryInsertSchema,
        { ...baseInsert, entryType: "ADJUSTMENT", description: "No op", amount: "0.00" },
        "amount"
      );
    });

    it("rejects invalid entry type when provided", () => {
      expectInvalidEnumField(payrollEntryInsertSchema, baseInsert, "entryType", "BONUS");
    });
  });

  describe("payrollEntryUpdateSchema", () => {
    it("strips tenantId, employeeId, and payrollRunId from the patch shape", () => {
      const r = payrollEntryUpdateSchema.safeParse({
        tenantId: 9,
        employeeId: 8,
        payrollRunId: 7,
        description: "Updated label",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data).not.toHaveProperty("payrollRunId");
      expect(r.data.description).toBe("Updated label");
    });

    it("allows clearing quantity and rate with null", () => {
      expect(
        payrollEntryUpdateSchema.safeParse({
          quantity: null,
          rate: null,
        }).success
      ).toBe(true);
    });

    it("rejects amount mismatch when amount, quantity, and rate are patched together", () => {
      expectZodIssueAtPath(
        payrollEntryUpdateSchema,
        {
          amount: "10.00",
          quantity: "3",
          rate: "5",
        },
        "amount"
      );
    });
  });
});
