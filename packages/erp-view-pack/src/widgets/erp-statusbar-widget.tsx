/**
 * ERP Status Bar Widget — maps `field.options` from metadata to `RecordStatusBar`.
 *
 * Valid transitions and guards belong in **workflow / state-machine contracts** (engine + server);
 * this widget only renders options and forwards `onChange` when not `disabled`.
 *
 * @see `../../../../docs/patterns/metadata-driven-view-composition-standard.md` §3.3, §4.5
 */

import * as React from "react";
import { RecordStatusBar } from "../patterns/record-status-bar";
import type { WidgetRenderProps, CellRenderProps } from "@afenda/view-engine";

export function ErpStatusBarWidgetRender({ field, value, onChange, disabled }: WidgetRenderProps) {
  if (!field.options) {
    return <span className="text-sm text-muted-foreground">No states defined</span>;
  }

  const states = field.options.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <RecordStatusBar
      states={states}
      current={String(value ?? "")}
      onChange={disabled ? undefined : onChange}
      variant="pill"
    />
  );
}

export function ErpStatusBarWidgetReadonly({ field, value }: WidgetRenderProps) {
  const option = field.options?.find((opt) => opt.value === value);
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {option?.label ?? "—"}
    </span>
  );
}

export function ErpStatusBarWidgetCell({ field, value }: CellRenderProps) {
  const option = field.options?.find((opt) => opt.value === value);
  return <>{option?.label ?? ""}</>;
}
