/**
 * User role assignment Zod rules.
 * Run: pnpm test:db -- src/__tests__/user-roles-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  userRoleAssignmentInsertSchema,
  userRoleInsertSchema,
  userRoleUpdateSchema,
} from "../schema-platform/security/userRoles";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validAssignmentBase = {
  userId: 10,
  roleId: 20,
  tenantId: 1,
  assignedBy: 5,
};

describe("user role Zod schemas", () => {
  describe("userRoleAssignmentInsertSchema", () => {
    it("accepts a full assignment payload with assignedBy", () => {
      expect(userRoleAssignmentInsertSchema.safeParse(validAssignmentBase).success).toBe(true);
    });

    it("rejects non-positive assignedBy", () => {
      expectZodIssueAtPath(
        userRoleAssignmentInsertSchema,
        { ...validAssignmentBase, assignedBy: 0 },
        "assignedBy"
      );
    });

    it("rejects missing assignedBy", () => {
      const { assignedBy: _a, ...rest } = validAssignmentBase;
      expect(userRoleAssignmentInsertSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects zero or negative userId, roleId, and tenantId", () => {
      expectZodIssueAtPath(
        userRoleAssignmentInsertSchema,
        { ...validAssignmentBase, userId: 0 },
        "userId"
      );
      expectZodIssueAtPath(
        userRoleAssignmentInsertSchema,
        { ...validAssignmentBase, userId: -1 },
        "userId"
      );
      expectZodIssueAtPath(
        userRoleAssignmentInsertSchema,
        { ...validAssignmentBase, roleId: 0 },
        "roleId"
      );
      expectZodIssueAtPath(
        userRoleAssignmentInsertSchema,
        { ...validAssignmentBase, tenantId: 0 },
        "tenantId"
      );
    });

    it("requires assignedBy to be present and positive", () => {
      expectZodIssueAtPath(
        userRoleAssignmentInsertSchema,
        { ...validAssignmentBase, assignedBy: -1 },
        "assignedBy"
      );
    });

    it("rejects expiresAt in the past when set", () => {
      expectZodIssueAtPath(
        userRoleAssignmentInsertSchema,
        {
          ...validAssignmentBase,
          expiresAt: new Date(Date.now() - 60_000),
        },
        "expiresAt"
      );
    });

    it("accepts expiresAt in the future when set", () => {
      expect(
        userRoleAssignmentInsertSchema.safeParse({
          ...validAssignmentBase,
          expiresAt: new Date(Date.now() + 3600_000),
        }).success
      ).toBe(true);
    });

    it("accepts null expiresAt (no expiry)", () => {
      expect(
        userRoleAssignmentInsertSchema.safeParse({
          ...validAssignmentBase,
          expiresAt: null,
        }).success
      ).toBe(true);
    });
  });

  describe("userRoleUpdateSchema", () => {
    it("allows clearing expiresAt with null", () => {
      expect(userRoleUpdateSchema.safeParse({ expiresAt: null }).success).toBe(true);
    });

    it("rejects expiresAt in the past when set on update", () => {
      expectZodIssueAtPath(
        userRoleUpdateSchema,
        { expiresAt: new Date(Date.now() - 60_000) },
        "expiresAt"
      );
    });

    it("accepts expiresAt in the future on update", () => {
      expect(
        userRoleUpdateSchema.safeParse({ expiresAt: new Date(Date.now() + 3600_000) }).success
      ).toBe(true);
    });
  });

  describe("userRoleInsertSchema", () => {
    it("rejects missing assignedBy (NOT NULL column)", () => {
      const { assignedBy: _a, ...rest } = validAssignmentBase;
      expect(userRoleInsertSchema.safeParse(rest).success).toBe(false);
    });
  });
});
