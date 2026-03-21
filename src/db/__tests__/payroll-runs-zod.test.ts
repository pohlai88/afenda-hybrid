/**
 * Payroll run Zod rules + unique runCode (case-insensitive) per tenant.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/payroll-runs-zod.test.ts
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { payrollPeriods } from "../schema-hrm/payroll/operations/payrollPeriods";
import { payrollRuns, payrollRunInsertSchema, payrollRunUpdateSchema } from "../schema-hrm/payroll/operations/payrollRuns";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";
import { matchesPgError } from "./pg-error";

const baseInsert = {
  tenantId: 1,
  payrollPeriodId: 1,
  currencyId: 1,
  runCode: "RUN-001",
  runDate: new Date("2026-04-01"),
  createdBy: 1,
  updatedBy: 1,
};

describe("payroll run Zod schemas", () => {
  describe("payrollRunInsertSchema", () => {
    it("rejects negative totalGross", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        { ...baseInsert, runCode: "RUN-NG", totalGross: "-1.00" },
        "totalGross",
      );
    });

    it("rejects totalNet inconsistent with gross minus deductions", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        {
          ...baseInsert,
          runCode: "RUN-NET",
          totalGross: "1000.00",
          totalDeductions: "200.00",
          totalNet: "900.00",
        },
        "totalNet",
      );
    });

    it("normalizes runCode to uppercase", () => {
      const r = payrollRunInsertSchema.safeParse({ ...baseInsert, runCode: "apr-01" });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.runCode).toBe("APR-01");
    });

    it("rejects APPROVED without approvedBy", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        {
          ...baseInsert,
          runCode: "RUN-APP",
          status: "APPROVED",
          approvedAt: new Date("2026-04-02"),
        },
        "approvedBy",
      );
    });

    it("rejects DRAFT with approval fields set", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        {
          ...baseInsert,
          runCode: "RUN-DR",
          status: "DRAFT",
          approvedBy: 1,
          approvedAt: new Date("2026-04-02"),
        },
        "status",
      );
    });

    it("accepts APPROVED with approval fields only", () => {
      expect(
        payrollRunInsertSchema.safeParse({
          ...baseInsert,
          runCode: "RUN-APP-OK",
          status: "APPROVED",
          approvedBy: 1,
          approvedAt: new Date("2026-04-02"),
        }).success,
      ).toBe(true);
    });

    it("rejects PROCESSING without processedBy/processedAt (requires processing audit)", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        {
          ...baseInsert,
          runCode: "RUN-PR",
          status: "PROCESSING",
          approvedBy: 1,
          approvedAt: new Date("2026-04-02"),
        },
        "processedBy",
      );
    });

    it("rejects COMPLETED without prior approval fields", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        {
          ...baseInsert,
          runCode: "RUN-CMP",
          status: "COMPLETED",
          processedBy: 1,
          processedAt: new Date("2026-04-05"),
        },
        "approvedBy",
      );
    });

    it("rejects employeeCount 0 when totals are non-zero", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        {
          ...baseInsert,
          runCode: "RUN-EC",
          totalGross: "500.00",
          totalDeductions: "50.00",
          totalNet: "450.00",
          employeeCount: 0,
        },
        "employeeCount",
      );
    });

    it("rejects negative employeeCount", () => {
      expectZodIssueAtPath(
        payrollRunInsertSchema,
        { ...baseInsert, runCode: "RUN-ECN", employeeCount: -1 },
        "employeeCount",
      );
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(payrollRunInsertSchema, baseInsert, "status", "ARCHIVED");
    });
  });

  describe("payrollRunUpdateSchema", () => {
    it("strips tenantId and payrollPeriodId but allows currencyId on the patch", () => {
      const r = payrollRunUpdateSchema.safeParse({
        tenantId: 9,
        payrollPeriodId: 8,
        currencyId: 7,
        notes: "Adjusted",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("payrollPeriodId");
      expect(r.data.currencyId).toBe(7);
      expect(r.data.notes).toBe("Adjusted");
    });

    it("rejects orphan approvedBy without status in patch", () => {
      expectZodIssueAtPath(payrollRunUpdateSchema, { approvedBy: 1 }, "approvedBy");
    });

    it("rejects total patch when net does not match gross minus deductions", () => {
      expectZodIssueAtPath(
        payrollRunUpdateSchema,
        {
          totalGross: "100.00",
          totalDeductions: "10.00",
          totalNet: "95.00",
        },
        "totalNet",
      );
    });
  });
});

describe("payroll runs DB constraints", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let tenantId: number;
  let currencyId: number;
  let payrollPeriodId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `PR_RUN_${suffix}`,
        name: "Payroll run Zod tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = (`PR${suffix.replace(/\W/g, "")}`).toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Payroll run currency",
        symbol: "P",
      })
      .returning();
    currencyId = cur.currencyId;

    const [pp] = await db
      .insert(payrollPeriods)
      .values({
        tenantId,
        periodCode: `PER_${suffix}`,
        name: "Test period",
        periodStart: "2038-01-01",
        periodEnd: "2038-01-31",
        payDate: "2038-02-05",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    payrollPeriodId = pp.payrollPeriodId;
  });

  afterAll(async () => {
    await db.delete(payrollRuns).where(eq(payrollRuns.tenantId, tenantId));
    await db.delete(payrollPeriods).where(eq(payrollPeriods.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("rejects duplicate runCode for same tenant (case-insensitive unique index)", async () => {
    await db.insert(payrollRuns).values({
      tenantId,
      payrollPeriodId,
      currencyId,
      runCode: "RUN-DUP-1",
      runDate: "2038-03-01",
      createdBy: 1,
      updatedBy: 1,
    });

    await expect(
      db.insert(payrollRuns).values({
        tenantId,
        payrollPeriodId,
        currencyId,
        runCode: "run-dup-1",
        runDate: "2038-03-15",
        createdBy: 1,
        updatedBy: 1,
      }),
    ).rejects.toSatisfy(matchesPgError(/uq_payroll_runs_code|23505|duplicate key/i));
  });
});
