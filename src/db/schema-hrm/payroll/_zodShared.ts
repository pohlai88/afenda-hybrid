/**
 * Shared Zod helpers for `payroll` schema modules.
 * Aligns with docs/architecture/01-db-first-guideline.md §5 (Drizzle + Zod 4) and Appendix C (numeric → z.string() for money).
 *
 * Import from this file (not `@/…`): e.g. `import { zMoney12_2Positive } from "../_zodShared";` from `operations/*.ts`.
 */
import { z } from "zod/v4";

import { dateValue as dateValueFromWire } from "../../_shared/zodWire";

/** Re-export for existing `import { dateValue } from "../_zodShared"` call sites. */
export const dateValue = dateValueFromWire;

/** Max absolute value for `numeric(12, 2)` money columns (10 integer digits + 2 decimals). */
export const MAX_MONEY_12_2 = 9_999_999_999.99;

/** Max absolute value for `numeric(10, 2)` money columns (8 integer digits + 2 decimals), e.g. expense claim amounts. */
export const MAX_MONEY_10_2 = 99_999_999.99;

/**
 * Canonical `numeric(12,2)` money string (no scientific notation, no trailing dot, no redundant integer leading zeros).
 * - Integer: `0` or `[1-9]\\d{0,9}` (up to 10 digits, fits magnitude guard).
 * - Optional fraction: `.` + 1–2 decimal digits.
 */
const CANONICAL_MONEY_12_2 = /^(0|[1-9]\d{0,9})(\.\d{1,2})?$/;

/** Canonical `numeric(10,2)` — integer part at most 8 digits (≤ 99_999_999). */
const CANONICAL_MONEY_10_2 = /^(0|[1-9]\d{0,7})(\.\d{1,2})?$/;

/**
 * Fractional digit count ≤ `maxDecimals`. Rejects trailing `.` (e.g. `"123."`) so parsing edge cases stay explicit.
 */
export function moneyFracOk(s: string, maxDecimals: number): boolean {
  const t = s.trim();
  if (t.endsWith(".")) return false;
  const frac = t.split(".")[1];
  return frac === undefined || frac.length <= maxDecimals;
}

/** String matches canonical `numeric(12,2)` pattern (after trim). */
export function isCanonicalMoney12_2String(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t)) return false;
  return CANONICAL_MONEY_12_2.test(t);
}

/** String matches canonical `numeric(10,2)` pattern (after trim). */
export function isCanonicalMoney10_2String(s: string): boolean {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t)) return false;
  return CANONICAL_MONEY_10_2.test(t);
}

/** `numeric(12, 2)` strictly > 0, canonical format, within magnitude. */
export function isValidPositiveMoney12_2(s: string): boolean {
  const t = s.trim();
  if (!isCanonicalMoney12_2String(t)) return false;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n <= 0) return false;
  return n <= MAX_MONEY_12_2;
}

/** `numeric(12, 2)` non-negative, canonical format, within magnitude. */
export function isValidNonNegativeMoney12_2(s: string): boolean {
  const t = s.trim();
  if (!isCanonicalMoney12_2String(t)) return false;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return false;
  return n <= MAX_MONEY_12_2;
}

/** `numeric(10, 2)` strictly > 0, canonical format, within magnitude (expense lines, etc.). */
export function isValidPositiveMoney10_2(s: string): boolean {
  const t = s.trim();
  if (!isCanonicalMoney10_2String(t)) return false;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n <= 0) return false;
  return n <= MAX_MONEY_10_2;
}

/**
 * Normalizes a money string to two decimal places with no leading zeros on the integer part (e.g. `"0001.5"` → `"1.50"`).
 * Uses relaxed syntax: `moneyFracOk` + magnitude (allows leading zeros on input); rejects scientific notation and trailing `.`.
 * Returns `null` if the value is not representable as a non-negative `numeric(12,2)`.
 */
export function normalizeMoneyStringToTwoDecimals(s: string): string | null {
  const t = s.trim();
  if (t === "" || /[eE]/.test(t) || t.endsWith(".")) return null;
  if (!moneyFracOk(t, 2)) return null;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0 || n > MAX_MONEY_12_2) return null;
  const cents = Math.round(n * 100);
  if (Math.abs(n * 100 - cents) > 1e-6) return null;
  const ip = Math.floor(cents / 100);
  const fp = cents % 100;
  return `${ip}.${fp.toString().padStart(2, "0")}`;
}

// —— Zod string schemas (reuse in insert/update overrides; keep messages consistent) ——

export const ZOD_MESSAGE_POSITIVE_MONEY_12_2 = `must be a positive decimal in canonical form (no leading-zero integers except 0, max 2 decimals), ≤ ${MAX_MONEY_12_2} (numeric 12,2)`;

export const ZOD_MESSAGE_NON_NEGATIVE_MONEY_12_2 = `must be a non-negative decimal in canonical form (no leading-zero integers except 0, max 2 decimals), ≤ ${MAX_MONEY_12_2} (numeric 12,2)`;

export const ZOD_MESSAGE_POSITIVE_MONEY_10_2 = `must be a positive decimal in canonical form (no leading-zero integers except 0, max 2 decimals), ≤ ${MAX_MONEY_10_2} (numeric 10,2)`;

/** Required positive `numeric(12,2)` as string. */
export function zMoney12_2Positive(message: string = ZOD_MESSAGE_POSITIVE_MONEY_12_2) {
  return z.string().refine(isValidPositiveMoney12_2, { message });
}

/** Required non-negative `numeric(12,2)` as string. */
export function zMoney12_2NonNegative(message: string = ZOD_MESSAGE_NON_NEGATIVE_MONEY_12_2) {
  return z.string().refine(isValidNonNegativeMoney12_2, { message });
}

/** Optional / nullable positive money for patches. */
export function zMoney12_2PositiveOptionalNullable(
  message: string = ZOD_MESSAGE_POSITIVE_MONEY_12_2,
) {
  return z
    .string()
    .optional()
    .nullable()
    .refine((v) => v === undefined || v === null || isValidPositiveMoney12_2(v), { message });
}

/** Optional / nullable non-negative money for patches. */
export function zMoney12_2NonNegativeOptionalNullable(
  message: string = ZOD_MESSAGE_NON_NEGATIVE_MONEY_12_2,
) {
  return z
    .string()
    .optional()
    .nullable()
    .refine((v) => v === undefined || v === null || isValidNonNegativeMoney12_2(v), { message });
}

/** Required positive `numeric(10,2)` as string. */
export function zMoney10_2Positive(message: string = ZOD_MESSAGE_POSITIVE_MONEY_10_2) {
  return z.string().refine(isValidPositiveMoney10_2, { message });
}

/** Optional positive `numeric(10,2)` for patches. */
export function zMoney10_2PositiveOptional(message: string = ZOD_MESSAGE_POSITIVE_MONEY_10_2) {
  return z
    .string()
    .optional()
    .refine((v) => v === undefined || isValidPositiveMoney10_2(v), { message });
}
