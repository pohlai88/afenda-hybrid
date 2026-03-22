/**
 * Earnings type Zod rules (enums, code pattern, defaultRate bounds, tenant immutability).
 * Run: pnpm test:db -- src/__tests__/earnings-types-zod.test.ts
 *
 * Duplicate `earningsCode` per tenant is enforced by DB unique index, not Zod.
 */
import { describe, expect, it } from "vitest";
import {
  earningsTypeInsertSchema,
  earningsTypeUpdateSchema,
} from "../schema-hrm/payroll/fundamentals/earningsTypes";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  earningsCode: "BASE",
  name: "Base salary",
  category: "SALARY" as const,
  createdBy: 1,
  updatedBy: 1,
};

describe("earnings type Zod schemas", () => {
  describe("earningsTypeInsertSchema", () => {
    it("rejects invalid category", () => {
      expectInvalidEnumField(earningsTypeInsertSchema, validInsertBase, "category", "ROYALTIES");
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(earningsTypeInsertSchema, validInsertBase, "status", "DELETED");
    });

    it("rejects earningsCode that fails pattern", () => {
      expectZodIssueAtPath(
        earningsTypeInsertSchema,
        { ...validInsertBase, earningsCode: "bad code!" },
        "earningsCode"
      );
    });

    it("normalizes earningsCode to uppercase", () => {
      const r = earningsTypeInsertSchema.safeParse({
        ...validInsertBase,
        earningsCode: "ot_flat",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.earningsCode).toBe("OT_FLAT");
    });

    it("rejects negative defaultRate", () => {
      expectZodIssueAtPath(
        earningsTypeInsertSchema,
        { ...validInsertBase, earningsCode: "RATE1", defaultRate: "-0.01" },
        "defaultRate"
      );
    });

    it("rejects defaultRate above numeric(5,2) max", () => {
      expectZodIssueAtPath(
        earningsTypeInsertSchema,
        { ...validInsertBase, earningsCode: "RATE2", defaultRate: "1000.00" },
        "defaultRate"
      );
    });

    it("rejects defaultRate with more than 2 decimal places", () => {
      expectZodIssueAtPath(
        earningsTypeInsertSchema,
        { ...validInsertBase, earningsCode: "RATE3", defaultRate: "1.234" },
        "defaultRate"
      );
    });

    it("accepts valid defaultRate and optional flags", () => {
      expect(
        earningsTypeInsertSchema.safeParse({
          ...validInsertBase,
          earningsCode: "OK01",
          defaultRate: "12.50",
          isTaxable: false,
          isPensionable: false,
          status: "ARCHIVED",
        }).success
      ).toBe(true);
    });
  });

  describe("earningsTypeUpdateSchema", () => {
    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(earningsTypeUpdateSchema, { status: "UNKNOWN" }, "status");
    });

    it("allows clearing description and defaultRate with null", () => {
      expect(
        earningsTypeUpdateSchema.safeParse({
          description: null,
          defaultRate: null,
        }).success
      ).toBe(true);
    });

    it("uppercases earningsCode on patch", () => {
      const r = earningsTypeUpdateSchema.safeParse({ earningsCode: "bonus_q1" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.earningsCode).toBe("BONUS_Q1");
    });

    it("strips tenantId from the patch shape", () => {
      const r = earningsTypeUpdateSchema.safeParse({
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
