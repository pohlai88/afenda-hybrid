/**
 * Money Widget — Default renderer for monetary/money fields
 */

import * as React from "react";
import { Input } from "@afenda/ui-core/primitives/input";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

export function MoneyWidgetRender({ field, value, onChange, disabled, error }: WidgetRenderProps) {
  const numValue = value != null ? Number(value) : "";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
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
        className="pl-7"
        step="0.01"
        aria-invalid={!!error}
      />
    </div>
  );
}

export function MoneyWidgetReadonly({ value }: WidgetRenderProps) {
  const formatted =
    value != null
      ? Number(value).toLocaleString(undefined, { style: "currency", currency: "USD" })
      : "—";
  return <span className="text-sm tabular-nums">{formatted}</span>;
}

export function MoneyWidgetCell({ value }: CellRenderProps) {
  return (
    <>
      {value != null
        ? Number(value).toLocaleString(undefined, { style: "currency", currency: "USD" })
        : ""}
    </>
  );
}
