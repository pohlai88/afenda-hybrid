/**
 * Onboarding / offboarding checklist Zod enum enforcement.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/checklists-zod.test.ts
 */
import { describe, it } from "vitest";
import {
  onboardingChecklistInsertSchema,
  onboardingChecklistUpdateSchema,
} from "../schema-hrm/recruitment/operations/onboardingChecklists";
import {
  offboardingChecklistInsertSchema,
  offboardingChecklistUpdateSchema,
} from "../schema-hrm/recruitment/operations/offboardingChecklists";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const onboardingInsertBase = {
  tenantId: 1,
  employeeId: 2,
  taskName: "Sign handbook",
  taskCategory: "DOCUMENTATION",
  createdBy: 1,
  updatedBy: 1,
};

const offboardingInsertBase = {
  tenantId: 1,
  employeeId: 2,
  taskName: "Return laptop",
  taskCategory: "ASSET_RETURN",
  createdBy: 1,
  updatedBy: 1,
};

describe("checklist Zod schemas — enum enforcement", () => {
  describe("onboardingChecklistInsertSchema", () => {
    it("rejects invalid status", () => {
      expectInvalidEnumField(onboardingChecklistInsertSchema, onboardingInsertBase, "status", "NOT_A_STATUS");
    });

    it("rejects invalid taskCategory", () => {
      expectInvalidEnumField(onboardingChecklistInsertSchema, onboardingInsertBase, "taskCategory", "WRONG_CATEGORY");
    });
  });

  describe("onboardingChecklistUpdateSchema", () => {
    it("rejects invalid status", () => {
      expectZodIssueAtPath(onboardingChecklistUpdateSchema, { status: "NOT_A_STATUS" }, "status");
    });

    it("rejects invalid taskCategory", () => {
      expectZodIssueAtPath(onboardingChecklistUpdateSchema, { taskCategory: "WRONG_CATEGORY" }, "taskCategory");
    });
  });

  describe("offboardingChecklistInsertSchema", () => {
    it("rejects invalid status", () => {
      expectInvalidEnumField(offboardingChecklistInsertSchema, offboardingInsertBase, "status", "NOT_A_STATUS");
    });

    it("rejects invalid taskCategory", () => {
      expectInvalidEnumField(offboardingChecklistInsertSchema, offboardingInsertBase, "taskCategory", "ONBOARDING_ONLY");
    });
  });

  describe("offboardingChecklistUpdateSchema", () => {
    it("rejects invalid status", () => {
      expectZodIssueAtPath(offboardingChecklistUpdateSchema, { status: "NOT_A_STATUS" }, "status");
    });

    it("rejects invalid taskCategory", () => {
      expectZodIssueAtPath(offboardingChecklistUpdateSchema, { taskCategory: "DOCUMENTATION" }, "taskCategory");
    });
  });
});
