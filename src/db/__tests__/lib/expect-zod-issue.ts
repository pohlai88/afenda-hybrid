import { expect } from "vitest";
import type { z } from "zod/v4";

/**
 * Assert `schema.safeParse(value)` fails with at least one issue whose path matches `path`
 * (dot-joined, e.g. `"status"`, `"nested.field"`).
 */
export function expectZodIssueAtPath(schema: z.ZodType, value: unknown, path: string): void {
  const r = schema.safeParse(value);
  expect(r.success).toBe(false);
  if (r.success) return;
  expect(r.error.issues.some((i) => i.path.join(".") === path)).toBe(true);
}

/**
 * Merge `badValue` into a valid object and assert parsing fails on `field`.
 * Use for enum columns (`status`, `taskCategory`, etc.).
 */
export function expectInvalidEnumField(
  schema: z.ZodType,
  validBase: Record<string, unknown>,
  field: string,
  badValue: string,
): void {
  expectZodIssueAtPath(schema, { ...validBase, [field]: badValue }, field);
}
