/**
 * Text Widget — Default renderer for text/char fields
 */

import * as React from "react";
import { Input } from "@afenda/ui-core/primitives/input";
import { Textarea } from "@afenda/ui-core/primitives/textarea";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

export function TextWidgetRender({ field, value, onChange, disabled, error }: WidgetRenderProps) {
  const stringValue = value != null ? String(value) : "";

  // Use textarea for long text fields
  if (field.type === "text" && !field.widget) {
    return (
      <Textarea
        id={field.name}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        rows={4}
        aria-invalid={!!error}
      />
    );
  }

  // Default to input for char/short text
  return (
    <Input
      id={field.name}
      type="text"
      value={stringValue}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      aria-invalid={!!error}
    />
  );
}

export function TextWidgetReadonly({ value }: WidgetRenderProps) {
  return <span className="text-sm">{value != null ? String(value) : "—"}</span>;
}

export function TextWidgetCell({ value }: CellRenderProps) {
  return <>{value != null ? String(value) : ""}</>;
}
