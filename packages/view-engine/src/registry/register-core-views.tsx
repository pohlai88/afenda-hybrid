/**
 * Core View Registration
 *
 * Registers the default renderers for the 3 canonical view types.
 * Called during view engine initialization.
 */

import { registerView, type ViewRendererProps } from "./view-registry";
import { FormView } from "../renderers/form-view";
import { ListView } from "../renderers/list-view";
import { KanbanView } from "../renderers/kanban-view";

/**
 * Registers all core view renderers.
 * Must be called before any view resolution occurs.
 */
export function registerCoreViews(): void {
  // Register form view
  registerView("form", (props: ViewRendererProps) => {
    const data = props.data as Record<string, unknown> | undefined;
    return (
      <FormView
        model={props.model}
        view={props.view}
        data={data}
        onSave={props.onSave}
        onCancel={props.onCancel}
        onSearch={props.onSearch}
        conditionContext={props.conditionContext}
      />
    );
  });

  // Register list view
  registerView("list", (props: ViewRendererProps) => {
    const data = props.data as unknown[];
    return <ListView model={props.model} view={props.view} data={data} onAction={props.onAction} />;
  });

  // Register kanban view
  registerView("kanban", (props: ViewRendererProps) => {
    const data = props.data as unknown[];
    return (
      <KanbanView
        model={props.model}
        view={props.view}
        data={data}
        onStateChange={props.onStateChange}
        onRecordClick={props.onRecordClick}
      />
    );
  });
}
