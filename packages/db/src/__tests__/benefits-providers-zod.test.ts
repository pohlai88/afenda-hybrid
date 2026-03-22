/**
 * Benefits provider Zod rules (status enum, email/URL, contract dates).
 * Run: pnpm test:db -- src/__tests__/benefits-providers-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  benefitsProviderInsertSchema,
  benefitsProviderUpdateSchema,
} from "../schema-hrm/benefits/fundamentals/benefitsProviders";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  providerCode: "BCBS-01",
  name: "Blue Cross",
  createdBy: 1,
  updatedBy: 1,
};

describe("benefits provider Zod schemas", () => {
  describe("benefitsProviderInsertSchema — status", () => {
    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(benefitsProviderInsertSchema, validInsertBase, "status", "RETIRED");
    });

    it("accepts each valid status", () => {
      for (const status of ["ACTIVE", "INACTIVE", "SUSPENDED"] as const) {
        expect(
          benefitsProviderInsertSchema.safeParse({
            ...validInsertBase,
            providerCode: `P-${status}`,
            status,
          }).success
        ).toBe(true);
      }
    });

    it("omitting status is valid (DB default ACTIVE)", () => {
      expect(benefitsProviderInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("benefitsProviderInsertSchema — email and website", () => {
    it("rejects invalid email", () => {
      expectZodIssueAtPath(
        benefitsProviderInsertSchema,
        { ...validInsertBase, providerCode: "BAD-EM", email: "not-an-email" },
        "email"
      );
    });

    it("rejects invalid website URL", () => {
      expectZodIssueAtPath(
        benefitsProviderInsertSchema,
        { ...validInsertBase, providerCode: "BAD-WEB", website: "not-a-url" },
        "website"
      );
    });

    it("accepts valid email and https URL", () => {
      expect(
        benefitsProviderInsertSchema.safeParse({
          ...validInsertBase,
          providerCode: "GOOD-WEB",
          email: "contact@provider.example",
          website: "https://provider.example/path",
        }).success
      ).toBe(true);
    });
  });

  describe("benefitsProviderInsertSchema — contract dates", () => {
    it("rejects contractEndDate before contractStartDate", () => {
      expectZodIssueAtPath(
        benefitsProviderInsertSchema,
        {
          ...validInsertBase,
          providerCode: "BAD-DATES",
          contractStartDate: new Date("2026-06-01"),
          contractEndDate: new Date("2026-01-01"),
        },
        "contractEndDate"
      );
    });
  });

  describe("benefitsProviderUpdateSchema", () => {
    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(benefitsProviderUpdateSchema, { status: "UNKNOWN" }, "status");
    });

    it("allows clearing nullable contact fields with null", () => {
      expect(
        benefitsProviderUpdateSchema.safeParse({
          contactPerson: null,
          email: null,
          phone: null,
          website: null,
        }).success
      ).toBe(true);
    });

    it("rejects invalid email on update", () => {
      expectZodIssueAtPath(benefitsProviderUpdateSchema, { email: "bad" }, "email");
    });
  });
});
