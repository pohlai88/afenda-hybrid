/**
 * Payslip Zod rules + DB unique indexes (payslipNumber case-insensitive; one per employee per run).
 * Run: pnpm test:db -- src/__tests__/payslips-zod.test.ts
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { persons } from "../schema-hrm/hr/people/persons";
import { employees } from "../schema-hrm/hr/fundamentals/employees";
import { payrollPeriods } from "../schema-hrm/payroll/operations/payrollPeriods";
import { payrollRuns } from "../schema-hrm/payroll/operations/payrollRuns";
import {
  payslips,
  payslipInsertSchema,
  payslipUpdateSchema,
} from "../schema-hrm/payroll/operations/payslips";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";
import { matchesPgError } from "./pg-error";

const baseInsert = {
  tenantId: 1,
  payrollRunId: 1,
  employeeId: 1,
  payslipNumber: "PS-001",
  periodStart: new Date("2026-01-01"),
  periodEnd: new Date("2026-01-31"),
  payDate: new Date("2026-02-05"),
  grossPay: "5000.00",
  totalDeductions: "500.00",
  netPay: "4500.00",
  currencyId: 1,
  createdBy: 1,
  updatedBy: 1,
};

describe("payslip Zod schemas", () => {
  describe("payslipInsertSchema", () => {
    it("rejects negative grossPay", () => {
      expectZodIssueAtPath(
        payslipInsertSchema,
        { ...baseInsert, payslipNumber: "PS-NG", grossPay: "-1.00" },
        "grossPay"
      );
    });

    it("rejects netPay inconsistent with gross minus deductions", () => {
      expectZodIssueAtPath(
        payslipInsertSchema,
        { ...baseInsert, payslipNumber: "PS-NET", netPay: "4000.00" },
        "netPay"
      );
    });

    it("rejects periodEnd before periodStart", () => {
      expectZodIssueAtPath(
        payslipInsertSchema,
        {
          ...baseInsert,
          payslipNumber: "PS-DT",
          periodStart: new Date("2026-06-01"),
          periodEnd: new Date("2026-01-01"),
        },
        "periodEnd"
      );
    });

    it("normalizes payslipNumber to uppercase", () => {
      const r = payslipInsertSchema.safeParse({ ...baseInsert, payslipNumber: "ps-abc" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.payslipNumber).toBe("PS-ABC");
    });

    it("rejects GENERATED without generatedAt", () => {
      expectZodIssueAtPath(
        payslipInsertSchema,
        { ...baseInsert, payslipNumber: "PS-GEN", status: "GENERATED" },
        "generatedAt"
      );
    });

    it("rejects SENT without sentAt", () => {
      expectZodIssueAtPath(
        payslipInsertSchema,
        {
          ...baseInsert,
          payslipNumber: "PS-ST",
          status: "SENT",
          generatedAt: new Date("2026-02-01"),
        },
        "sentAt"
      );
    });

    it("accepts DRAFT without workflow timestamps", () => {
      expect(payslipInsertSchema.safeParse(baseInsert).success).toBe(true);
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(payslipInsertSchema, baseInsert, "status", "POSTED");
    });
  });

  describe("payslipUpdateSchema", () => {
    it("strips tenantId, employeeId, and payrollRunId from the patch shape", () => {
      const r = payslipUpdateSchema.safeParse({
        tenantId: 9,
        employeeId: 8,
        payrollRunId: 7,
        currencyId: 3,
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data).not.toHaveProperty("payrollRunId");
      expect(r.data.currencyId).toBe(3);
    });

    it("allows clearing workflow timestamps with null", () => {
      expect(
        payslipUpdateSchema.safeParse({
          generatedAt: null,
          sentAt: null,
          viewedAt: null,
        }).success
      ).toBe(true);
    });

    it("rejects orphan sentAt without status in patch", () => {
      expectZodIssueAtPath(payslipUpdateSchema, { sentAt: new Date() }, "sentAt");
    });

    it("rejects amount patch when net does not match gross minus deductions", () => {
      expectZodIssueAtPath(
        payslipUpdateSchema,
        {
          grossPay: "100.00",
          totalDeductions: "10.00",
          netPay: "95.00",
        },
        "netPay"
      );
    });
  });
});

describe("payslips DB constraints", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let tenantId: number;
  let currencyId: number;
  let payrollPeriodId: number;
  let payrollRunId: number;
  let employeeId: number;
  let employeeId2: number;

  const moneyRow = {
    grossPay: "1000.00",
    totalDeductions: "100.00",
    netPay: "900.00",
  };

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `PSLP_${suffix}`,
        name: "Payslip Zod tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = `PS${suffix.replace(/\W/g, "")}`.toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Payslip currency",
        symbol: "S",
      })
      .returning();
    currencyId = cur.currencyId;

    const [pp] = await db
      .insert(payrollPeriods)
      .values({
        tenantId,
        periodCode: `PER_PS_${suffix}`,
        name: "Period",
        periodStart: "2040-01-01",
        periodEnd: "2040-01-31",
        payDate: "2040-02-07",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payrollPeriodId = pp.payrollPeriodId;

    const [run] = await db
      .insert(payrollRuns)
      .values({
        tenantId,
        payrollPeriodId,
        currencyId,
        runCode: `RUN_PS_${suffix}`,
        runDate: "2040-02-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payrollRunId = run.payrollRunId;

    const [p] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_PS_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p.personId,
        employeeCode: `E_PS_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId = e.employeeId;

    const [p2] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_PS2_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e2] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p2.personId,
        employeeCode: `E_PS2_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId2 = e2.employeeId;
  });

  afterAll(async () => {
    await db.delete(payslips).where(eq(payslips.tenantId, tenantId));
    await db.delete(payrollRuns).where(eq(payrollRuns.tenantId, tenantId));
    await db.delete(payrollPeriods).where(eq(payrollPeriods.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects duplicate payslipNumber for same tenant (case-insensitive)", async () => {
    await db.insert(payslips).values({
      tenantId,
      payrollRunId,
      employeeId,
      payslipNumber: "PS-DUP-1",
      periodStart: "2040-03-01",
      periodEnd: "2040-03-31",
      payDate: "2040-04-05",
      ...moneyRow,
      currencyId,
      createdBy: 1,
      updatedBy: 1,
    });

    await expect(
      db.insert(payslips).values({
        tenantId,
        payrollRunId,
        employeeId: employeeId2,
        payslipNumber: "ps-dup-1",
        periodStart: "2040-04-01",
        periodEnd: "2040-04-30",
        payDate: "2040-05-05",
        ...moneyRow,
        currencyId,
        createdBy: 1,
        updatedBy: 1,
      })
    ).rejects.toSatisfy(matchesPgError(/uq_payslips_number|23505|duplicate key/i));
  });
});

describe("payslips DB employee+run uniqueness", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let tenantId: number;
  let currencyId: number;
  let payrollPeriodId: number;
  let payrollRunId: number;
  let employeeId: number;

  const moneyRow = {
    grossPay: "800.00",
    totalDeductions: "80.00",
    netPay: "720.00",
  };

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `PSLP2_${suffix}`,
        name: "Payslip Zod tenant 2",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = `P2${suffix.replace(/\W/g, "")}`.toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Payslip currency 2",
        symbol: "2",
      })
      .returning();
    currencyId = cur.currencyId;

    const [pp] = await db
      .insert(payrollPeriods)
      .values({
        tenantId,
        periodCode: `PER2_${suffix}`,
        name: "Period 2",
        periodStart: "2041-01-01",
        periodEnd: "2041-01-31",
        payDate: "2041-02-07",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payrollPeriodId = pp.payrollPeriodId;

    const [run] = await db
      .insert(payrollRuns)
      .values({
        tenantId,
        payrollPeriodId,
        currencyId,
        runCode: `RUN2_${suffix}`,
        runDate: "2041-02-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payrollRunId = run.payrollRunId;

    const [p] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P2_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p.personId,
        employeeCode: `E2_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId = e.employeeId;
  });

  afterAll(async () => {
    await db.delete(payslips).where(eq(payslips.tenantId, tenantId));
    await db.delete(payrollRuns).where(eq(payrollRuns.tenantId, tenantId));
    await db.delete(payrollPeriods).where(eq(payrollPeriods.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects second payslip for same tenant, employee, and payroll run", async () => {
    await db.insert(payslips).values({
      tenantId,
      payrollRunId,
      employeeId,
      payslipNumber: "PS-FIRST",
      periodStart: "2041-03-01",
      periodEnd: "2041-03-31",
      payDate: "2041-04-05",
      ...moneyRow,
      currencyId,
      createdBy: 1,
      updatedBy: 1,
    });

    await expect(
      db.insert(payslips).values({
        tenantId,
        payrollRunId,
        employeeId,
        payslipNumber: "PS-SECOND",
        periodStart: "2041-03-01",
        periodEnd: "2041-03-31",
        payDate: "2041-04-05",
        ...moneyRow,
        currencyId,
        createdBy: 1,
        updatedBy: 1,
      })
    ).rejects.toSatisfy(matchesPgError(/uq_payslips_employee_run|23505|duplicate key/i));
  });
});
