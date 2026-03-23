/**
 * Metadata — DataTable Helpers
 *
 * Bridges `ListColumnDef` metadata with the `DataTable` `Column<T>` interface.
 * Provides column conversion, visibility defaults, export ordering, and
 * numeric footer summaries driven by metadata.
 *
 * @version 1.0.0 — handles UnifiedFieldType, prepares for package split
 */

import type { ListColumnDef, ColumnSummary, FormatterKey } from "./list-column-def";
import type { Column } from "@afenda/ui-core";
import { normalizeFieldType, type UnifiedFieldType } from "./field-types";

// ---------------------------------------------------------------------------
// Column conversion
// ---------------------------------------------------------------------------

/**
 * Converts an array of `ListColumnDef` into `Column<T>[]` suitable for
 * the `DataTable` component. Fields are sorted by `sequence` then by
 * declaration order.
 */
export function toDataTableColumns<T extends Record<string, unknown>>(
  defs: ListColumnDef[]
): Column<T>[] {
  const sorted = [...defs].sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999));

  return sorted.map((def) => ({
    id: def.name,
    header: def.label,
    accessorKey: def.name as keyof T,
    sortable: def.sortable ?? true,
    align: def.align ?? defaultAlign(def.type),
    hidden: def.visible === false,
    width: def.width,
    enableHiding: def.enableHiding ?? true,
  }));
}

function defaultAlign(type: UnifiedFieldType): "left" | "center" | "right" {
  const normalized = normalizeFieldType(type);

  switch (normalized) {
    case "number":
    case "money":
      return "right";
    case "boolean":
      return "center";
    default:
      return "left";
  }
}

// ---------------------------------------------------------------------------
// Column visibility defaults
// ---------------------------------------------------------------------------

/**
 * Returns the default column visibility map from an array of `ListColumnDef`.
 * This can be passed to `DataTable` as the initial `columnVisibility` state.
 */
export function columnVisibilityDefaults(defs: ListColumnDef[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const def of defs) {
    map[def.name] = def.visible !== false;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Export column order
// ---------------------------------------------------------------------------

/**
 * Returns an ordered list of `{ key, label }` for CSV/Excel export,
 * respecting `sequence` and using `exportLabel` when available.
 */
export function exportColumnOrder(defs: ListColumnDef[]): Array<{ key: string; label: string }> {
  return [...defs]
    .filter((d) => d.visible !== false)
    .sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999))
    .map((d) => ({
      key: d.name,
      label: d.exportLabel ?? d.label,
    }));
}

// ---------------------------------------------------------------------------
// Numeric column summary
// ---------------------------------------------------------------------------

export interface ColumnSummaryResult {
  field: string;
  label: string;
  summary: ColumnSummary;
  value: number;
}

/**
 * Computes footer summary values for all columns that declare a `summary`.
 * Operates on raw row data so it works with both client- and server-paginated
 * data sets.
 */
export function computeColumnSummaries<T extends Record<string, unknown>>(
  defs: ListColumnDef[],
  data: T[]
): ColumnSummaryResult[] {
  return defs
    .filter((d) => d.summary && d.summary !== "none")
    .map((def) => {
      const values = data.map((row) => Number(row[def.name])).filter((n) => !Number.isNaN(n));

      return {
        field: def.name,
        label: def.label,
        summary: def.summary!,
        value: aggregate(def.summary!, values),
      };
    });
}

function aggregate(op: ColumnSummary, values: number[]): number {
  if (values.length === 0) return 0;

  switch (op) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "count":
      return values.length;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Formatter resolver (lightweight — no runtime dependency on formatters.ts)
// ---------------------------------------------------------------------------

/**
 * Returns a mapping of `FormatterKey` to a simple display function.
 * Apps that need richer formatting should supply their own `cell` renderer.
 *
 * Handles both Odoo-style and lean formatter keys.
 */
export function defaultCellFormatter(
  key: FormatterKey,
  _options?: Record<string, unknown>
): (value: unknown) => string {
  switch (key) {
    case "number":
      return (v) => {
        const n = Number(v);
        return Number.isNaN(n) ? String(v ?? "") : n.toLocaleString();
      };
    case "currency":
      return (v) => {
        const n = Number(v);
        return Number.isNaN(n)
          ? String(v ?? "")
          : n.toLocaleString(undefined, {
              style: "currency",
              currency: (_options?.currency as string) ?? "USD",
            });
      };
    case "percent":
      return (v) => {
        const n = Number(v);
        return Number.isNaN(n) ? String(v ?? "") : `${n.toFixed(1)}%`;
      };
    case "date":
      return (v) => {
        if (!v) return "";
        const d = v instanceof Date ? v : new Date(String(v));
        return d.toLocaleDateString();
      };
    case "text":
    default:
      return (v) => String(v ?? "");
  }
}
