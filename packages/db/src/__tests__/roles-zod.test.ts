/**
 * Role Zod rules (roleCode, permissions shape).
 * Run: pnpm test:db -- src/__tests__/roles-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { roleInsertSchema, roleUpdateSchema } from "../schema-platform/security/roles";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  roleCode: "HR_ADMIN",
  name: "HR Administrator",
  createdBy: 1,
  updatedBy: 1,
};

describe("role Zod schemas", () => {
  describe("roleInsertSchema — roleCode", () => {
    it("rejects roleCode with spaces", () => {
      expectZodIssueAtPath(
        roleInsertSchema,
        { ...validInsertBase, roleCode: "BAD CODE" },
        "roleCode"
      );
    });

    it("rejects roleCode with disallowed special characters", () => {
      expectZodIssueAtPath(
        roleInsertSchema,
        { ...validInsertBase, roleCode: "BAD@ROLE" },
        "roleCode"
      );
    });

    it("rejects roleCode shorter than 2 characters", () => {
      expectZodIssueAtPath(roleInsertSchema, { ...validInsertBase, roleCode: "X" }, "roleCode");
    });

    it("accepts roleCode with hyphen and underscore", () => {
      expect(
        roleInsertSchema.safeParse({
          ...validInsertBase,
          roleCode: "my-role_v2",
        }).success
      ).toBe(true);
    });
  });

  describe("roleInsertSchema — permissions", () => {
    it("accepts boolean permission values", () => {
      expect(
        roleInsertSchema.safeParse({
          ...validInsertBase,
          roleCode: "P_BOOL",
          permissions: { reports: true, export: false },
        }).success
      ).toBe(true);
    });

    it("accepts string array permission values", () => {
      expect(
        roleInsertSchema.safeParse({
          ...validInsertBase,
          roleCode: "P_ARR",
          permissions: { scopes: ["read", "write"] },
        }).success
      ).toBe(true);
    });

    it("accepts nested record of booleans", () => {
      expect(
        roleInsertSchema.safeParse({
          ...validInsertBase,
          roleCode: "P_NEST",
          permissions: { modules: { people: true, payroll: false } },
        }).success
      ).toBe(true);
    });

    it("rejects numeric permission values", () => {
      const r = roleInsertSchema.safeParse({
        ...validInsertBase,
        roleCode: "P_BAD",
        permissions: { level: 3 },
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".").startsWith("permissions"))).toBe(true);
      }
    });

    it("rejects plain string permission values", () => {
      const r = roleInsertSchema.safeParse({
        ...validInsertBase,
        roleCode: "P_BAD2",
        permissions: { mode: "all" },
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".").startsWith("permissions"))).toBe(true);
      }
    });
  });

  describe("roleInsertSchema — tenant and audit ids", () => {
    it("rejects non-positive tenantId", () => {
      expectZodIssueAtPath(roleInsertSchema, { ...validInsertBase, tenantId: 0 }, "tenantId");
    });

    it("accepts omitting isSystemRole (DB default false)", () => {
      expect(roleInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("roleUpdateSchema", () => {
    it("allows clearing description and permissions with null", () => {
      expect(
        roleUpdateSchema.safeParse({
          description: null,
          permissions: null,
        }).success
      ).toBe(true);
    });

    it("rejects invalid roleCode on patch", () => {
      expectZodIssueAtPath(roleUpdateSchema, { roleCode: "bad code" }, "roleCode");
    });
  });
});
