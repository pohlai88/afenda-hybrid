/**
 * Bank account Zod rules (status enum, immutable tenant/employee on update).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/bank-accounts-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { bankAccountInsertSchema, bankAccountUpdateSchema } from "../schema-hrm/payroll/fundamentals/bankAccounts";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  employeeId: 10,
  bankName: "Test Bank",
  accountNumber: "****1234",
  accountHolderName: "Jane Doe",
  createdBy: 1,
  updatedBy: 1,
};

describe("bank account Zod schemas", () => {
  describe("bankAccountInsertSchema", () => {
    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(bankAccountInsertSchema, validInsertBase, "status", "FROZEN");
    });

    it("accepts each valid status", () => {
      for (const status of ["ACTIVE", "INACTIVE", "CLOSED", "PENDING_VERIFICATION"] as const) {
        expect(
          bankAccountInsertSchema.safeParse({
            ...validInsertBase,
            employeeId: 10 + status.length,
            status,
          }).success,
        ).toBe(true);
      }
    });

    it("omitting status is valid (DB default PENDING_VERIFICATION)", () => {
      expect(bankAccountInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("accepts optional currencyId when positive", () => {
      expect(
        bankAccountInsertSchema.safeParse({
          ...validInsertBase,
          employeeId: 11,
          currencyId: 2,
        }).success,
      ).toBe(true);
    });
  });

  describe("bankAccountUpdateSchema", () => {
    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(bankAccountUpdateSchema, { status: "UNKNOWN" }, "status");
    });

    it("allows clearing nullable bank fields with null", () => {
      expect(
        bankAccountUpdateSchema.safeParse({
          bankCode: null,
          routingNumber: null,
          swiftCode: null,
          iban: null,
          currencyId: null,
        }).success,
      ).toBe(true);
    });

    it("strips tenantId and employeeId from the patch shape", () => {
      const r = bankAccountUpdateSchema.safeParse({
        tenantId: 99,
        employeeId: 88,
        bankName: "Renamed Bank",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data.bankName).toBe("Renamed Bank");
    });
  });
});
