"use client";

import { cn } from "@afenda/ui-core/lib/utils";

export type AnimatedSelectionCountVariant = "items" | "selected";

export interface AnimatedSelectionCountProps {
  count: number;
  className?: string;
  /** `items` → “3 items selected”; `selected` → “3 selected” (e.g. bulk banner). */
  variant?: AnimatedSelectionCountVariant;
  /** Text size; defaults to `text-sm`. */
  textClassName?: string;
  /** Muted destructive text tone (Destructive Action Safety Standard §4.1 — not bright/alarming). */
  dangerTone?: boolean;
}

/**
 * Selection count with a short zoom/fade on numeric change (Tailwind `animate-in`).
 *
 * Grammar and layout stability follow `docs/patterns/bulk-interaction-standard.md` §3.3
 * and Data Grid Standard §2.1 (no layout shift during selection changes).
 */
export function AnimatedSelectionCount({
  count,
  className,
  variant = "items",
  textClassName = "text-sm",
  dangerTone,
}: AnimatedSelectionCountProps) {
  const rest =
    variant === "items" ? (count === 1 ? "item selected" : "items selected") : "selected";

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-baseline gap-x-1 font-semibold tabular-nums text-foreground",
        dangerTone && "text-destructive/90",
        textClassName,
        className
      )}
    >
      <span
        key={count}
        className={cn(
          "inline-block min-w-[7ch] text-center tabular-nums",
          "animate-in fade-in-0 zoom-in-95 duration-150",
          "motion-reduce:animate-none motion-reduce:transition-none"
        )}
      >
        {count}
      </span>
      <span className="text-start">{rest}</span>
    </span>
  );
}
