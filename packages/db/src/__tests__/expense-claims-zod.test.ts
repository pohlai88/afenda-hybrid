/**
 * Expense claim Zod rules + unique claimNumber (case-insensitive) per tenant.
 * Run: pnpm test:db -- src/__tests__/expense-claims-zod.test.ts
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { persons } from "../schema-hrm/hr/people/persons";
import { employees } from "../schema-hrm/hr/fundamentals/employees";
import { expenseTypes } from "../schema-hrm/payroll/fundamentals/expenseTypes";
import {
  expenseClaims,
  expenseClaimInsertSchema,
  expenseClaimUpdateSchema,
} from "../schema-hrm/payroll/operations/expenseClaims";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";
import { matchesPgError } from "./pg-error";

const baseInsert = {
  tenantId: 1,
  employeeId: 1,
  claimNumber: "EC-100",
  expenseTypeId: 1,
  expenseDate: new Date("2026-01-15"),
  amount: "100.50",
  currencyId: 1,
  description: "Client lunch",
  createdBy: 1,
  updatedBy: 1,
};

describe("expense claim Zod schemas", () => {
  describe("expenseClaimInsertSchema", () => {
    it("rejects zero amount", () => {
      expectZodIssueAtPath(expenseClaimInsertSchema, { ...baseInsert, amount: "0" }, "amount");
    });

    it("rejects negative amount", () => {
      expectZodIssueAtPath(expenseClaimInsertSchema, { ...baseInsert, amount: "-10.00" }, "amount");
    });

    it("rejects more than 2 decimal places on amount", () => {
      expectZodIssueAtPath(expenseClaimInsertSchema, { ...baseInsert, amount: "10.001" }, "amount");
    });

    it("rejects amount above numeric(10,2) magnitude", () => {
      expectZodIssueAtPath(
        expenseClaimInsertSchema,
        { ...baseInsert, amount: "100000000.00" },
        "amount"
      );
    });

    it("rejects non-canonical integer leading zeros on amount", () => {
      expectZodIssueAtPath(expenseClaimInsertSchema, { ...baseInsert, amount: "01.00" }, "amount");
    });

    it("normalizes claimNumber to uppercase", () => {
      const r = expenseClaimInsertSchema.safeParse({ ...baseInsert, claimNumber: "inv-abc" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.claimNumber).toBe("INV-ABC");
    });

    it("rejects paidAt when status is DRAFT", () => {
      expectZodIssueAtPath(
        expenseClaimInsertSchema,
        {
          ...baseInsert,
          claimNumber: "EC-DRAFT-PT",
          status: "DRAFT",
          paidAt: new Date("2026-02-01"),
        },
        "paidAt"
      );
    });

    it("rejects REJECTED without rejectionReason", () => {
      expectZodIssueAtPath(
        expenseClaimInsertSchema,
        {
          ...baseInsert,
          claimNumber: "EC-REJ-1",
          status: "REJECTED",
        },
        "rejectionReason"
      );
    });

    it("rejects PAID without paidAt", () => {
      expectZodIssueAtPath(
        expenseClaimInsertSchema,
        {
          ...baseInsert,
          claimNumber: "EC-PAID-1",
          status: "PAID",
          approvedBy: 1,
          approvedAt: new Date("2026-02-01"),
        },
        "paidAt"
      );
    });

    it("rejects APPROVED without approvedBy", () => {
      expectZodIssueAtPath(
        expenseClaimInsertSchema,
        {
          ...baseInsert,
          claimNumber: "EC-APP-1",
          status: "APPROVED",
          approvedAt: new Date("2026-02-01"),
        },
        "approvedBy"
      );
    });

    it("rejects rejectionReason when status is not REJECTED", () => {
      expectZodIssueAtPath(
        expenseClaimInsertSchema,
        {
          ...baseInsert,
          claimNumber: "EC-RSN-1",
          status: "SUBMITTED",
          rejectionReason: "No receipt",
        },
        "rejectionReason"
      );
    });

    it("rejects approval fields when status is SUBMITTED", () => {
      expectZodIssueAtPath(
        expenseClaimInsertSchema,
        {
          ...baseInsert,
          claimNumber: "EC-SUB-1",
          status: "SUBMITTED",
          approvedBy: 1,
          approvedAt: new Date("2026-02-01"),
        },
        "approvedBy"
      );
    });

    it("accepts PAID with full workflow fields", () => {
      expect(
        expenseClaimInsertSchema.safeParse({
          ...baseInsert,
          claimNumber: "EC-PAID-OK",
          status: "PAID",
          approvedBy: 1,
          approvedAt: new Date("2026-02-01"),
          paidAt: new Date("2026-03-01"),
        }).success
      ).toBe(true);
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(expenseClaimInsertSchema, baseInsert, "status", "VOID");
    });
  });

  describe("expenseClaimUpdateSchema", () => {
    it("strips tenantId and employeeId from the patch shape", () => {
      const r = expenseClaimUpdateSchema.safeParse({
        tenantId: 9,
        employeeId: 8,
        description: "Updated",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data.description).toBe("Updated");
    });

    it("rejects paidAt without status PAID in the same patch", () => {
      expectZodIssueAtPath(expenseClaimUpdateSchema, { paidAt: new Date("2026-04-01") }, "paidAt");
    });

    it("rejects rejectionReason without status REJECTED in the same patch", () => {
      expectZodIssueAtPath(
        expenseClaimUpdateSchema,
        { rejectionReason: "Missing docs" },
        "rejectionReason"
      );
    });

    it("allows clearing receiptPath, rejectionReason, workflow timestamps with null", () => {
      expect(
        expenseClaimUpdateSchema.safeParse({
          receiptPath: null,
          rejectionReason: null,
          approvedBy: null,
          approvedAt: null,
          paidAt: null,
        }).success
      ).toBe(true);
    });
  });
});

describe("expense claims DB constraints", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let tenantId: number;
  let employeeId: number;
  let expenseTypeId: number;
  let currencyId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `EX_CLM_${suffix}`,
        name: "Expense claim Zod tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = `EX${suffix.replace(/\W/g, "")}`.toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Test currency",
        symbol: "X",
      })
      .returning();
    currencyId = cur.currencyId;

    const [et] = await db
      .insert(expenseTypes)
      .values({
        tenantId,
        expenseCode: `EXTP_${suffix}`,
        name: "Travel",
        category: "TRAVEL",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    expenseTypeId = et.expenseTypeId;

    const [p] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_EX_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p.personId,
        employeeCode: `E_EX_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId = e.employeeId;
  });

  afterAll(async () => {
    await db.delete(expenseClaims).where(eq(expenseClaims.tenantId, tenantId));
    await db.delete(expenseTypes).where(eq(expenseTypes.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects duplicate claimNumber for same tenant (case-insensitive unique index)", async () => {
    await db.insert(expenseClaims).values({
      tenantId,
      employeeId,
      claimNumber: "CLAIM-DUP-1",
      expenseTypeId,
      expenseDate: "2032-01-01",
      amount: "25.00",
      currencyId,
      description: "First",
      createdBy: 1,
      updatedBy: 1,
    });

    await expect(
      db.insert(expenseClaims).values({
        tenantId,
        employeeId,
        claimNumber: "claim-dup-1",
        expenseTypeId,
        expenseDate: "2032-02-01",
        amount: "30.00",
        currencyId,
        description: "Second",
        createdBy: 1,
        updatedBy: 1,
      })
    ).rejects.toSatisfy(matchesPgError(/uq_expense_claims_number|23505|duplicate key/i));
  });
});
