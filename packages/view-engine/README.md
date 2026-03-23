# @afenda/view-engine

**AFENDA View Engine** — Metadata interpreter, widget registry, and view renderers.

The View Engine is a **deterministic business interface engine** that projects business truth through metadata. It interprets `ModelDef` and `ViewDef` contracts and renders complete, interactive UIs without hand-coding forms or tables.

**Canonical docs (architecture, diagrams):** [docs/view-engine/README.md](../../docs/view-engine/README.md)

---

## Architecture

```
@afenda/view-engine
 ├─ metadata/          — Type contracts (ModelDef, ViewDef, Condition, LayoutTree)
 ├─ registry/          — Widget Registry, View Registry, boot sequence
 ├─ widgets/           — 7 core widgets (text, number, money, boolean, date, select, relation)
 ├─ renderers/         — FormView, ListView, KanbanView
 ├─ hooks/             — useFormState
 ├─ components/        — MetadataField
 └─ devtools/          — Debug overlay (tree-shaken in production)
```

---

## Quick Start

### 1. Initialize the Engine

Call once at application startup:

```typescript
import { initializeViewEngine } from "@afenda/view-engine";

initializeViewEngine();
```

For ERP applications, register ERP widgets first:

```typescript
import { registerErpWidgets } from "@afenda/erp-view-pack";
import { initializeViewEngine } from "@afenda/view-engine";

registerErpWidgets();
initializeViewEngine();
```

### 2. Define a Model

```typescript
import type { ModelDef } from "@afenda/view-engine";

const employeeModel: ModelDef = {
  version: 1,
  name: "hr.employee",
  label: "Employee",
  fields: {
    employeeCode: {
      name: "employeeCode",
      label: "Code",
      type: "text",
      required: true,
      maxLength: 20,
    },
    firstName: {
      name: "firstName",
      label: "First Name",
      type: "text",
      required: true,
    },
    salary: {
      name: "salary",
      label: "Salary",
      type: "money",
      readonly: { field: "status", op: "ne", value: "DRAFT" },
    },
    status: {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "ACTIVE", label: "Active" },
        { value: "ARCHIVED", label: "Archived" },
      ],
    },
  },
  states: {
    field: "status",
    states: [
      { value: "DRAFT", label: "Draft", transitions: ["ACTIVE"] },
      { value: "ACTIVE", label: "Active", transitions: ["ARCHIVED"] },
      { value: "ARCHIVED", label: "Archived" },
    ],
  },
};
```

### 3. Define Views

**Form View:**

```typescript
import type { ViewDef } from "@afenda/view-engine";

const employeeFormView: ViewDef = {
  version: 1,
  id: "hr.employee.form",
  name: "Employee Form",
  kind: "form",
  model: "hr.employee",
  layout: [
    {
      kind: "group",
      direction: "horizontal",
      title: "Basic Information",
      columns: 2,
      children: [
        { kind: "field", name: "employeeCode" },
        { kind: "field", name: "firstName" },
      ],
    },
    { kind: "separator" },
    {
      kind: "notebook",
      pages: [
        {
          key: "details",
          label: "Details",
          children: [
            { kind: "field", name: "salary" },
            { kind: "field", name: "status" },
          ],
        },
      ],
    },
  ],
};
```

**List View:**

```typescript
const employeeListView: ViewDef = {
  version: 1,
  id: "hr.employee.list",
  name: "Employee List",
  kind: "list",
  model: "hr.employee",
  fields: ["employeeCode", "firstName", "salary", "status"],
};
```

**Kanban View:**

```typescript
const employeeKanbanView: ViewDef = {
  version: 1,
  id: "hr.employee.kanban",
  name: "Employee Kanban",
  kind: "kanban",
  model: "hr.employee",
  fields: ["employeeCode", "firstName", "salary"],
};
```

### 4. Render Views

```typescript
import { FormView, ListView, KanbanView } from "@afenda/view-engine";

// Form
<FormView
  model={employeeModel}
  view={employeeFormView}
  data={employeeRecord}
  conditionContext={{ uid: currentUserId, company_id: currentCompanyId }}
  onSearch={async (fieldName, query) => searchRelation(fieldName, query)}
  onSave={async (values) => {
    await saveEmployee(values);
  }}
/>

// List
<ListView
  model={employeeModel}
  view={employeeListView}
  data={employees}
  onAction={async (action, records) => {
    if (action === "delete") {
      await deleteEmployees(records);
    }
  }}
/>

// Kanban
<KanbanView
  model={employeeModel}
  view={employeeKanbanView}
  data={employees}
  onStateChange={async (record, newState) => {
    await updateEmployeeStatus(record, newState);
  }}
/>
```

---

## Condition DSL

Control field visibility, readonly state, and required flags with conditions:

```typescript
// Simple comparison
readonly: { field: "status", op: "eq", value: "ARCHIVED" }

// Logical AND
invisible: {
  op: "and",
  conditions: [
    { field: "status", op: "ne", value: "DRAFT" },
    { field: "salary", op: "gt", value: 100000 },
  ]
}

// Logical OR
required: {
  op: "or",
  conditions: [
    { field: "role", op: "eq", value: "ADMIN" },
    { field: "role", op: "eq", value: "MANAGER" },
  ]
}

// Negation
invisible: { op: "not", condition: { field: "isAdmin", op: "eq", value: true } }
```

**Supported operators:** `eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `in`, `not_in`, plus combinators `and`, `or`, and `not`.

### Evaluation context (`ConditionContext`)

`evaluateCondition` accepts an optional fourth argument: values such as `uid`, `company_id`, and `today` are merged with the record; **record keys override** context on conflicts. In `FormView`, pass the same object as `conditionContext` so field and notebook conditions can reference the current user or company:

```typescript
<FormView
  model={model}
  view={view}
  data={record}
  conditionContext={{ uid: 1, company_id: 42, today: "2026-03-23" }}
/>
```

### Relation fields and `onSearch`

Many2one-style fields can use static `field.options` or async lookup. Provide `onSearch` on `FormView` (or on `ViewRendererProps` when using `resolveView`): the engine calls `(fieldName, query) => Promise<{ value, label }[]>` with a 300ms debounce inside the relation widget.

---

## Layout Constraints

LayoutTree definitions are validated at parse time:

| Constraint             | Limit                   |
| ---------------------- | ----------------------- |
| Group nesting depth    | 4                       |
| Notebook nesting       | 1 (no nested notebooks) |
| Total tree depth       | 6                       |
| Horizontal group width | 3 fields                |
| Notebook pages         | 6                       |
| Field colspan          | 1, 2, or 3              |

Invalid layouts are rejected with structured errors.

---

## Widget Registry

### Core Widgets

7 default widgets are registered at boot:

- `text` — Input or Textarea
- `number` — Numeric input
- `money` — Currency input with symbol
- `boolean` — Checkbox or Switch
- `date` — Date picker
- `select` — Dropdown or Radio group
- `relation` — Basic text input (override in ERP pack)

### Custom Widgets

Platform team can register custom widgets:

```typescript
import { registerCustomWidget } from "@afenda/view-engine";

registerCustomWidget("priority", {
  render: PriorityWidgetRender,
  readonly: PriorityWidgetReadonly,
  cell: PriorityWidgetCell,
});
```

**Note:** Custom widgets log a dev-mode warning. Apps cannot register widgets.

---

## Devtools

Enable debug mode via URL param or environment:

```
?ve-debug=1
```

Features:

- **Field inspector** — Focus a field to see FieldDef and condition results (`window.__AFENDA_FIELD_INSPECT__`)
- **Layout boundaries** — Dotted borders around LayoutNodes
- **Condition log** — Subscribes via `useSyncExternalStore`; mirrored on `window.__AFENDA_ENGINE_LOG__`
- **State machine** — SVG transition graph from the active `<FormView />` automatically, or override with `previewModel` / `previewValues` on `<ViewEngineDevtools />`
- **Computed fields** — Field inspector shows server `compute` key and `deps` above the raw JSON
- **Console dump** — `console.table(window.__AFENDA_ENGINE_LOG__)`

Keyboard shortcut: `Ctrl+Shift+D`

With only `<FormView />` on screen, open the State Machine tab and the graph uses that form’s model and live values (`window.__AFENDA_FORM_PREVIEW__` mirrors the snapshot for the console).

Optional overrides:

```tsx
<ViewEngineDevtools
  enabled={process.env.NODE_ENV !== "production"}
  previewModel={employeeModel}
  previewValues={currentRecord}
/>
```

---

## Design Principles

### Declarative, Not Expressive

Metadata is a **data structure**, not a programming language. All business logic executes server-side.

### Thin Engine Boundary

The View Engine may:

- ✅ Interpret metadata
- ✅ Compose UI components
- ✅ Manage local form state

It may NOT:

- ❌ Fetch data
- ❌ Manage caching
- ❌ Handle routing
- ❌ Contain business logic

### Registry Governance

Registries are sealed after boot. Extension points are controlled:

- **Widget Registry** — platform UI team only
- **View Registry** — platform architecture team only
- **ERP Extensions** — `@afenda/erp-view-pack` only
- **Applications** — consume only, cannot register

---

## API Reference

### Core Functions

- `initializeViewEngine()` — Boot the engine (call once)
- `registerWidget(key, def)` — Register core widget
- `registerCustomWidget(key, def)` — Register custom widget (logs warning)
- `registerView(kind, component)` — Register view renderer
- `resolveWidget(field)` — Resolve widget for field
- `resolveView(kind)` — Resolve renderer for view kind
- `evaluateCondition(condition, record)` — Evaluate condition DSL
- `validateLayout(nodes, model)` — Validate layout tree

### Components

- `<FormView />` — Form renderer
- `<ListView />` — List renderer
- `<KanbanView />` — Kanban renderer
- `<MetadataField />` — Single field renderer
- `<ViewEngineDevtools />` — Debug overlay

### Hooks

- `useFormState(options)` — Form state manager

---

## Testing

```bash
pnpm --filter @afenda/view-engine test
```

Tests cover:

- Condition evaluator (all operators, combinators, edge cases)
- Layout validator (all constraints)
- Widget registry (governance, resolution)
- Type system (version fields required)

---

## License

Private — AFENDA Platform
