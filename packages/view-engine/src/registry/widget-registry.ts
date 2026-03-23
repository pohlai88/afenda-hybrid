/**
 * Widget Registry — Governed Extension Point
 *
 * Maps field types and widget hints to React components.
 * Sealed after boot to prevent runtime mutation.
 *
 * @version 1.0.0
 */

import * as React from "react";
import type { FieldDef } from "../metadata/field-def";

/**
 * Core widget keys — platform-owned, stable set.
 */
export type CoreWidgetKey =
  | "text"
  | "number"
  | "money"
  | "boolean"
  | "date"
  | "select"
  | "relation";

/**
 * Props passed to widget render functions.
 */
export interface WidgetRenderProps {
  field: FieldDef;
  value: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  /** Async search callback for relation widgets. */
  onSearch?: (query: string) => Promise<Array<{ value: string; label: string }>>;
  /** Resolved display label for relation widgets. */
  displayValue?: string;
}

/**
 * Props passed to widget cell renderers (for list views).
 */
export interface CellRenderProps {
  field: FieldDef;
  value: unknown;
  /** Resolved display label for relation widgets. */
  displayValue?: string;
}

/**
 * Widget definition — specifies render functions for different contexts.
 */
export interface WidgetDef {
  /** Form context renderer (editable). */
  render: React.FC<WidgetRenderProps>;
  /** Form context renderer (readonly). Falls back to render if omitted. */
  readonly?: React.FC<WidgetRenderProps>;
  /** List cell renderer. Falls back to simple string formatting if omitted. */
  cell?: React.FC<CellRenderProps>;
}

// ---------------------------------------------------------------------------
// Registry State
// ---------------------------------------------------------------------------

const registry = new Map<string, WidgetDef>();
let sealed = false;

// ---------------------------------------------------------------------------
// Registration API
// ---------------------------------------------------------------------------

/**
 * Registers a core widget (platform team only).
 * Throws if the registry is sealed or if the key is already registered.
 */
export function registerWidget(key: CoreWidgetKey, def: WidgetDef): void {
  if (sealed) {
    throw new Error(`Widget registry is sealed. Cannot register widget "${key}".`);
  }
  if (registry.has(key)) {
    throw new Error(`Widget "${key}" is already registered.`);
  }
  registry.set(key, def);
}

/**
 * Registers a core widget only if not already registered.
 * Used internally by registerCoreWidgets to allow ERP overrides to take precedence.
 */
export function registerWidgetIfAbsent(key: CoreWidgetKey, def: WidgetDef): void {
  if (sealed) {
    throw new Error(`Widget registry is sealed. Cannot register widget "${key}".`);
  }
  if (!registry.has(key)) {
    registry.set(key, def);
  }
}

/**
 * Registers a custom widget (ERP pack or experimental use).
 * Logs a dev-mode warning to surface unauthorized extensions.
 * Throws if the registry is sealed.
 */
export function registerCustomWidget(key: string, def: WidgetDef): void {
  if (sealed) {
    throw new Error(`Widget registry is sealed. Cannot register widget "${key}".`);
  }
  if (registry.has(key)) {
    throw new Error(`Widget "${key}" is already registered.`);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Widget Registry] Custom widget "${key}" registered. ` +
        `Custom widgets are not part of the platform contract and may break in future versions.`
    );
  }

  registry.set(key, def);
}

/**
 * Seals the registry, preventing further registration.
 * Called after boot-time initialization.
 */
export function sealRegistry(): void {
  sealed = true;
}

/**
 * Unseals the registry (test-only).
 * @internal
 */
export function unsealRegistryForTesting(): void {
  if (process.env.NODE_ENV === "test") {
    sealed = false;
  }
}

/**
 * Returns true if the registry is sealed.
 */
export function isSealed(): boolean {
  return sealed;
}

// ---------------------------------------------------------------------------
// Resolution API
// ---------------------------------------------------------------------------

/**
 * Resolves the widget for a given field.
 * Resolution order:
 * 1. field.widget (if specified and registered)
 * 2. Normalized field.type
 * 3. Fallback to "text" widget
 */
export function resolveWidget(field: FieldDef): WidgetDef {
  // Try explicit widget hint
  if (field.widget && registry.has(field.widget)) {
    return registry.get(field.widget)!;
  }

  // Normalize field type to lean vocabulary
  const normalizedType = normalizeFieldTypeForWidget(field.type);
  if (registry.has(normalizedType)) {
    return registry.get(normalizedType)!;
  }

  // Fallback to text widget
  const fallback = registry.get("text");
  if (!fallback) {
    throw new Error(`Widget registry is not initialized. Missing "text" fallback widget.`);
  }
  return fallback;
}

/**
 * Returns a read-only view of all registered widgets.
 */
export function getRegisteredWidgets(): ReadonlyMap<string, WidgetDef> {
  return registry;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a field type to a widget key.
 * Maps both Odoo-style and lean types to core widget keys.
 */
function normalizeFieldTypeForWidget(type: string): CoreWidgetKey {
  switch (type) {
    case "char":
    case "text":
    case "html":
      return "text";
    case "integer":
    case "float":
      return "number";
    case "monetary":
      return "money";
    case "boolean":
      return "boolean";
    case "date":
    case "datetime":
      return "date";
    case "selection":
      return "select";
    case "many2one":
    case "one2many":
    case "many2many":
    case "reference":
      return "relation";
    default:
      return "text"; // fallback
  }
}
