import { cn } from "@afenda/ui-core/lib/utils";

/**
 * Column cell alignment and typography aligned with
 * `docs/patterns/data-grid-interaction-standard.md` §3.2 and §9.2, and
 * `docs/patterns/erp-visual-density-typography-standard.md` §3.1, §4.3, §6, §8.
 * Compose on `<th>` / `<td>` (or cell components) beside `SELECTION_COLUMN_CELL_CLASS` for the checkbox column.
 */

/** Primary identifier column — left, medium weight. */
export const DATA_GRID_CELL_PRIMARY = cn("text-left font-medium text-foreground");

/** Secondary / attribute columns — left, muted. */
export const DATA_GRID_CELL_ATTRIBUTE = cn("text-left text-muted-foreground");

/** Numeric / quantitative columns — right, tabular figures. */
export const DATA_GRID_CELL_NUMERIC = cn("text-right tabular-nums");

/** Status / indicator columns — center. */
export const DATA_GRID_CELL_STATUS = "text-center";

/** Generic text column when not primary or muted (§3.2). */
export const DATA_GRID_CELL_TEXT = "text-left";

/**
 * Row hover + selection tint — no layout shift (Standard §5.1, §7.1, §9.3).
 * Prefer this token name for new code; `dataGridRowSelectionClass` is the same bundle for backward compatibility.
 */
export const DATA_GRID_ROW_SURFACE = cn(
  "transition-colors duration-150",
  "hover:bg-muted/40",
  "data-[state=selected]:bg-primary/5"
);

/**
 * Optional full-row selection affordance (Standard §5.1). Use with app-provided `onClick` / keyboard toggle; does not replace checkbox semantics.
 */
export const DATA_GRID_ROW_CLICKABLE = "cursor-pointer";

/**
 * Sticky header row shell (Standard §11.3). Apply to `<thead>` row or header container.
 */
export const DATA_GRID_HEADER_STICKY = cn(
  "sticky top-0 z-10 border-b",
  "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
);

/**
 * Cell padding presets (Standard §9.1).
 */
export const DATA_GRID_DENSITY_COMFORTABLE = "px-3 py-2.5";

export const DATA_GRID_DENSITY_COMPACT = "px-2 py-1.5";

/** Financial / high-density numeric grids — tighter padding + executive size. */
export const DATA_GRID_DENSITY_FINANCIAL = cn(
  "px-2 py-1 text-[13px] font-medium tracking-tight tabular-nums"
);
