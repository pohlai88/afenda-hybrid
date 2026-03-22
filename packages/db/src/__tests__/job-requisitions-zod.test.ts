/**
 * Job requisition Zod rules (salary strings, APPROVED, headcount).
 * Run: pnpm test:db -- src/__tests__/job-requisitions-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  jobRequisitionInsertSchema,
  jobRequisitionUpdateSchema,
} from "../schema-hrm/recruitment/operations/jobRequisitions";

const validInsertBase = {
  tenantId: 1,
  requisitionCode: "REQ-001",
  title: "Software Engineer",
  headcount: 1,
  createdBy: 1,
  updatedBy: 1,
};

describe("job requisition Zod schemas", () => {
  describe("jobRequisitionInsertSchema", () => {
    it("accepts minimal DRAFT insert", () => {
      expect(jobRequisitionInsertSchema.safeParse(validInsertBase).success).toBe(true);
    });

    it("rejects APPROVED without approvedBy and approvedAt", () => {
      const r = jobRequisitionInsertSchema.safeParse({
        ...validInsertBase,
        requisitionCode: "REQ-APR",
        status: "APPROVED" as const,
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "approvedBy")).toBe(true);
      }
    });

    it("accepts APPROVED with approvedBy and approvedAt", () => {
      expect(
        jobRequisitionInsertSchema.safeParse({
          ...validInsertBase,
          requisitionCode: "REQ-AP2",
          status: "APPROVED" as const,
          approvedBy: 99,
          approvedAt: new Date("2026-03-20T10:00:00.000Z"),
        }).success
      ).toBe(true);
    });

    it("rejects invalid minSalary format", () => {
      expect(
        jobRequisitionInsertSchema.safeParse({
          ...validInsertBase,
          requisitionCode: "REQ-S1",
          minSalary: "12.345",
        }).success
      ).toBe(false);
    });

    it("rejects minSalary greater than maxSalary", () => {
      const r = jobRequisitionInsertSchema.safeParse({
        ...validInsertBase,
        requisitionCode: "REQ-S2",
        minSalary: "90000.00",
        maxSalary: "80000.00",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path.join(".") === "maxSalary")).toBe(true);
      }
    });

    it("rejects headcount below 1", () => {
      expect(
        jobRequisitionInsertSchema.safeParse({ ...validInsertBase, headcount: 0 }).success
      ).toBe(false);
    });
  });

  describe("jobRequisitionUpdateSchema", () => {
    it("accepts empty partial update", () => {
      expect(jobRequisitionUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("rejects status APPROVED without approver fields in same patch", () => {
      expect(jobRequisitionUpdateSchema.safeParse({ status: "APPROVED" }).success).toBe(false);
    });

    it("accepts status APPROVED with approvedBy and approvedAt in same patch", () => {
      expect(
        jobRequisitionUpdateSchema.safeParse({
          status: "APPROVED",
          approvedBy: 5,
          approvedAt: new Date("2026-03-21T12:00:00.000Z"),
        }).success
      ).toBe(true);
    });
  });
});
