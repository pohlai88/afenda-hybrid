/**
 * ERP Money Widget — money field rendering bound from metadata (`field`, `value`, `onChange`).
 *
 * Currency and placeholder come from the **field presentation contract**; this module does not load
 * domain data or decide permissions (`disabled` is supplied by the engine).
 *
 * @see `../../../../docs/patterns/metadata-driven-view-composition-standard.md` §3.3, §4.3
 */

import * as React from "react";
import { Input } from "@afenda/ui-core/primitives/input";
import type { WidgetRenderProps, CellRenderProps } from "@afenda/view-engine";

export function ErpMoneyWidgetRender({
  field,
  value,
  onChange,
  disabled,
  error,
}: WidgetRenderProps) {
  const numValue = value != null ? Number(value) : "";
  const currency = field.currencyField ?? "USD";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        {getCurrencySymbol(String(currency))}
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
        className="pl-8"
        step="0.01"
        aria-invalid={!!error}
      />
    </div>
  );
}

export function ErpMoneyWidgetReadonly({ field, value }: WidgetRenderProps) {
  const currency = field.currencyField ?? "USD";
  const formatted =
    value != null
      ? Number(value).toLocaleString(undefined, {
          style: "currency",
          currency: String(currency),
        })
      : "—";
  return <span className="text-sm font-medium tabular-nums">{formatted}</span>;
}

export function ErpMoneyWidgetCell({ field, value }: CellRenderProps) {
  const currency = field.currencyField ?? "USD";
  return (
    <>
      {value != null
        ? Number(value).toLocaleString(undefined, {
            style: "currency",
            currency: String(currency),
          })
        : ""}
    </>
  );
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };
  return symbols[currency] ?? currency;
}
