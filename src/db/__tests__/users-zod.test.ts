/**
 * User Zod rules (email, status enum).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/users-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { userInsertSchema, userUpdateSchema } from "../schema-platform/security/users";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  email: "valid@example.com",
  displayName: "Valid User",
  createdBy: 1,
  updatedBy: 1,
};

describe("user Zod schemas", () => {
  describe("userInsertSchema — tenant and audit ids", () => {
    it("rejects non-positive tenantId", () => {
      expectZodIssueAtPath(userInsertSchema, { ...validInsertBase, tenantId: 0 }, "tenantId");
    });
  });

  describe("userInsertSchema — email", () => {
    it("rejects invalid email strings", () => {
      expectZodIssueAtPath(
        userInsertSchema,
        { ...validInsertBase, email: "not-an-email" },
        "email",
      );
    });

    it("rejects email without domain", () => {
      expectZodIssueAtPath(userInsertSchema, { ...validInsertBase, email: "local@" }, "email");
    });
  });

  describe("userInsertSchema — status", () => {
    it("accepts each valid status", () => {
      for (const status of ["ACTIVE", "INACTIVE", "LOCKED", "PENDING_VERIFICATION"] as const) {
        expect(
          userInsertSchema.safeParse({
            ...validInsertBase,
            email: `${status.toLowerCase()}@example.com`,
            status,
          }).success,
        ).toBe(true);
      }
    });

    it("rejects invalid status on insert", () => {
      expectInvalidEnumField(userInsertSchema, validInsertBase, "status", "SUSPENDED");
    });

    it("omitting status is valid (DB default)", () => {
      expect(userInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("userUpdateSchema — status", () => {
    it("rejects invalid status on update", () => {
      expectZodIssueAtPath(userUpdateSchema, { status: "BANNED" }, "status");
    });

    it("accepts partial email patch", () => {
      expect(userUpdateSchema.safeParse({ email: "new@example.com" }).success).toBe(true);
    });
  });
});
