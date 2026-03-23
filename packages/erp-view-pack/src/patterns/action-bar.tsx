"use client";

import { useId, type ReactNode } from "react";
import { Button } from "@afenda/ui-core/primitives/button";
import { X } from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";
import type { BulkSelectionScopeUi } from "../selection/bulk-selection-scope-ui";
import { useEscapeClearsSelection } from "../selection/use-escape-clears-selection";
import { AnimatedSelectionCount } from "./animated-selection-count";
import { BulkSelectionScopeHint } from "./bulk-selection-scope-hint";
import {
  ACTION_BAR_ACTIONS_SCROLL,
  ACTION_BAR_COMPACT_CHILD_HIT,
  ACTION_BAR_DESTRUCTIVE,
  ACTION_BAR_DIVIDER,
  ACTION_BAR_DIVIDER_COMPACT,
  ACTION_BAR_ROOT_MOTION,
} from "./action-bar-chrome";
import { COMMAND_SURFACE_BULK_SELECTION, commandSurfaceDataAttrs } from "./command-surface-toolbar";
import { BulkDestructiveConsequenceHint } from "./destructive-bulk-consequence-hint";
import type { BulkDestructiveSeverity } from "./destructive-bulk-ui";
import { resolveBulkDestructiveSeverity } from "./destructive-bulk-ui";
import { ERP_TYPO_SIZE_BODY, ERP_TYPO_SIZE_COMPACT } from "./erp-typography";
import { StickyActionBar } from "./sticky-action-bar";

/**
 * Floating / compact bulk action surfaces (see `docs/patterns/bulk-interaction-standard.md`).
 * Prefer `variant="sticky"` for data grids so the bar does not obscure grid content (Bulk Standard §13).
 * Part of the grid **selection layer** (Data Grid Interaction Standard §3.1).
 *
 * **Rendering layer:** receives `selectedCount`, scope hints, and **presentation** flags (`hasDestructiveAction`,
 * `destructiveSeverity`); which bulk actions exist and who may run them is decided from metadata / engine, not inside this component.
 *
 * @see `docs/patterns/command-surface-toolbar-standard.md` (zones, overflow, identifiers §7).
 */
export type ActionBarVariant = "floating" | "sticky" | "compact";

export interface ActionBarProps {
  selectedCount: number;
  onClear?: () => void;
  children: ReactNode;
  className?: string;
  /**
   * Muted “destructive mode” chrome for the bar when bulk actions include high-impact operations.
   * Does not replace confirmation flows — see `docs/patterns/destructive-action-safety-standard.md` §5–6.
   */
  hasDestructiveAction?: boolean;
  /**
   * Progressive emphasis when `hasDestructiveAction` (Standard §4.2). `critical` still requires a confirmation dialog in app code.
   */
  destructiveSeverity?: BulkDestructiveSeverity;
  /** Overrides default screen-reader consequence copy for `high` / `critical` severity. */
  destructiveConsequenceHint?: string;
  /**
   * Communicates selection scope to assistive tech (Standard §2.1). Ignored if `scopeHint` is set.
   */
  selectionScope?: BulkSelectionScopeUi;
  /** Overrides the default screen-reader scope line derived from `selectionScope`. */
  scopeHint?: string;
  /**
   * When `onClear` is set, Escape clears selection by default (Standard §6.2).
   * Set `false` when another layer owns Escape (modal, command palette).
   */
  escapeClearsSelection?: boolean;
  /**
   * - `floating` — centered pill over the viewport (default).
   * - `sticky` — delegates to `StickyActionBar` (table container bottom).
   * - `compact` — smaller padding, left-aligned floating bar.
   */
  variant?: ActionBarVariant;
  /**
   * When bulk actions are unavailable for permission/policy reasons, explain at bar level
   * (`permission-role-interaction-standard.md` §5). Does not hide `children` — wire button `disabled` in app.
   */
  disabledReason?: string;
}

const variantShell: Record<
  Exclude<ActionBarVariant, "sticky">,
  { root: string; actions: string }
> = {
  floating: {
    root: cn(
      "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-fit max-w-[calc(100vw-2rem)] min-w-0 -translate-x-1/2 gap-3 rounded-lg border px-4 py-2.5",
      "shadow-xl shadow-black/5 dark:shadow-black/30",
      "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    ),
    actions: "gap-2",
  },
  compact: {
    root: cn(
      "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-50 w-fit max-w-[min(calc(100vw-2rem),28rem)] min-w-0 gap-2 rounded-md border px-3 py-2",
      "shadow-xl shadow-black/5 dark:shadow-black/30",
      "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    ),
    actions: "gap-1.5",
  },
};

export function ActionBar({
  selectedCount,
  onClear,
  children,
  className,
  hasDestructiveAction,
  destructiveSeverity,
  destructiveConsequenceHint,
  selectionScope,
  scopeHint,
  escapeClearsSelection,
  variant = "floating",
  disabledReason,
}: ActionBarProps) {
  const disabledReasonId = useId();
  const resolvedSeverity = resolveBulkDestructiveSeverity(
    hasDestructiveAction,
    destructiveSeverity
  );
  const escapeEnabled =
    Boolean(onClear) &&
    selectedCount > 0 &&
    (escapeClearsSelection ?? true) &&
    variant !== "sticky";

  useEscapeClearsSelection(escapeEnabled, onClear);

  if (selectedCount === 0) return null;

  if (variant === "sticky") {
    return (
      <StickyActionBar
        selectedCount={selectedCount}
        onClear={onClear}
        hasDestructiveAction={hasDestructiveAction}
        destructiveSeverity={destructiveSeverity}
        destructiveConsequenceHint={destructiveConsequenceHint}
        selectionScope={selectionScope}
        scopeHint={scopeHint}
        escapeClearsSelection={escapeClearsSelection}
        disabledReason={disabledReason}
        className={className}
      >
        {children}
      </StickyActionBar>
    );
  }

  const shell = variantShell[variant];
  const divider = variant === "compact" ? ACTION_BAR_DIVIDER_COMPACT : ACTION_BAR_DIVIDER;

  return (
    <div
      {...commandSurfaceDataAttrs(COMMAND_SURFACE_BULK_SELECTION)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title={disabledReason}
      aria-describedby={disabledReason ? disabledReasonId : undefined}
      aria-disabled={disabledReason ? true : undefined}
      data-destructive={hasDestructiveAction ? "" : undefined}
      data-destructive-severity={resolvedSeverity}
      className={cn(
        "flex items-center",
        ACTION_BAR_ROOT_MOTION,
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        ACTION_BAR_DESTRUCTIVE,
        shell.root,
        className
      )}
    >
      {disabledReason ? (
        <span id={disabledReasonId} className="sr-only">
          {disabledReason}
        </span>
      ) : null}
      <BulkSelectionScopeHint scope={selectionScope} scopeHint={scopeHint} />
      <BulkDestructiveConsequenceHint
        severity={resolvedSeverity}
        consequenceHint={destructiveConsequenceHint}
      />
      <AnimatedSelectionCount
        count={selectedCount}
        dangerTone={hasDestructiveAction}
        textClassName={cn(
          "tabular-nums",
          variant === "compact" ? ERP_TYPO_SIZE_COMPACT : ERP_TYPO_SIZE_BODY
        )}
        className="shrink-0"
      />
      <div className={divider} aria-hidden />
      <div
        className={cn(
          ACTION_BAR_ACTIONS_SCROLL,
          shell.actions,
          variant === "compact" && ACTION_BAR_COMPACT_CHILD_HIT
        )}
      >
        {children}
      </div>
      {onClear && (
        <>
          <div className={divider} aria-hidden />
          <Button
            type="button"
            variant={hasDestructiveAction ? "destructive-ghost" : "ghost"}
            size="icon-sm"
            className="min-h-10 min-w-10 shrink-0"
            onClick={onClear}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </>
      )}
    </div>
  );
}
