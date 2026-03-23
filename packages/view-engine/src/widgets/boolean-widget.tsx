/**
 * Boolean Widget — Default renderer for boolean fields
 */

import * as React from "react";
import { Checkbox } from "@afenda/ui-core/primitives/checkbox";
import { Switch } from "@afenda/ui-core/primitives/switch";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

export function BooleanWidgetRender({ field, value, onChange, disabled }: WidgetRenderProps) {
  const checked = Boolean(value);

  // Use switch for toggle-style fields (widget hint must be cast to string for comparison)
  if (field.widget && String(field.widget) === "toggle") {
    return (
      <Switch id={field.name} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    );
  }

  // Default to checkbox
  return (
    <Checkbox id={field.name} checked={checked} onCheckedChange={onChange} disabled={disabled} />
  );
}

export function BooleanWidgetReadonly({ value }: WidgetRenderProps) {
  return <span className="text-sm">{value ? "Yes" : "No"}</span>;
}

export function BooleanWidgetCell({ value }: CellRenderProps) {
  return <>{value ? "✓" : ""}</>;
}
