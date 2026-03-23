# AFENDA Data Grid Interaction Standard

**Purpose**  
Define how data grids behave, render, and interact across AFENDA applications. This standard ensures consistency, performance, operational safety, and clarity for high-density enterprise workflows.

**Related:** [Audit & traceability UX](./audit-traceability-ux-standard.md) — grids often anchor record-level history and filtering into activity views. [ERP visual density & typography](./erp-visual-density-typography-standard.md) — grid type scale, alignment, and density modes (§8). [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — collection views (§5.1): columns, filters, bulk actions from contracts. [Command surface & toolbar](./command-surface-toolbar-standard.md) — selection layer toolbars (sticky, compact, floating). [Permission & role interaction](./permission-role-interaction-standard.md) — row/column/action visibility and eligibility from resolved contracts. [Workflow & state transition](./workflow-state-transition-standard.md) — status columns, filters by state, entry points to workflow actions. [Cross-module navigation](./cross-module-navigation-standard.md) — shell layout (§3.1) alongside primary sidebar / header zones.

---

## 1. Design Intent

Data grids are operational work surfaces where users:

- Review large datasets
- Compare structured records
- Execute precise multi-step workflows
- Perform bulk state transformations

They must prioritize clarity, stability, and efficiency over visual decoration.

---

## 2. Core Principles

### 2.1 Stability First

Layouts must not shift during:

- Data loading
- Sorting
- Filtering
- Selection
- Pagination

### 2.2 Predictable Interaction

All grids must behave consistently regardless of module or domain.

### 2.3 High-Density Readability

Grids must support prolonged professional use without fatigue.

### 2.4 Truthful Representation

Grid state must always reflect backend truth. No visual state may imply uncommitted system state.

---

## 3. Grid Structure

### 3.1 Layout Regions

| Region          | Purpose                         |
| --------------- | ------------------------------- |
| Toolbar         | Filters, search, global actions |
| Header          | Column labels and sort controls |
| Body            | Row data                        |
| Footer          | Pagination and totals           |
| Selection layer | Bulk interaction surface        |

### 3.2 Column Rules

#### Required Column Types

| Type      | Purpose                      |
| --------- | ---------------------------- |
| Selection | Row selection checkboxes     |
| Primary   | Main record identifier       |
| Attribute | Supporting fields            |
| Status    | Operational state indicators |
| Numeric   | Quantitative values          |
| Actions   | Row-level operations         |

#### Column Behavior Standards

- Columns must not resize unexpectedly
- User resizing must persist
- Numeric columns right-aligned
- Status columns center-aligned
- Text columns left-aligned

---

## 4. Sorting and Filtering

### 4.1 Sorting

**Rules**

- Single-column sort default
- Multi-sort allowed for advanced workflows
- Sort state visually persistent
- Sort must not clear selection

### 4.2 Filtering

**Requirements**

- Filters must be explicit and reversible
- Active filters must be visible
- Filter changes must clear selection
- Server filtering preferred for large datasets

---

## 5. Selection Behavior

### 5.1 Row Selection

- Checkbox column required
- Entire row clickable (optional but recommended)
- Selection highlight subtle
- Selection must persist across pagination

### 5.2 Range Selection

**Shift key behavior**

- Select contiguous range
- Direction-aware
- Scroll-safe

### 5.3 Keyboard Selection

| Key           | Behavior        |
| ------------- | --------------- |
| Space         | Toggle row      |
| Shift + Arrow | Expand range    |
| Ctrl/Cmd + A  | Select page     |
| Escape        | Clear selection |

---

## 6. Pagination

### 6.1 Modes

| Mode            | Use case                  |
| --------------- | ------------------------- |
| Page-based      | ERP operational workflows |
| Infinite scroll | Exploration workflows     |
| Virtualized     | Massive datasets          |

### 6.2 Requirements

- Pagination must not reset scroll unexpectedly
- Page size changes must preserve user intent
- Selection must persist across pages

---

## 7. Row Interaction

### 7.1 Hover Behavior

- Subtle background change
- No layout movement
- Action buttons may reveal on hover

### 7.2 Row Expansion

Used for:

- Details
- Inline editing
- Nested records

**Rules**

- Expansion must not reflow entire grid
- Expanded content visually nested
- Only one expansion allowed by default

---

## 8. Inline Editing

### 8.1 Activation

- Double-click cell
- Enter key when focused

### 8.2 Behavior

- Edit must not alter row height
- Save via Enter
- Cancel via Escape
- Dirty state visually indicated

### 8.3 Validation

- Field-level validation only
- Errors must not break grid layout

---

## 9. Visual System

### 9.1 Density Modes

| Mode        | Use case                |
| ----------- | ----------------------- |
| Comfortable | General operations      |
| Compact     | Data-heavy workflows    |
| Financial   | High-precision analysis |

### 9.2 Typography

- Tabular numerals for numeric columns
- Medium weight for primary identifiers
- Muted tone for secondary data

### 9.3 Color Usage

- Selection: subtle tint
- Hover: soft neutral
- Status: semantic indicators only
- Avoid decorative colors

---

## 10. Performance Standards

### 10.1 Rendering

Avoid:

- Full grid re-render on small state change
- Complex cell animations
- Expensive hover effects

### 10.2 Data Volume

Grids must handle:

- 100k+ rows (server mode)
- Virtualized rendering
- Progressive data loading

---

## 11. Accessibility

### 11.1 Screen Readers

- Header associations required
- Sort state announced
- Selection state announced

### 11.2 Keyboard Navigation

- Arrow keys move focus
- Tab navigates controls
- Focus ring always visible

### 11.3 Touch Support

- Minimum touch targets
- Sticky headers for context

---

## 12. Error and Empty States

### 12.1 Empty States

Must clarify:

- No data exists
- Filters removed all data
- Permissions restrict visibility

### 12.2 Error States

- Network failures must not corrupt grid layout
- Retry mechanisms visible

---

## 13. Audit and Safety

### 13.1 Action Traceability

Row-level and bulk actions must be auditable.

### 13.2 Permission Awareness

UI must respect:

- Role permissions
- Record ownership
- Field-level restrictions

Destructive and high-impact operations must follow the **[AFENDA Destructive Action Safety Standard](./destructive-action-safety-standard.md)** (confirmations, severity, backend authority, audit).

---

## 14. Anti-Patterns (Prohibited)

- Layout shift during interaction
- Selection loss on pagination
- Hidden active filters
- Infinite scroll in operational ERP modules
- Mixed alignment in numeric columns
- Hover-only critical actions

---

## 15. Integration with Bulk Interaction Standard

Data grids must integrate seamlessly with:

- Checkbox column system
- Bulk action bars
- Selection scope model
- Centralized selection store

**Companion documents:** [AFENDA Bulk Interaction Standard](./bulk-interaction-standard.md) · [AFENDA Destructive Action Safety Standard](./destructive-action-safety-standard.md) (row and bulk destructive actions).

**Implementation reference (UI packages):**

- `@afenda/erp-view-pack/selection` — store, reconciliation, `SelectAllCheckbox`, `RowCheckbox`, `SELECTION_COLUMN_*`, `SELECTION_CHECKBOX_TOUCH`, `dataGridRowSelectionClass` / `DATA_GRID_ROW_SURFACE`, and **`DATA_GRID_*`** tokens (`DATA_GRID_CELL_NUMERIC`, `DATA_GRID_CELL_STATUS`, `DATA_GRID_DENSITY_*`, `DATA_GRID_HEADER_STICKY`, etc.).
- `@afenda/erp-view-pack/patterns/*` — `ActionBar`, `StickyActionBar`, `CompactSelectionBar`, `BulkSelectionNotice`, `AnimatedSelectionCount` (selection layer + notices).
- `@afenda/view-engine` — list/grid view building blocks where grids are composed (keep domain state and selection outside presentational tables).

Grids are interaction surfaces; state authority lives in domain systems.

---

## 16. Implementation Checklist

### Structure

- [ ] Header, body, footer regions
- [ ] Column alignment rules
- [ ] Stable layout behavior

### Interaction

- [ ] Sorting system
- [ ] Filtering system
- [ ] Selection system
- [ ] Keyboard navigation

### Visuals

- [ ] Density modes
- [ ] Typography hierarchy
- [ ] Semantic color use

### Performance

- [ ] Virtualization-safe
- [ ] Efficient state updates
- [ ] Server-side scaling

### Accessibility

- [ ] Screen reader labels
- [ ] Keyboard traversal
- [ ] Focus visibility

---

## 17. Maturity Model

| Level        | Capability                             |
| ------------ | -------------------------------------- |
| Basic        | Static table                           |
| Functional   | Sort and filter                        |
| Advanced     | Persistent selection                   |
| Professional | Inline editing + virtualization        |
| Enterprise   | Full interaction + audit + permissions |

Teams must target **Enterprise** maturity for mission-critical modules.

---

## 18. Standard Outcome

Adopting this standard ensures:

- Predictable interaction
- Operational safety
- High-density efficiency
- Scalable performance
- Trustworthy data representation

Data grids become **precision operational instruments**, not simple tables.
