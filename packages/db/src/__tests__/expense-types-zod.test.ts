/**
 * Expense type Zod rules (enums, code pattern, maxAmount > 0, tenant immutability).
 * Run: pnpm test:db -- src/__tests__/expense-types-zod.test.ts
 *
 * Duplicate `expenseCode` per tenant is enforced by DB unique index, not Zod.
 */
import { describe, expect, it } from "vitest";
import {
  expenseTypeInsertSchema,
  expenseTypeUpdateSchema,
} from "../schema-hrm/payroll/fundamentals/expenseTypes";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  expenseCode: "MEALS",
  name: "Meals",
  category: "MEALS" as const,
  createdBy: 1,
  updatedBy: 1,
};

describe("expense type Zod schemas", () => {
  describe("expenseTypeInsertSchema", () => {
    it("rejects invalid category", () => {
      expectInvalidEnumField(expenseTypeInsertSchema, validInsertBase, "category", "SUBSCRIPTIONS");
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(expenseTypeInsertSchema, validInsertBase, "status", "DELETED");
    });

    it("rejects expenseCode that fails pattern", () => {
      expectZodIssueAtPath(
        expenseTypeInsertSchema,
        { ...validInsertBase, expenseCode: "bad code!" },
        "expenseCode"
      );
    });

    it("normalizes expenseCode to uppercase", () => {
      const r = expenseTypeInsertSchema.safeParse({
        ...validInsertBase,
        expenseCode: "travel_dom",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.expenseCode).toBe("TRAVEL_DOM");
    });

    it("rejects zero maxAmount", () => {
      expectZodIssueAtPath(
        expenseTypeInsertSchema,
        { ...validInsertBase, expenseCode: "CAP1", maxAmount: "0" },
        "maxAmount"
      );
    });

    it("rejects negative maxAmount", () => {
      expectZodIssueAtPath(
        expenseTypeInsertSchema,
        { ...validInsertBase, expenseCode: "CAP2", maxAmount: "-10.00" },
        "maxAmount"
      );
    });

    it("rejects maxAmount with more than 2 decimal places", () => {
      expectZodIssueAtPath(
        expenseTypeInsertSchema,
        { ...validInsertBase, expenseCode: "CAP3", maxAmount: "100.001" },
        "maxAmount"
      );
    });

    it("accepts valid maxAmount and optional flags", () => {
      expect(
        expenseTypeInsertSchema.safeParse({
          ...validInsertBase,
          expenseCode: "OK01",
          maxAmount: "500.00",
          requiresReceipt: false,
          requiresApproval: false,
          status: "ARCHIVED",
        }).success
      ).toBe(true);
    });
  });

  describe("expenseTypeUpdateSchema", () => {
    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(expenseTypeUpdateSchema, { status: "UNKNOWN" }, "status");
    });

    it("allows clearing description and maxAmount with null", () => {
      expect(
        expenseTypeUpdateSchema.safeParse({
          description: null,
          maxAmount: null,
        }).success
      ).toBe(true);
    });

    it("uppercases expenseCode on patch", () => {
      const r = expenseTypeUpdateSchema.safeParse({ expenseCode: "hotel_uk" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.expenseCode).toBe("HOTEL_UK");
    });

    it("strips tenantId from the patch shape", () => {
      const r = expenseTypeUpdateSchema.safeParse({
        tenantId: 99,
        name: "Renamed",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data.name).toBe("Renamed");
    });
  });
});
