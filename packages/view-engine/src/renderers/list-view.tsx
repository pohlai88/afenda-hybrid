/**
 * List View Renderer
 *
 * Renders a metadata-driven list view using DataTable.
 * Converts ViewDef.fields to ListColumnDef, then to DataTable columns.
 *
 * @version 1.0.0
 */

import * as React from "react";
import { DataTable, type Column } from "@afenda/ui-core";
import { resolveWidget } from "../registry/widget-registry";
import type { ModelDef } from "../metadata/model-def";
import type { ViewDef } from "../metadata/view-kind";
import type { ListColumnDef } from "../metadata/list-column-def";

export interface ListViewProps {
  /** Model definition. */
  model: ModelDef;
  /** View definition (kind: "list"). */
  view: ViewDef;
  /** Array of records to display. */
  data: unknown[];
  /** Called when the user performs a bulk action. */
  onAction?: (action: string, records: unknown[]) => Promise<void>;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * List View Renderer.
 *
 * Renders a complete list view from ModelDef + ViewDef.
 * Uses the widget registry for cell rendering.
 */
export function ListView({ model, view, data, onAction, className }: ListViewProps) {
  // Determine which fields to display
  const fieldNames = view.fields ?? Object.keys(model.fields);

  // Convert to ListColumnDef
  const listColumns: ListColumnDef[] = fieldNames.map((fieldName) => {
    const fieldDef = model.fields[fieldName];
    if (!fieldDef) {
      throw new Error(`Unknown field "${fieldName}" in view "${view.id}"`);
    }

    return {
      name: fieldName,
      label: fieldDef.label,
      type: fieldDef.type,
      sortable: true,
      align: undefined,
      formatter: undefined,
    };
  });

  // Convert to DataTable columns with cell renderers from widget registry
  const columns: Column<Record<string, unknown>>[] = listColumns.map((col) => {
    const fieldDef = model.fields[col.name];
    const widget = fieldDef ? resolveWidget(fieldDef) : null;

    return {
      id: col.name,
      header: col.label,
      accessorKey: col.name,
      sortable: col.sortable,
      align: col.align,
      cell: widget?.cell
        ? (row) => {
            const CellRender = widget.cell!;
            return <CellRender field={fieldDef!} value={row[col.name]} />;
          }
        : undefined,
    };
  });

  // Add action column if onAction is provided
  if (onAction) {
    columns.push({
      id: "_actions",
      header: "Actions",
      cell: (row) => (
        <button
          onClick={() => onAction("view", [row])}
          className="text-sm text-primary hover:underline"
        >
          View
        </button>
      ),
      enableHiding: false,
    });
  }

  // Map ViewDef.defaultOrder to DataTable initialSorting
  const initialSorting = view.defaultOrder?.map(([field, dir]) => ({
    id: field,
    desc: dir === "desc",
  }));

  return (
    <div className={className}>
      <DataTable
        data={data as Record<string, unknown>[]}
        columns={columns}
        searchable
        searchFields={view.searchFields}
        initialSorting={initialSorting}
        enableColumnVisibility
        enableExport
        selectable={!!onAction}
      />
    </div>
  );
}
