import { cn } from "@afenda/ui-core/lib/utils";

/**
 * Shared chrome for ERP patterns — density, motion safety, and visual refinement.
 *
 * @see `docs/patterns/erp-visual-density-typography-standard.md` (type roles, calm tone, long-duration use).
 * Complements `erp-typography.ts` for semantic roles (`ERP_TYPO_*`); use `PATTERN_DENSE_*` for motion and executive-density shells.
 *
 * **Where to add new tokens:**
 * - **Global utilities** (e.g. `.mask-gradient-x`) → `@afenda/ui-core/tokens/globals.css`
 * - **Pattern-specific** (e.g. toolbar dividers) → this file or specialized chrome (e.g. `action-bar-chrome.ts`)
 * - **Selection-specific** → `../selection/selection-tokens.ts`
 */

/**
 * Dense motion bundle: tight tracking + respect reduced-motion preference.
 * Use on interactive patterns (toolbars, cards, notices) for executive density.
 */
export const PATTERN_DENSE_MOTION = cn(
  "tracking-tight",
  "motion-reduce:animate-none motion-reduce:transition-none"
);

/**
 * Executive typography for data-heavy patterns (~13px, tight tracking).
 * Aligns with `SELECTION_EXEC_TEXT` but available for non-selection contexts.
 */
export const PATTERN_DENSE_TEXT = cn("text-[13px] font-medium tracking-tight");

/**
 * Calm surface for sticky/compact toolbars and notices.
 * Shared with selection bars for visual consistency.
 */
export const PATTERN_BAR_SURFACE = cn(
  "bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40"
);

/**
 * Decorative icon guard: prevents screen readers from announcing purely visual indicators.
 * Apply to trend arrows, status dots, module icons in collapsed nav, etc.
 */
export const PATTERN_DECORATIVE_ICON = "aria-hidden";
