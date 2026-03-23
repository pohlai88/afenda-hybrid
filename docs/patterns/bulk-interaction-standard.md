# AFENDA Bulk Interaction Standard

**Purpose**  
Establish a consistent, enterprise-grade pattern for bulk selection and mass actions across AFENDA applications. This standard ensures operational safety, UX clarity, scalability for large datasets, and alignment with the Business Truth Engine philosophy.

**Related:** [Audit & traceability UX](./audit-traceability-ux-standard.md) — bulk operation history (§4.2) must remain evidentiary and non-obscuring. [ERP visual density & typography](./erp-visual-density-typography-standard.md) — compact toolbars, spacing rhythm, operational tone. [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — selection semantics and bulk actions derived from action contracts, not ad-hoc UI. [Command surface & toolbar](./command-surface-toolbar-standard.md) — bulk bars as contextual command surfaces (zones, overflow, identifiers). [Notification & system feedback](./notification-system-feedback-standard.md) — live-region discipline for counts (avoid competing announcements). [Permission & role interaction](./permission-role-interaction-standard.md) — bulk action eligibility vs selection UI state; server re-checks. [Workflow & state transition](./workflow-state-transition-standard.md) — bulk state changes and reconciliation with lifecycle rules. [Cross-module navigation](./cross-module-navigation-standard.md) — leaving and re-entering collection views without assuming stale selection.

---

## 1. Design Principles

### 1.1 Operational Clarity

Users must always understand:

- What is selected
- The scope of selection
- The impact of bulk actions

### 1.2 Safety Over Speed

Bulk actions can cause irreversible operational damage. The interface must:

- Prevent accidental triggering
- Signal destructive intent clearly
- Provide escape paths

### 1.3 System Truthfulness

Selection state must reflect real system state:

- No ghost selections
- No stale selections after data mutation
- No ambiguity across pages or filters

### 1.4 Density with Readability

Interfaces must support high-volume operational work without visual noise.

---

## 2. Interaction Architecture

### 2.1 Selection Scope Model

Bulk selection operates in three scopes:

| Scope    | Meaning                           | Typical Trigger       |
| -------- | --------------------------------- | --------------------- |
| Page     | Only rows visible on current page | Header checkbox       |
| Filtered | All rows matching active filters  | “Select all matching” |
| Global   | Entire dataset                    | Administrative tools  |

Selection scope must be explicitly communicated in the UI.

### 2.2 State Ownership

Selection state MUST exist outside table components.

**Rationale**

- Tables re-render frequently
- Data refresh can invalidate internal state
- Multiple views may share selection context

**Standard**

- Centralized store
- Stable row identifiers
- Filter-hash awareness

**Implementation reference:** `@afenda/erp-view-pack/selection` (`createSelectionStore`, reconciliation helpers, `useEscapeClearsSelection`, `BulkSelectionScopeUi` / `bulkSelectionScopeSrOnlyLabel`, `SELECTION_CHECKBOX_TOUCH`, checkbox primitives) and pattern components under `@afenda/erp-view-pack/patterns/*` (`ActionBar`, `StickyActionBar`, `CompactSelectionBar`, `AnimatedSelectionCount`, `BulkSelectionNotice`).

---

## 3. Core Components

### 3.1 Checkbox Column

#### Header Checkbox

Controls page-level selection.

**States**

- Checked: All visible rows selected
- Indeterminate: Some rows selected
- Unchecked: None selected

#### Row Checkbox

Controls individual row selection.

**Requirements**

- Large hit target
- Keyboard accessible
- Screen-reader labeled

### 3.2 Action Bars

#### Floating Action Bar

Used for dashboards and multi-panel layouts.

**Characteristics**

- Viewport anchored
- High visual prominence
- Used for cross-module operations

#### Sticky Action Bar

Used for data grids and ERP tables.

**Characteristics**

- Container anchored
- Medium prominence
- Does not obscure content

#### Compact Selection Bar

Used for dense financial and analytical interfaces.

**Characteristics**

- Inline placement
- Reduced padding
- Left-aligned layout

### 3.3 Selection Counter

**Behavior Requirements**

- Animated value transitions
- Tabular numerals
- No layout shift when count grows

**Grammar Rules**

- “1 item selected”
- “N items selected”

---

## 4. Bulk Action Patterns

### 4.1 Primary Actions

Common bulk operations:

- Edit
- Move
- Tag
- Export
- Archive

### 4.2 Destructive Actions

Examples:

- Delete
- Force status reset
- Remove permissions

**Safety Requirements**

- Visual warning state
- Confirmation for irreversible actions
- Clear undo policy where feasible

Full severity, confirmation copy, audit, and system safeguards: **[AFENDA Destructive Action Safety Standard](./destructive-action-safety-standard.md)**.

---

## 5. Visual System

### 5.1 Tone

Bulk interaction visuals must feel:

- Calm
- Precise
- Trustworthy
- Operationally serious

Avoid playful or overly colorful styling.

### 5.2 Visual Signals

#### Selected Rows

- Subtle background tint
- No heavy borders

#### Destructive Mode

- Soft warning background
- Elevated border emphasis
- Never bright or alarming

Aligns with [Destructive Action Safety Standard](./destructive-action-safety-standard.md) §4 (muted signaling, progressive emphasis for higher severity in app-level flows).

#### Elevation

- Soft shadow layers
- Avoid floating “toast-like” feel for ERP

**Implementation reference:** `SELECTION_*` tokens and `ACTION_BAR_*` / `PATTERN_BAR_SURFACE` in `@afenda/erp-view-pack` (see `packages/erp-view-pack/src/patterns/_CONVENTIONS.md`).

---

## 6. Accessibility Requirements

### 6.1 Screen Readers

- Live-region announcements for selection count
- Checkbox role semantics
- Action buttons labeled clearly

### 6.2 Keyboard Support

- Space toggles focused checkbox
- Shift+Click range selection
- Escape clears selection

### 6.3 Touch Targets

Minimum interactive size must support tablet operation.

---

## 7. Edge Case Governance

| Scenario          | Required behavior       |
| ----------------- | ----------------------- |
| Filter change     | Clear selection         |
| Page change       | Preserve selection      |
| Data refresh      | Reconcile removed rows  |
| Soft delete       | Remove from selection   |
| Hard delete       | Remove from selection   |
| Permission change | Disable invalid actions |
| Partial load      | Maintain safe toggling  |

---

## 8. Performance Standards

### 8.1 Scalability

System must support:

- 100k+ row datasets
- Server pagination
- Virtualized rendering

### 8.2 Rendering

Avoid:

- Per-row state containers
- Expensive hover effects
- Layout-shifting animations

---

## 9. Safety and Auditability

### 9.1 Action Logging

All bulk operations must be auditable.

Log entries should include:

- Actor
- Timestamp
- Selection scope
- Affected record IDs
- Action performed

### 9.2 Permission Awareness

Bulk actions must respect:

- Role permissions
- Field-level restrictions
- Record ownership rules

---

## 10. Integration with Business Truth Engine

Bulk actions are not UI conveniences — they are **system state transformations**.

Therefore:

- Actions must pass through domain services
- Optimistic updates must reconcile with truth state
- Failures must provide recovery paths

The UI layer is an execution surface, not the source of truth.

---

## 11. Implementation Checklist

### Selection

- [ ] Centralized store
- [ ] Stable row IDs
- [ ] Filter-hash awareness
- [ ] Scope model implemented

### UI Components

- [ ] Checkbox column
- [ ] Indeterminate header state
- [ ] Selection counter animation
- [ ] Action bar variant support

### Safety

- [ ] Destructive action styling
- [ ] Confirmation flows
- [ ] Permission validation

### Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader announcements
- [ ] Touch target sizing

### Performance

- [ ] Virtualization-safe
- [ ] No layout shift
- [ ] Efficient reconciliation

---

## 12. Maturity Model

| Level        | Capability                             |
| ------------ | -------------------------------------- |
| Basic        | Page-only selection                    |
| Intermediate | Cross-page persistence                 |
| Advanced     | Filter-scope selection                 |
| Enterprise   | Global selection + audit + permissions |

Teams should target **Enterprise** maturity for mission-critical modules.

---

## 13. Anti-Patterns (Prohibited)

- Storing selection inside table rows
- Losing selection on pagination
- Ambiguous “Select All” meaning
- Bright destructive colors
- Floating bars covering critical data
- Irreversible actions without confirmation

---

## 14. Companion Standards

- **Data grids** — Bulk selection is composed inside grids (toolbar, body, footer, selection layer). See **[Data Grid Interaction Standard](./data-grid-interaction-standard.md)** for layout regions, sort/filter, pagination, and keyboard behavior.
- **Destructive bulk actions** — Severity, confirmations, audit, and muted visual signaling are defined in **[Destructive Action Safety Standard](./destructive-action-safety-standard.md)** (ERP bars use `hasDestructiveAction` / `ACTION_BAR_DESTRUCTIVE` for toolbar-level emphasis only).

---

## 15. Standard Outcome

Adopting this standard ensures:

- Operational safety
- Predictable behavior
- Executive-grade UX
- Scalable architecture
- Trustworthy system state transitions

Bulk interaction becomes a **controlled operational instrument**, not a convenience feature.
