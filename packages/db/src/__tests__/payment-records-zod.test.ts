/**
 * Payment record Zod vs `chk_payment_records_amount` and numeric(12,2) bounds.
 * Run: pnpm test:db -- src/__tests__/payment-records-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  paymentRecordInsertSchema,
  paymentRecordUpdateSchema,
} from "../schema-hrm/payroll/operations/paymentRecords";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const baseInsert = {
  tenantId: 1,
  payslipId: 1,
  paymentReference: "pay-ref-001",
  amount: "1000.00",
  currencyId: 1,
  paymentDate: new Date("2026-03-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("payment record Zod schemas", () => {
  describe("paymentRecordInsertSchema", () => {
    it("rejects non-positive amount", () => {
      expectZodIssueAtPath(paymentRecordInsertSchema, { ...baseInsert, amount: "0" }, "amount");
      expectZodIssueAtPath(paymentRecordInsertSchema, { ...baseInsert, amount: "-1.00" }, "amount");
    });

    it("rejects amount with more than 2 decimal places", () => {
      expectZodIssueAtPath(
        paymentRecordInsertSchema,
        { ...baseInsert, paymentReference: "PR-2DP", amount: "10.001" },
        "amount"
      );
    });

    it("rejects trailing dot and leading-zero integer forms", () => {
      expectZodIssueAtPath(
        paymentRecordInsertSchema,
        { ...baseInsert, paymentReference: "PR-DOT", amount: "100." },
        "amount"
      );
      expectZodIssueAtPath(
        paymentRecordInsertSchema,
        { ...baseInsert, paymentReference: "PR-LZ", amount: "01.00" },
        "amount"
      );
    });

    it("accepts a minimal valid insert", () => {
      expect(paymentRecordInsertSchema.safeParse(baseInsert).success).toBe(true);
    });

    it("rejects invalid payment status when provided", () => {
      expectInvalidEnumField(paymentRecordInsertSchema, baseInsert, "status", "UNKNOWN");
    });
  });

  describe("paymentRecordUpdateSchema", () => {
    it("strips tenantId and payslipId", () => {
      const r = paymentRecordUpdateSchema.safeParse({
        tenantId: 9,
        payslipId: 8,
        amount: "500.00",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("payslipId");
      expect(r.data.amount).toBe("500.00");
    });
  });
});
