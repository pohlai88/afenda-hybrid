import { cn } from "@afenda/ui-core/lib/utils";

/**
 * Typography and tone tokens for read-only audit / traceability surfaces.
 *
 * @see `docs/patterns/audit-traceability-ux-standard.md` §8 (visual system), §6.1 (field diffs).
 * @see `docs/patterns/erp-visual-density-typography-standard.md` §4.3–4.4 (numeric & monospace rules).
 */

/** Object identifiers, correlation IDs, stable keys (§8.3). */
export const AUDIT_TEXT_IDENTIFIER = cn("font-mono text-sm text-foreground");

/** Relative or absolute times; keeps column alignment when lists update (§8.3). */
export const AUDIT_TEXT_TIMESTAMP = cn("tabular-nums text-muted-foreground");

/** Actor / principal name (§8.3). */
export const AUDIT_TEXT_ACTOR = cn("text-sm font-medium text-foreground");

/** Neutral read-only panel tone — evidence-style, not decorative (§8.1). */
export const AUDIT_SURFACE_READONLY = cn("rounded-md border border-border/70 bg-muted/15");

/** Prior value in a field-level diff (§6.1). */
export const AUDIT_FIELD_DIFF_BEFORE = cn(
  "text-muted-foreground line-through decoration-muted-foreground/50"
);

/** Resulting value in a field-level diff (§6.1). */
export const AUDIT_FIELD_DIFF_AFTER = cn("font-medium text-foreground");
