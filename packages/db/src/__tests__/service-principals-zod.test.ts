/**
 * Service principal Zod rules (status enum, nullable clears on update).
 * Run: pnpm test:db -- src/__tests__/service-principals-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  servicePrincipalInsertSchema,
  servicePrincipalUpdateSchema,
} from "../schema-platform/security/servicePrincipals";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  name: "CI Runner",
  createdBy: 1,
  updatedBy: 1,
};

describe("service principal Zod schemas", () => {
  describe("servicePrincipalInsertSchema — clientId", () => {
    it("rejects invalid UUID when clientId is provided", () => {
      expectZodIssueAtPath(
        servicePrincipalInsertSchema,
        { ...validInsertBase, name: "Bad client", clientId: "not-a-uuid" },
        "clientId"
      );
    });
  });

  describe("servicePrincipalInsertSchema — status", () => {
    it("accepts each valid status", () => {
      for (const status of ["ACTIVE", "INACTIVE", "REVOKED"] as const) {
        expect(
          servicePrincipalInsertSchema.safeParse({
            ...validInsertBase,
            name: `SP-${status}`,
            status,
          }).success
        ).toBe(true);
      }
    });

    it("rejects invalid status on insert", () => {
      expectInvalidEnumField(servicePrincipalInsertSchema, validInsertBase, "status", "PENDING");
    });

    it("omitting status is valid (DB default)", () => {
      expect(servicePrincipalInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("servicePrincipalUpdateSchema — status", () => {
    it("rejects invalid status on update", () => {
      expectZodIssueAtPath(servicePrincipalUpdateSchema, { status: "RETIRED" }, "status");
    });

    it("allows clearing description with null", () => {
      expect(servicePrincipalUpdateSchema.safeParse({ description: null }).success).toBe(true);
    });

    it("allows clearing lastUsedAt with null", () => {
      expect(servicePrincipalUpdateSchema.safeParse({ lastUsedAt: null }).success).toBe(true);
    });
  });
});
