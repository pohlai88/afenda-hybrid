/**
 * Statutory scheme rate Zod rules + DB unique index on (scheme, effectiveFrom) for non-deleted rows.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/statutory-scheme-rates-zod.test.ts
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  statutorySchemeRateInsertSchema,
  statutorySchemeRateUpdateSchema,
} from "../schema-hrm/payroll/fundamentals/statutorySchemeRates";
import { statutorySchemes } from "../schema-hrm/payroll/fundamentals/statutorySchemes";
import { statutorySchemeRates } from "../schema-hrm/payroll/fundamentals/statutorySchemeRates";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";
import { matchesPgError } from "./pg-error";

const validInsert = {
  statutorySchemeId: 1,
  effectiveFrom: new Date("2026-01-01"),
  employeeRate: "0.0500",
  employerRate: "0.0500",
};

describe("statutory scheme rate Zod schemas", () => {
  describe("statutorySchemeRateInsertSchema", () => {
    it("rejects employeeRate above 1", () => {
      expectZodIssueAtPath(
        statutorySchemeRateInsertSchema,
        { ...validInsert, employeeRate: "1.0001" },
        "employeeRate",
      );
    });

    it("rejects negative employerRate", () => {
      expectZodIssueAtPath(
        statutorySchemeRateInsertSchema,
        { ...validInsert, employerRate: "-0.01" },
        "employerRate",
      );
    });

    it("rejects rate with more than 4 decimal places", () => {
      expectZodIssueAtPath(
        statutorySchemeRateInsertSchema,
        { ...validInsert, employeeRate: "0.12345" },
        "employeeRate",
      );
    });

    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        statutorySchemeRateInsertSchema,
        {
          ...validInsert,
          effectiveFrom: new Date("2026-06-01"),
          effectiveTo: new Date("2026-01-01"),
        },
        "effectiveTo",
      );
    });

    it("rejects wageFloor greater than wageCeiling when both set", () => {
      expectZodIssueAtPath(
        statutorySchemeRateInsertSchema,
        {
          ...validInsert,
          wageFloor: "5000.00",
          wageCeiling: "1000.00",
        },
        "wageFloor",
      );
    });

    it("accepts valid insert with optional bounds and metadata", () => {
      expect(
        statutorySchemeRateInsertSchema.safeParse({
          ...validInsert,
          wageFloor: "0.00",
          wageCeiling: "10000.00",
          rateMetadata: { tiers: [1, 2] },
        }).success,
      ).toBe(true);
    });
  });

  describe("statutorySchemeRateUpdateSchema", () => {
    it("strips statutorySchemeId from the patch shape", () => {
      const r = statutorySchemeRateUpdateSchema.safeParse({
        statutorySchemeId: 99,
        employeeRate: "0.01",
      });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data).not.toHaveProperty("statutorySchemeId");
      expect(r.data.employeeRate).toBe("0.01");
    });

    it("allows clearing wage bounds, metadata, and effectiveTo with null", () => {
      expect(
        statutorySchemeRateUpdateSchema.safeParse({
          wageCeiling: null,
          wageFloor: null,
          rateMetadata: null,
          effectiveTo: null,
        }).success,
      ).toBe(true);
    });

    it("rejects invalid rate on patch", () => {
      expectZodIssueAtPath(
        statutorySchemeRateUpdateSchema,
        { employeeRate: "2" },
        "employeeRate",
      );
    });
  });
});

describe("statutory scheme rates DB constraints", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let schemeId: number;

  beforeAll(async () => {
    const [row] = await db
      .insert(statutorySchemes)
      .values({
        schemeCode: `SSR_ZOD_${suffix}`,
        name: "SSR Zod test scheme",
        country: "MY",
        category: "PENSION",
      })
      .returning();
    schemeId = row.statutorySchemeId;
  });

  afterAll(async () => {
    await db.delete(statutorySchemeRates).where(eq(statutorySchemeRates.statutorySchemeId, schemeId));
    await db.delete(statutorySchemes).where(eq(statutorySchemes.statutorySchemeId, schemeId));
  });

  it("rejects duplicate effectiveFrom for same scheme (partial unique index)", async () => {
    const effectiveFrom = "2030-03-01";

    await db.insert(statutorySchemeRates).values({
      statutorySchemeId: schemeId,
      effectiveFrom,
      employeeRate: "0.0100",
      employerRate: "0.0200",
    });

    await expect(
      db.insert(statutorySchemeRates).values({
        statutorySchemeId: schemeId,
        effectiveFrom,
        employeeRate: "0.0300",
        employerRate: "0.0400",
      }),
    ).rejects.toSatisfy(
      matchesPgError(/uq_statutory_scheme_rates_scheme_effective_from|23505|duplicate key/i),
    );
  });
});
