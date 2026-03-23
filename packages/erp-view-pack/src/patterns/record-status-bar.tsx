"use client";

import { cn } from "@afenda/ui-core/lib/utils";
import { ERP_TYPO_META_STRONG } from "./erp-typography";
import { PATTERN_DENSE_MOTION } from "./pattern-chrome";

export interface RecordState {
  /** Unique value stored in the record. */
  value: string;
  /** Display label. */
  label: string;
  /** If true, this state is "folded" (hidden unless it's the current state). */
  folded?: boolean;
  /**
   * When true, the state is visible but not selectable (engine/domain guard).
   * @see `docs/patterns/workflow-state-transition-standard.md` §5.1
   */
  disabled?: boolean;
  /** Shown as native tooltip when `disabled` (and for SR context via `title`). */
  disabledReason?: string;
}

export interface RecordStatusBarProps {
  /** Ordered list of workflow states. */
  states: RecordState[];
  /** Current state value. */
  current: string;
  /** Called when the user clicks a different state. Omit to make the bar read-only. */
  onChange?: (value: string) => void;
  /** Visual style variant. */
  variant?: "pill" | "arrow";
  className?: string;
}

/**
 * Horizontal workflow status bar inspired by Odoo's `statusbar` widget.
 *
 * Unlike `Stepper` (linear onboarding flow), this represents a state
 * machine where the user can jump between states when `onChange` is provided.
 * Lifecycle rules and guards belong in metadata/domain per
 * `docs/patterns/workflow-state-transition-standard.md`; high-impact transitions
 * also follow `docs/patterns/destructive-action-safety-standard.md`.
 * Dense labels use `ERP_TYPO_META_STRONG` (`erp-visual-density-typography-standard.md` §4.2).
 */
export function RecordStatusBar({
  states,
  current,
  onChange,
  variant = "pill",
  className,
}: RecordStatusBarProps) {
  const currentIdx = states.findIndex((s) => s.value === current);

  const visibleStates = states.filter((s) => !s.folded || s.value === current);

  if (variant === "arrow") {
    return (
      <div
        className={cn("flex items-stretch overflow-hidden rounded-lg border", className)}
        role="radiogroup"
        aria-label="Record status"
      >
        {visibleStates.map((state) => {
          const idx = states.findIndex((s) => s.value === state.value);
          const isCurrent = state.value === current;
          const isPast = idx < currentIdx;
          const clickable = Boolean(onChange) && !isCurrent && !state.disabled;

          return (
            <button
              key={state.value}
              type="button"
              role="radio"
              aria-checked={isCurrent}
              disabled={!clickable}
              title={
                state.disabled && state.disabledReason && !isCurrent
                  ? state.disabledReason
                  : undefined
              }
              onClick={() => clickable && onChange?.(state.value)}
              className={cn(
                "relative flex-1 px-4 py-2 text-center",
                ERP_TYPO_META_STRONG,
                PATTERN_DENSE_MOTION,
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                isCurrent && "bg-primary text-primary-foreground",
                isPast && !isCurrent && "bg-primary/10 text-primary",
                !isPast && !isCurrent && "bg-muted text-muted-foreground",
                state.disabled && !isCurrent && "opacity-60",
                clickable && "cursor-pointer hover:bg-primary/20",
                !clickable && !isCurrent && "cursor-not-allowed"
              )}
            >
              {state.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="radiogroup"
      aria-label="Record status"
    >
      {visibleStates.map((state) => {
        const idx = states.findIndex((s) => s.value === state.value);
        const isCurrent = state.value === current;
        const isPast = idx < currentIdx;
        const clickable = Boolean(onChange) && !isCurrent && !state.disabled;

        return (
          <button
            key={state.value}
            type="button"
            role="radio"
            aria-checked={isCurrent}
            disabled={!clickable}
            title={
              state.disabled && state.disabledReason && !isCurrent
                ? state.disabledReason
                : undefined
            }
            onClick={() => clickable && onChange?.(state.value)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1",
              ERP_TYPO_META_STRONG,
              PATTERN_DENSE_MOTION,
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isCurrent && "bg-primary text-primary-foreground shadow-sm",
              isPast && !isCurrent && "bg-primary/10 text-primary",
              !isPast && !isCurrent && "bg-muted text-muted-foreground",
              state.disabled && !isCurrent && "opacity-60",
              clickable && "cursor-pointer hover:bg-primary/20",
              !clickable && !isCurrent && "cursor-not-allowed"
            )}
          >
            {state.label}
          </button>
        );
      })}
    </div>
  );
}
