/**
 * Loan record Zod rules + unique loanNumber (case-insensitive) per tenant.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/loan-records-zod.test.ts
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { persons } from "../schema-hrm/hr/people/persons";
import { employees } from "../schema-hrm/hr/fundamentals/employees";
import { loanRecords, loanRecordInsertSchema, loanRecordUpdateSchema } from "../schema-hrm/payroll/operations/loanRecords";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";
import { matchesPgError } from "./pg-error";

const baseInsert = {
  tenantId: 1,
  employeeId: 1,
  loanNumber: "LN-BASE",
  loanType: "PERSONAL_LOAN" as const,
  principalAmount: "1000.00",
  totalAmount: "1100.00",
  currencyId: 1,
  startDate: new Date("2026-01-01"),
  endDate: new Date("2027-01-01"),
  monthlyDeduction: "100.00",
  totalPaid: "0",
  outstandingBalance: "1100.00",
  createdBy: 1,
  updatedBy: 1,
};

describe("loan record Zod schemas", () => {
  describe("loanRecordInsertSchema", () => {
    it("rejects non-positive principal", () => {
      expectZodIssueAtPath(loanRecordInsertSchema, { ...baseInsert, loanNumber: "LN-P0", principalAmount: "0" }, "principalAmount");
    });

    it("rejects negative principal", () => {
      expectZodIssueAtPath(loanRecordInsertSchema, { ...baseInsert, loanNumber: "LN-PN", principalAmount: "-100.00" }, "principalAmount");
    });

    it("rejects non-positive monthly deduction", () => {
      expectZodIssueAtPath(loanRecordInsertSchema, { ...baseInsert, loanNumber: "LN-M0", monthlyDeduction: "0" }, "monthlyDeduction");
    });

    it("rejects endDate on or before startDate", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        {
          ...baseInsert,
          loanNumber: "LN-DT",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-01-01"),
        },
        "endDate",
      );
    });

    it("rejects totalAmount below principal", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        { ...baseInsert, loanNumber: "LN-TOT", totalAmount: "500.00" },
        "totalAmount",
      );
    });

    it("rejects totalPaid greater than totalAmount", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        { ...baseInsert, loanNumber: "LN-TP", totalPaid: "1200.00", outstandingBalance: "-100.00" },
        "totalPaid",
      );
    });

    it("rejects outstandingBalance inconsistent with totalAmount minus totalPaid", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        { ...baseInsert, loanNumber: "LN-OB", outstandingBalance: "500.00" },
        "outstandingBalance",
      );
    });

    it("rejects negative outstandingBalance", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        { ...baseInsert, loanNumber: "LN-NEG", totalPaid: "500.00", outstandingBalance: "-100.00" },
        "outstandingBalance",
      );
    });

    it("normalizes loanNumber to uppercase", () => {
      const r = loanRecordInsertSchema.safeParse({ ...baseInsert, loanNumber: "loan-abc" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.loanNumber).toBe("LOAN-ABC");
    });

    it("rejects ACTIVE without disbursementDate", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        {
          ...baseInsert,
          loanNumber: "LN-ACT",
          status: "ACTIVE",
          approvedBy: 1,
          approvedAt: new Date("2026-01-15"),
        },
        "disbursementDate",
      );
    });

    it("rejects APPROVED without approvedBy", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        {
          ...baseInsert,
          loanNumber: "LN-APP",
          status: "APPROVED",
          approvedAt: new Date("2026-01-10"),
        },
        "approvedBy",
      );
    });

    it("rejects COMPLETED with non-zero outstandingBalance", () => {
      expectZodIssueAtPath(
        loanRecordInsertSchema,
        {
          ...baseInsert,
          loanNumber: "LN-CMP",
          status: "COMPLETED",
          approvedBy: 1,
          approvedAt: new Date("2026-01-10"),
          disbursementDate: new Date("2026-01-12"),
          totalPaid: "1100.00",
          outstandingBalance: "100.00",
        },
        "outstandingBalance",
      );
    });

    it("accepts COMPLETED with zero outstanding and matching paid/total", () => {
      expect(
        loanRecordInsertSchema.safeParse({
          ...baseInsert,
          loanNumber: "LN-CMP-OK",
          status: "COMPLETED",
          approvedBy: 1,
          approvedAt: new Date("2026-01-10"),
          disbursementDate: new Date("2026-01-12"),
          totalPaid: "1100.00",
          outstandingBalance: "0.00",
        }).success,
      ).toBe(true);
    });

    it("rejects invalid loan type when provided", () => {
      expectInvalidEnumField(loanRecordInsertSchema, baseInsert, "loanType", "MORTGAGE");
    });
  });

  describe("loanRecordUpdateSchema", () => {
    it("strips tenantId and employeeId from the patch shape", () => {
      const r = loanRecordUpdateSchema.safeParse({
        tenantId: 9,
        employeeId: 8,
        reason: "Note",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data.reason).toBe("Note");
    });

    it("allows clearing reason, approval fields, and disbursementDate with null", () => {
      expect(
        loanRecordUpdateSchema.safeParse({
          reason: null,
          approvedBy: null,
          approvedAt: null,
          disbursementDate: null,
        }).success,
      ).toBe(true);
    });

    it("rejects orphan approvedBy without status in patch", () => {
      expectZodIssueAtPath(loanRecordUpdateSchema, { approvedBy: 1 }, "approvedBy");
    });

    it("allows setting disbursementDate without status (e.g. pending loan)", () => {
      expect(
        loanRecordUpdateSchema.safeParse({
          disbursementDate: new Date("2026-03-01"),
        }).success,
      ).toBe(true);
    });
  });
});

describe("loan records DB constraints", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let tenantId: number;
  let employeeId: number;
  let currencyId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `LN_REC_${suffix}`,
        name: "Loan record Zod tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = (`LN${suffix.replace(/\W/g, "")}`).toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Loan test currency",
        symbol: "L",
      })
      .returning();
    currencyId = cur.currencyId;

    const [p] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_LN_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p.personId,
        employeeCode: `E_LN_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId = e.employeeId;
  });

  afterAll(async () => {
    await db.delete(loanRecords).where(eq(loanRecords.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects duplicate loanNumber for same tenant (case-insensitive unique index)", async () => {
    await db.insert(loanRecords).values({
      tenantId,
      employeeId,
      loanNumber: "LOAN-DUP-1",
      loanType: "PERSONAL_LOAN",
      principalAmount: "500.00",
      interestRate: "0",
      totalAmount: "500.00",
      currencyId,
      startDate: "2033-01-01",
      endDate: "2034-01-01",
      monthlyDeduction: "50.00",
      totalPaid: "0",
      outstandingBalance: "500.00",
      createdBy: 1,
      updatedBy: 1,
    });

    await expect(
      db.insert(loanRecords).values({
        tenantId,
        employeeId,
        loanNumber: "loan-dup-1",
        loanType: "PERSONAL_LOAN",
        principalAmount: "300.00",
        interestRate: "0",
        totalAmount: "300.00",
        currencyId,
        startDate: "2033-02-01",
        endDate: "2034-02-01",
        monthlyDeduction: "30.00",
        totalPaid: "0",
        outstandingBalance: "300.00",
        createdBy: 1,
        updatedBy: 1,
      }),
    ).rejects.toSatisfy(matchesPgError(/uq_loan_records_number|23505|duplicate key/i));
  });
});
