import { cn } from "@afenda/ui-core/lib/utils";

/**
 * Bulk selection toolbar chrome (scroll mask, dividers, destructive shell, motion).
 *
 * @see `docs/patterns/command-surface-toolbar-standard.md` §9
 * @see `docs/patterns/bulk-interaction-standard.md`
 */

/** Root chrome: density + respect reduced motion (complements global `prefers-reduced-motion`). */
export const ACTION_BAR_ROOT_MOTION = cn(
  "tracking-tight",
  "motion-reduce:animate-none motion-reduce:transition-none"
);

/**
 * Muted bulk-toolbar destructive shell (not bright/alarming).
 * Progressive emphasis via `data-destructive-severity` (Destructive Action Safety Standard §4.2).
 */
export const ACTION_BAR_DESTRUCTIVE = cn(
  "data-[destructive]:border-destructive/50",
  "data-[destructive]:bg-destructive/[0.08]",
  "data-[destructive]:[box-shadow:0_0_0_1px_hsl(var(--destructive)_/_0.15)]",
  "data-[destructive-severity=high]:border-destructive/60",
  "data-[destructive-severity=high]:bg-destructive/[0.12]",
  "data-[destructive-severity=high]:[box-shadow:0_0_0_1px_hsl(var(--destructive)_/_0.24)]",
  "data-[destructive-severity=critical]:border-destructive/65",
  "data-[destructive-severity=critical]:bg-destructive/[0.14]",
  "data-[destructive-severity=critical]:[box-shadow:0_0_0_2px_hsl(var(--destructive)_/_0.22)]"
);

/** Horizontal scroll affordance (requires `.mask-gradient-x` in globals). */
export const ACTION_BAR_ACTIONS_SCROLL = cn(
  "flex min-w-0 items-center overflow-x-auto",
  "mask-gradient-x"
);

/** Softer vertical rules in dense toolbars. */
export const ACTION_BAR_DIVIDER = "h-4 w-px shrink-0 bg-border/70";

export const ACTION_BAR_DIVIDER_COMPACT = "h-3.5 w-px shrink-0 bg-border/70";

/** Touch-safe minimums for compact floating actions. */
export const ACTION_BAR_COMPACT_CHILD_HIT = "[&>*]:min-h-8 [&>*]:px-2";
