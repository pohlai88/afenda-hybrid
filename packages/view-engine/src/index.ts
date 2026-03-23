/**
 * @afenda/view-engine — Metadata Interpreter
 *
 * Widget registry, view registry, and metadata-driven renderers.
 * Thin projection layer — interprets metadata, composes UI, manages local state.
 * Does NOT fetch data, cache, route, or contain business logic.
 *
 * @version 0.1.0
 */

// Metadata contracts
export * from "./metadata";

// Components
export * from "./components/metadata-field";

// Widget Registry
export * from "./registry/widget-registry";
export { registerCoreWidgets } from "./registry/register-core-widgets";

// View Registry
export * from "./registry/view-registry";
export { registerCoreViews } from "./registry/register-core-views";

// Boot
export { initializeViewEngine, isInitialized } from "./registry/boot";

// Hooks
export { useFormState } from "./hooks/use-form-state";

// Renderers
export { FormView } from "./renderers/form-view";
export { ListView } from "./renderers/list-view";
export { KanbanView } from "./renderers/kanban-view";

// Devtools
export {
  ViewEngineDevtools,
  logConditionEvaluation,
  updateViewEngineFormPreview,
  unregisterViewEngineFormPreview,
} from "./devtools/view-engine-devtools";
