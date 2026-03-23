/**
 * Form View Renderer
 *
 * Interprets ViewDef.layout (LayoutTree) and renders a complete form.
 * Evaluates conditions, manages form state, and composes UI from widgets.
 *
 * @version 1.0.0
 */

import * as React from "react";
import { Button } from "@afenda/ui-core/primitives/button";
import { Badge } from "@afenda/ui-core/primitives/badge";
import { Separator } from "@afenda/ui-core/primitives/separator";
import { FormSection } from "@afenda/ui-core/patterns/form-section";
import { FormNotebook } from "@afenda/ui-core/patterns/form-notebook";
import { MetadataField } from "../components/metadata-field";
import { evaluateCondition } from "../metadata/condition";
import { validateLayout } from "../metadata/layout";
import { useFormState } from "../hooks/use-form-state";
import type { ModelDef } from "../metadata/model-def";
import type { ConditionContext } from "../metadata/condition";
import type { ViewDef } from "../metadata/view-kind";
import type { LayoutNode, FieldNode, GroupNode, NotebookNode } from "../metadata/layout";
import {
  updateViewEngineFormPreview,
  unregisterViewEngineFormPreview,
} from "../devtools/view-engine-devtools";

// Check if devtools are enabled
const isDevtoolsEnabled =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location?.search).get("ve-debug") === "1";

export interface FormViewProps {
  /** Model definition. */
  model: ModelDef;
  /** View definition (kind: "form"). */
  view: ViewDef;
  /** Initial record data. */
  data?: Record<string, unknown>;
  /** Called when the user saves the form. */
  onSave?: (data: Record<string, unknown>) => Promise<void>;
  /** Called when the user cancels. */
  onCancel?: () => void;
  /** Async search callback for relation fields. */
  onSearch?: (fieldName: string, query: string) => Promise<Array<{ value: string; label: string }>>;
  /** User/company/date (etc.) merged into condition evaluation; form values win on key conflicts. */
  conditionContext?: ConditionContext;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Form View Renderer.
 *
 * Renders a complete form from ModelDef + ViewDef.
 * Evaluates all conditions against the current record and passes
 * pre-evaluated booleans to MetadataField components.
 */
export function FormView({
  model,
  view,
  data,
  onSave,
  onCancel,
  onSearch,
  conditionContext,
  className,
}: FormViewProps) {
  const form = useFormState({
    model,
    initialData: data,
    conditionContext,
    onSubmit: onSave,
  });

  const formPreviewOwnerRef = React.useRef<symbol | null>(null);
  if (formPreviewOwnerRef.current === null) {
    formPreviewOwnerRef.current = Symbol("ve-form-preview");
  }
  const formPreviewOwner = formPreviewOwnerRef.current;

  const layout = view.layout ?? generateDefaultLayout(model);

  // Devtools: publish live model + values for State Machine tab (dev only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    updateViewEngineFormPreview(formPreviewOwner, { model, values: form.values });
    return () => {
      unregisterViewEngineFormPreview(formPreviewOwner);
    };
  }, [model, form.values, formPreviewOwner]);

  // Validate layout on mount
  React.useEffect(() => {
    if (view.layout && process.env.NODE_ENV !== "production") {
      const result = validateLayout(view.layout, model);
      if (!result.valid) {
        console.error("[FormView] Invalid layout:", result.errors);
      }
    }
  }, [view.layout, model]);

  return (
    <div className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.submit();
        }}
        className="space-y-6"
      >
        {layout.map((node, idx) => (
          <LayoutNodeRenderer
            key={idx}
            node={node}
            model={model}
            values={form.values}
            errors={form.errors}
            onFieldChange={form.setFieldValue}
            onFieldBlur={form.touchField}
            onSearch={onSearch}
            conditionContext={conditionContext}
          />
        ))}

        <div className="flex items-center gap-2 border-t pt-4">
          <Button type="submit" disabled={!form.dirty || form.submitting}>
            {form.submitting ? "Saving..." : "Save"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {form.dirty && (
            <Button type="button" variant="ghost" onClick={form.reset} disabled={form.submitting}>
              Reset
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout Interpreter
// ---------------------------------------------------------------------------

interface LayoutNodeRendererProps {
  node: LayoutNode;
  model: ModelDef;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onFieldChange: (name: string, value: unknown) => void;
  onFieldBlur: (name: string) => void;
  onSearch?: (fieldName: string, query: string) => Promise<Array<{ value: string; label: string }>>;
  conditionContext?: ConditionContext;
}

function LayoutNodeRenderer({
  node,
  model,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
  onSearch,
  conditionContext,
}: LayoutNodeRendererProps) {
  const debugClass = isDevtoolsEnabled
    ? "outline outline-1 outline-dashed outline-blue-300 relative"
    : "";

  const debugLabel = isDevtoolsEnabled ? (
    <span className="absolute -top-2 left-2 bg-blue-100 px-1 text-[10px] text-blue-700 rounded">
      {node.kind}
    </span>
  ) : null;

  switch (node.kind) {
    case "field":
      return (
        <div className={debugClass}>
          {debugLabel}
          <FieldNodeRenderer
            node={node}
            model={model}
            values={values}
            errors={errors}
            onFieldChange={onFieldChange}
            onFieldBlur={onFieldBlur}
            onSearch={onSearch}
            conditionContext={conditionContext}
          />
        </div>
      );
    case "group":
      return (
        <div className={debugClass}>
          {debugLabel}
          <GroupNodeRenderer
            node={node}
            model={model}
            values={values}
            errors={errors}
            onFieldChange={onFieldChange}
            onFieldBlur={onFieldBlur}
            onSearch={onSearch}
            conditionContext={conditionContext}
          />
        </div>
      );
    case "notebook":
      return (
        <div className={debugClass}>
          {debugLabel}
          <NotebookNodeRenderer
            node={node}
            model={model}
            values={values}
            errors={errors}
            onFieldChange={onFieldChange}
            onFieldBlur={onFieldBlur}
            onSearch={onSearch}
            conditionContext={conditionContext}
          />
        </div>
      );
    case "separator":
      return <Separator className="my-4" />;
    default:
      return null;
  }
}

function FieldNodeRenderer({
  node,
  model,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
  onSearch,
  conditionContext,
}: LayoutNodeRendererProps & { node: FieldNode }) {
  const fieldDef = model.fields[node.name];
  if (!fieldDef) {
    return <div className="text-sm text-destructive">Unknown field: {node.name}</div>;
  }

  // Evaluate conditions against current record
  const readonly = fieldDef.readonly
    ? typeof fieldDef.readonly === "boolean"
      ? fieldDef.readonly
      : evaluateCondition(fieldDef.readonly, values, `${node.name}.readonly`, conditionContext)
    : false;

  const invisible = fieldDef.invisible
    ? typeof fieldDef.invisible === "boolean"
      ? fieldDef.invisible
      : evaluateCondition(fieldDef.invisible, values, `${node.name}.invisible`, conditionContext)
    : false;

  // Computed fields are always readonly
  const isComputed = !!fieldDef.compute;
  const effectiveReadonly = readonly || isComputed;

  return (
    <div className="relative">
      <MetadataField
        field={fieldDef}
        value={values[node.name]}
        onChange={(value) => onFieldChange(node.name, value)}
        onBlur={() => onFieldBlur(node.name)}
        onSearch={onSearch ? (query) => onSearch(node.name, query) : undefined}
        error={errors[node.name]}
        readonly={effectiveReadonly}
        invisible={invisible}
      />
      {isComputed && !invisible && (
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-[10px] pointer-events-none"
        >
          Computed
        </Badge>
      )}
    </div>
  );
}

function GroupNodeRenderer({
  node,
  model,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
  onSearch,
  conditionContext,
}: LayoutNodeRendererProps & { node: GroupNode }) {
  const direction = node.direction === "horizontal" ? "horizontal" : "vertical";
  const columns = node.columns ?? (direction === "horizontal" ? 3 : 1);

  return (
    <FormSection title={node.title ?? ""} columns={columns}>
      {node.children.map((child, idx) => (
        <LayoutNodeRenderer
          key={idx}
          node={child}
          model={model}
          values={values}
          errors={errors}
          onFieldChange={onFieldChange}
          onFieldBlur={onFieldBlur}
          onSearch={onSearch}
          conditionContext={conditionContext}
        />
      ))}
    </FormSection>
  );
}

function NotebookNodeRenderer({
  node,
  model,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
  onSearch,
  conditionContext,
}: LayoutNodeRendererProps & { node: NotebookNode }) {
  // Filter pages by invisible condition
  const visiblePages = node.pages.filter((page) => {
    if (!page.invisible) return true;
    if (typeof page.invisible === "boolean") return !page.invisible;
    return !evaluateCondition(
      page.invisible,
      values,
      `notebook.${page.key}.invisible`,
      conditionContext
    );
  });

  const pages = visiblePages.map((page) => ({
    value: page.key,
    label: page.label,
    children: (
      <div className="space-y-4">
        {page.children.map((child, idx) => (
          <LayoutNodeRenderer
            key={idx}
            node={child}
            model={model}
            values={values}
            errors={errors}
            onFieldChange={onFieldChange}
            onFieldBlur={onFieldBlur}
            onSearch={onSearch}
            conditionContext={conditionContext}
          />
        ))}
      </div>
    ),
  }));

  return <FormNotebook pages={pages} />;
}

// ---------------------------------------------------------------------------
// Default Layout Generator
// ---------------------------------------------------------------------------

/**
 * Generates a default layout when ViewDef.layout is not provided.
 * Simply lists all fields vertically in the order they appear in the model.
 */
function generateDefaultLayout(model: ModelDef): LayoutNode[] {
  return Object.keys(model.fields).map((fieldName) => ({
    kind: "field" as const,
    name: fieldName,
  }));
}
