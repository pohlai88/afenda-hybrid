/**
 * Metadata — List Column Definition
 *
 * Bridges `FieldDef` metadata and the `DataTable` `Column<T>` interface.
 * Consumers can convert a `ListColumnDef` into a `Column<T>` via a thin
 * mapper (see `toDataTableColumn` helper).
 *
 * @version 1.0.0 — accepts UnifiedFieldType
 */

import type { UnifiedFieldType } from "./field-types";
import type { WidgetHint } from "./field-def";

/** How a numeric column should be summarised in a footer row. */
export type ColumnSummary = "sum" | "avg" | "min" | "max" | "count" | "none";

/**
 * Formatter key — references a named formatter from `lib/formatters.ts`
 * (e.g. `"number"`, `"currency"`, `"date"`, `"percent"`).
 */
export type FormatterKey = "number" | "currency" | "date" | "percent" | "text" | (string & {});

export interface ListColumnDef {
  /** Technical field name — used as `Column.id` and `Column.accessorKey`. */
  name: string;

  /** Column header label. */
  label: string;

  /** Underlying field type (used for default alignment / formatting). */
  type: UnifiedFieldType;

  /** Override the default widget for rendering cells. */
  widget?: WidgetHint;

  /** Explicit column alignment (defaults from `type` if omitted). */
  align?: "left" | "center" | "right";

  /** Whether the column is sortable. Defaults to `true`. */
  sortable?: boolean;

  /** Whether the column is visible by default. Defaults to `true`. */
  visible?: boolean;

  /** Whether the user can toggle column visibility. Defaults to `true`. */
  enableHiding?: boolean;

  /** CSS width hint (e.g. `"120px"`, `"15%"`). */
  width?: string;

  /** Named formatter to apply to cell values. */
  formatter?: FormatterKey;

  /** Formatter options passed through (locale, decimals, currency, …). */
  formatterOptions?: Record<string, unknown>;

  /** Summary type for footer aggregation. */
  summary?: ColumnSummary;

  /**
   * Export key — the header used when exporting to CSV.
   * Falls back to `label` if omitted.
   */
  exportLabel?: string;

  /** Display order (lower = further left). */
  sequence?: number;
}
