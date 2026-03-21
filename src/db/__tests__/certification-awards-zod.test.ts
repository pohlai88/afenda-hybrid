/**
 * Certification awards Zod: expiry vs award date (mirrors `chk_certification_awards_expiry`).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/certification-awards-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  certificationAwardInsertSchema,
  certificationAwardUpdateSchema,
} from "../schema-hrm/learning/operations/certificationAwards";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

const baseInsert = {
  tenantId: 1,
  employeeId: 1,
  certificationId: 1,
  awardDate: "2026-01-15",
  createdBy: 1,
  updatedBy: 1,
};

describe("certification awards Zod", () => {
  it("insert rejects expiryDate before awardDate", () => {
    expectZodIssueAtPath(
      certificationAwardInsertSchema,
      { ...baseInsert, expiryDate: "2026-01-01" },
      "expiryDate"
    );
  });

  it("insert accepts expiryDate on or after awardDate", () => {
    expect(
      certificationAwardInsertSchema.safeParse({
        ...baseInsert,
        expiryDate: "2027-01-15",
      }).success
    ).toBe(true);
  });

  it("update applies same rule when both dates are in the payload", () => {
    expectZodIssueAtPath(
      certificationAwardUpdateSchema,
      { awardDate: "2026-06-01", expiryDate: "2026-05-01" },
      "expiryDate"
    );
  });
});
