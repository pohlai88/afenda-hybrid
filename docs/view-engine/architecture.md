# AFENDA View Engine — Architecture Overview

**Version:** 1.0.0  
**Status:** Canonical  
**Last Updated:** March 24, 2026

---

## Executive Summary

The **AFENDA View Engine** is a deterministic business interface engine that projects business truth through metadata. It replaces hand-coded forms, tables, and workflows with a metadata-driven rendering system.

**Key Principle:** Metadata is a **data structure**, not a programming language. Business logic executes server-side; the engine interprets and renders.

**Product standard:** [Metadata-driven view composition](../patterns/metadata-driven-view-composition-standard.md) (layers, contracts, registries, determinism, anti-patterns).

---

## Package Architecture

```
@afenda/ui-core        — Primitives, patterns, hooks, tokens
@afenda/view-engine    — Metadata interpreter, registries, renderers
@afenda/erp-view-pack  — ERP-specific patterns and widgets
```

### Layer responsibilities

| Layer             | Purpose                                     | Metadata-aware? | Registry access?   |
| ----------------- | ------------------------------------------- | --------------- | ------------------ |
| **ui-core**       | Accessible primitives, layout patterns      | ❌ No           | ❌ No              |
| **view-engine**   | Metadata interpreter, registries, renderers | ✅ Yes          | ✅ Owns registries |
| **erp-view-pack** | ERP-specific patterns, widget overrides     | ✅ Yes          | ✅ Can register    |

---

## Metadata Contracts

### ModelDef

Defines a business entity:

```typescript
interface ModelDef {
  version: 1;
  name: string; // e.g., "hr.employee"
  label: string; // e.g., "Employee"
  fields: Record<string, FieldDef>;
  states?: StateMachineDef; // Workflow states
  defaultOrder?: Array<[field: string, direction: "asc" | "desc"]>;
}
```

### FieldDef

Defines a single field:

```typescript
interface FieldDef {
  name: string;
  label: string;
  type: UnifiedFieldType; // text, number, money, boolean, date, select, relation
  required?: boolean | Condition;
  readonly?: boolean | Condition;
  invisible?: boolean | Condition;
  compute?: Formula; // Server-side computed field
  widget?: WidgetHint; // UI hint (email, url, priority, etc.)
  options?: Array<{ value: string; label: string }>;
  relation?: string; // For relation fields
  // ... validation constraints
}
```

### ViewDef

Defines how to render a model:

```typescript
interface ViewDef {
  version: 1;
  id: string;
  name: string;
  kind: "list" | "form" | "kanban";
  model: string;
  fields?: string[]; // For list/kanban
  layout?: LayoutNode[]; // For form (LayoutTree)
  filters?: FilterExpr[];
}
```

### Condition DSL

Declarative expressions for dynamic UI:

```typescript
type Condition =
  | boolean
  | { field: string; op: ComparisonOp; value: unknown }
  | { op: "and" | "or"; conditions: Condition[] };
```

**Operators:** `eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `in`, `not_in`

**Example:**

```typescript
readonly: {
  op: "and",
  conditions: [
    { field: "status", op: "ne", value: "DRAFT" },
    { field: "approvedBy", op: "ne", value: null },
  ]
}
```

### LayoutTree

Structured form layout:

```typescript
type LayoutNode =
  | { kind: "field"; name: string; colspan?: 1 | 2 | 3 }
  | { kind: "group"; direction: "horizontal" | "vertical"; title?: string; children: LayoutNode[] }
  | { kind: "notebook"; pages: Array<{ key: string; label: string; children: LayoutNode[] }> }
  | { kind: "separator" };
```

**Constraints:**

- Max nesting depth: 6
- Max horizontal group width: 3 fields
- Max notebook pages: 6
- No nested notebooks

---

## Registry System

### Widget Registry

Maps field types and hints to React components.

**Governance:**

- **Core widgets** — Registered by `initializeViewEngine()`
- **Custom widgets** — Platform UI team only (logs dev warning)
- **ERP overrides** — `@afenda/erp-view-pack` only
- **Applications** — Cannot register

**API:**

```typescript
registerWidget("text", {
  render: TextWidgetRender,
  readonly: TextWidgetReadonly,
  cell: TextWidgetCell,
});

resolveWidget(field); // Returns WidgetDef
```

### View Registry

Maps view kinds to renderer components.

**Governance:**

- **Core views** — Registered by `initializeViewEngine()` (form, list, kanban)
- **Custom views** — Platform architecture team only
- **Applications** — Cannot register

**API:**

```typescript
registerView("form", FormView);
resolveView("form"); // Returns React component
```

---

## View Renderers

### FormView

Interprets `ViewDef.layout` (LayoutTree) and renders a complete form.

**Features:**

- Pre-evaluates conditions (`readonly`, `invisible`, `required`)
- Resolves widgets via registry
- Manages form state with `useFormState`
- Validates layout constraints
- Integrates devtools boundaries

**Props:**

```typescript
interface FormViewProps {
  model: ModelDef;
  view: ViewDef;
  data: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}
```

### ListView

Renders a data table using `DataTable` from `ui-core`.

**Features:**

- Converts `ViewDef.fields` to `ListColumnDef`
- Resolves cell renderers via widget registry
- Supports sorting, filtering, pagination
- Action column for row-level operations

**Props:**

```typescript
interface ListViewProps {
  model: ModelDef;
  view: ViewDef;
  data: Array<Record<string, unknown>>;
  onAction?: (action: string, records: Array<Record<string, unknown>>) => Promise<void>;
}
```

### KanbanView

Renders a Kanban board based on `ModelDef.states`.

**Features:**

- Groups records by state
- Drag-and-drop state transitions
- Validates transitions against state machine
- Renders `KanbanCard` for each record

**Props:**

```typescript
interface KanbanViewProps {
  model: ModelDef;
  view: ViewDef;
  data: Array<Record<string, unknown>>;
  onStateChange?: (record: Record<string, unknown>, newState: string) => Promise<void>;
}
```

---

## Engine Devtools

### Enable Debug Mode

```
?ve-debug=1
```

Or set environment variable:

```bash
NEXT_PUBLIC_VE_DEBUG=1
```

### Features

1. **Field Inspector** — Hover fields to see FieldDef and condition results
2. **Layout Boundaries** — Dotted borders around LayoutNodes
3. **Condition Log** — `window.__AFENDA_ENGINE_LOG__` array
4. **Console Dump** — `console.table(window.__AFENDA_ENGINE_LOG__)`

### Keyboard Shortcut

`Ctrl+Shift+D` — Toggle devtools overlay

### Logging

All condition evaluations are logged:

```typescript
window.__AFENDA_ENGINE_LOG__ = [
  {
    field: "salary",
    condition: { field: "status", op: "ne", value: "DRAFT" },
    result: true,
    record: { status: "ACTIVE", salary: 50000 },
    timestamp: 1711234567890,
  },
];
```

---

## Design Principles

### 1. Declarative, Not Expressive

Metadata is a **data structure**, not a programming language. No inline expressions, no eval, no scripting.

**Bad:**

```typescript
compute: "record.salary * 1.2"; // ❌ Inline expression
```

**Good:**

```typescript
compute: { fn: "compute_annual_salary", args: ["salary"] }  // ✅ Server reference
```

### 2. Thin Engine Boundary

The View Engine may:

- ✅ Interpret metadata
- ✅ Compose UI components
- ✅ Manage local form state

It may NOT:

- ❌ Fetch data
- ❌ Manage caching
- ❌ Handle routing
- ❌ Contain business logic

### 3. Registry Governance

Registries are sealed after boot. Extension points are controlled:

- **Widget Registry** — Platform UI team only
- **View Registry** — Platform architecture team only
- **ERP Extensions** — `@afenda/erp-view-pack` only
- **Applications** — Consume only, cannot register

### 4. Deterministic Simplicity

Every metadata contract must be:

- **Parseable** — No dynamic code execution
- **Testable** — Unit tests for all evaluators
- **Debuggable** — Devtools for runtime inspection
- **Versionable** — `version` field on all contracts

---

## Boot Sequence

```typescript
// 1. Register ERP widgets (if using ERP pack)
import { registerErpWidgets } from "@afenda/erp-view-pack";
registerErpWidgets();

// 2. Initialize view engine
import { initializeViewEngine } from "@afenda/view-engine";
initializeViewEngine();

// 3. Render views
import { FormView, ListView, KanbanView } from "@afenda/view-engine";
```

**What happens during `initializeViewEngine()`:**

1. Register 7 core widgets (`text`, `number`, `money`, `boolean`, `date`, `select`, `relation`)
2. Register 3 core views (`form`, `list`, `kanban`)
3. Seal both registries

---

## Testing Strategy

### Unit Tests

- **Condition evaluator** — All operators, combinators, edge cases
- **Layout validator** — All constraints, nesting rules
- **Widget registry** — Governance, resolution, sealing
- **View registry** — Governance, resolution, sealing

### Type Tests

- `version` field required on `ModelDef` and `ViewDef`
- `Condition` type correctness
- `LayoutNode` discriminated union

### Integration Tests

- Full form rendering with conditions
- List rendering with cell formatters
- Kanban state transitions

---

## Migration Path

### Phase 1: Stabilize Contracts (✅ Complete)

- Define `ModelDef`, `ViewDef`, `Condition`, `LayoutTree`
- Write formal spec (`SPEC.md`)
- Implement evaluators and validators
- Unit tests for all contracts

### Phase 2: Split Packages (✅ Complete)

- Create `@afenda/ui-core`, `@afenda/view-engine`, `@afenda/erp-view-pack`
- Move files to correct packages
- Consumers import packages directly (no aggregate facade)

### Phase 3: Introduce Registries (✅ Complete)

- Widget Registry with governance
- View Registry with governance
- Boot sequence (`initializeViewEngine()`)

### Phase 4: Build Renderers (✅ Complete)

- `FormView` — LayoutTree interpreter
- `ListView` — DataTable integration
- `KanbanView` — State machine visualization

### Phase 5: Devtools (✅ Complete)

- Debug overlay
- Condition logging
- Layout boundaries

### Phase 6: Migrate consumers (deferred)

- Replace hand-coded forms with `FormView`
- Replace hand-coded tables with `ListView`
- Wire a host app (e.g. Next.js) against `@afenda/ui-core` + view-engine + erp-view-pack

---

## Performance Considerations

### Tree-Shaking

Devtools are tree-shaken in production:

```typescript
if (process.env.NODE_ENV !== "production") {
  // Devtools logging
}
```

### Lazy Loading

View renderers can be lazy-loaded:

```typescript
const FormView = lazy(() => import("@afenda/view-engine/renderers/form-view"));
```

### Memoization

All evaluators are pure functions and can be memoized:

```typescript
const result = useMemo(() => evaluateCondition(condition, record), [condition, record]);
```

---

## Security

### No Dynamic Code Execution

The engine never uses `eval`, `Function()`, or dynamic imports based on metadata.

### Server-Authoritative Logic

All business logic executes server-side. Conditions are declarative checks, not executable code.

### Sealed Registries

Applications cannot inject custom widgets or views, preventing arbitrary code execution.

---

## Future Extensions

### Planned (Not Implemented)

- **Formula evaluator** — Client-side computed fields for display-only values
- **Filter DSL** — Declarative filters for list views
- **View inheritance** — Extend base views with deltas
- **Field groups** — Reusable field sets
- **Custom view kinds** — Beyond form/list/kanban

### Not Planned

- **Inline expressions** — No scripting in metadata
- **Dynamic imports** — No runtime code loading
- **Unrestricted registries** — Governance is permanent

---

## Glossary

- **ModelDef** — Business entity definition (fields, states, validation)
- **ViewDef** — UI rendering definition (kind, layout, filters)
- **FieldDef** — Single field definition (type, constraints, conditions)
- **Condition** — Declarative expression for dynamic UI (readonly, invisible, required)
- **LayoutTree** — Structured form layout (fields, groups, notebooks, separators)
- **Widget** — React component for rendering a field (render, readonly, cell)
- **View Renderer** — React component for rendering a complete view (FormView, ListView, KanbanView)
- **Registry** — Governed mapping from keys to components (sealed after boot)
- **Facade** — Re-export package for backward compatibility

---

## References

- [Metadata Contract Spec](../../packages/view-engine/src/metadata/SPEC.md)
- [Diagrams & flows](./diagram.md)
- [UI Core README](../../packages/ui-core/README.md)
- [View Engine README](../../packages/view-engine/README.md)
- [ERP View Pack README](../../packages/erp-view-pack/README.md)

---

## License

Private — AFENDA Platform
