/**
 * Payroll RQB nested graph: payrollRun → payslips → paymentRecords → bankAccount → currency.
 * Run: pnpm test:db -- src/__tests__/payroll-rqb-nested-relations.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { persons } from "../schema-hrm/hr/people/persons";
import { employees } from "../schema-hrm/hr/fundamentals/employees";
import { payrollPeriods } from "../schema-hrm/payroll/operations/payrollPeriods";
import { payrollRuns } from "../schema-hrm/payroll/operations/payrollRuns";
import { payslips } from "../schema-hrm/payroll/operations/payslips";
import { paymentRecords } from "../schema-hrm/payroll/operations/paymentRecords";
import { bankAccounts } from "../schema-hrm/payroll/fundamentals/bankAccounts";

describe("payroll nested RQB relations", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let tenantId: number;
  let currencyId: number;
  let employeeId: number;
  let payrollPeriodId: number;
  let payrollRunId: number;
  let payslipId: number;
  let bankAccountId: number;
  let paymentRecordId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `PR_RQB_${suffix}`,
        name: "Payroll RQB test tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = `P${suffix.replace(/\W/g, "")}`.toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Payroll RQB tender",
        symbol: "P",
      })
      .returning();
    currencyId = cur.currencyId;

    const [p] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_PAY_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p.personId,
        employeeCode: `E_PAY_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    employeeId = e.employeeId;

    const [period] = await db
      .insert(payrollPeriods)
      .values({
        tenantId,
        periodCode: `PER_${suffix}`,
        name: "Test period",
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payDate: "2026-02-07",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payrollPeriodId = period.payrollPeriodId;

    const [run] = await db
      .insert(payrollRuns)
      .values({
        tenantId,
        payrollPeriodId,
        runCode: `RUN_${suffix}`,
        runDate: "2026-02-01",
        currencyId,
        status: "DRAFT",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payrollRunId = run.payrollRunId;

    const [acct] = await db
      .insert(bankAccounts)
      .values({
        tenantId,
        employeeId,
        bankName: "Test Bank",
        accountNumber: `ACC_${suffix}`,
        accountHolderName: "Test Holder",
        currencyId,
        status: "ACTIVE",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    bankAccountId = acct.bankAccountId;

    const [slip] = await db
      .insert(payslips)
      .values({
        tenantId,
        payrollRunId,
        employeeId,
        payslipNumber: `PS_${suffix}`,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payDate: "2026-02-07",
        grossPay: "1000.00",
        totalDeductions: "100.00",
        netPay: "900.00",
        currencyId,
        status: "DRAFT",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payslipId = slip.payslipId;

    const [pay] = await db
      .insert(paymentRecords)
      .values({
        tenantId,
        payslipId,
        bankAccountId,
        paymentReference: `REF_${suffix}`,
        amount: "900.00",
        currencyId,
        paymentDate: "2026-02-07",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    paymentRecordId = pay.paymentRecordId;
  });

  afterAll(async () => {
    await db.delete(paymentRecords).where(eq(paymentRecords.tenantId, tenantId));
    await db.delete(payslips).where(eq(payslips.tenantId, tenantId));
    await db.delete(payrollRuns).where(eq(payrollRuns.tenantId, tenantId));
    await db.delete(payrollPeriods).where(eq(payrollPeriods.tenantId, tenantId));
    await db.delete(bankAccounts).where(eq(bankAccounts.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("loads payrollRun with payslips, paymentRecords, bankAccount, and currencies", async () => {
    const row = await db.query.payrollRuns.findFirst({
      where: {
        AND: [{ tenantId: { eq: tenantId } }, { payrollRunId: { eq: payrollRunId } }],
      },
      with: {
        currency: true,
        processor: true,
        approver: true,
        payslips: {
          with: {
            employee: true,
            currency: true,
            paymentRecords: {
              with: {
                bankAccount: { with: { currency: true } },
                currency: true,
              },
            },
          },
        },
      },
    });

    expect(row).toBeDefined();
    expect(row!.currency!.currencyId).toBe(currencyId);
    expect(row!.processor).toBeNull();
    expect(row!.approver).toBeNull();

    expect(row!.payslips).toHaveLength(1);
    const slip = row!.payslips[0];
    expect(slip.payslipId).toBe(payslipId);
    expect(slip.employee!.employeeId).toBe(employeeId);
    expect(slip.currency!.currencyId).toBe(currencyId);

    expect(slip.paymentRecords).toHaveLength(1);
    const pr = slip.paymentRecords[0];
    expect(pr.paymentRecordId).toBe(paymentRecordId);
    expect(pr.currency!.currencyId).toBe(currencyId);
    expect(pr.bankAccount!.bankAccountId).toBe(bankAccountId);
    expect(pr.bankAccount!.currency!.currencyId).toBe(currencyId);
  });
});
