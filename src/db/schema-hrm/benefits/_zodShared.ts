/**
 * Shared Zod helpers for `benefits` tables (date-range checks, money strings).
 * Not re-exported from the public barrel — import from this file only inside `benefits/`.
 */
import { z } from "zod/v4";

import { dateValue as dateValueFromWire } from "../../_shared/zodWire";

/** Re-export for existing `import { dateValue } from "../_zodShared"` call sites. */
export const dateValue = dateValueFromWire;

export const nonNegativeDecimalString = z.string().refine(
  (v) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 0;
  },
  { message: "Must be a non-negative decimal string" }
);

export const positiveDecimalString = z.string().refine(
  (val) => {
    const n = Number.parseFloat(val);
    return Number.isFinite(n) && n > 0;
  },
  { message: "Must be a positive decimal string" }
);
