"use client";

import { useId, type ReactNode } from "react";
import { Button } from "@afenda/ui-core/primitives/button";
import { X } from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";
import type { BulkSelectionScopeUi } from "../selection/bulk-selection-scope-ui";
import { useEscapeClearsSelection } from "../selection/use-escape-clears-selection";
import { AnimatedSelectionCount } from "./animated-selection-count";
import { BulkSelectionScopeHint } from "./bulk-selection-scope-hint";
import { BulkDestructiveConsequenceHint } from "./destructive-bulk-consequence-hint";
import type { BulkDestructiveSeverity } from "./destructive-bulk-ui";
import { resolveBulkDestructiveSeverity } from "./destructive-bulk-ui";
import {
  ACTION_BAR_ACTIONS_SCROLL,
  ACTION_BAR_DESTRUCTIVE,
  ACTION_BAR_DIVIDER,
  ACTION_BAR_ROOT_MOTION,
} from "./action-bar-chrome";
import { COMMAND_SURFACE_BULK_SELECTION, commandSurfaceDataAttrs } from "./command-surface-toolbar";
import { SELECTION_BAR_SURFACE, SELECTION_EXEC_TEXT } from "../selection/selection-tokens";

export interface CompactSelectionBarProps {
  selectedCount: number;
  children: ReactNode;
  className?: string;
  onClear?: () => void;
  /** Muted destructive chrome; confirmations live in app/domain per Destructive Action Safety Standard §5. */
  hasDestructiveAction?: boolean;
  destructiveSeverity?: BulkDestructiveSeverity;
  destructiveConsequenceHint?: string;
  selectionScope?: BulkSelectionScopeUi;
  scopeHint?: string;
  escapeClearsSelection?: boolean;
  /** Bar-level explanation when actions are unavailable (`permission-role-interaction-standard.md` §5). */
  disabledReason?: string;
}

/**
 * Dense strip above a grid header (e.g. financial tables). Not sticky—parent controls layout.
 *
 * See `docs/patterns/bulk-interaction-standard.md` §3.2 / §6 and Data Grid Standard §3.1 (toolbar / header-adjacent selection strip).
 *
 * @see `docs/patterns/command-surface-toolbar-standard.md` (compact strip §4).
 */
export function CompactSelectionBar({
  selectedCount,
  children,
  className,
  onClear,
  hasDestructiveAction,
  destructiveSeverity,
  destructiveConsequenceHint,
  selectionScope,
  scopeHint,
  escapeClearsSelection,
  disabledReason,
}: CompactSelectionBarProps) {
  const disabledReasonId = useId();
  const resolvedSeverity = resolveBulkDestructiveSeverity(
    hasDestructiveAction,
    destructiveSeverity
  );

  useEscapeClearsSelection(
    selectedCount > 0 && Boolean(onClear) && (escapeClearsSelection ?? true),
    onClear
  );

  if (selectedCount === 0) return null;

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
        "flex min-w-0 items-center gap-3 border-b px-3 py-1.5",
        ACTION_BAR_ROOT_MOTION,
        SELECTION_BAR_SURFACE,
        ACTION_BAR_DESTRUCTIVE,
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
        textClassName={cn("text-sm tabular-nums", SELECTION_EXEC_TEXT)}
        className="shrink-0"
      />
      <div className={ACTION_BAR_DIVIDER} aria-hidden />
      <div className={cn("min-w-0 flex-1 gap-2", ACTION_BAR_ACTIONS_SCROLL)}>{children}</div>
      {onClear ? (
        <>
          <div className={ACTION_BAR_DIVIDER} aria-hidden />
          <Button
            variant={hasDestructiveAction ? "destructive-ghost" : "ghost"}
            size="icon-sm"
            className="min-h-10 min-w-10 shrink-0"
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </>
      ) : null}
    </div>
  );
}
