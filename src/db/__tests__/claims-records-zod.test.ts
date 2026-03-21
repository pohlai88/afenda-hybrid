/**
 * Claims records Zod rules (status enum, dates, lifecycle fields).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/claims-records-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { claimRecordInsertSchema, claimRecordUpdateSchema } from "../schema-hrm/benefits/operations/claimsRecords";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const validInsertBase = {
  tenantId: 1,
  enrollmentId: 10,
  employeeId: 20,
  claimNumber: "CLM-001",
  claimDate: new Date("2026-03-01"),
  serviceDate: new Date("2026-02-15"),
  claimAmount: "500.00",
  currencyId: 1,
  description: "Office visit",
  createdBy: 1,
  updatedBy: 1,
};

describe("claims records Zod schemas", () => {
  describe("claimRecordInsertSchema — status", () => {
    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(claimRecordInsertSchema, validInsertBase, "status", "SETTLED");
    });

    it("accepts each valid status with required lifecycle fields", () => {
      const cases: Array<Record<string, unknown>> = [
        { status: "DRAFT" as const },
        { status: "SUBMITTED" as const },
        { status: "UNDER_REVIEW" as const },
        {
          status: "REJECTED" as const,
          rejectionReason: "Not covered",
        },
        {
          status: "APPROVED" as const,
          approvedAmount: "500.00",
        },
        {
          status: "PARTIALLY_APPROVED" as const,
          approvedAmount: "200.00",
        },
        {
          status: "PAID" as const,
          approvedAmount: "500.00",
          paidAt: new Date("2026-03-10T12:00:00.000Z"),
        },
        { status: "CANCELLED" as const },
      ];

      for (const extra of cases) {
        expect(
          claimRecordInsertSchema.safeParse({
            ...validInsertBase,
            claimNumber: `CLM-${(extra.status as string).slice(0, 3)}-${Math.random().toString(36).slice(2, 6)}`,
            ...extra,
          }).success,
        ).toBe(true);
      }
    });

    it("omitting status is valid (DB default DRAFT)", () => {
      expect(claimRecordInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });
  });

  describe("claimRecordInsertSchema — dates and amounts", () => {
    it("rejects serviceDate after claimDate", () => {
      expectZodIssueAtPath(
        claimRecordInsertSchema,
        {
          ...validInsertBase,
          claimNumber: "CLM-BAD-DATE",
          claimDate: new Date("2026-01-01"),
          serviceDate: new Date("2026-06-01"),
        },
        "serviceDate",
      );
    });

    it("rejects approvedAmount greater than claimAmount", () => {
      expectZodIssueAtPath(
        claimRecordInsertSchema,
        {
          ...validInsertBase,
          claimNumber: "CLM-BAD-APP",
          claimAmount: "100.00",
          approvedAmount: "150.00",
        },
        "approvedAmount",
      );
    });
  });

  describe("claimRecordInsertSchema — lifecycle", () => {
    it("rejects REJECTED without rejectionReason", () => {
      expectZodIssueAtPath(
        claimRecordInsertSchema,
        { ...validInsertBase, claimNumber: "CLM-REJ", status: "REJECTED" as const },
        "rejectionReason",
      );
    });

    it("rejects REJECTED with blank rejectionReason", () => {
      expectZodIssueAtPath(
        claimRecordInsertSchema,
        {
          ...validInsertBase,
          claimNumber: "CLM-REJB",
          status: "REJECTED" as const,
          rejectionReason: "   ",
        },
        "rejectionReason",
      );
    });

    it("rejects APPROVED without approvedAmount", () => {
      expectZodIssueAtPath(
        claimRecordInsertSchema,
        { ...validInsertBase, claimNumber: "CLM-APP", status: "APPROVED" as const },
        "approvedAmount",
      );
    });

    it("rejects PAID without paidAt", () => {
      expectZodIssueAtPath(
        claimRecordInsertSchema,
        {
          ...validInsertBase,
          claimNumber: "CLM-PAID1",
          status: "PAID" as const,
          approvedAmount: "500.00",
        },
        "paidAt",
      );
    });

    it("rejects PAID without approvedAmount", () => {
      expectZodIssueAtPath(
        claimRecordInsertSchema,
        {
          ...validInsertBase,
          claimNumber: "CLM-PAID2",
          status: "PAID" as const,
          paidAt: new Date("2026-03-10T12:00:00.000Z"),
        },
        "approvedAmount",
      );
    });
  });

  describe("claimRecordUpdateSchema", () => {
    it("rejects invalid status on patch", () => {
      expectZodIssueAtPath(claimRecordUpdateSchema, { status: "UNKNOWN" }, "status");
    });

    it("rejects REJECTED without rejectionReason in the same patch", () => {
      expectZodIssueAtPath(claimRecordUpdateSchema, { status: "REJECTED" as const }, "rejectionReason");
    });

    it("rejects APPROVED without approvedAmount in the same patch", () => {
      expectZodIssueAtPath(claimRecordUpdateSchema, { status: "APPROVED" as const }, "approvedAmount");
    });

    it("allows clearing nullable fields with null", () => {
      expect(
        claimRecordUpdateSchema.safeParse({
          approvedAmount: null,
          providerName: null,
          receiptPath: null,
          rejectionReason: null,
        }).success,
      ).toBe(true);
    });
  });
});
