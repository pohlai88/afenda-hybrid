import { z } from "zod/v4";

/**
 * Shared Zod wire formats and patch helpers for Drizzle `date` / `timestamptz` columns.
 * Domain `_zodShared.ts` modules import from here and re-export for local ergonomics.
 *
 * Lives under `src/db/_shared/` (not `schema/`) — pure Zod, no Drizzle table definitions.
 */

// ---------------------------------------------------------------------------
// Patch helpers
// ---------------------------------------------------------------------------

/** Nullable DB columns on update: omit, set null, or set a value. */
export function nullableOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema.nullable().optional();
}

// ---------------------------------------------------------------------------
// Postgres `date` (YYYY-MM-DD wire strings)
// ---------------------------------------------------------------------------

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date string in YYYY-MM-DD format");

export const dateOptionalSchema = dateStringSchema.optional();

export const dateNullableOptionalSchema = dateStringSchema.nullable().optional();

export const dateCoerceSchema = z.coerce.date();

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Parse API/JSON `date` wire values; returns null if omitted, null literal, empty, or non-ISO. */
export function isoDateWireString(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  const s = typeof v === "string" ? v : String(v);
  return ISO_DATE_ONLY.test(s) ? s : null;
}

// ---------------------------------------------------------------------------
// Postgres `timestamptz` (ISO strings or `Date` after coercion)
// ---------------------------------------------------------------------------

export function isParseableTimestamptzString(s: string): boolean {
  return !Number.isNaN(Date.parse(s));
}

export const timestamptzStringSchema = z
  .string()
  .min(1)
  .refine(isParseableTimestamptzString, "expected a parseable ISO-8601 datetime (timestamptz)");

export const timestamptzOptionalSchema = timestamptzStringSchema.optional();

export const timestamptzNullableOptionalSchema = timestamptzStringSchema.nullable().optional();

/** Accept ISO string or Date (e.g. insert/update payloads). */
export const timestamptzWireSchema = z.union([timestamptzStringSchema, z.date()]);

export const timestamptzWireNullableOptionalSchema = timestamptzWireSchema.nullable().optional();

/**
 * Compare `Date` or date/time strings in refinements (legacy payroll/benefits pattern).
 * Prefer `isoDateWireString` when ordering pure `YYYY-MM-DD` API payloads without timezone shift.
 */
export function dateValue(d: Date | string): number {
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

/** Epoch ms for ordering comparisons in refinements; supports string, Date, omit/null/"". */
export function parseUnknownToEpochMs(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date) {
    const t = v.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}
