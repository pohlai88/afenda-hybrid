/**
 * Tax profile Zod rules + partial unique index (one ACTIVE profile per employee per tax year).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/tax-profiles-zod.test.ts
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { persons } from "../schema-hrm/hr/people/persons";
import { employees } from "../schema-hrm/hr/fundamentals/employees";
import {
  taxProfiles,
  taxProfileInsertSchema,
  taxProfileUpdateSchema,
} from "../schema-hrm/payroll/fundamentals/taxProfiles";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";
import { matchesPgError } from "./pg-error";

const validInsert = {
  tenantId: 1,
  employeeId: 1,
  taxYear: 2026,
  effectiveFrom: new Date("2026-01-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("tax profile Zod schemas", () => {
  describe("taxProfileInsertSchema", () => {
    it("rejects negative allowances", () => {
      expectZodIssueAtPath(taxProfileInsertSchema, { ...validInsert, allowances: -1 }, "allowances");
    });

    it("rejects allowances above 99", () => {
      expectZodIssueAtPath(taxProfileInsertSchema, { ...validInsert, allowances: 100 }, "allowances");
    });

    it("rejects negative additionalWithholding", () => {
      expectZodIssueAtPath(
        taxProfileInsertSchema,
        { ...validInsert, additionalWithholding: -10 },
        "additionalWithholding",
      );
    });

    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        taxProfileInsertSchema,
        {
          ...validInsert,
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });

    it("rejects invalid country code length", () => {
      expectZodIssueAtPath(
        taxProfileInsertSchema,
        { ...validInsert, taxJurisdictionCountry: "USA" },
        "taxJurisdictionCountry",
      );
    });

    it("rejects non-alpha country code", () => {
      expectZodIssueAtPath(
        taxProfileInsertSchema,
        { ...validInsert, taxJurisdictionCountry: "12" },
        "taxJurisdictionCountry",
      );
    });

    it("normalizes country code to uppercase", () => {
      const r = taxProfileInsertSchema.safeParse({ ...validInsert, taxJurisdictionCountry: "my" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.taxJurisdictionCountry).toBe("MY");
    });

    it("rejects non-US filing status when tax regime is not US_FEDERAL", () => {
      expectZodIssueAtPath(
        taxProfileInsertSchema,
        {
          ...validInsert,
          taxRegime: "MY_LHDN",
          filingStatus: "MARRIED_FILING_JOINTLY",
        },
        "filingStatus",
      );
    });

    it("accepts US_FEDERAL with non-SINGLE filing status", () => {
      expect(
        taxProfileInsertSchema.safeParse({
          ...validInsert,
          taxRegime: "US_FEDERAL",
          filingStatus: "MARRIED_FILING_JOINTLY",
        }).success,
      ).toBe(true);
    });

    it("accepts MY_LHDN with SINGLE filing status placeholder", () => {
      expect(
        taxProfileInsertSchema.safeParse({
          ...validInsert,
          taxRegime: "MY_LHDN",
          filingStatus: "SINGLE",
        }).success,
      ).toBe(true);
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(taxProfileInsertSchema, validInsert, "status", "DRAFT");
    });
  });

  describe("taxProfileUpdateSchema", () => {
    it("strips tenantId and employeeId from the patch shape", () => {
      const r = taxProfileUpdateSchema.safeParse({
        tenantId: 99,
        employeeId: 88,
        allowances: 5,
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data.allowances).toBe(5);
    });

    it("allows clearing taxIdNumber, regimePayload, and effectiveTo with null", () => {
      expect(
        taxProfileUpdateSchema.safeParse({
          taxIdNumber: null,
          regimePayload: null,
          effectiveTo: null,
        }).success,
      ).toBe(true);
    });

    it("rejects MY_LHDN and non-SINGLE filing when both appear in patch", () => {
      expectZodIssueAtPath(
        taxProfileUpdateSchema,
        { taxRegime: "MY_LHDN", filingStatus: "HEAD_OF_HOUSEHOLD" },
        "filingStatus",
      );
    });
  });
});

describe("tax profiles DB constraints", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let tenantId: number;
  let employeeId: number;
  const taxYear = 2041;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `TX_PRF_${suffix}`,
        name: "Tax profile Zod tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const [p] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_TX_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p.personId,
        employeeCode: `E_TX_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId = e.employeeId;
  });

  afterAll(async () => {
    await db.delete(taxProfiles).where(eq(taxProfiles.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects duplicate ACTIVE profile for same tenant, employee, and tax year", async () => {
    await db.insert(taxProfiles).values({
      tenantId,
      employeeId,
      taxYear,
      effectiveFrom: "2031-01-01",
      taxRegime: "US_FEDERAL",
      filingStatus: "SINGLE",
      createdBy: 1,
      updatedBy: 1,
    });

    await expect(
      db.insert(taxProfiles).values({
        tenantId,
        employeeId,
        taxYear,
        effectiveFrom: "2031-06-01",
        taxRegime: "US_FEDERAL",
        filingStatus: "SINGLE",
        createdBy: 1,
        updatedBy: 1,
      }),
    ).rejects.toSatisfy(matchesPgError(/uq_tax_profiles_employee_year|23505|duplicate key/i));
  });
});
