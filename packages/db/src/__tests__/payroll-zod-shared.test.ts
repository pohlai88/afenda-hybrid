/**
 * Unit tests for `schema-hrm/payroll/_zodShared.ts` (no DB).
 * Run: pnpm test:db -- src/__tests__/payroll-zod-shared.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  isCanonicalMoney12_2String,
  isValidNonNegativeMoney12_2,
  isValidPositiveMoney10_2,
  isValidPositiveMoney12_2,
  MAX_MONEY_10_2,
  MAX_MONEY_12_2,
  normalizeMoneyStringToTwoDecimals,
  zMoney10_2Positive,
  zMoney12_2NonNegative,
  zMoney12_2Positive,
} from "../schema-hrm/payroll/_zodShared";

describe("payroll _zodShared money helpers", () => {
  describe("isValidPositiveMoney12_2", () => {
    it("rejects zero and negatives", () => {
      expect(isValidPositiveMoney12_2("0")).toBe(false);
      expect(isValidPositiveMoney12_2("0.00")).toBe(false);
      expect(isValidPositiveMoney12_2("-1.00")).toBe(false);
    });

    it("rejects too many decimals", () => {
      expect(isValidPositiveMoney12_2("123.456")).toBe(false);
    });

    it("rejects magnitude overflow", () => {
      expect(isValidPositiveMoney12_2("10000000000.00")).toBe(false);
      expect(isValidPositiveMoney12_2("99999999999.99")).toBe(false);
    });

    it("accepts max representable magnitude", () => {
      expect(isValidPositiveMoney12_2(String(MAX_MONEY_12_2))).toBe(true);
    });

    it("rejects trailing dot and scientific notation", () => {
      expect(isValidPositiveMoney12_2("123.")).toBe(false);
      expect(isValidPositiveMoney12_2("1e2")).toBe(false);
    });

    it("rejects redundant integer leading zeros", () => {
      expect(isValidPositiveMoney12_2("01.00")).toBe(false);
      expect(isValidPositiveMoney12_2("0001.00")).toBe(false);
    });

    it("accepts canonical positives", () => {
      expect(isValidPositiveMoney12_2("0.01")).toBe(true);
      expect(isValidPositiveMoney12_2("1")).toBe(true);
      expect(isValidPositiveMoney12_2("1.50")).toBe(true);
    });
  });

  describe("isValidNonNegativeMoney12_2", () => {
    it("accepts zero", () => {
      expect(isValidNonNegativeMoney12_2("0")).toBe(true);
      expect(isValidNonNegativeMoney12_2("0.00")).toBe(true);
    });
  });

  describe("normalizeMoneyStringToTwoDecimals", () => {
    it("strips leading zeros and pads fraction", () => {
      expect(normalizeMoneyStringToTwoDecimals("0001.5")).toBe("1.50");
      expect(normalizeMoneyStringToTwoDecimals("0.00")).toBe("0.00");
    });

    it("returns null for invalid inputs", () => {
      expect(normalizeMoneyStringToTwoDecimals("123.")).toBe(null);
      expect(normalizeMoneyStringToTwoDecimals("1e2")).toBe(null);
      expect(normalizeMoneyStringToTwoDecimals("1.001")).toBe(null);
    });
  });

  describe("isCanonicalMoney12_2String", () => {
    it("matches documented edge cases", () => {
      expect(isCanonicalMoney12_2String("1")).toBe(true);
      expect(isCanonicalMoney12_2String("01")).toBe(false);
    });
  });

  describe("isValidPositiveMoney10_2 (numeric 10,2)", () => {
    it("rejects overflow past 8 integer digits", () => {
      expect(isValidPositiveMoney10_2("100000000.00")).toBe(false);
      expect(isValidPositiveMoney10_2(String(MAX_MONEY_10_2))).toBe(true);
    });
  });

  /** Zod factories — same edge cases as predicates, via `.safeParse`. */
  describe("zMoney12_2Positive / zMoney12_2NonNegative", () => {
    const pos = zMoney12_2Positive();
    const nn = zMoney12_2NonNegative();

    it("positive: rejects 0, 0.00, 123.456, 99999999999.99, 123., 01.00", () => {
      expect(pos.safeParse("0").success).toBe(false);
      expect(pos.safeParse("0.00").success).toBe(false);
      expect(pos.safeParse("123.456").success).toBe(false);
      expect(pos.safeParse("99999999999.99").success).toBe(false);
      expect(pos.safeParse("123.").success).toBe(false);
      expect(pos.safeParse("01.00").success).toBe(false);
    });

    it("positive: accepts canonical values", () => {
      expect(pos.safeParse("0.01").success).toBe(true);
      expect(pos.safeParse(String(MAX_MONEY_12_2)).success).toBe(true);
    });

    it("non-negative: accepts 0 and 0.00", () => {
      expect(nn.safeParse("0").success).toBe(true);
      expect(nn.safeParse("0.00").success).toBe(true);
    });
  });

  describe("zMoney10_2Positive", () => {
    const p = zMoney10_2Positive();
    it("rejects same bad forms as 12,2 positive", () => {
      expect(p.safeParse("123.").success).toBe(false);
      expect(p.safeParse("01.00").success).toBe(false);
    });
  });
});
