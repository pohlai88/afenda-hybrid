# AFENDA View Engine — Examples

Quick-start examples for common use cases.

---

## Setup

### 1. Initialize the Engine

```typescript
// app/layout.tsx or main entry point
import { registerErpWidgets } from "@afenda/erp-view-pack";
import { initializeViewEngine } from "@afenda/view-engine";

// Register ERP widgets first (if using ERP pack)
registerErpWidgets();

// Initialize view engine (registers core widgets/views, seals registries)
initializeViewEngine();
```

---

## Example 1: Simple Form

### Define the Model

```typescript
import type { ModelDef } from "@afenda/view-engine";

const contactModel: ModelDef = {
  version: 1,
  name: "crm.contact",
  label: "Contact",
  fields: {
    name: {
      name: "name",
      label: "Full Name",
      type: "text",
      required: true,
      maxLength: 100,
    },
    email: {
      name: "email",
      label: "Email",
      type: "text",
      widget: "email",
      required: true,
    },
    phone: {
      name: "phone",
      label: "Phone",
      type: "text",
      widget: "phone",
    },
    notes: {
      name: "notes",
      label: "Notes",
      type: "text",
      multiline: true,
    },
  },
};
```

### Define the Form View

```typescript
import type { ViewDef } from "@afenda/view-engine";

const contactFormView: ViewDef = {
  version: 1,
  id: "crm.contact.form",
  name: "Contact Form",
  kind: "form",
  model: "crm.contact",
  layout: [
    { kind: "field", name: "name" },
    {
      kind: "group",
      direction: "horizontal",
      columns: 2,
      children: [
        { kind: "field", name: "email" },
        { kind: "field", name: "phone" },
      ],
    },
    { kind: "separator" },
    { kind: "field", name: "notes" },
  ],
};
```

### Render the Form

```typescript
import { FormView } from "@afenda/view-engine";

export function ContactFormPage({ contactId }: { contactId: string }) {
  const contact = await fetchContact(contactId);

  return (
    <FormView
      model={contactModel}
      view={contactFormView}
      data={contact}
      onSave={async (values) => {
        await updateContact(contactId, values);
      }}
    />
  );
}
```

---

## Example 2: Conditional Fields

### Model with Conditions

```typescript
const requisitionModel: ModelDef = {
  version: 1,
  name: "recruitment.requisition",
  label: "Requisition",
  fields: {
    title: {
      name: "title",
      label: "Job Title",
      type: "text",
      required: true,
    },
    status: {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "APPROVED", label: "Approved" },
        { value: "CLOSED", label: "Closed" },
      ],
    },
    approvedBy: {
      name: "approvedBy",
      label: "Approved By",
      type: "relation",
      relation: "hr.employee",
      // Only visible when status is APPROVED or CLOSED
      invisible: { field: "status", op: "eq", value: "DRAFT" },
    },
    approvalDate: {
      name: "approvalDate",
      label: "Approval Date",
      type: "date",
      // Required when status is APPROVED
      required: { field: "status", op: "eq", value: "APPROVED" },
      // Readonly when status is CLOSED
      readonly: { field: "status", op: "eq", value: "CLOSED" },
    },
    budget: {
      name: "budget",
      label: "Budget",
      type: "money",
      // Readonly when status is not DRAFT
      readonly: { field: "status", op: "ne", value: "DRAFT" },
    },
  },
};
```

### Form View

```typescript
const requisitionFormView: ViewDef = {
  version: 1,
  id: "recruitment.requisition.form",
  name: "Requisition Form",
  kind: "form",
  model: "recruitment.requisition",
  layout: [
    { kind: "field", name: "title" },
    { kind: "field", name: "status" },
    { kind: "separator" },
    {
      kind: "group",
      direction: "horizontal",
      title: "Approval Details",
      columns: 2,
      children: [
        { kind: "field", name: "approvedBy" },
        { kind: "field", name: "approvalDate" },
      ],
    },
    { kind: "separator" },
    { kind: "field", name: "budget" },
  ],
};
```

**Result:** Fields automatically show/hide and enable/disable based on status.

---

## Example 3: List View with Actions

### Model

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
    },
    firstName: {
      name: "firstName",
      label: "First Name",
      type: "text",
    },
    lastName: {
      name: "lastName",
      label: "Last Name",
      type: "text",
    },
    salary: {
      name: "salary",
      label: "Salary",
      type: "money",
    },
    status: {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
  },
};
```

### List View

```typescript
const employeeListView: ViewDef = {
  version: 1,
  id: "hr.employee.list",
  name: "Employee List",
  kind: "list",
  model: "hr.employee",
  fields: ["employeeCode", "firstName", "lastName", "salary", "status"],
};
```

### Render with Actions

```typescript
import { ListView } from "@afenda/view-engine";

export function EmployeeListPage() {
  const employees = await fetchEmployees();

  return (
    <ListView
      model={employeeModel}
      view={employeeListView}
      data={employees}
      onAction={async (action, records) => {
        if (action === "delete") {
          await deleteEmployees(records.map((r) => r.id));
        } else if (action === "export") {
          await exportEmployees(records);
        }
      }}
    />
  );
}
```

---

## Example 4: Kanban with State Machine

### Model with States

```typescript
const taskModel: ModelDef = {
  version: 1,
  name: "project.task",
  label: "Task",
  fields: {
    title: {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
    },
    assignee: {
      name: "assignee",
      label: "Assignee",
      type: "relation",
      relation: "hr.employee",
    },
    priority: {
      name: "priority",
      label: "Priority",
      type: "select",
      widget: "priority",
      options: [
        { value: "LOW", label: "Low" },
        { value: "MEDIUM", label: "Medium" },
        { value: "HIGH", label: "High" },
      ],
    },
    status: {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "TODO", label: "To Do" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "REVIEW", label: "Review" },
        { value: "DONE", label: "Done" },
      ],
    },
  },
  states: {
    field: "status",
    states: [
      {
        value: "TODO",
        label: "To Do",
        transitions: ["IN_PROGRESS"],
      },
      {
        value: "IN_PROGRESS",
        label: "In Progress",
        transitions: ["REVIEW", "TODO"],
      },
      {
        value: "REVIEW",
        label: "Review",
        transitions: ["DONE", "IN_PROGRESS"],
      },
      {
        value: "DONE",
        label: "Done",
        folded: true, // Collapsed by default
      },
    ],
  },
};
```

### Kanban View

```typescript
const taskKanbanView: ViewDef = {
  version: 1,
  id: "project.task.kanban",
  name: "Task Board",
  kind: "kanban",
  model: "project.task",
  fields: ["title", "assignee", "priority"],
};
```

### Render with State Transitions

```typescript
import { KanbanView } from "@afenda/view-engine";

export function TaskBoardPage() {
  const tasks = await fetchTasks();

  return (
    <KanbanView
      model={taskModel}
      view={taskKanbanView}
      data={tasks}
      onStateChange={async (task, newState) => {
        await updateTaskStatus(task.id, newState);
      }}
    />
  );
}
```

**Result:** Drag-and-drop between columns with automatic state validation.

---

## Example 5: Complex Form with Notebook

### Model

```typescript
const employeeModel: ModelDef = {
  version: 1,
  name: "hr.employee",
  label: "Employee",
  fields: {
    employeeCode: { name: "employeeCode", label: "Code", type: "text", required: true },
    firstName: { name: "firstName", label: "First Name", type: "text", required: true },
    lastName: { name: "lastName", label: "Last Name", type: "text", required: true },
    email: { name: "email", label: "Email", type: "text", widget: "email" },
    phone: { name: "phone", label: "Phone", type: "text", widget: "phone" },
    department: {
      name: "department",
      label: "Department",
      type: "relation",
      relation: "hr.department",
    },
    jobTitle: { name: "jobTitle", label: "Job Title", type: "text" },
    salary: { name: "salary", label: "Salary", type: "money" },
    hireDate: { name: "hireDate", label: "Hire Date", type: "date" },
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
};
```

### Form View with Notebook

```typescript
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
      columns: 3,
      children: [
        { kind: "field", name: "employeeCode" },
        { kind: "field", name: "firstName" },
        { kind: "field", name: "lastName" },
      ],
    },
    { kind: "separator" },
    {
      kind: "notebook",
      pages: [
        {
          key: "contact",
          label: "Contact",
          children: [
            {
              kind: "group",
              direction: "horizontal",
              columns: 2,
              children: [
                { kind: "field", name: "email" },
                { kind: "field", name: "phone" },
              ],
            },
          ],
        },
        {
          key: "employment",
          label: "Employment",
          children: [
            { kind: "field", name: "department" },
            { kind: "field", name: "jobTitle" },
            {
              kind: "group",
              direction: "horizontal",
              columns: 2,
              children: [
                { kind: "field", name: "hireDate" },
                { kind: "field", name: "salary" },
              ],
            },
          ],
        },
        {
          key: "status",
          label: "Status",
          children: [{ kind: "field", name: "status" }],
        },
      ],
    },
  ],
};
```

---

## Example 6: Advanced Conditions

### Logical AND

```typescript
readonly: {
  op: "and",
  conditions: [
    { field: "status", op: "ne", value: "DRAFT" },
    { field: "approvedBy", op: "ne", value: null },
  ]
}
```

**Meaning:** Field is readonly when status is not DRAFT AND approvedBy is not null.

### Logical OR

```typescript
required: {
  op: "or",
  conditions: [
    { field: "role", op: "eq", value: "ADMIN" },
    { field: "role", op: "eq", value: "MANAGER" },
  ]
}
```

**Meaning:** Field is required when role is ADMIN OR MANAGER.

### Nested Conditions

```typescript
invisible: {
  op: "and",
  conditions: [
    { field: "status", op: "eq", value: "ACTIVE" },
    {
      op: "or",
      conditions: [
        { field: "salary", op: "gt", value: 100000 },
        { field: "role", op: "eq", value: "EXECUTIVE" },
      ],
    },
  ],
}
```

**Meaning:** Field is invisible when status is ACTIVE AND (salary > 100000 OR role is EXECUTIVE).

### In/Not In Operators

```typescript
readonly: {
  field: "status",
  op: "in",
  value: ["APPROVED", "CLOSED", "ARCHIVED"],
}
```

**Meaning:** Field is readonly when status is one of APPROVED, CLOSED, or ARCHIVED.

---

## Example 7: Custom Widget Registration

### Define Custom Widget

```typescript
// widgets/priority-widget.tsx
import type { WidgetRenderProps, WidgetReadonlyProps, WidgetCellProps } from "@afenda/view-engine";

export function PriorityWidgetRender({ field, value, onChange }: WidgetRenderProps) {
  return (
    <div className="flex gap-2">
      {["LOW", "MEDIUM", "HIGH"].map((priority) => (
        <button
          key={priority}
          onClick={() => onChange(priority)}
          className={cn(
            "px-3 py-1 rounded",
            value === priority ? "bg-blue-500 text-white" : "bg-gray-100"
          )}
        >
          {priority}
        </button>
      ))}
    </div>
  );
}

export function PriorityWidgetReadonly({ value }: WidgetReadonlyProps) {
  const colors = {
    LOW: "text-gray-500",
    MEDIUM: "text-yellow-600",
    HIGH: "text-red-600",
  };
  return <span className={colors[value as string]}>{value}</span>;
}

export function PriorityWidgetCell({ value }: WidgetCellProps) {
  return <PriorityWidgetReadonly value={value} />;
}
```

### Register Widget

```typescript
// registry/register-custom-widgets.ts
import { registerCustomWidget } from "@afenda/view-engine";
import {
  PriorityWidgetRender,
  PriorityWidgetReadonly,
  PriorityWidgetCell,
} from "../widgets/priority-widget";

export function registerCustomWidgets() {
  registerCustomWidget("priority", {
    render: PriorityWidgetRender,
    readonly: PriorityWidgetReadonly,
    cell: PriorityWidgetCell,
  });
}
```

### Use in Boot Sequence

```typescript
// app/layout.tsx
import { registerErpWidgets } from "@afenda/erp-view-pack";
import { initializeViewEngine } from "@afenda/view-engine";
import { registerCustomWidgets } from "./registry/register-custom-widgets";

registerErpWidgets();
registerCustomWidgets(); // Before initializeViewEngine()
initializeViewEngine();
```

### Use in FieldDef

```typescript
priority: {
  name: "priority",
  label: "Priority",
  type: "select",
  widget: "priority", // Custom widget
  options: [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
  ],
}
```

---

## Example 8: Server-Side Computed Fields

### Model with Formula

```typescript
const orderModel: ModelDef = {
  version: 1,
  name: "sales.order",
  label: "Order",
  fields: {
    subtotal: {
      name: "subtotal",
      label: "Subtotal",
      type: "money",
    },
    taxRate: {
      name: "taxRate",
      label: "Tax Rate",
      type: "number",
    },
    taxAmount: {
      name: "taxAmount",
      label: "Tax Amount",
      type: "money",
      compute: {
        fn: "compute_tax_amount",
        args: ["subtotal", "taxRate"],
      },
      readonly: true, // Computed fields are always readonly
    },
    total: {
      name: "total",
      label: "Total",
      type: "money",
      compute: {
        fn: "compute_order_total",
        args: ["subtotal", "taxAmount"],
      },
      readonly: true,
    },
  },
};
```

**Note:** The engine displays computed fields but does not execute the formula. The server must compute and return the value.

---

## Example 9: Debugging with Devtools

### Enable Debug Mode

Add `?ve-debug=1` to the URL:

```
http://localhost:3000/employees/123?ve-debug=1
```

### Inspect Condition Evaluations

Open browser console:

```javascript
// View all condition evaluations
console.table(window.__AFENDA_ENGINE_LOG__);

// Filter by field
window.__AFENDA_ENGINE_LOG__.filter((log) => log.field === "salary");

// Check specific condition result
window.__AFENDA_ENGINE_LOG__.find((log) => log.field === "approvedBy" && log.result === false);
```

### Visual Layout Boundaries

With `?ve-debug=1`, all LayoutNodes have dotted blue borders and labels.

### Toggle Devtools Overlay

Press `Ctrl+Shift+D` to show/hide the debug overlay.

---

## Example 10: ERP Status Bar Widget

### Model with Status Bar

```typescript
const purchaseOrderModel: ModelDef = {
  version: 1,
  name: "purchase.order",
  label: "Purchase Order",
  fields: {
    orderNumber: { name: "orderNumber", label: "Order #", type: "text" },
    status: {
      name: "status",
      label: "Status",
      type: "select",
      widget: "statusbar", // ERP widget
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "SENT", label: "Sent" },
        { value: "CONFIRMED", label: "Confirmed" },
        { value: "RECEIVED", label: "Received" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
  },
  states: {
    field: "status",
    states: [
      { value: "DRAFT", label: "Draft", transitions: ["SENT", "CANCELLED"] },
      { value: "SENT", label: "Sent", transitions: ["CONFIRMED", "CANCELLED"] },
      { value: "CONFIRMED", label: "Confirmed", transitions: ["RECEIVED"] },
      { value: "RECEIVED", label: "Received" },
      { value: "CANCELLED", label: "Cancelled", folded: true },
    ],
  },
};
```

### Form View

```typescript
const purchaseOrderFormView: ViewDef = {
  version: 1,
  id: "purchase.order.form",
  name: "Purchase Order Form",
  kind: "form",
  model: "purchase.order",
  layout: [
    { kind: "field", name: "orderNumber" },
    { kind: "field", name: "status" }, // Renders as status bar
  ],
};
```

**Result:** Status field renders as a horizontal workflow bar with clickable state transitions.

---

## Example 11: Validation Constraints

### Model with Validation

```typescript
const productModel: ModelDef = {
  version: 1,
  name: "product.product",
  label: "Product",
  fields: {
    sku: {
      name: "sku",
      label: "SKU",
      type: "text",
      required: true,
      maxLength: 20,
      pattern: "^[A-Z0-9-]+$", // Alphanumeric + hyphens
    },
    price: {
      name: "price",
      label: "Price",
      type: "money",
      required: true,
      min: 0.01, // Must be positive
    },
    stock: {
      name: "stock",
      label: "Stock",
      type: "number",
      min: 0, // Cannot be negative
      max: 999999,
    },
    description: {
      name: "description",
      label: "Description",
      type: "text",
      multiline: true,
      maxLength: 1000,
    },
  },
};
```

**Result:** Form validates constraints before submission. Errors are displayed inline.

---

## Example 12: Using MetadataField Directly

For custom layouts outside the view engine:

```typescript
import { MetadataField } from "@afenda/view-engine";

export function CustomEmployeeForm({ employee }: { employee: Employee }) {
  const model = employeeModel;

  return (
    <div className="space-y-4">
      <MetadataField
        field={model.fields.firstName}
        value={employee.firstName}
        onChange={(value) => updateEmployee({ firstName: value })}
      />

      <MetadataField
        field={model.fields.salary}
        value={employee.salary}
        onChange={(value) => updateEmployee({ salary: value })}
        readonly={employee.status !== "DRAFT"} // Pre-evaluated condition
      />
    </div>
  );
}
```

---

## Common Patterns

### Pattern 1: Fetch Data + Render View

```typescript
export async function EmployeeFormPage({ id }: { id: string }) {
  const employee = await fetchEmployee(id);

  return (
    <FormView
      model={employeeModel}
      view={employeeFormView}
      data={employee}
      onSave={async (values) => {
        await updateEmployee(id, values);
      }}
    />
  );
}
```

### Pattern 2: List with Search

```typescript
export async function EmployeeListPage({ searchParams }: { searchParams: { q?: string } }) {
  const employees = await searchEmployees(searchParams.q);

  return (
    <ListView
      model={employeeModel}
      view={employeeListView}
      data={employees}
    />
  );
}
```

### Pattern 3: Kanban with Filters

```typescript
export async function TaskBoardPage({ searchParams }: { searchParams: { assignee?: string } }) {
  const tasks = await fetchTasks({ assignee: searchParams.assignee });

  return (
    <KanbanView
      model={taskModel}
      view={taskKanbanView}
      data={tasks}
      onStateChange={updateTaskStatus}
    />
  );
}
```

---

## Troubleshooting

### Issue: Widget Not Found

**Error:** `Widget not found for field type: custom`

**Solution:** Ensure custom widget is registered before `initializeViewEngine()`:

```typescript
registerCustomWidget("custom", widgetDef);
initializeViewEngine();
```

### Issue: Layout Validation Failed

**Error:** `Layout validation failed: Max nesting depth exceeded`

**Solution:** Flatten layout tree. Max depth is 6 levels.

### Issue: Condition Not Evaluating

**Enable devtools:**

```
?ve-debug=1
```

**Check log:**

```javascript
console.table(window.__AFENDA_ENGINE_LOG__);
```

**Verify condition syntax:**

```typescript
// ❌ Bad
readonly: { field: "status", op: "equals", value: "DRAFT" }

// ✅ Good
readonly: { field: "status", op: "eq", value: "DRAFT" }
```

### Issue: Form State Not Updating

**Ensure `onSave` is async:**

```typescript
// ❌ Bad
onSave={(values) => { updateEmployee(values); }}

// ✅ Good
onSave={async (values) => { await updateEmployee(values); }}
```

---

## Best Practices

### 1. Define Models Once

Store `ModelDef` in a central registry:

```typescript
// lib/models/index.ts
export const models = {
  employee: employeeModel,
  requisition: requisitionModel,
  organization: organizationModel,
};
```

### 2. Reuse Views

Define multiple views per model:

```typescript
export const employeeViews = {
  form: employeeFormView,
  list: employeeListView,
  kanban: employeeKanbanView,
};
```

### 3. Pre-Evaluate Conditions Server-Side

For performance, evaluate conditions server-side and send pre-computed flags:

```typescript
// Server
const employee = await fetchEmployee(id);
employee._readonly = employee.status !== "DRAFT";

// Client
<FormView data={employee} />
```

### 4. Use Devtools in Development

Always enable `?ve-debug=1` when developing metadata-driven UIs.

### 5. Validate Layouts Early

Run `validateLayout()` in tests:

```typescript
test("employee form layout is valid", () => {
  const result = validateLayout(employeeFormView.layout, employeeModel);
  expect(result.valid).toBe(true);
});
```

---

## License

Private — AFENDA Platform
