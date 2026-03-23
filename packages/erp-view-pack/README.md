# @afenda/erp-view-pack

**AFENDA ERP View Pack** — ERP-specific patterns, widgets, and presets.

This package extends `@afenda/view-engine` with domain-specific components for enterprise resource planning applications.

**Docs:** [View engine](../../docs/view-engine/README.md) · [Testing](../../docs/testing/README.md)

---

## What's Inside

### ERP Patterns (9 components)

- **Workflow:** RecordStatusBar, StatusBadge
- **Metrics:** MetricCard, StatGroup
- **Navigation:** SidebarNav, AppModuleIcon
- **Data:** DescriptionList, ActionBar
- **Notifications:** NotificationCenter

### ERP Widgets (2 overrides)

- **Money Widget** — Enhanced currency handling with symbol prefix
- **Status Bar Widget** — Workflow state visualization

### Registry Boot

- `registerErpWidgets()` — Registers ERP widget overrides

---

## Installation

```bash
pnpm add @afenda/erp-view-pack
```

---

## Usage

### 1. Register ERP Widgets

Call before `initializeViewEngine()`:

```typescript
import { registerErpWidgets } from "@afenda/erp-view-pack";
import { initializeViewEngine } from "@afenda/view-engine";

registerErpWidgets();
initializeViewEngine();
```

### 2. Use ERP Patterns

```typescript
import { RecordStatusBar, MetricCard } from "@afenda/erp-view-pack";

function EmployeeHeader({ employee }) {
  return (
    <>
      <RecordStatusBar
        states={[
          { value: "DRAFT", label: "Draft" },
          { value: "ACTIVE", label: "Active" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        current={employee.status}
        onChange={(newStatus) => updateStatus(employee.id, newStatus)}
      />

      <div className="grid grid-cols-3 gap-4 mt-4">
        <MetricCard
          label="Total Employees"
          value={1234}
          trend={{ value: 12, direction: "up" }}
        />
      </div>
    </>
  );
}
```

### 3. Use Status Bar Widget

```typescript
const statusField: FieldDef = {
  name: "status",
  label: "Status",
  type: "select",
  widget: "statusbar", // ERP widget override
  options: [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "ARCHIVED", label: "Archived" },
  ],
};
```

---

## Design Principles

### Domain-Specific, Not Generic

This package contains patterns that are specific to ERP workflows. Generic patterns belong in `@afenda/ui-core`.

### Governed Extension

ERP widget overrides are registered through `registerErpWidgets()`. Applications cannot register their own widgets.

### Odoo-Inspired

Many patterns mirror Odoo's UI conventions (status bars, notebooks, metric cards) for familiarity.

---

## Package Boundaries

### What This Package Does

- ✅ Provide ERP-specific patterns
- ✅ Override core widgets with ERP variants
- ✅ Define ERP view presets

### What This Package Does NOT Do

- ❌ Interpret metadata (that's `@afenda/view-engine`)
- ❌ Provide generic UI primitives (that's `@afenda/ui-core`)
- ❌ Fetch data or contain business logic

---

## Dependencies

- `@afenda/ui-core` — Core UI components
- `@afenda/view-engine` — Metadata interpreter

---

## Testing

```bash
pnpm --filter @afenda/erp-view-pack typecheck
```

---

## License

Private — AFENDA Platform
