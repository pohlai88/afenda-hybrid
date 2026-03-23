import { cn } from "@afenda/ui-core/lib/utils";

/**
 * ERP text roles and spacing rhythm (Visual Density & Typography Standard §3.2, §4.2, §9.1).
 *
 * @see `docs/patterns/erp-visual-density-typography-standard.md`
 */

// --- §4.2 text roles ---

/** Display — page-level titles (20–24px, semibold). */
export const ERP_TYPO_DISPLAY = cn("text-2xl font-semibold tracking-tight");

/** Primary KPI / dashboard figure: display metrics + tabular numerals + display face (§4.2, §4.3). */
export const ERP_TYPO_KPI_VALUE = cn("font-display", ERP_TYPO_DISPLAY, "tabular-nums");

/** Section title — popover headers, panel titles (16px semibold). */
export const ERP_TYPO_SECTION = cn("text-base font-semibold leading-tight");

/** Emphasis — primary inline data at default density (14px medium). */
export const ERP_TYPO_EMPHASIS = cn("text-sm font-medium leading-normal");

/** Body — standard content (13–14px regular). */
export const ERP_TYPO_BODY = cn("text-sm font-normal leading-normal");

/** Meta — secondary copy (12px regular). */
export const ERP_TYPO_META = cn("text-xs font-normal leading-normal");

/** Micro — dense metadata (11px medium); pair with `AUDIT_TEXT_TIMESTAMP` for times. */
export const ERP_TYPO_MICRO = cn("text-[11px] font-medium leading-tight");

/** Line size when weight comes from a parent (e.g. `AnimatedSelectionCount` uses `font-semibold`). */
export const ERP_TYPO_SIZE_BODY = "text-sm";

export const ERP_TYPO_SIZE_COMPACT = "text-xs";

/**
 * Dense UI labels: status chips, trend captions (12px medium).
 * Prefer over arbitrary `text-[10px]` for operational chrome (§4.2, §5.2).
 */
export const ERP_TYPO_META_STRONG = cn("text-xs font-medium leading-normal");

/** KPI / field overlines — medium weight, muted (§9.1 labels; §5 hierarchy). */
export const ERP_TYPO_OVERLINE_LABEL = cn(
  "text-xs font-medium uppercase tracking-wider text-muted-foreground"
);

// --- §3.2 spacing (Tailwind default theme, 1 unit = 4px) ---

export const ERP_SPACE_GAP_XS = "gap-1";
export const ERP_SPACE_GAP_SM = "gap-2";
export const ERP_SPACE_GAP_MD = "gap-3";
export const ERP_SPACE_GAP_LG = "gap-4";
export const ERP_SPACE_GAP_XL = "gap-6";

export const ERP_SPACE_PAD_XS = "p-1";
export const ERP_SPACE_PAD_SM = "p-2";
export const ERP_SPACE_PAD_MD = "p-3";
export const ERP_SPACE_PAD_LG = "p-4";
export const ERP_SPACE_PAD_XL = "p-6";
