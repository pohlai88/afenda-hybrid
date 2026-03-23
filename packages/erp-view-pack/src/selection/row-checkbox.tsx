"use client";

import * as React from "react";
import { Checkbox } from "@afenda/ui-core/primitives/checkbox";
import { cn } from "@afenda/ui-core/lib/utils";
import { useSelectionStore } from "./selection-store-context";
import { SELECTION_CHECKBOX_MOTION, SELECTION_CHECKBOX_TOUCH } from "./selection-tokens";

/**
 * Per-row control; pair with `SelectAllCheckbox` and a centralized store.
 * Bulk Interaction Standard §3.1 / §2.2; Data Grid Standard §3.2, §5.1.
 */
export interface RowCheckboxProps {
  id: string;
  /**
   * Current page row IDs — required when bulk scope is virtual (`enterFilteredVirtual` /
   * `enterAllVirtual`) so unchecking can demote to an explicit set.
   */
  pageIds?: readonly string[];
  className?: string;
  "aria-label"?: string;
}

export function RowCheckbox({
  id,
  pageIds,
  className,
  "aria-label": ariaLabel = "Select row",
}: RowCheckboxProps) {
  const checked = useSelectionStore((s) => s.isIdSelected(id, pageIds));
  const toggleOne = useSelectionStore((s) => s.toggleOne);

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={() => toggleOne(id, pageIds)}
      aria-label={ariaLabel}
      className={cn(SELECTION_CHECKBOX_MOTION, SELECTION_CHECKBOX_TOUCH, className)}
    />
  );
}
