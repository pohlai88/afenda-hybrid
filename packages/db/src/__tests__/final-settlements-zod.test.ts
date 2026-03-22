/**
 * Final settlement Zod rules + DB checks (uniques, dates, non-negative amounts).
 * Run: pnpm test:db -- src/__tests__/final-settlements-zod.test.ts
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { currencies } from "../schema-platform/core/currencies";
import { persons } from "../schema-hrm/hr/people/persons";
import { employees } from "../schema-hrm/hr/fundamentals/employees";
import {
  finalSettlements,
  finalSettlementInsertSchema,
  finalSettlementUpdateSchema,
  FinalSettlementIdSchema,
  type NewFinalSettlement,
} from "../schema-hrm/payroll/operations/finalSettlements";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";
import { matchesPgError } from "./pg-error";

const baseInsert = {
  tenantId: 1,
  employeeId: 1,
  settlementNumber: "FS-BASE-1",
  terminationDate: "2026-03-15",
  lastWorkingDay: "2026-03-10",
  totalEarnings: "1000.00",
  totalDeductions: "200.00",
  netSettlement: "800.00",
  currencyId: 1,
  createdBy: 1,
  updatedBy: 1,
};

describe("final settlement Zod schemas", () => {
  describe("FinalSettlementIdSchema", () => {
    it("rejects non-positive ids", () => {
      expect(FinalSettlementIdSchema.safeParse(0).success).toBe(false);
      expect(FinalSettlementIdSchema.safeParse(-1).success).toBe(false);
    });

    it("accepts positive integers", () => {
      expect(FinalSettlementIdSchema.safeParse(1).success).toBe(true);
    });
  });

  describe("finalSettlementInsertSchema", () => {
    it("rejects netSettlement that does not match totals", () => {
      expectZodIssueAtPath(
        finalSettlementInsertSchema,
        {
          ...baseInsert,
          settlementNumber: "fs-net-bad",
          totalEarnings: "100.00",
          totalDeductions: "20.00",
          netSettlement: "90.00",
        },
        "netSettlement"
      );
    });

    it("rejects lastWorkingDay after terminationDate", () => {
      expectZodIssueAtPath(
        finalSettlementInsertSchema,
        {
          ...baseInsert,
          settlementNumber: "fs-date-bad",
          terminationDate: "2026-03-10",
          lastWorkingDay: "2026-03-15",
        },
        "lastWorkingDay"
      );
    });

    it("rejects negative component amounts", () => {
      expectZodIssueAtPath(
        finalSettlementInsertSchema,
        {
          ...baseInsert,
          settlementNumber: "fs-neg-earn",
          unpaidSalary: "-1.00",
        },
        "unpaidSalary"
      );
    });

    it("rejects paidAt when status is not PAID", () => {
      expectZodIssueAtPath(
        finalSettlementInsertSchema,
        {
          ...baseInsert,
          settlementNumber: "fs-paid-bad",
          status: "APPROVED",
          approvedBy: 1,
          approvedAt: new Date("2026-03-01"),
          paidAt: new Date("2026-03-02"),
        },
        "paidAt"
      );
    });

    it("rejects PAID without paidAt", () => {
      expectZodIssueAtPath(
        finalSettlementInsertSchema,
        {
          ...baseInsert,
          settlementNumber: "fs-paid-miss",
          status: "PAID",
          approvedBy: 1,
          approvedAt: new Date("2026-03-01"),
        },
        "paidAt"
      );
    });

    it("accepts PAID with approval metadata and paidAt", () => {
      expect(
        finalSettlementInsertSchema.safeParse({
          ...baseInsert,
          settlementNumber: "FS-PAID-OK",
          status: "PAID",
          approvedBy: 1,
          approvedAt: new Date("2026-03-01"),
          paidAt: new Date("2026-03-05"),
        }).success
      ).toBe(true);
    });

    it("normalizes settlementNumber to uppercase", () => {
      const r = finalSettlementInsertSchema.safeParse({
        ...baseInsert,
        settlementNumber: "fs-mixed-case",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.settlementNumber).toBe("FS-MIXED-CASE");
    });

    it("rejects invalid status when provided", () => {
      expectInvalidEnumField(finalSettlementInsertSchema, baseInsert, "status", "VOID");
    });
  });

  describe("finalSettlementUpdateSchema", () => {
    it("strips tenantId and employeeId from the patch shape", () => {
      const r = finalSettlementUpdateSchema.safeParse({
        tenantId: 9,
        employeeId: 8,
        notes: "Updated",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("tenantId");
      expect(r.data).not.toHaveProperty("employeeId");
      expect(r.data.notes).toBe("Updated");
    });

    it("rejects partial monetary totals patch", () => {
      expectZodIssueAtPath(
        finalSettlementUpdateSchema,
        { totalEarnings: "500.00" },
        "netSettlement"
      );
    });

    it("rejects inconsistent totals when all three are provided", () => {
      expectZodIssueAtPath(
        finalSettlementUpdateSchema,
        {
          totalEarnings: "100.00",
          totalDeductions: "30.00",
          netSettlement: "60.00",
        },
        "netSettlement"
      );
    });

    it("rejects partial date patch", () => {
      expectZodIssueAtPath(
        finalSettlementUpdateSchema,
        { terminationDate: new Date("2026-04-01") },
        "lastWorkingDay"
      );
    });

    it("rejects invalid date order on update", () => {
      expectZodIssueAtPath(
        finalSettlementUpdateSchema,
        {
          terminationDate: new Date("2026-04-01"),
          lastWorkingDay: new Date("2026-04-10"),
        },
        "lastWorkingDay"
      );
    });

    it("rejects paidAt without status PAID in the same patch", () => {
      expectZodIssueAtPath(
        finalSettlementUpdateSchema,
        { paidAt: new Date("2026-04-01") },
        "paidAt"
      );
    });

    it("allows clearing workflow and notes with null", () => {
      expect(
        finalSettlementUpdateSchema.safeParse({
          notes: null,
          processedBy: null,
          processedAt: null,
          approvedBy: null,
          approvedAt: null,
          paidAt: null,
        }).success
      ).toBe(true);
    });
  });
});

describe("final settlements DB constraints", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let tenantId: number;
  let employeeId: number;
  let otherEmployeeId: number;
  let twoRowEmployeeId: number;
  let negCheckEmployeeId: number;
  let dateCheckEmployeeId: number;
  let currencyId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `FS_ZOD_${suffix}`,
        name: "Final settlement Zod tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const curCode = `FS${suffix.replace(/\W/g, "")}`.toUpperCase().slice(0, 12);
    const [cur] = await db
      .insert(currencies)
      .values({
        currencyCode: curCode,
        name: "Test currency",
        symbol: "X",
      })
      .returning();
    currencyId = cur.currencyId;

    const [p] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_FS_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p.personId,
        employeeCode: `E_FS_${suffix}`,
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
        personCode: `P_FS2_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e2] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p2.personId,
        employeeCode: `E_FS2_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    otherEmployeeId = e2.employeeId;

    const [p3] = await db
      .insert(persons)
      .values({
        tenantId,
        personCode: `P_FS3_${suffix}`,
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();

    const [e3] = await db
      .insert(employees)
      .values({
        tenantId,
        personId: p3.personId,
        employeeCode: `E_FS3_${suffix}`,
        hireDate: "2020-01-01",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    twoRowEmployeeId = e3.employeeId;

    for (let i = 4; i <= 5; i++) {
      const [px] = await db
        .insert(persons)
        .values({
          tenantId,
          personCode: `P_FS${i}_${suffix}`,
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      const [ex] = await db
        .insert(employees)
        .values({
          tenantId,
          personId: px.personId,
          employeeCode: `E_FS${i}_${suffix}`,
          hireDate: "2020-01-01",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      if (i === 4) negCheckEmployeeId = ex.employeeId;
      else dateCheckEmployeeId = ex.employeeId;
    }
  });

  afterAll(async () => {
    await db.delete(finalSettlements).where(eq(finalSettlements.tenantId, tenantId));
    await db.delete(employees).where(eq(employees.tenantId, tenantId));
    await db.delete(persons).where(eq(persons.tenantId, tenantId));
    await db.delete(currencies).where(eq(currencies.currencyId, currencyId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  function settlementRow(settlementNumber: string, extra?: Partial<NewFinalSettlement>) {
    return {
      tenantId,
      employeeId,
      settlementNumber,
      terminationDate: "2026-06-01",
      lastWorkingDay: "2026-05-28",
      totalEarnings: "1000.00",
      totalDeductions: "0.00",
      netSettlement: "1000.00",
      currencyId,
      createdBy: 1,
      updatedBy: 1,
      ...extra,
    };
  }

  it("rejects duplicate settlementNumber for same tenant (case-insensitive unique index)", async () => {
    await db.insert(finalSettlements).values(settlementRow("FS-DUP-1"));

    await expect(
      db.insert(finalSettlements).values(settlementRow("fs-dup-1", { employeeId: otherEmployeeId }))
    ).rejects.toSatisfy(matchesPgError(/uq_final_settlements_number|23505|duplicate key/i));
  });

  it("rejects a second non-cancelled settlement for the same employee", async () => {
    const num = `FS-EMP-${suffix.slice(0, 8)}`;
    await db
      .insert(finalSettlements)
      .values(
        settlementRow(`${num}-A`, { settlementNumber: `${num}-A`, employeeId: twoRowEmployeeId })
      );

    await expect(
      db
        .insert(finalSettlements)
        .values(
          settlementRow(`${num}-B`, { settlementNumber: `${num}-B`, employeeId: twoRowEmployeeId })
        )
    ).rejects.toSatisfy(matchesPgError(/uq_final_settlements_employee|23505|duplicate key/i));
  });

  it("rejects negative earnings (check constraint)", async () => {
    await expect(
      db.insert(finalSettlements).values(
        settlementRow(`FS-NEG-${suffix}`, {
          employeeId: negCheckEmployeeId,
          unpaidSalary: "-1.00",
        })
      )
    ).rejects.toSatisfy(matchesPgError(/chk_final_settlements_earnings|23514|check constraint/i));
  });

  it("rejects lastWorkingDay after terminationDate (check constraint)", async () => {
    await expect(
      db.insert(finalSettlements).values(
        settlementRow(`FS-DATES-${suffix}`, {
          employeeId: dateCheckEmployeeId,
          terminationDate: "2026-01-10",
          lastWorkingDay: "2026-01-20",
        })
      )
    ).rejects.toSatisfy(matchesPgError(/chk_final_settlements_dates|23514|check constraint/i));
  });
});
