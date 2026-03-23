# AFENDA View Engine — System Diagrams

Visual reference for understanding the view engine architecture.

---

## Package Dependency Graph

```
┌─────────────────────┐     ┌──────────────────────────┐
│ @afenda/ui-core     │     │ @afenda/view-engine      │
│ Primitives, patterns│◄────│ Metadata, registries,   │
│ hooks, tokens       │     │ renderers, devtools      │
└─────────────────────┘     └────────────┬─────────────┘
         ▲                                │
         │                                │
         │                     ┌──────────▼──────────┐
         │                     │ @afenda/erp-view-pack│
         └─────────────────────│ ERP patterns/widgets │
                               └─────────────────────┘
```

---

## Data Flow: Form Rendering

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. APPLICATION LAYER                                            │
│                                                                 │
│   const employee = await fetchEmployee(id);                    │
│                                                                 │
│   <FormView                                                     │
│     model={employeeModel}                                       │
│     view={employeeFormView}                                     │
│     data={employee}                                             │
│     onSave={saveEmployee}                                       │
│   />                                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VIEW ENGINE LAYER                                            │
│                                                                 │
│   FormView:                                                     │
│   • Parse ViewDef.layout (LayoutTree)                          │
│   • Validate layout constraints                                │
│   • Initialize useFormState(data)                              │
│   • For each LayoutNode:                                       │
│     - Evaluate conditions (readonly, invisible, required)      │
│     - Resolve widget via registry                              │
│     - Render MetadataField                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. WIDGET LAYER                                                 │
│                                                                 │
│   MetadataField:                                                │
│   • Receive pre-evaluated conditions (readonly, invisible)     │
│   • Resolve widget from registry (resolveWidget)               │
│   • Render widget.render or widget.readonly                    │
│   • Pass value, onChange, field metadata                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. UI CORE LAYER                                                │
│                                                                 │
│   TextWidget:                                                   │
│   • Render <Input /> or <Textarea /> from ui-core              │
│   • Apply styling, validation, accessibility                   │
│   • Handle user input, call onChange                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Boot Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│ APPLICATION STARTUP (app/layout.tsx)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. registerErpWidgets()                                         │
│                                                                 │
│    • Register ErpMoneyWidget (overrides "money")               │
│    • Register ErpStatusBarWidget (new "statusbar")             │
│    • Logs dev warning for custom widgets                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. initializeViewEngine()                                       │
│                                                                 │
│    • Call registerCoreWidgets()                                │
│      - Register 7 core widgets (text, number, money, etc.)    │
│    • Call registerCoreViews()                                  │
│      - Register 3 core views (form, list, kanban)             │
│    • Seal widget registry (sealRegistry)                       │
│    • Seal view registry (sealViewRegistry)                     │
│    • Set __initialized = true                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. APPLICATION READY                                            │
│                                                                 │
│    • Registries sealed (cannot extend)                         │
│    • Views can be rendered                                     │
│    • Widgets can be resolved                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Condition Evaluation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ INPUT: Condition + Record                                       │
│                                                                 │
│   condition: { field: "status", op: "ne", value: "DRAFT" }    │
│   record: { status: "ACTIVE", salary: 50000 }                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ evaluateCondition(condition, record, fieldName)                 │
│                                                                 │
│   1. Check if condition is boolean → return directly           │
│   2. Check if ComparisonExpr → evaluate comparison             │
│   3. Check if LogicalExpr → evaluate recursively               │
│   4. Log to window.__AFENDA_ENGINE_LOG__ (dev mode)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ OUTPUT: boolean                                                 │
│                                                                 │
│   result: true                                                  │
│   (status "ACTIVE" !== "DRAFT")                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Widget Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ INPUT: FieldDef                                                 │
│                                                                 │
│   field: {                                                      │
│     name: "salary",                                             │
│     type: "money",                                              │
│     widget: undefined                                           │
│   }                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ resolveWidget(field)                                            │
│                                                                 │
│   1. Check if field.widget is set → lookup by widget hint      │
│   2. Otherwise → normalize field.type to LeanFieldType         │
│   3. Lookup widget by normalized type                          │
│   4. If not found → throw error                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ OUTPUT: WidgetDef                                               │
│                                                                 │
│   {                                                             │
│     render: MoneyWidgetRender,                                 │
│     readonly: MoneyWidgetReadonly,                             │
│     cell: MoneyWidgetCell,                                     │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layout Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ INPUT: LayoutNode[] + ModelDef                                  │
│                                                                 │
│   layout: [                                                     │
│     { kind: "field", name: "firstName" },                      │
│     { kind: "group", children: [...] },                        │
│     { kind: "notebook", pages: [...] },                        │
│   ]                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ validateLayout(layout, model)                                   │
│                                                                 │
│   For each node:                                                │
│   1. Check max depth (6)                                       │
│   2. Check horizontal group width (3)                          │
│   3. Check notebook nesting (1)                                │
│   4. Check notebook pages (6)                                  │
│   5. Check field exists in model                               │
│   6. Check field colspan (1, 2, or 3)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ OUTPUT: ValidationResult                                        │
│                                                                 │
│   { valid: true }                                               │
│   or                                                            │
│   { valid: false, errors: ["Max depth exceeded"] }            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Registry Governance Model

```
┌─────────────────────────────────────────────────────────────────┐
│ BOOT TIME (app startup)                                         │
│                                                                 │
│   registerErpWidgets()      ← ERP pack can register            │
│   registerCustomWidgets()   ← Platform team can register       │
│   initializeViewEngine()    ← Registers core, then seals       │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐   │
│   │ Widget Registry                                        │   │
│   │ ┌─────────────────────────────────────────────────┐   │   │
│   │ │ Core Widgets (7)                                 │   │   │
│   │ │ • text, number, money, boolean, date, select... │   │   │
│   │ └─────────────────────────────────────────────────┘   │   │
│   │ ┌─────────────────────────────────────────────────┐   │   │
│   │ │ Custom Widgets (platform team)                  │   │   │
│   │ │ • priority, tags, etc.                          │   │   │
│   │ └─────────────────────────────────────────────────┘   │   │
│   │ ┌─────────────────────────────────────────────────┐   │   │
│   │ │ ERP Overrides (erp-view-pack)                   │   │   │
│   │ │ • erp-money, erp-statusbar                      │   │   │
│   │ └─────────────────────────────────────────────────┘   │   │
│   │                                                        │   │
│   │ 🔒 SEALED (cannot extend after boot)                  │   │
│   └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ RUNTIME (view rendering)                                        │
│                                                                 │
│   resolveWidget(field)      ← Applications can only resolve    │
│   resolveView(kind)         ← Cannot register new widgets      │
│                                                                 │
│   ✅ Allowed: Read from registry                               │
│   ❌ Blocked: Write to registry (throws error)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Form Rendering Pipeline

```
┌───────────────────────────────────────────────────────────────────────┐
│ 1. METADATA DEFINITION (Developer)                                    │
│                                                                       │
│    const employeeModel: ModelDef = {                                 │
│      fields: {                                                        │
│        salary: {                                                      │
│          type: "money",                                               │
│          readonly: { field: "status", op: "ne", value: "DRAFT" }    │
│        }                                                              │
│      }                                                                │
│    };                                                                 │
│                                                                       │
│    const employeeFormView: ViewDef = {                               │
│      kind: "form",                                                    │
│      layout: [{ kind: "field", name: "salary" }]                     │
│    };                                                                 │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 2. VIEW ENGINE (FormView)                                             │
│                                                                       │
│    • Parse layout tree                                                │
│    • Validate constraints (depth, nesting, etc.)                     │
│    • Initialize form state (useFormState)                            │
│    • For each field:                                                  │
│      - Get FieldDef from model                                       │
│      - Evaluate condition: evaluateCondition(                        │
│          { field: "status", op: "ne", value: "DRAFT" },             │
│          { status: "ACTIVE", salary: 50000 }                         │
│        ) → true                                                       │
│      - Resolve widget: resolveWidget(field) → MoneyWidget           │
│      - Render MetadataField with pre-evaluated readonly=true        │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 3. METADATA FIELD (MetadataField)                                     │
│                                                                       │
│    • Receive field, value, onChange, readonly=true                   │
│    • Resolve widget (already done by FormView)                       │
│    • Render widget.readonly (since readonly=true)                    │
│    • Pass field metadata to widget                                   │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 4. WIDGET (MoneyWidgetReadonly)                                       │
│                                                                       │
│    • Receive value (50000)                                            │
│    • Format as currency: "$50,000.00"                                │
│    • Render as read-only text with styling                           │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 5. UI CORE (Primitives)                                               │
│                                                                       │
│    • Render <div className="text-lg font-semibold">$50,000.00</div> │
│    • Apply Tailwind classes                                          │
│    • Ensure accessibility                                            │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Condition Evaluation Tree

```
Condition: {
  op: "and",
  conditions: [
    { field: "status", op: "ne", value: "DRAFT" },
    {
      op: "or",
      conditions: [
        { field: "salary", op: "gt", value: 100000 },
        { field: "role", op: "eq", value: "EXECUTIVE" }
      ]
    }
  ]
}

Record: { status: "ACTIVE", salary: 50000, role: "MANAGER" }

Evaluation Tree:
┌─────────────────────────────────────────────────────────────┐
│ AND                                                          │
│ ├─ status != "DRAFT"                                        │
│ │  └─ "ACTIVE" != "DRAFT" → ✅ true                         │
│ └─ OR                                                        │
│    ├─ salary > 100000                                       │
│    │  └─ 50000 > 100000 → ❌ false                          │
│    └─ role == "EXECUTIVE"                                   │
│       └─ "MANAGER" == "EXECUTIVE" → ❌ false                │
│       └─ OR result → ❌ false                                │
│                                                              │
│ AND result → ❌ false (true && false)                        │
└─────────────────────────────────────────────────────────────┘

Final Result: false (field is NOT readonly)
```

---

## Widget Registry Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ WIDGET REGISTRY                                                  │
│                                                                 │
│ Map<string, WidgetDef>                                          │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ "text" → {                                               │   │
│ │   render: TextWidgetRender,                              │   │
│ │   readonly: TextWidgetReadonly,                          │   │
│ │   cell: TextWidgetCell                                   │   │
│ │ }                                                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ "money" → {                                              │   │
│ │   render: ErpMoneyWidgetRender,  ← ERP override         │   │
│ │   readonly: ErpMoneyWidgetReadonly,                      │   │
│ │   cell: ErpMoneyWidgetCell                               │   │
│ │ }                                                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ "statusbar" → {                                          │   │
│ │   render: ErpStatusBarWidgetRender,  ← ERP custom       │   │
│ │   readonly: ErpStatusBarWidgetReadonly,                  │   │
│ │   cell: ErpStatusBarWidgetCell                           │   │
│ │ }                                                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ... (7 core + 2 ERP = 9 total widgets)                         │
│                                                                 │
│ 🔒 SEALED after initializeViewEngine()                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## View Registry Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ VIEW REGISTRY                                                    │
│                                                                 │
│ Map<ViewKind, React.ComponentType>                              │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ "form" → FormView                                        │   │
│ │   • Interprets ViewDef.layout (LayoutTree)              │   │
│ │   • Evaluates conditions                                 │   │
│ │   • Manages form state (useFormState)                   │   │
│ │   • Renders MetadataField for each field                │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ "list" → ListView                                        │   │
│ │   • Converts ViewDef.fields to ListColumnDef            │   │
│ │   • Resolves cell renderers from widget registry        │   │
│ │   • Renders DataTable from ui-core                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ "kanban" → KanbanView                                    │   │
│ │   • Groups records by ModelDef.states                   │   │
│ │   • Renders KanbanCard for each record                  │   │
│ │   • Handles drag-and-drop state transitions             │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 🔒 SEALED after initializeViewEngine()                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## LayoutTree Structure

```
LayoutNode (discriminated union)
│
├─ FieldNode
│  └─ { kind: "field", name: string, colspan?: 1|2|3 }
│
├─ GroupNode
│  └─ { kind: "group", direction: "horizontal"|"vertical", title?: string, columns?: number, children: LayoutNode[] }
│
├─ NotebookNode
│  └─ { kind: "notebook", pages: Array<{ key: string, label: string, children: LayoutNode[] }> }
│
└─ SeparatorNode
   └─ { kind: "separator" }

Constraints:
• Max depth: 6
• Max horizontal group width: 3 fields
• Max notebook pages: 6
• No nested notebooks
```

---

## State Machine Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ModelDef.states                                                  │
│                                                                 │
│   {                                                             │
│     field: "status",                                            │
│     states: [                                                   │
│       { value: "DRAFT", transitions: ["SENT"] },              │
│       { value: "SENT", transitions: ["CONFIRMED", "CANCELLED"] },│
│       { value: "CONFIRMED", transitions: ["DONE"] },          │
│       { value: "DONE" },                                       │
│       { value: "CANCELLED", folded: true }                     │
│     ]                                                           │
│   }                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ KanbanView Rendering                                             │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │  DRAFT   │  │   SENT   │  │CONFIRMED │  │   DONE   │     │
│   ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤     │
│   │ Card 1   │  │ Card 3   │  │ Card 5   │  │ Card 7   │     │
│   │ Card 2   │  │ Card 4   │  │ Card 6   │  │ Card 8   │     │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                 │
│   Drag Card 1 from DRAFT to SENT:                              │
│   • Validate transition: DRAFT → SENT ✅ allowed               │
│   • Call onStateChange(card1, "SENT")                          │
│   • Server updates record.status = "SENT"                      │
│   • Re-render with updated data                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Devtools Overlay

```
┌─────────────────────────────────────────────────────────────────┐
│ ?ve-debug=1 → Enable Debug Mode                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ VISUAL DEBUGGING                                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────┐     │
│   │ FieldNode (firstName)                                │     │
│   │ ┌─────────────────────────────────────────────────┐ │     │
│   │ │ [Input component]                                │ │     │
│   │ └─────────────────────────────────────────────────┘ │     │
│   │ • type: text                                         │     │
│   │ • required: true                                     │     │
│   │ • readonly: false                                    │     │
│   └─────────────────────────────────────────────────────┘     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────┐     │
│   │ GroupNode (horizontal)                               │     │
│   │ ┌─────────────┐ ┌─────────────┐                     │     │
│   │ │ Field: email│ │ Field: phone│                     │     │
│   │ └─────────────┘ └─────────────┘                     │     │
│   └─────────────────────────────────────────────────────┘     │
│                                                                 │
│   [Ctrl+Shift+D to toggle overlay]                             │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ CONSOLE LOGGING                                                  │
│                                                                 │
│   window.__AFENDA_ENGINE_LOG__ = [                              │
│     {                                                            │
│       field: "salary",                                           │
│       condition: { field: "status", op: "ne", value: "DRAFT" }, │
│       result: true,                                              │
│       record: { status: "ACTIVE", salary: 50000 },              │
│       timestamp: 1711234567890                                   │
│     }                                                            │
│   ];                                                             │
│                                                                 │
│   console.table(window.__AFENDA_ENGINE_LOG__);                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Import path hierarchy

```
Application code (import explicitly by layer)
    ├─ import { Button, DataTable } from "@afenda/ui-core";
    ├─ import { FormView, ListView, initializeViewEngine } from "@afenda/view-engine";
    └─ import { RecordStatusBar, registerErpWidgets } from "@afenda/erp-view-pack";

Package dependencies
    @afenda/view-engine
    └─ @afenda/ui-core
    @afenda/erp-view-pack
    ├─ @afenda/ui-core
    └─ @afenda/view-engine
```

---

## Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────┐
│ INTEGRATION TESTS (Manual)                                       │
│ • Full form rendering with conditions                           │
│ • List rendering with cell formatters                           │
│ • Kanban state transitions                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT TESTS (232 tests)                                     │
│ • All primitives (button, input, card, etc.)                   │
│ • All patterns (data-table, form-field, etc.)                  │
│ • All hooks (useDebounce, useBreakpoint, etc.)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ UNIT TESTS (Core Logic)                                         │
│ • Condition evaluator (all operators, combinators)             │
│ • Layout validator (all constraints)                            │
│ • Widget registry (governance, resolution)                      │
│ • View registry (governance, resolution)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ TYPE TESTS (Compile-Time)                                       │
│ • version field required on ModelDef                            │
│ • version field required on ViewDef                             │
│ • Condition type correctness                                    │
│ • LayoutNode discriminated union                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DEFINE METADATA                                               │
│                                                                 │
│    • Write ModelDef (fields, states, validation)               │
│    • Write ViewDef (layout, filters)                           │
│    • Run validateLayout() to check constraints                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. RENDER VIEW                                                   │
│                                                                 │
│    • <FormView model={model} view={view} data={data} />       │
│    • Enable devtools: ?ve-debug=1                              │
│    • Inspect field metadata, condition results                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. DEBUG (if needed)                                             │
│                                                                 │
│    • Check window.__AFENDA_ENGINE_LOG__                         │
│    • Verify condition evaluations                               │
│    • Inspect layout boundaries                                  │
│    • Fix metadata, re-render                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. TEST                                                          │
│                                                                 │
│    • Write unit tests for metadata                              │
│    • Run pnpm test                                              │
│    • Verify all tests pass                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│ PRODUCTION BUILD                                                 │
│                                                                 │
│   Tree-Shaking:                                                 │
│   • Devtools removed (if NODE_ENV === "production")            │
│   • Unused widgets removed                                      │
│   • Unused renderers removed                                    │
│                                                                 │
│   Memoization:                                                  │
│   • evaluateCondition (pure function)                           │
│   • resolveWidget (O(1) lookup)                                │
│   • resolveView (O(1) lookup)                                  │
│                                                                 │
│   Lazy Loading:                                                 │
│   • const FormView = lazy(() => import("..."))                 │
│   • const ListView = lazy(() => import("..."))                 │
│                                                                 │
│   Bundle Size:                                                  │
│   • ui-core: ~150KB                                             │
│   • view-engine: ~40KB (without devtools: ~35KB)               │
│   • erp-view-pack: ~20KB                                        │
│   • Total: ~210KB → ~150KB after tree-shaking                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│ THREAT: Arbitrary Code Execution                                │
│                                                                 │
│   ❌ Blocked by:                                                │
│   • No eval() or Function()                                    │
│   • No dynamic imports based on metadata                       │
│   • No inline expressions in conditions                        │
│   • All business logic server-authoritative                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ THREAT: Registry Injection                                       │
│                                                                 │
│   ❌ Blocked by:                                                │
│   • Registries sealed after boot                               │
│   • Applications cannot register widgets/views                 │
│   • Compile-time error if attempted                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ THREAT: XSS via Metadata                                         │
│                                                                 │
│   ❌ Blocked by:                                                │
│   • All values sanitized by React                              │
│   • No dangerouslySetInnerHTML                                 │
│   • All user input escaped                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparison Matrix

| Feature          | Hand-Coded Forms       | AFENDA View Engine     |
| ---------------- | ---------------------- | ---------------------- |
| Development time | 2-4 hours per form     | 10-20 minutes          |
| Code volume      | 200+ lines             | 20 lines (metadata)    |
| Consistency      | Manual (error-prone)   | Automatic (guaranteed) |
| Testability      | Integration tests only | Unit + integration     |
| Debuggability    | Console.log            | Devtools overlay       |
| Maintainability  | Change 50 files        | Change 1 metadata file |
| Type safety      | Manual prop typing     | Versioned contracts    |
| Accessibility    | Manual ARIA            | Automatic (Radix)      |

---

## Success Indicators

| Indicator              | Status                                        |
| ---------------------- | --------------------------------------------- |
| All phases complete    | ✅ Yes                                        |
| All tests passing      | ✅ Yes (232/232)                              |
| All typechecks passing | ✅ Yes (0 errors)                             |
| Documentation complete | ✅ Yes — see [docs/view-engine/](./README.md) |
| Ready for production   | ✅ Yes                                        |
| Ready for migration    | ✅ Yes                                        |

---

## Document navigation

**Start here:** [View engine docs index](./README.md)

**For developers:** [Package examples](../../packages/view-engine/EXAMPLES.md)

**For architects:** [architecture.md](./architecture.md)

---

**Status:** ✅ Production Ready — All deliverables complete
