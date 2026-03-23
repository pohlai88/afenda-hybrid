/**
 * Select Widget — Default renderer for selection/select fields
 */

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@afenda/ui-core/primitives/select";
import { RadioGroup, RadioGroupItem } from "@afenda/ui-core/primitives/radio-group";
import { Label } from "@afenda/ui-core/primitives/label";
import type { WidgetRenderProps, CellRenderProps } from "../registry/widget-registry";

export function SelectWidgetRender({ field, value, onChange, disabled }: WidgetRenderProps) {
  const stringValue = value != null ? String(value) : undefined;

  // Use radio group for radio widget hint
  if (field.widget === "radio" && field.options) {
    return (
      <RadioGroup value={stringValue} onValueChange={onChange} disabled={disabled}>
        {field.options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
            <Label htmlFor={`${field.name}-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // Default to dropdown
  return (
    <Select value={stringValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={field.name}>
        <SelectValue placeholder={field.placeholder ?? "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {field.options?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SelectWidgetReadonly({ field, value }: WidgetRenderProps) {
  const option = field.options?.find((opt) => opt.value === value);
  return <span className="text-sm">{option?.label ?? "—"}</span>;
}

export function SelectWidgetCell({ field, value }: CellRenderProps) {
  const option = field.options?.find((opt) => opt.value === value);
  return <>{option?.label ?? ""}</>;
}
