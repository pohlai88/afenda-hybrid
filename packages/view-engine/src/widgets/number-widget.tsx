/**
 * Number Widget — Default renderer for integer/float/number fields
 */

import * as React from "react";
import { Input } from "@afenda/ui-core/primitives/input";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

export function NumberWidgetRender({ field, value, onChange, disabled, error }: WidgetRenderProps) {
  const numValue = value != null ? Number(value) : "";

  return (
    <Input
      id={field.name}
      type="number"
      value={numValue}
      onChange={(e) => {
        const val = e.target.value === "" ? null : Number(e.target.value);
        onChange?.(val);
      }}
      disabled={disabled}
      placeholder={field.placeholder}
      aria-invalid={!!error}
    />
  );
}

export function NumberWidgetReadonly({ value }: WidgetRenderProps) {
  const formatted = value != null ? Number(value).toLocaleString() : "—";
  return <span className="text-sm tabular-nums">{formatted}</span>;
}

export function NumberWidgetCell({ value }: CellRenderProps) {
  return <>{value != null ? Number(value).toLocaleString() : ""}</>;
}
