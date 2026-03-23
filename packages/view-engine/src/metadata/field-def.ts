/**
 * Metadata — Field Definition
 *
 * A portable, JSON-serialisable description of a single field on a model.
 * Designed to be stored in a registry, returned by an API, or hard-coded
 * in a TypeScript module — the UI package makes no assumptions about origin.
 *
 * @version 1.0.0 — condition-aware, sealed widget hints
 */

import type { FieldType } from "./field-types";
import type { Condition, Formula } from "./condition";

/** One option in a `selection`-type field. */
export interface SelectionOption {
  /** Stored value (persisted in the database). */
  value: string;
  /** Human-readable label shown in the UI. */
  label: string;
}

/**
 * Widget hint — overrides the default control for a given `FieldType`.
 *
 * For example a `char` field might render as a `"url"` or `"email"` widget,
 * and a `selection` field might render as `"radio"` instead of a dropdown.
 *
 * **Sealed type** — custom widget keys are registered through the governed
 * registry API, not through this type union.
 */
export type WidgetHint =
  | "default"
  | "email"
  | "url"
  | "phone"
  | "password"
  | "color"
  | "radio"
  | "toggle"
  | "tags"
  | "priority"
  | "statusbar"
  | "image"
  | "progressbar";

export interface FieldDef {
  /** Technical field name (e.g. `"employee_code"`). */
  name: string;

  /** Human-readable label. */
  label: string;

  /** Field data type — drives the default widget selection. */
  type: FieldType;

  /**
   * Whether the field must have a value.
   * Can be a static boolean or a dynamic condition.
   */
  required?: boolean | Condition;

  /**
   * Whether the field is non-editable in the current view.
   * Can be a static boolean or a dynamic condition.
   */
  readonly?: boolean | Condition;

  /**
   * Whether the field is hidden in the current view.
   * Can be a static boolean or a dynamic condition.
   */
  invisible?: boolean | Condition;

  /** Short description / tooltip (Odoo `help` attribute). */
  help?: string;

  /** Placeholder text for input controls. */
  placeholder?: string;

  /**
   * Available options for `selection` fields.
   * Also used by `many2one` in "quick add" mode.
   */
  options?: SelectionOption[];

  /** Override the default widget for this field type. */
  widget?: WidgetHint;

  /** Default value (JSON-safe). */
  defaultValue?: unknown;

  /**
   * Group name — fields with the same `group` render inside the same
   * `FormSection` when using automatic layout.
   */
  group?: string;

  /** Display order within its group (lower = earlier). */
  sequence?: number;

  /**
   * For relational fields (`many2one`, `one2many`, `many2many`):
   * the target model name.
   */
  relation?: string;

  /** Maximum length for `char` / `text` fields. */
  maxLength?: number;

  /** Regex pattern for format validation (e.g., "^[A-Z0-9-]+$"). */
  pattern?: string;

  /** Minimum value for numeric fields. */
  min?: number;

  /** Maximum value for numeric fields. */
  max?: number;

  /** Decimal precision for `float` / `monetary` fields. */
  digits?: [precision: number, scale: number];

  /** Currency field name for `monetary` fields. */
  currencyField?: string;

  /**
   * Computed field definition.
   * The client references a named server-side compute key — it does NOT
   * execute arithmetic.
   */
  compute?: Formula;
}
