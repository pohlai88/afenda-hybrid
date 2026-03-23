/**
 * View Registry — Governed Extension Point
 *
 * Maps view kinds (list, form, kanban) to renderer components.
 * Sealed after boot to prevent runtime mutation.
 *
 * @version 1.0.0
 */

import * as React from "react";
import type { ModelDef } from "../metadata/model-def";
import type { ConditionContext } from "../metadata/condition";
import type { ViewDef, ViewKind } from "../metadata/view-kind";

/**
 * Props passed to view renderer components.
 */
export interface ViewRendererProps {
  /** Model definition. */
  model: ModelDef;
  /** View definition. */
  view: ViewDef;
  /** Record data (single record for form, array for list/kanban). */
  data: unknown;
  /** Called when the user saves changes (form view). */
  onSave?: (data: Record<string, unknown>) => Promise<void>;
  /** Called when the user cancels (form view). */
  onCancel?: () => void;
  /** Async search for relation fields (form view). */
  onSearch?: (fieldName: string, query: string) => Promise<Array<{ value: string; label: string }>>;
  /** Merged into form condition evaluation (form view). */
  conditionContext?: ConditionContext;
  /** Called when the user performs an action (list view). */
  onAction?: (action: string, records: unknown[]) => Promise<void>;
  /** Called when a card moves to a new state (kanban view). */
  onStateChange?: (record: unknown, newState: string) => Promise<void>;
  /** Called when a kanban card is clicked. */
  onRecordClick?: (record: unknown) => void;
}

/**
 * View renderer component type.
 */
export type ViewRenderer = React.FC<ViewRendererProps>;

// ---------------------------------------------------------------------------
// Registry State
// ---------------------------------------------------------------------------

const registry = new Map<ViewKind, ViewRenderer>();
let sealed = false;

// ---------------------------------------------------------------------------
// Registration API
// ---------------------------------------------------------------------------

/**
 * Registers a view renderer (platform architecture team only).
 * Throws if the registry is sealed or if the kind is already registered.
 */
export function registerView(kind: ViewKind, component: ViewRenderer): void {
  if (sealed) {
    throw new Error(`View registry is sealed. Cannot register view "${kind}".`);
  }
  if (registry.has(kind)) {
    throw new Error(`View "${kind}" is already registered.`);
  }
  registry.set(kind, component);
}

/**
 * Seals the view registry, preventing further registration.
 * Called after boot-time initialization.
 */
export function sealViewRegistry(): void {
  sealed = true;
}

/**
 * Returns true if the view registry is sealed.
 */
export function isViewRegistrySealed(): boolean {
  return sealed;
}

// ---------------------------------------------------------------------------
// Resolution API
// ---------------------------------------------------------------------------

/**
 * Resolves the renderer for a given view kind.
 * Throws if no renderer is registered for the kind.
 */
export function resolveView(kind: ViewKind): ViewRenderer {
  const renderer = registry.get(kind);
  if (!renderer) {
    throw new Error(
      `No renderer registered for view kind "${kind}". ` +
        `Did you forget to call initializeViewEngine()?`
    );
  }
  return renderer;
}

/**
 * Returns a read-only view of all registered view renderers.
 */
export function getRegisteredViews(): ReadonlyMap<ViewKind, ViewRenderer> {
  return registry;
}
