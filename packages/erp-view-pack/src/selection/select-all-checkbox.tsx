"use client";

import * as React from "react";
import { Checkbox } from "@afenda/ui-core/primitives/checkbox";
import { cn } from "@afenda/ui-core/lib/utils";
import { useSelectionStore } from "./selection-store-context";
import { SELECTION_CHECKBOX_MOTION, SELECTION_CHECKBOX_TOUCH } from "./selection-tokens";

type CheckedState = boolean | "indeterminate";

export interface SelectAllCheckboxProps {
  /** Stable IDs for the current page (memoize when possible). */
  pageIds: readonly string[];
  className?: string;
  "aria-label"?: string;
}

/**
 * Header checkbox: full page selected, indeterminate (some rows), or off.
 * Data Grid Interaction Standard §3.2 (selection column), §5.3 (page select pattern).
 */
export function SelectAllCheckbox({
  pageIds,
  className,
  "aria-label": ariaLabel = "Select all rows on this page",
}: SelectAllCheckboxProps) {
  const isAllPageSelected = useSelectionStore((s) => s.isAllPageSelected(pageIds));
  const isSomePageSelected = useSelectionStore((s) => s.isSomePageSelected(pageIds));
  const togglePage = useSelectionStore((s) => s.togglePage);

  const checked: CheckedState = isAllPageSelected
    ? true
    : isSomePageSelected
      ? "indeterminate"
      : false;

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={() => togglePage(pageIds)}
      aria-label={ariaLabel}
      className={cn(SELECTION_CHECKBOX_MOTION, SELECTION_CHECKBOX_TOUCH, className)}
    />
  );
}
