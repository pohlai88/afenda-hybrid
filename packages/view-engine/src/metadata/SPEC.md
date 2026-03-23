# AFENDA Metadata Contract Specification

**Version:** 1.0.0  
**Status:** Canonical  
**Last Updated:** March 24, 2026

---

## Purpose

This specification defines the **Business Interface Constitution** for AFENDA — the formal contract between business truth (expressed as metadata) and user interface (rendered by the view engine).

The metadata system ensures:

1. **Business truth description** — metadata describes what exists, not how it looks
2. **Determinism** — same metadata always renders identical UI
3. **Finitude** — bounded configuration space prevents chaos
4. **Interpretability** — engine executes, applications do not improvise
5. **Server authority** — UI reflects system truth, never invents it

---

## Design Principles

### Declarative, Not Expressive

Metadata is a **data structure**, not a programming language. All business logic executes server-side. The client evaluates pre-defined operators against record values — it does not interpret arbitrary expressions.

### Thin Engine Boundary

The View Engine is a **projection layer**. It may:

- ✅ Interpret metadata
- ✅ Compose UI components
- ✅ Manage local form state

It may NOT:

- ❌ Fetch data
- ❌ Manage caching
- ❌ Handle routing
- ❌ Contain business logic

Data flows in via props; mutations flow out via callbacks. The application layer owns I/O.

### Registry Governance

Registries are **sealed by default**. Extension points are controlled:

- **Widget Registry** — platform UI team only
- **View Registry** — platform architecture team only
- **ERP Extensions** — `@afenda/erp-view-pack` only
- **Applications** — consume only, cannot register

---

## 1. Metadata Layers

```
ModelDef
 ├─ version: 1
 ├─ name: string
 ├─ label: string
 ├─ fields: Record<string, FieldDef>
 ├─ states?: StateMachineDef
 └─ defaultOrder?: [string, "asc" | "desc"][]

ViewDef
 ├─ version: 1
 ├─ id: string
 ├─ kind: "list" | "form" | "kanban"
 ├─ model: string
 ├─ fields?: string[]           (list/kanban)
 ├─ layout?: LayoutNode[]       (form)
 ├─ filters?: FilterExpr[]
 └─ defaultOrder?: [string, "asc" | "desc"][]
```

---

## 2. ModelDef Contract

### Structure

```typescript
interface ModelDef {
  version: 1;
  name: string;
  label: string;
  fields: Record<string, FieldDef>;
  states?: StateMachineDef;
  defaultOrder?: [string, "asc" | "desc"][];
}
```

### Rules

- **`name` is immutable** — once deployed, the model name cannot change
- **Field keys are immutable** — renames require alias mapping
- **Must be JSON-serializable** — no functions, no circular references
- **No executable code** — all logic references server-side compute keys

### Example

```typescript
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

---

## 3. Condition DSL

### Purpose

Conditions control field visibility, readonly state, and required flags. They must be:

- **Deterministic** — same condition + same record = same result
- **Side-effect free** — no mutations, no I/O
- **Locally evaluable** — operates on the current record only
- **Simple to debug** — structured, not opaque

### Grammar

```typescript
type ComparisonOp = "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in";

type ComparisonExpr = {
  field: string;
  op: ComparisonOp;
  value: unknown;
};

type LogicalExpr = {
  op: "and" | "or";
  conditions: Condition[];
};

type Condition = boolean | ComparisonExpr | LogicalExpr;
```

### Operators

| Operator | Semantics           | Example                                                       |
| -------- | ------------------- | ------------------------------------------------------------- |
| `eq`     | Equality            | `{ field: "status", op: "eq", value: "ACTIVE" }`              |
| `ne`     | Inequality          | `{ field: "status", op: "ne", value: "DRAFT" }`               |
| `gt`     | Greater than        | `{ field: "salary", op: "gt", value: 50000 }`                 |
| `lt`     | Less than           | `{ field: "age", op: "lt", value: 65 }`                       |
| `gte`    | Greater or equal    | `{ field: "years", op: "gte", value: 5 }`                     |
| `lte`    | Less or equal       | `{ field: "hours", op: "lte", value: 40 }`                    |
| `in`     | Member of array     | `{ field: "status", op: "in", value: ["ACTIVE", "PENDING"] }` |
| `not_in` | Not member of array | `{ field: "status", op: "not_in", value: ["ARCHIVED"] }`      |

### Logical Combinators

```typescript
// AND — all conditions must be true
{
  op: "and",
  conditions: [
    { field: "status", op: "eq", value: "ACTIVE" },
    { field: "salary", op: "gt", value: 50000 }
  ]
}

// OR — any condition must be true
{
  op: "or",
  conditions: [
    { field: "role", op: "eq", value: "ADMIN" },
    { field: "role", op: "eq", value: "MANAGER" }
  ]
}
```

### Evaluation Rules

1. **Undefined field** → `FALSE`
2. **Type mismatch** → `FALSE`
3. **Empty conditions array** → `TRUE`
4. **Null/empty checks** → use `{ field: "x", op: "eq", value: null }`
5. **No side effects** — evaluation is pure
6. **No cross-record dependencies** — conditions operate on a single record

### Forbidden

- ❌ Arbitrary JavaScript expressions
- ❌ String-based `eval()`
- ❌ Cross-record dependencies (joins, aggregates)
- ❌ Async conditions
- ❌ Function calls
- ❌ Special `is_set`/`is_empty` operators (use `eq`/`ne` with `null`)

### Implementation Contract

```typescript
function evaluateCondition(condition: Condition, record: Record<string, unknown>): boolean;
```

**Guarantees:**

- Pure function (no side effects)
- Deterministic (same inputs → same output)
- Synchronous
- No exceptions (returns `false` on error)

---

## 4. LayoutTree

### Purpose

LayoutTree defines the spatial structure of form views. It must guarantee **visual predictability** and prevent unusable enterprise screens.

### Node Types

```typescript
type LayoutNode = FieldNode | GroupNode | NotebookNode | SeparatorNode;

interface FieldNode {
  kind: "field";
  name: string;
  colspan?: 1 | 2 | 3;
}

interface GroupNode {
  kind: "group";
  direction: "vertical" | "horizontal";
  title?: string;
  columns?: 1 | 2 | 3;
  children: LayoutNode[];
}

interface NotebookNode {
  kind: "notebook";
  pages: Array<{
    key: string;
    label: string;
    children: LayoutNode[];
  }>;
}

interface SeparatorNode {
  kind: "separator";
  label?: string;
}
```

### Structural Constraints

| Constraint             | Limit          | Rationale                                 |
| ---------------------- | -------------- | ----------------------------------------- |
| Group nesting depth    | 4              | Prevents deeply nested, confusing layouts |
| Notebook nesting       | 1              | No notebooks inside notebooks             |
| Total tree depth       | 6              | Keeps layouts flat and scannable          |
| Horizontal group width | 3 fields       | Prevents horizontal scrolling             |
| Notebook pages         | 6              | Keeps tab bars manageable                 |
| Page minimum content   | 1 field        | Empty pages are invalid                   |
| Separator position     | Not first/last | Separators must divide content            |
| Field colspan          | 1, 2, or 3     | Prevents layout chaos                     |

### Field Constraints

- **Field must exist** — `FieldNode.name` must be a key in `ModelDef.fields`
- **Colspan only in horizontal groups** — vertical groups ignore colspan
- **Hidden fields occupy layout slots** — invisible fields still take space (for consistent layout)

### Anti-Patterns (Forbidden)

- ❌ Deep nesting of groups (>4 levels)
- ❌ Horizontal scrolling forms
- ❌ Dynamic layout mutations (runtime injection/removal of nodes)
- ❌ Conditionally injected layout nodes
- ❌ Recursive notebooks

### Validation

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateLayout(nodes: LayoutNode[], model: ModelDef): ValidationResult;
```

**Validation errors include:**

- Unknown field name
- Excessive nesting depth
- Empty notebook page
- Separator at invalid position
- Invalid colspan value
- Nested notebook

---

## 5. State Machine Semantics

### Purpose

State machines represent **business lifecycle truth**. They define:

- Valid states a record can occupy
- Legal transitions between states
- UI behavior per state

### Structure

```typescript
interface StateMachineDef {
  field: string;
  states: StateNode[];
}

interface StateNode {
  value: string;
  label: string;
  folded?: boolean;
  transitions?: string[];
}
```

### Rules

1. **State field must be `select` type** — the field referenced by `StateMachineDef.field` must exist in `ModelDef.fields` and have `type: "select"`
2. **Exactly one active state** — a record occupies one state at a time
3. **Explicit transitions only** — if `transitions` is defined, only those target states are allowed
4. **Self-transition forbidden** — `transitions` cannot include the current state value
5. **Undefined transitions = terminal state** — if `transitions` is omitted or empty, the state is terminal (no further transitions)

### Transition Semantics

| Scenario                   | Behavior                                 |
| -------------------------- | ---------------------------------------- |
| `transitions: ["ACTIVE"]`  | Can transition to ACTIVE only            |
| `transitions: []`          | Terminal state, no transitions allowed   |
| `transitions: undefined`   | Terminal state, no transitions allowed   |
| Target not in states array | Invalid metadata, rejected at validation |

### UI Behavior Mapping

| State Property       | UI Effect                              |
| -------------------- | -------------------------------------- |
| `folded: true`       | Collapsed column in Kanban view        |
| No transitions       | Record is read-only, no action buttons |
| Multiple transitions | Show action menu or dropdown           |

### Engine Responsibilities

The engine may:

- ✅ Block illegal transitions (not in `transitions` array)
- ✅ Show state visually (pills, arrows, Kanban columns)
- ✅ Animate valid transitions

The engine may NOT:

- ❌ Decide business rules (which transitions are valid)
- ❌ Auto-transition states (requires user action)
- ❌ Override server truth (server is authoritative)

### Example

```typescript
const requisitionStates: StateMachineDef = {
  field: "status",
  states: [
    { value: "DRAFT", label: "Draft", transitions: ["SUBMITTED"] },
    { value: "SUBMITTED", label: "Submitted", transitions: ["APPROVED", "REJECTED"] },
    { value: "APPROVED", label: "Approved", folded: true },
    { value: "REJECTED", label: "Rejected", folded: true },
  ],
};
```

---

## 6. Registry Governance

### Registry Types

| Registry           | Purpose                             | Owner                      |
| ------------------ | ----------------------------------- | -------------------------- |
| Widget Registry    | Field renderers (form + list cells) | Platform UI Team           |
| View Registry      | View renderers (list, form, kanban) | Platform Architecture Team |
| Formatter Registry | Value display logic                 | Platform UI Team           |

### Ownership Rules

| Actor                   | Widget Registry           | View Registry          | ERP Extensions    |
| ----------------------- | ------------------------- | ---------------------- | ----------------- |
| Platform UI Team        | ✅ Register core widgets  | ❌                     | ❌                |
| Platform Architecture   | ❌                        | ✅ Register core views | ❌                |
| `@afenda/erp-view-pack` | ✅ Register ERP overrides | ❌                     | ✅ Create presets |
| Applications            | ❌                        | ❌                     | ❌                |

### Extension Policy

**Allowed:**

- ✅ ERP package overrides (via `registerErpWidgets()`)
- ✅ Versioned registry upgrades
- ✅ Controlled experimental flags

**Forbidden:**

- ❌ App-level widget injection
- ❌ Runtime registry mutation after seal
- ❌ Duplicate widget keys
- ❌ Conditional registration

### Conflict Resolution

When multiple registrations occur for the same key:

1. **ERP override** (from `@afenda/erp-view-pack`)
2. **Platform default** (from `@afenda/view-engine`)
3. **Error** if ambiguous

### Registry Sealing

Registries are sealed after boot-time initialization:

```typescript
// Boot sequence
registerCoreWidgets(); // platform defaults
registerErpWidgets(); // ERP overrides
sealRegistry(); // prevent further registration

// After seal, this throws:
registerWidget("custom", def); // ❌ Error: Registry is sealed
```

Custom widgets require explicit opt-in:

```typescript
registerCustomWidget("custom", def); // ⚠️ Logs dev-mode warning
```

---

## 7. Field Types

### Unified Type System

AFENDA supports two field type vocabularies for backward compatibility:

**Odoo-style (verbose):**

```typescript
type FieldType =
  | "char"
  | "text"
  | "integer"
  | "float"
  | "monetary"
  | "boolean"
  | "date"
  | "datetime"
  | "selection"
  | "many2one"
  | "one2many"
  | "many2many"
  | "binary"
  | "html"
  | "reference";
```

**Lean (business-oriented):**

```typescript
type LeanFieldType = "text" | "number" | "money" | "boolean" | "date" | "select" | "relation";
```

### Type Mapping

| Odoo-style                          | Lean       | Notes                                         |
| ----------------------------------- | ---------- | --------------------------------------------- |
| `char`                              | `text`     | Short text                                    |
| `text`                              | `text`     | Long text (widget hint differentiates)        |
| `integer`                           | `number`   | Integer                                       |
| `float`                             | `number`   | Decimal (digits differentiate)                |
| `monetary`                          | `money`    | Currency value                                |
| `boolean`                           | `boolean`  | True/false                                    |
| `date`                              | `date`     | Date only                                     |
| `datetime`                          | `date`     | Date + time (widget hint differentiates)      |
| `selection`                         | `select`   | Dropdown/radio                                |
| `many2one`, `one2many`, `many2many` | `relation` | Relational field (cardinality via extra prop) |

### Unified Type

```typescript
type UnifiedFieldType = FieldType | LeanFieldType;
```

All metadata consumers (ListColumnDef, widget registry, formatters) must accept `UnifiedFieldType`.

---

## 8. Formula System

### Purpose

Formulas represent **computed fields** — values derived from other fields. The client does NOT execute arithmetic; it references named server-side compute keys.

### Structure

```typescript
interface Formula {
  deps: string[]; // field names this formula depends on
  compute: string; // server-side compute key
}
```

### Example

```typescript
const salaryBandField: FieldDef = {
  name: "salaryBand",
  label: "Salary Band",
  type: "text",
  readonly: true,
  compute: {
    deps: ["salary", "jobLevel"],
    compute: "compute_salary_band", // server endpoint, not inline logic
  },
};
```

### Client Behavior

- The client sends `{ compute: "compute_salary_band", deps: { salary: 75000, jobLevel: "L5" } }` to the server
- The server returns `{ value: "Senior" }`
- The client displays "Senior" in the field

### Forbidden

- ❌ Inline arithmetic (`"salary * 1.2"`)
- ❌ JavaScript eval
- ❌ Client-side compute logic

---

## 9. Filter Expressions

### Purpose

Filters define search/query constraints. They use the same operator grammar as Conditions.

### Structure

```typescript
type FilterExpr = ComparisonExpr | LogicalExpr;
```

### Example

```typescript
const activeEmployeesFilter: FilterExpr = {
  op: "and",
  conditions: [
    { field: "status", op: "eq", value: "ACTIVE" },
    { field: "hireDate", op: "gte", value: "2020-01-01" },
  ],
};
```

---

## 10. Widget Hints

### Purpose

Widget hints override the default control for a given field type.

### Sealed Type

```typescript
type WidgetHint =
  | "default"
  | "email"
  | "url"
  | "phone"
  | "password"
  | "color"
  | "radio"
  | "tags"
  | "priority"
  | "statusbar"
  | "image"
  | "progressbar";
```

**Note:** The open `(string & {})` escape hatch is removed. Custom widget keys are registered through the governed registry API, not through the type union.

### Examples

```typescript
// Email input instead of plain text
{ name: "email", type: "text", widget: "email" }

// Radio group instead of dropdown
{ name: "priority", type: "select", widget: "radio", options: [...] }

// Status bar instead of dropdown
{ name: "status", type: "select", widget: "statusbar", options: [...] }
```

---

## 11. Metadata Versioning

### Purpose

Versioning allows the engine to evolve metadata contracts without breaking existing definitions.

### Version Field

All top-level metadata interfaces carry a `version` field:

```typescript
interface ModelDef {
  version: 1;
  // ...
}

interface ViewDef {
  version: 1;
  // ...
}
```

### Dispatch Strategy

The engine dispatches on version:

```typescript
function renderView(view: ViewDef, model: ModelDef, data: unknown) {
  if (view.version === 1) {
    return renderViewV1(view, model, data);
  }
  // Future: version 2, 3, etc.
  throw new Error(`Unsupported view version: ${view.version}`);
}
```

### Migration Path

When introducing breaking changes:

1. Increment version (e.g., `version: 2`)
2. Add new renderer for v2
3. Keep v1 renderer for backward compatibility
4. Deprecate v1 after migration period

---

## 12. Testing Matrix

### Contract Tests (Phase 0b)

| Component               | Test Cases                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Condition Evaluator** | Every operator, `and`/`or` combinators, null values, missing fields, type mismatches, nested logic  |
| **Layout Validator**    | Every constraint violation (depth, width, nesting, unknown fields, empty pages, invalid separators) |
| **Type System**         | `ModelDef.version` and `ViewDef.version` are required (type-level tests)                            |

### Unit Tests (Per Widget)

Each registered widget must have tests for:

- ✅ Render with valid value
- ✅ Render with null/undefined
- ✅ `onChange` callback fires
- ✅ Readonly mode displays correctly
- ✅ Disabled state works
- ✅ Error state displays

### Registry Governance Tests

- ✅ `sealRegistry()` prevents late registration
- ✅ `registerCustomWidget()` logs warning in dev mode
- ✅ Duplicate keys throw error
- ✅ Post-seal registration throws

### Integration Tests (Renderers)

Given `ModelDef` + `ViewDef` + mock data:

- ✅ Rendered output matches layout structure
- ✅ Conditions resolve correctly
- ✅ Fields appear in correct order
- ✅ Hidden fields are not rendered
- ✅ Readonly fields are non-editable

### Determinism Tests

Same metadata must produce:

- ✅ Identical DOM structure
- ✅ Identical widget tree
- ✅ Identical field ordering
- ✅ Identical layout hierarchy

Test across all view types (form, list, kanban).

### Layout Constraint Tests

Invalid layout trees must be rejected:

- ✅ Excessive depth → structured error
- ✅ Unknown field → structured error
- ✅ Empty notebook page → structured error
- ✅ Nested notebook → structured error
- ✅ Invalid separator position → structured error

---

## 13. View Kinds

### Canonical Views

AFENDA supports exactly **3 view types**:

```typescript
type ViewKind = "list" | "form" | "kanban";
```

### View Semantics

| View Kind | Purpose                        | When to Use           |
| --------- | ------------------------------ | --------------------- |
| `list`    | Browse and bulk operations     | Scanning many records |
| `form`    | Inspect and edit single record | Detailed record view  |
| `kanban`  | State-machine workflows        | Process tracking      |

### Removed View Types

The following Odoo-style view types are **not supported**:

- ❌ `"search"` — search is a feature of list view, not a separate view
- ❌ `"calendar"` — analytics feature, deferred
- ❌ `"graph"` — analytics feature, deferred
- ❌ `"pivot"` — analytics feature, deferred

---

## 14. Performance Constraints

### Metadata Size Limits

| Metadata Type      | Limit | Rationale                         |
| ------------------ | ----- | --------------------------------- |
| Fields per model   | 200   | Prevents unwieldy forms           |
| Options per select | 100   | Use relation field for large sets |
| Layout depth       | 6     | Keeps rendering fast              |
| Notebook pages     | 6     | Prevents tab bar overflow         |

### Rendering Constraints

- **Condition evaluation** — O(n) where n = number of fields
- **Layout validation** — O(n) where n = number of nodes
- **Widget resolution** — O(1) via Map lookup

---

## 15. Error Handling

### Validation Errors

Metadata validation errors are **structural** — they indicate malformed metadata, not business rule violations.

```typescript
interface MetadataError {
  code: string;
  message: string;
  path?: string; // e.g., "layout[0].children[2]"
}
```

### Error Categories

| Category          | Example                       | Handling                         |
| ----------------- | ----------------------------- | -------------------------------- |
| **Structural**    | Unknown field in layout       | Throw during validation          |
| **Type mismatch** | String value for number field | Return `false` in condition eval |
| **Missing data**  | Field not in record           | Return `false` in condition eval |
| **Registry**      | Duplicate widget key          | Throw during registration        |

### Error Boundaries

- **Validation errors** — throw immediately, prevent rendering
- **Runtime errors** — log to console, render fallback UI
- **Condition errors** — return `false`, continue rendering

---

## 16. Backward Compatibility

### Deprecation Policy

When introducing breaking changes:

1. **Announce deprecation** — log warnings in dev mode
2. **Parallel support** — old and new APIs coexist for 1 major version
3. **Migration guide** — provide automated migration tooling
4. **Remove** — delete deprecated API in next major version

### Current Compatibility Guarantees

- **Odoo-style field types** — supported indefinitely via `UnifiedFieldType`
- **Existing `FieldDef`** — compatible with new `Condition`-aware version (boolean conditions still work)
- **Existing `ViewDef`** — `fields: string[]` still valid for list/kanban views

---

## 17. Security Considerations

### No Code Execution

Metadata must never execute arbitrary code:

- ❌ `eval()`
- ❌ `Function()` constructor
- ❌ Dynamic imports
- ❌ Inline event handlers

### Sanitization

- **User-provided metadata** — validate against schema before rendering
- **Formula compute keys** — whitelist of known server endpoints
- **Filter expressions** — validate operators before sending to server

### XSS Prevention

- **Field values** — always escaped by React
- **HTML field type** — sanitized via DOMPurify before rendering
- **Widget hints** — closed set, no arbitrary strings

---

## 18. Future Extensions

### Planned (Not Yet Implemented)

- **Conditional required** — `required: Condition` instead of `required: boolean`
- **Field-level permissions** — `readonly` based on user role
- **Computed layout** — server-driven layout generation
- **Multi-record forms** — one2many/many2many inline editing

### Explicitly Deferred

- ❌ Pivot engine
- ❌ Spreadsheet-style tables
- ❌ Drag-heavy UI builders
- ❌ Fully dynamic layouts
- ❌ Graph/chart views
- ❌ Calendar views

---

## 19. Compliance Checklist

Before merging any metadata-related code, verify:

- [ ] All conditions use the 8 approved operators
- [ ] No arbitrary JavaScript expressions
- [ ] Layout depth ≤ 6
- [ ] Horizontal groups ≤ 3 fields
- [ ] Notebook pages ≤ 6
- [ ] All field names exist in ModelDef
- [ ] State field is `select` type
- [ ] No self-transitions
- [ ] Registry sealed after boot
- [ ] `version` field present on ModelDef and ViewDef
- [ ] Tests cover all operators and constraints
- [ ] No cross-record dependencies
- [ ] No async conditions

---

## 20. Glossary

| Term              | Definition                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Metadata**      | JSON-serializable data structure describing business entities and their UI representation |
| **Model**         | Business entity definition (fields, states, ordering)                                     |
| **View**          | UI representation of a model (list, form, kanban)                                         |
| **Field**         | Single data attribute on a model                                                          |
| **Widget**        | UI control for rendering/editing a field                                                  |
| **Condition**     | Boolean expression controlling field visibility/editability                               |
| **Formula**       | Computed field referencing server-side logic                                              |
| **Layout**        | Tree structure defining form spatial arrangement                                          |
| **State Machine** | Workflow definition with states and transitions                                           |
| **Registry**      | Governed map of widgets or views                                                          |

---

**End of Specification**

This document is the source of truth for all metadata-related implementation. Any code that violates this spec must be rejected during code review.
