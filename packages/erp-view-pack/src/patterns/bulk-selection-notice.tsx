"use client";

import { Button } from "@afenda/ui-core/primitives/button";
import { cn } from "@afenda/ui-core/lib/utils";
import { AnimatedSelectionCount } from "./animated-selection-count";
import {
  COMMAND_SURFACE_SELECTION_NOTICE,
  commandSurfaceDataAttrs,
} from "./command-surface-toolbar";
import { ERP_TYPO_BODY } from "./erp-typography";
import { SELECTION_EXEC_TEXT } from "../selection/selection-tokens";

export interface BulkSelectionNoticeProps {
  selectedOnPage: number;
  totalOnPage: number;
  totalFiltered: number;
  onSelectAllPage: () => void;
  onSelectAllFiltered: () => void;
  className?: string;
}

/**
 * Gmail / Notion-style escalation: page partial selection → all on page → all in filter.
 *
 * Surfaces explicit page vs filter scope (Bulk Interaction Standard §2.1; Data Grid Standard §4.2, §5).
 *
 * @see `docs/patterns/command-surface-toolbar-standard.md` (escalation notice §4).
 */
export function BulkSelectionNotice({
  selectedOnPage,
  totalOnPage,
  totalFiltered,
  onSelectAllPage,
  onSelectAllFiltered,
  className,
}: BulkSelectionNoticeProps) {
  if (selectedOnPage === 0) return null;

  const showPageLink = selectedOnPage < totalOnPage;
  const showFilteredLink = totalFiltered > totalOnPage;

  return (
    <div
      {...commandSurfaceDataAttrs(COMMAND_SURFACE_SELECTION_NOTICE)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border bg-muted/40 px-3 py-2",
        ERP_TYPO_BODY,
        className
      )}
    >
      <span className="sr-only">
        Bulk selection. Links below can expand the selection to the full page or to all rows
        matching the current filters.
      </span>
      <AnimatedSelectionCount
        count={selectedOnPage}
        variant="selected"
        textClassName={cn("text-sm font-medium", SELECTION_EXEC_TEXT)}
      />

      {showPageLink ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className={cn("h-auto min-h-0 px-0 py-0", ERP_TYPO_BODY)}
          onClick={onSelectAllPage}
        >
          Select all {totalOnPage} on this page
        </Button>
      ) : null}

      {showFilteredLink ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className={cn("h-auto min-h-0 px-0 py-0", ERP_TYPO_BODY)}
          onClick={onSelectAllFiltered}
        >
          Select all {totalFiltered} matching filter
        </Button>
      ) : null}
    </div>
  );
}
