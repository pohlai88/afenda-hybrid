import { cn } from "@afenda/ui-core/lib/utils";
import { DATA_GRID_ROW_SURFACE } from "./data-grid-tokens";

/** Checkbox column width (header + cells). Fits §6.3 touch target on the checkbox control. */
export const SELECTION_COLUMN_CLASS = "w-12 px-2";

/** Header / cell alignment for selection column. */
export const SELECTION_COLUMN_CELL_CLASS = cn(SELECTION_COLUMN_CLASS, "text-center");

/**
 * Apply to `<tr>` and set `data-state="selected"` when the row is in the current selection.
 * Alias of `DATA_GRID_ROW_SURFACE` (Data Grid Interaction Standard §5.1, §7.1, §9.3).
 */
export const dataGridRowSelectionClass = DATA_GRID_ROW_SURFACE;

/**
 * Executive density for toolbars / notices (≈13px, tight tracking).
 * @see `docs/patterns/erp-visual-density-typography-standard.md` §4.2, §3.1.
 */
export const SELECTION_EXEC_TEXT = cn("text-[13px] font-medium tracking-tight");

/**
 * Sticky / compact selection bars — calm, dense surfaces.
 * @see `docs/patterns/command-surface-toolbar-standard.md` §9 (with `action-bar-chrome.ts`).
 */
export const SELECTION_BAR_SURFACE = cn(
  "bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40"
);

/** Checkbox micro-motion (~120ms). */
export const SELECTION_CHECKBOX_MOTION = cn(
  "transition-transform duration-150 ease-out active:scale-95"
);

/**
 * Minimum interactive footprint for selection checkboxes (AFENDA Bulk Interaction Standard §6.3).
 * Visual box stays `h-4 w-4` from the primitive; min size expands the hit target without shifting column width intent.
 */
export const SELECTION_CHECKBOX_TOUCH = "min-h-11 min-w-11";
