/**
 * View Engine Devtools
 *
 * Debug overlay for metadata-driven UI.
 * Tree-shaken in production builds.
 *
 * @version 1.0.0
 */

import * as React from "react";
import { cn } from "@afenda/ui-core/lib/utils";
import type { ModelDef } from "../metadata/model-def";

// ---------------------------------------------------------------------------
// Global Log Store with React Subscription
// ---------------------------------------------------------------------------

interface ConditionLog {
  field: string;
  condition: unknown;
  result: boolean;
  record: Record<string, unknown>;
  timestamp: number;
}

const listeners = new Set<() => void>();
const logStore: ConditionLog[] = [];

export function pushConditionLog(log: ConditionLog): void {
  logStore.push(log);
  listeners.forEach((fn) => fn());

  // Also expose on window for console debugging
  if (typeof window !== "undefined") {
    (window as any).__AFENDA_ENGINE_LOG__ = logStore;
  }
}

function subscribeToLogs(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getLogsSnapshot(): ConditionLog[] {
  return logStore;
}

// ---------------------------------------------------------------------------
// Field Inspector Store
// ---------------------------------------------------------------------------

interface FieldInspectorData {
  fieldName: string;
  fieldDef: any;
  value: unknown;
  readonly: boolean;
  invisible: boolean;
  required: boolean;
  widget: string;
}

const fieldInspectorListeners = new Set<() => void>();
let fieldInspectorData: FieldInspectorData | null = null;

export function setFieldInspectorData(data: FieldInspectorData | null): void {
  fieldInspectorData = data;
  fieldInspectorListeners.forEach((fn) => fn());

  if (typeof window !== "undefined") {
    (window as any).__AFENDA_FIELD_INSPECT__ = data;
  }
}

function subscribeToFieldInspector(callback: () => void): () => void {
  fieldInspectorListeners.add(callback);
  return () => fieldInspectorListeners.delete(callback);
}

function getFieldInspectorSnapshot(): FieldInspectorData | null {
  return fieldInspectorData;
}

// ---------------------------------------------------------------------------
// Active FormView preview (State Machine tab + console)
// ---------------------------------------------------------------------------

interface FormPreviewSnapshot {
  model: ModelDef;
  values: Record<string, unknown>;
  owner: symbol;
}

const previewListeners = new Set<() => void>();
let activeFormPreview: FormPreviewSnapshot | null = null;

/**
 * Registers or updates the active form record for devtools (State Machine tab).
 * Call from FormView in development; pass a stable `owner` symbol per mount.
 */
export function updateViewEngineFormPreview(
  owner: symbol,
  payload: { model: ModelDef; values: Record<string, unknown> }
): void {
  activeFormPreview = { owner, model: payload.model, values: payload.values };
  previewListeners.forEach((fn) => fn());
  if (typeof window !== "undefined") {
    (window as unknown as { __AFENDA_FORM_PREVIEW__?: unknown }).__AFENDA_FORM_PREVIEW__ = {
      model: payload.model.name,
      values: payload.values,
    };
  }
}

/** Clears preview only if this owner is still active (avoids race on remount). */
export function unregisterViewEngineFormPreview(owner: symbol): void {
  if (activeFormPreview?.owner !== owner) return;
  activeFormPreview = null;
  previewListeners.forEach((fn) => fn());
  if (typeof window !== "undefined") {
    delete (window as unknown as { __AFENDA_FORM_PREVIEW__?: unknown }).__AFENDA_FORM_PREVIEW__;
  }
}

function subscribeToFormPreview(callback: () => void): () => void {
  previewListeners.add(callback);
  return () => previewListeners.delete(callback);
}

function getFormPreviewSnapshot(): FormPreviewSnapshot | null {
  return activeFormPreview;
}

export interface ViewEngineDevtoolsProps {
  /** Enable the devtools overlay. */
  enabled: boolean;
  /** Additional CSS classes. */
  className?: string;
  /**
   * Model with `states` — overrides auto-registered preview from an active `FormView`.
   */
  previewModel?: ModelDef;
  /**
   * Current form/record values — overrides auto values from `FormView` when `previewModel` is used.
   */
  previewValues?: Record<string, unknown>;
}

/**
 * View Engine Devtools overlay.
 *
 * Activate via:
 * - URL param: ?ve-debug=1
 * - Keyboard shortcut: Ctrl+Shift+D
 *
 * Features:
 * - Field inspector (focus a field to see FieldDef, condition results)
 * - Layout boundaries (dotted borders around LayoutNodes)
 * - Condition debugger (show expression + result)
 * - State machine visualizer (show graph with current state)
 *
 * Tree-shaken in production when process.env.NODE_ENV === "production".
 */
function StateMachineSvgPreview({
  model,
  values,
}: {
  model: ModelDef;
  values?: Record<string, unknown>;
}) {
  const sm = model.states;
  if (!sm) return null;

  const stateField = sm.field;
  const current = values ? String(values[stateField] ?? "") : "";
  const list = sm.states;
  const r = 22;
  const step = 100;
  const margin = 36;
  const cy = 56;
  const width = Math.max(280, margin * 2 + (list.length - 1) * step + r * 2);
  const height = 112;

  const cx = (i: number) => margin + r + i * step;

  const indexByValue = new Map(list.map((s, i) => [s.value, i]));

  const edges: Array<{ from: number; to: number }> = [];
  for (const s of list) {
    const from = indexByValue.get(s.value);
    if (from === undefined) continue;
    for (const t of s.transitions ?? []) {
      const to = indexByValue.get(t);
      if (to !== undefined) edges.push({ from, to });
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Model <span className="font-mono">{model.name}</span> — field{" "}
        <span className="font-mono">{stateField}</span>
        {current ? (
          <>
            {" "}
            → current <span className="font-mono text-foreground">{current}</span>
          </>
        ) : null}
      </p>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="text-foreground"
        aria-label="State machine transitions"
      >
        <defs>
          <marker
            id="ve-state-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" className="fill-muted-foreground" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const x1 = cx(e.from);
          const x2 = cx(e.to);
          const dir = x2 >= x1 ? 1 : -1;
          const ax1 = x1 + dir * r;
          const ax2 = x2 - dir * r;
          return (
            <line
              key={`${e.from}-${e.to}-${i}`}
              x1={ax1}
              y1={cy}
              x2={ax2}
              y2={cy}
              className="stroke-muted-foreground"
              strokeWidth={1.5}
              markerEnd="url(#ve-state-arrow)"
            />
          );
        })}
        {list.map((s, i) => {
          const x = cx(i);
          const isCurrent = s.value === current;
          return (
            <g key={s.value}>
              <circle
                cx={x}
                cy={cy}
                r={r}
                className={cn(
                  "stroke-2",
                  isCurrent ? "fill-primary/15 stroke-primary" : "fill-muted/40 stroke-border"
                )}
              />
              <text
                x={x}
                y={cy + 4}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-medium"
              >
                {s.label.length > 10 ? `${s.label.slice(0, 9)}…` : s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ViewEngineDevtools({
  enabled,
  className,
  previewModel,
  previewValues,
}: ViewEngineDevtoolsProps) {
  const [inspectorVisible, setInspectorVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"logs" | "field" | "state">("logs");

  // Subscribe to the global log store
  const logs = React.useSyncExternalStore(subscribeToLogs, getLogsSnapshot, getLogsSnapshot);

  // Subscribe to field inspector
  const fieldData = React.useSyncExternalStore(
    subscribeToFieldInspector,
    getFieldInspectorSnapshot,
    getFieldInspectorSnapshot
  );

  const autoFormPreview = React.useSyncExternalStore(
    subscribeToFormPreview,
    getFormPreviewSnapshot,
    getFormPreviewSnapshot
  );

  const resolvedPreviewModel = previewModel ?? autoFormPreview?.model;
  const resolvedPreviewValues = previewValues ?? autoFormPreview?.values;

  React.useEffect(() => {
    if (!enabled) return;

    // Keyboard shortcut: Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setInspectorVisible((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  if (!enabled || process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <>
      {inspectorVisible && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 w-[480px] rounded-lg border bg-background shadow-lg",
            className
          )}
        >
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold text-sm">View Engine Inspector</h3>
            <button
              onClick={() => setInspectorVisible(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("logs")}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors",
                activeTab === "logs"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Condition Logs
            </button>
            <button
              onClick={() => setActiveTab("field")}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors",
                activeTab === "field"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Field Inspector
            </button>
            <button
              onClick={() => setActiveTab("state")}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors",
                activeTab === "state"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              State Machine
            </button>
          </div>

          <div className="p-4 max-h-[400px] overflow-y-auto">
            {activeTab === "logs" && (
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No conditions evaluated yet.</p>
                ) : (
                  <div className="space-y-1">
                    {logs.slice(-10).map((log, idx) => (
                      <div
                        key={idx}
                        className="text-xs border-l-2 pl-2 py-1"
                        style={{
                          borderColor: log.result ? "#10b981" : "#ef4444",
                        }}
                      >
                        <div className="font-mono">{log.field}</div>
                        <div className="text-muted-foreground">
                          {JSON.stringify(log.condition)} → {String(log.result)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    console.table((window as any).__AFENDA_ENGINE_LOG__);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Dump to console
                </button>
              </div>
            )}

            {activeTab === "field" && (
              <div className="space-y-3">
                {!fieldData ? (
                  <p className="text-xs text-muted-foreground">
                    Focus on a field to inspect its metadata.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Field Name</div>
                      <div className="text-sm font-mono">{fieldData.fieldName}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Widget</div>
                      <div className="text-sm">{fieldData.widget}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Value</div>
                      <div className="text-sm font-mono">{JSON.stringify(fieldData.value)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Readonly</div>
                        <div className="text-sm">{String(fieldData.readonly)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Invisible</div>
                        <div className="text-sm">{String(fieldData.invisible)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Required</div>
                        <div className="text-sm">{String(fieldData.required)}</div>
                      </div>
                    </div>
                    {fieldData.fieldDef?.compute ? (
                      <div className="rounded-md border border-primary/30 bg-primary/5 p-2 space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Server compute (client displays only)
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Key:</span>{" "}
                          <code className="text-xs font-mono">
                            {String(fieldData.fieldDef.compute.compute)}
                          </code>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Depends on:</span>{" "}
                          <code className="text-xs font-mono">
                            {(fieldData.fieldDef.compute.deps ?? []).join(", ") || "—"}
                          </code>
                        </div>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">
                        Field Definition
                      </div>
                      <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(fieldData.fieldDef, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "state" && (
              <div className="space-y-3">
                {resolvedPreviewModel?.states ? (
                  <>
                    {!previewModel && autoFormPreview ? (
                      <p className="text-[10px] text-muted-foreground">
                        Using active <code className="text-foreground">FormView</code> (live
                        values).
                      </p>
                    ) : null}
                    {previewModel && !previewValues && autoFormPreview ? (
                      <p className="text-[10px] text-muted-foreground">
                        Values merged from active <code className="text-foreground">FormView</code>.
                      </p>
                    ) : null}
                    <StateMachineSvgPreview
                      model={resolvedPreviewModel}
                      values={resolvedPreviewValues}
                    />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Open a <code className="text-foreground">FormView</code> for a model with{" "}
                    <code className="text-foreground">states</code>, or pass{" "}
                    <code className="text-foreground">previewModel</code> /{" "}
                    <code className="text-foreground">previewValues</code> to{" "}
                    <code className="text-foreground">ViewEngineDevtools</code>.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 z-50 text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Shift+D</kbd> to toggle inspector
      </div>
    </>
  );
}

/**
 * Logs a condition evaluation to the devtools.
 * Only active when devtools are enabled.
 */
export function logConditionEvaluation(
  field: string,
  condition: unknown,
  result: boolean,
  record: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "production") return;

  pushConditionLog({
    field,
    condition,
    result,
    record,
    timestamp: Date.now(),
  });
}
