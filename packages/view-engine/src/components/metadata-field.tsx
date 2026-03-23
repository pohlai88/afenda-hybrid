"use client";

import * as React from "react";
import { FormField } from "@afenda/ui-core/patterns/form-field";
import type { FieldDef } from "../metadata/field-def";
import type { Condition } from "../metadata/condition";
import { resolveWidget } from "../registry/widget-registry";
import { setFieldInspectorData } from "../devtools/view-engine-devtools";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MetadataFieldProps {
  /** The field definition that drives which control renders. */
  field: FieldDef;
  /** Current value (type varies by field type). */
  value?: unknown;
  /** Called when the user changes the value. */
  onChange?: (value: unknown) => void;
  /** Called when the field loses focus. */
  onBlur?: () => void;
  /** Async search callback for relation fields. */
  onSearch?: (query: string) => Promise<Array<{ value: string; label: string }>>;
  /** Validation error message. */
  error?: string;
  /**
   * Pre-evaluated readonly state (from view renderer).
   * If provided, overrides field.readonly.
   */
  readonly?: boolean;
  /**
   * Pre-evaluated invisible state (from view renderer).
   * If provided, overrides field.invisible.
   */
  invisible?: boolean;
  /** Override field-level disabled. */
  disabled?: boolean;
  className?: string;
}

/**
 * Renders a single control driven by a `FieldDef`.
 *
 * Uses the widget registry to resolve the appropriate renderer.
 * View renderers should evaluate conditions and pass pre-evaluated
 * booleans for readonly/invisible. If not provided, this component
 * will use safe defaults (treating Condition objects as false).
 */
export function MetadataField({
  field,
  value,
  onChange,
  onBlur,
  onSearch,
  error,
  readonly: readonlyProp,
  invisible: invisibleProp,
  disabled,
  className,
}: MetadataFieldProps) {
  const isReadonly = readonlyProp ?? resolveConditionToBoolean(field.readonly);
  const isInvisible = invisibleProp ?? resolveConditionToBoolean(field.invisible);

  if (isInvisible) return null;

  // Resolve required (can also be Condition)
  const isRequired =
    typeof field.required === "boolean"
      ? field.required
      : resolveConditionToBoolean(field.required);

  // Resolve widget from registry
  const widget = resolveWidget(field);
  const WidgetRender = isReadonly ? (widget.readonly ?? widget.render) : widget.render;

  // Resolve display value for relation fields
  const displayValue =
    field.type === "many2one" && field.options && value
      ? field.options.find((opt) => opt.value === value)?.label
      : undefined;

  // Update field inspector on focus
  const handleFocus = React.useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      setFieldInspectorData({
        fieldName: field.name,
        fieldDef: field,
        value,
        readonly: isReadonly,
        invisible: isInvisible,
        required: isRequired,
        widget: field.widget ?? "default",
      });
    }
  }, [field, value, isReadonly, isInvisible, isRequired]);

  return (
    <FormField
      label={field.label}
      name={field.name}
      description={field.help}
      error={error}
      required={isRequired}
      readonly={isReadonly}
      readonlyValue={
        isReadonly && widget.readonly ? (
          <WidgetRender
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onSearch={onSearch}
            displayValue={displayValue}
            disabled={disabled}
            error={error}
          />
        ) : undefined
      }
      copyable={false}
      maxLength={field.maxLength}
      charCount={field.maxLength && typeof value === "string" ? value.length : undefined}
      className={className}
    >
      {!isReadonly && (
        <div onFocus={handleFocus}>
          <WidgetRender
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onSearch={onSearch}
            displayValue={displayValue}
            disabled={disabled}
            error={error}
          />
        </div>
      )}
    </FormField>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fallback when `readonly` / `invisible` / `required` are passed as raw conditions
 * without a record: safe default false. FormView and other renderers should pass
 * pre-evaluated booleans when a record exists.
 */
function resolveConditionToBoolean(value: boolean | Condition | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "boolean") return value;
  return false;
}
