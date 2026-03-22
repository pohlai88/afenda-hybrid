/**
 * App-layer date rules for disciplinary actions (mirrors DB CHECKs).
 * Run: pnpm test:db -- src/__tests__/disciplinary-action-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  disciplinaryActionInsertSchema,
  disciplinaryActionUpdateSchema,
} from "../schema-hrm/talent/operations/disciplinaryActions";

/** Minimal insert shape that satisfies generated insert schema (enums + required fields). */
const validInsertBase = {
  tenantId: 1,
  employeeId: 2,
  actionType: "VERBAL_WARNING" as const,
  incidentDate: "2025-01-10",
  issueDate: "2025-01-15",
  description: "Policy review",
  issuedBy: 3,
  createdBy: 1,
  updatedBy: 1,
};

describe("disciplinaryAction Zod schemas (date refinements)", () => {
  describe("disciplinaryActionInsertSchema", () => {
    it("accepts issueDate on or after incidentDate", () => {
      const r = disciplinaryActionInsertSchema.safeParse({
        ...validInsertBase,
        incidentDate: "2025-01-10",
        issueDate: "2025-01-10",
      });
      expect(r.success).toBe(true);
    });

    it("rejects issueDate before incidentDate", () => {
      const r = disciplinaryActionInsertSchema.safeParse({
        ...validInsertBase,
        incidentDate: "2025-01-15",
        issueDate: "2025-01-10",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        const paths = r.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("issueDate");
        expect(r.error.issues.some((i) => String(i.message).includes("Issue date"))).toBe(true);
      }
    });

    it("accepts null / omitted expiryDate", () => {
      const r = disciplinaryActionInsertSchema.safeParse({
        ...validInsertBase,
        expiryDate: undefined,
      });
      expect(r.success).toBe(true);
    });

    it("rejects expiryDate before issueDate when set", () => {
      const r = disciplinaryActionInsertSchema.safeParse({
        ...validInsertBase,
        issueDate: "2025-06-01",
        expiryDate: "2025-05-01",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.map((i) => i.path.join("."))).toContain("expiryDate");
        expect(r.error.issues.some((i) => String(i.message).includes("Expiry date"))).toBe(true);
      }
    });

    // Drizzle `createInsertSchema` date columns are typically ISO strings here, not `Date` instances.
  });

  describe("disciplinaryActionUpdateSchema", () => {
    it("does not run issue/incident rule when only one of the pair is present", () => {
      const r = disciplinaryActionUpdateSchema.safeParse({
        issueDate: "2025-01-01",
      });
      expect(r.success).toBe(true);
    });

    it("rejects when both incidentDate and issueDate are set and invalid", () => {
      const r = disciplinaryActionUpdateSchema.safeParse({
        incidentDate: "2025-02-01",
        issueDate: "2025-01-01",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.map((i) => i.path.join("."))).toContain("issueDate");
      }
    });

    it("rejects expiry before issue when both provided", () => {
      const r = disciplinaryActionUpdateSchema.safeParse({
        issueDate: "2025-06-01",
        expiryDate: "2025-05-01",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.map((i) => i.path.join("."))).toContain("expiryDate");
        expect(r.error.issues.some((i) => String(i.message).includes("Expiry date"))).toBe(true);
      }
    });

    it("allows clearing expiry with null when issueDate is also sent", () => {
      const r = disciplinaryActionUpdateSchema.safeParse({
        issueDate: "2025-06-01",
        expiryDate: null,
      });
      expect(r.success).toBe(true);
    });
  });
});
