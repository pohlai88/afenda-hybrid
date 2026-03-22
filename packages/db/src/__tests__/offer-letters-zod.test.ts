/**
 * Offer letter Zod lifecycle rules and ids.
 * Run: pnpm test:db -- src/__tests__/offer-letters-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  offerLetterInsertSchema,
  offerLetterUpdateSchema,
} from "../schema-hrm/recruitment/operations/offerLetters";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  applicationId: 2,
  offerCode: "OFFER-001",
  baseSalary: "90000.00",
  currencyId: 3,
  startDate: "2026-05-01",
  expiryDate: "2026-06-01",
  createdBy: 1,
  updatedBy: 1,
};

describe("offer letter Zod schemas", () => {
  describe("offerLetterInsertSchema", () => {
    it("accepts minimal DRAFT insert (default status)", () => {
      expect(offerLetterInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("rejects non-empty declineReason when status is not DECLINED", () => {
      const r = offerLetterInsertSchema.safeParse({
        ...validInsertBase,
        status: "SENT" as const,
        sentAt: new Date("2026-03-20T10:00:00.000Z"),
        declineReason: "Pay",
      });
      expect(r.success).toBe(false);
    });

    it("accepts DECLINED with declineReason and respondedAt", () => {
      expect(
        offerLetterInsertSchema.safeParse({
          ...validInsertBase,
          offerCode: "OFFER-D1",
          status: "DECLINED" as const,
          declineReason: "Accepted another offer",
          respondedAt: new Date("2026-03-20T12:00:00.000Z"),
        }).success
      ).toBe(true);
    });

    it("rejects DECLINED without declineReason", () => {
      const r = offerLetterInsertSchema.safeParse({
        ...validInsertBase,
        offerCode: "OFFER-D2",
        status: "DECLINED" as const,
        respondedAt: new Date("2026-03-20T12:00:00.000Z"),
      });
      expect(r.success).toBe(false);
    });

    it("rejects SENT without sentAt", () => {
      const r = offerLetterInsertSchema.safeParse({
        ...validInsertBase,
        offerCode: "OFFER-S1",
        status: "SENT" as const,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "sentAt")).toBe(true);
      }
    });

    it("rejects non-positive tenantId", () => {
      expect(offerLetterInsertSchema.safeParse({ ...validInsertBase, tenantId: 0 }).success).toBe(
        false
      );
    });

    it("rejects invalid status on insert", () => {
      expectInvalidEnumField(
        offerLetterInsertSchema,
        validInsertBase,
        "status",
        "NOT_A_REAL_STATUS"
      );
    });
  });

  describe("offerLetterUpdateSchema", () => {
    it("accepts empty partial update", () => {
      expect(offerLetterUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects status SENT without sentAt in same patch", () => {
      const r = offerLetterUpdateSchema.safeParse({ status: "SENT" });
      expect(r.success).toBe(false);
    });

    it("accepts status SENT with sentAt in same patch", () => {
      expect(
        offerLetterUpdateSchema.safeParse({
          status: "SENT",
          sentAt: new Date("2026-03-21T09:00:00.000Z"),
        }).success
      ).toBe(true);
    });

    it("rejects invalid status on update", () => {
      expectZodIssueAtPath(offerLetterUpdateSchema, { status: "NOT_A_REAL_STATUS" }, "status");
    });
  });
});
