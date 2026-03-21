/**
 * Application Zod rules (FK id fields).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/applications-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { applicationInsertSchema, applicationUpdateSchema } from "../schema-hrm/recruitment/operations/applications";

const validInsertBase = {
  tenantId: 1,
  candidateId: 2,
  requisitionId: 3,
  applicationDate: "2026-03-20",
  createdBy: 1,
  updatedBy: 1,
};

describe("application Zod schemas", () => {
  describe("applicationInsertSchema", () => {
    it("accepts minimal valid insert", () => {
      const r = applicationInsertSchema.safeParse(validInsertBase);
      expect(r.success).toBe(true);
    });

    it("rejects non-positive tenantId", () => {
      const r = applicationInsertSchema.safeParse({ ...validInsertBase, tenantId: 0 });
      expect(r.success).toBe(false);
    });

    it("rejects non-positive candidateId", () => {
      const r = applicationInsertSchema.safeParse({ ...validInsertBase, candidateId: -1 });
      expect(r.success).toBe(false);
    });

    it("rejects non-positive requisitionId", () => {
      const r = applicationInsertSchema.safeParse({ ...validInsertBase, requisitionId: 0 });
      expect(r.success).toBe(false);
    });
  });

  describe("applicationUpdateSchema", () => {
    it("accepts empty partial update", () => {
      expect(applicationUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects tenantId 0 when present", () => {
      const r = applicationUpdateSchema.safeParse({ tenantId: 0 });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "tenantId")).toBe(true);
      }
    });
  });
});
