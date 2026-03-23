/**
 * Date Widget — Default renderer for date/datetime fields
 */

import * as React from "react";
import { DatePicker } from "@afenda/ui-core/primitives/date-picker";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

export function DateWidgetRender({ field, value, onChange, disabled }: WidgetRenderProps) {
  const dateValue = value instanceof Date ? value : value ? new Date(String(value)) : undefined;

  return (
    <DatePicker
      value={dateValue}
      onChange={onChange}
      disabled={disabled}
      placeholder={field.placeholder}
    />
  );
}

export function DateWidgetReadonly({ value }: WidgetRenderProps) {
  if (!value) return <span className="text-sm">—</span>;
  const date = value instanceof Date ? value : new Date(String(value));
  return <span className="text-sm">{date.toLocaleDateString()}</span>;
}

export function DateWidgetCell({ value }: CellRenderProps) {
  if (!value) return <></>;
  const date = value instanceof Date ? value : new Date(String(value));
  return <>{date.toLocaleDateString()}</>;
}
