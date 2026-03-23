# AFENDA Metadata-Driven View Composition Standard

## 1. Purpose

Define how application views are generated from metadata rather than hard-coded UI so that AFENDA systems achieve:

- Deterministic behavior
- Cross-module consistency
- Reduced engineering entropy
- Faster domain extensibility
- Governance at the architecture layer

This standard ensures UI is a _rendering outcome_, not an implementation artifact.

---

## Related standards

- [Data grid interaction](./data-grid-interaction-standard.md) — collection-view UX when grids are metadata-driven (columns, density, selection).
- [Bulk interaction](./bulk-interaction-standard.md) — bulk actions and selection semantics bound from action contracts, not ad-hoc UI flags.
- [Destructive action safety](./destructive-action-safety-standard.md) — destructive classification and confirmations in action contracts.
- [Audit & traceability UX](./audit-traceability-ux-standard.md) — audit hooks and explainability (§12 below).
- [ERP visual density & typography](./erp-visual-density-typography-standard.md) — token-driven rendering layer (§3.3).
- [Command surface & toolbar](./command-surface-toolbar-standard.md) — toolbar zones and action slots in layout contracts (§4.2).
- [Notification & system feedback](./notification-system-feedback-standard.md) — notification payloads and eligibility from contracts; no ad-hoc copy in primitives.
- [Permission & role interaction](./permission-role-interaction-standard.md) — how eligibility is resolved and reflected in UI; complements §4.6 below.
- [Workflow & state transition](./workflow-state-transition-standard.md) — lifecycle states, transitions, guards, and workflow views; complements §4.5 and §5.4 below.
- [Cross-module navigation](./cross-module-navigation-standard.md) — shell nav zones, menu graphs, deep links; complements §4.2 below.

**Implementation docs:** [View engine overview](../view-engine/README.md) · [View engine architecture](../view-engine/architecture.md) · [Metadata SPEC](../../packages/view-engine/src/metadata/SPEC.md)

---

## 2. Core principle

> Views must be declarative products of metadata contracts interpreted by a rendering engine.

UI code should not contain business logic, workflow rules, permission decisions, or domain branching.

Those concerns belong to metadata registries.

---

## 3. Architectural layers

### 3.1 Metadata layer (source of truth)

Defines _what_ the system represents.

Includes:

- Entity schemas
- Field definitions
- Validation rules
- View layout trees
- State machine definitions
- Permission matrices
- Action contracts
- Audit hooks

Metadata must be:

- Versioned
- Immutable once released
- Composable
- Machine-verifiable

### 3.2 Interpretation layer (view engine)

Defines _how metadata becomes UI_.

Responsibilities:

- Layout resolution
- Component binding
- State resolution
- Permission gating
- Dependency ordering
- Action wiring
- Data source mapping

The engine must not embed domain logic.

### 3.3 Rendering layer (UI components)

Defines _how visuals appear_.

Components must be:

- Stateless where possible
- Token-driven
- Density-adaptive
- Accessibility compliant
- Theme aware

Components must not:

- Fetch domain data directly
- Contain workflow rules
- Infer permissions

---

## 4. Metadata contracts

### 4.1 Entity contract

Defines business objects.

Includes:

- Identity semantics
- Field taxonomy
- Relationship graph
- Lifecycle states
- Soft-delete policy
- Audit classification

### 4.2 View layout contract

Defines spatial composition.

Includes:

- LayoutTree structure
- Zones (header, toolbar, body, side panels)
- Component slots
- Density profiles
- Responsive collapse rules
- Progressive disclosure rules

Layouts must be:

- Deterministic
- Hierarchical
- Nestable
- Device-adaptive

For primary sidebar / rail navigation, command palette, deep linking, and permission-filtered menu graphs, see [Cross-module navigation](./cross-module-navigation-standard.md).

### 4.3 Field presentation contract

Defines how data appears.

Includes:

- Display type
- Formatting rules
- Masking rules
- Inline validation rules
- Editability rules
- Dependency triggers
- Highlight conditions

### 4.4 Action contract

Defines system operations.

Includes:

- Preconditions
- Permission requirements
- Destructive classification
- Confirmation requirements
- Side-effects
- Undo policy
- Audit verbosity

### 4.5 State machine contract

Defines lifecycle governance.

Includes:

- Valid states
- Transition graph
- Transition guards
- Required approvals
- Escalation triggers
- Terminal states

UI must derive state affordances strictly from this contract.

For transition UX, approval pipelines, record status chrome, optimistic reconciliation, and audit expectations, see [Workflow & state transition](./workflow-state-transition-standard.md).

### 4.6 Permission contract

Defines access control behavior.

Includes:

- Visibility rules
- Field masking rules
- Edit scope rules
- Action eligibility
- Scope inheritance

Permissions must never be inferred at the component layer.

For user-visible gating, presentation modes (omit / disable / mask), bulk and destructive alignment, and accessibility expectations, see [Permission & role interaction](./permission-role-interaction-standard.md).

---

## 5. View types

### 5.1 Collection views

Examples: data grids, registries, ledgers

Metadata controls:

- Column definitions
- Sorting rules
- Filter schema
- Aggregations
- Bulk actions
- Selection semantics
- Density modes

### 5.2 Record views

Examples: forms, profiles, dossiers

Metadata controls:

- Section grouping
- Field layout
- Inline edit rules
- State banners
- Workflow panels
- Related entity panels

### 5.3 Analytical views

Examples: dashboards, summaries

Metadata controls:

- Metric definitions
- Aggregation windows
- Visualization mappings
- Threshold alerts
- Drill-down targets

### 5.4 Workflow views

Examples: approval consoles, task pipelines

Metadata controls:

- Stage definitions
- Transition controls
- Responsibility lanes
- Escalation signals
- SLA timers

See [Workflow & state transition](./workflow-state-transition-standard.md) for UX and layering expectations on top of this contract.

---

## 6. LayoutTree rules

LayoutTree is the canonical structural model.

Rules:

- Tree depth ≤ 6
- Zones must be explicitly typed
- Containers define density inheritance
- Children cannot override permission scope
- Visual grouping must reflect data semantics
- Reflow rules must be metadata-declared

---

## 7. Registry governance

All metadata must be registered in typed registries.

### Required registries

- Entity Registry
- Field Registry
- View Registry
- Action Registry
- Workflow Registry
- Permission Registry
- Layout Registry

Registry entries must include:

- Unique ID
- Semantic version
- Owner domain
- Change history
- Deprecation policy

---

## 8. Determinism requirements

Given identical:

- Metadata version
- Permission scope
- Data state
- Device class

The rendered UI must be identical.

No runtime randomness permitted.

---

## 9. Extensibility model

Extensions must occur through:

- Metadata overlays
- Registry augmentation
- Plugin renderers

Extensions must NOT:

- Patch core engine logic
- Mutate base metadata
- Inject hidden workflows

---

## 10. Anti-patterns (prohibited)

- Business logic inside components
- Conditional rendering based on ad-hoc flags
- Permission checks in UI code
- Hard-coded workflow steps
- Duplicate layout definitions
- Feature flags bypassing metadata
- Direct API calls inside visual components

---

## 11. Testing & verification

### 11.1 Metadata validation

- Schema validation
- Referential integrity checks
- Version compatibility checks

### 11.2 Rendering consistency

- Snapshot parity tests
- Permission variance tests
- Density mode tests
- Device class tests

### 11.3 Workflow integrity

- Transition graph validation
- Guard condition verification
- Terminal state enforcement

---

## 12. Auditability

The system must log:

- Metadata version used
- View composition path
- Permission scope applied
- Action derivation source
- Workflow transition origin

Ensures explainable UI behavior. Aligns with [Audit & traceability UX](./audit-traceability-ux-standard.md) for user-visible history surfaces.

---

## 13. Performance constraints

- Metadata resolution < 50ms
- Layout computation < 16ms
- Incremental re-rendering only
- Lazy zone loading
- Progressive hydration

---

## 14. Executive outcome

A compliant system achieves:

- Architectural sovereignty
- Replaceable UI layers
- Domain scalability
- Deterministic compliance
- Lower regression risk
- Faster module expansion
- Explainable system behavior

---

## 15. Compliance requirement

Any feature that bypasses metadata rendering governance is:

> Non-Compliant Architecture

and must not be promoted to production systems.

---

## 16. Implementation reference (monorepo)

| Layer                              | Location / notes                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Interpretation                     | `@afenda/view-engine` — see [view-engine architecture](../view-engine/architecture.md), [metadata SPEC](../../packages/view-engine/src/metadata/SPEC.md)                                                                                                                                                                                                                                                                       |
| Rendering (ERP widgets & patterns) | `@afenda/erp-view-pack` — stateless, token-driven components registered for the engine; **no** domain branching or permission inference in pattern code. Canonical JSDoc + `ERP_PACK_RENDERING_LAYER` in `packages/erp-view-pack/src/patterns/metadata-rendering-layer.ts`; bulk toolbars per [command surface & toolbar](./command-surface-toolbar-standard.md) (`command-surface-toolbar.ts`, `data-afenda-command-surface`) |
| Primitives & theme                 | `@afenda/ui-core`                                                                                                                                                                                                                                                                                                                                                                                                              |

`@afenda/erp-view-pack` patterns exist as **render targets** and shared chrome; product features compose them through metadata and the view engine, not by hard-coding workflows inside these components.
