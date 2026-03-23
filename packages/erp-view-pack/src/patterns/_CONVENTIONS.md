# ERP View Pack — Pattern Conventions

Reference implementation: `action-bar.tsx` + selection system.

---

## AFENDA bulk interaction standard

Product requirements for selection scope, safety, accessibility, performance, and Business Truth Engine alignment are defined in the monorepo standard:

**[Bulk interaction](../../../../docs/patterns/bulk-interaction-standard.md)** · **[Data grid](../../../../docs/patterns/data-grid-interaction-standard.md)** · **[Destructive action safety](../../../../docs/patterns/destructive-action-safety-standard.md)** · **[Audit & traceability UX](../../../../docs/patterns/audit-traceability-ux-standard.md)** · **[ERP visual density & typography](../../../../docs/patterns/erp-visual-density-typography-standard.md)** · **[Metadata-driven view composition](../../../../docs/patterns/metadata-driven-view-composition-standard.md)** · **[Command surface & toolbar](../../../../docs/patterns/command-surface-toolbar-standard.md)** · **[Notification & system feedback](../../../../docs/patterns/notification-system-feedback-standard.md)** · **[Permission & role interaction](../../../../docs/patterns/permission-role-interaction-standard.md)** · **[Workflow & state transition](../../../../docs/patterns/workflow-state-transition-standard.md)** · **[Cross-module navigation](../../../../docs/patterns/cross-module-navigation-standard.md)**

Use the bulk standard for selection stores and bars; the data grid standard for grid layout and interaction; the destructive safety standard for confirmations, severity, and muted bulk-toolbar risk signaling (`hasDestructiveAction`, `destructiveSeverity`, `ACTION_BAR_DESTRUCTIVE`, `BulkDestructiveConsequenceHint`, `DESTRUCTIVE_CONFIRM_LABEL_*`). Use the audit standard when building record history, activity logs, diffs, and export-oriented read-only timelines. Use the visual density standard for type scale, grid vs form density, alignment, and calm operational tone. Use the metadata-driven composition standard so patterns remain **rendering-layer** primitives: no domain branching, permission inference, or direct data fetching inside `@afenda/erp-view-pack` UI. Use the command-surface standard for toolbar zones, overflow, live regions, and `data-afenda-command-surface` on bulk bars. Use the notification standard for inbox/toast semantics, severity vs attention badges, and `data-afenda-notification-surface` on shell inbox UI. Use the permission standard so **eligibility** (visibility, disabled, masked values) is resolved in the interpretation layer and passed as props—never inferred inside pattern components. Use the workflow standard so **state lists and transitions** are contract-driven: `RecordStatusBar` and similar components render props from the engine/domain, not ad-hoc graphs. Use the cross-module navigation standard for **sidebar / rail** structure, deep links, and command-palette alignment (`sidebar-nav.tsx`, filtered `modules` props). Pattern-level conventions below complement all eleven.

**Implemented in this package**

- Optional `selectionScope` / `scopeHint` on action bars and compact bar (live region scope clarity, §2.1).
- `useEscapeClearsSelection` + default Escape-to-clear when `onClear` is provided on bars (§6.2; opt out via `escapeClearsSelection={false}`).
- `SELECTION_CHECKBOX_TOUCH` + slightly wider selection column for checkbox hit targets (§6.3).
- `bulkSelectionScopeSrOnlyLabel` / `BulkSelectionScopeUi` for consistent scope copy.
- Destructive bulk: `destructiveSeverity`, `destructiveConsequenceHint`, `BulkDestructiveConsequenceHint`, `resolveBulkDestructiveSeverity`, confirm-label constants (`destructive-bulk-ui.ts`).
- `BulkSelectionScopeHint` exported for custom bulk live regions (same copy as built-in bars).

**Data grid standard — tokens & selection layer**

- `DATA_GRID_CELL_*` alignment helpers (§3.2, §9.2), `DATA_GRID_DENSITY_*` (§9.1), `DATA_GRID_HEADER_STICKY` (§11.3), `DATA_GRID_ROW_SURFACE` / `dataGridRowSelectionClass` (§5.1, §7.1), `DATA_GRID_ROW_CLICKABLE` (§5.1 optional row hit).
- `createSelectionStore` behavior documented for filter vs pagination vs reconcile (Data Grid §4–6).

**Audit & traceability UX — tokens & read-only building blocks**

- `audit-chrome.ts`: `AUDIT_TEXT_IDENTIFIER`, `AUDIT_TEXT_TIMESTAMP`, `AUDIT_TEXT_ACTOR`, `AUDIT_SURFACE_READONLY`, `AUDIT_FIELD_DIFF_BEFORE` / `AUDIT_FIELD_DIFF_AFTER` (§6.1, §8).
- `AuditFieldDiff` for inline before→after field changes (§6.1, §12).
- `DescriptionList` item `valueTone`: `identifier` | `timestamp` | `actor` (§8.3).
- `NotificationCenter` / `Notification.timestampIso` + tabular timestamp styling (§8.3).

**ERP visual density & typography — shared chrome**

- `erp-typography.ts`: type roles (`ERP_TYPO_DISPLAY`, `ERP_TYPO_KPI_VALUE`, `ERP_TYPO_SECTION`, `ERP_TYPO_EMPHASIS`, `ERP_TYPO_BODY`, `ERP_TYPO_META`, `ERP_TYPO_MICRO`, `ERP_TYPO_OVERLINE_LABEL`, `ERP_TYPO_META_STRONG`), size helpers (`ERP_TYPO_SIZE_*`), spacing tokens `ERP_SPACE_*` (§3.2, §4.2, §9.1).
- `pattern-chrome.ts`: `PATTERN_DENSE_TEXT`, `PATTERN_DENSE_MOTION`, `PATTERN_BAR_SURFACE` (Visual Density §4.2 body/emphasis at ~13px, §10 motion safety) — use alongside `erp-typography` where patterns need executive density without changing semantic role.
- `selection/selection-tokens.ts`: `SELECTION_EXEC_TEXT` (executive dense copy on bars), `SELECTION_BAR_SURFACE` (calm toolbar tone §2.4).
- Grid density and cell alignment: `DATA_GRID_DENSITY_*`, `DATA_GRID_CELL_*` (Visual Density §3.1, §4.3, §6, §8; see Data Grid standard).

**Command surface & toolbar**

- `command-surface-toolbar.ts`: `COMMAND_SURFACE_ATTR`, role strings (`COMMAND_SURFACE_BULK_SELECTION`, `COMMAND_SURFACE_SELECTION_NOTICE`), `commandSurfaceDataAttrs()`, and semantic aliases (`COMMAND_SURFACE_ACTION_SCROLL`, `COMMAND_SURFACE_ZONE_DIVIDER`, …) over `action-bar-chrome.ts`.
- `ActionBar`, `StickyActionBar`, `CompactSelectionBar`, `BulkSelectionNotice` apply conformance identifiers per `docs/patterns/command-surface-toolbar-standard.md` §7.

**Notification & system feedback**

- `notification-feedback.ts`: `NOTIFICATION_FEEDBACK_ATTR`, `NOTIFICATION_SURFACE_INBOX_TRIGGER`, `NOTIFICATION_SURFACE_INBOX_PANEL`, `notificationSurfaceDataAttrs()` (`notification-system-feedback-standard.md` §8).
- `feedback-toast.ts`: `showFeedback()` maps severity to Sonner toasts (`notification-system-feedback-standard.md` §10).
- `NotificationCenter` applies inbox trigger + panel identifiers; unread badge palette is **attention**, not a destructive control (same standard §3).

**Metadata-driven view composition (rendering layer §3.3)**

- `metadata-rendering-layer.ts` documents the obligation; `ERP_PACK_RENDERING_LAYER` is exported from `src/index.ts` for diagnostics and version tagging.
- Patterns and widgets are **token-driven, stateless where possible**, and registered for `@afenda/view-engine` — see `docs/patterns/metadata-driven-view-composition-standard.md` and `docs/view-engine/architecture.md`.
- Props carry **presentation** (labels, counts, variants); **eligibility, workflow, and permissions** are resolved in metadata / engine layers, not inside pattern components.

**Permission & role interaction**

- Monorepo standard: `docs/patterns/permission-role-interaction-standard.md` — server deny-by-default, engine-resolved eligibility, presentation modes (omit / disable / read-only / mask). Selection stores remain **UI state only** (`selection/index.ts`).
- `ActionBar`, `StickyActionBar`, `CompactSelectionBar`: optional `disabledReason` — bar-level `title`, `aria-disabled`, and `sr-only` copy when bulk actions are unavailable (standard §5).

**Workflow & state transition**

- Monorepo standard: `docs/patterns/workflow-state-transition-standard.md` — state machine contract (metadata §4.5), workflow views (§5.4), presentation via `record-status-bar.tsx` / `workflow-state-banner.tsx` / `status-badge.tsx`; server remains authoritative for legal transitions.
- `RecordState.disabled` / `disabledReason` on `record-status-bar.tsx` for guarded targets without inferring permissions in the component.

**Cross-module navigation**

- Monorepo standard: `docs/patterns/cross-module-navigation-standard.md` — menu graphs and paths supplied as props; `sidebar-nav.tsx` + `app-module-icon.tsx` are presentation-only; app shell wires `currentPath` / `onNavigate`.
- `navigation-chrome.ts`: `NAVIGATION_SURFACE_ATTR`, `navigationSurfaceDataAttrs()` — `sidebar-rail`, `module-group`, `menu-item-active` on `sidebar-nav.tsx` (standard §8).

---

## File structure

- **One component per file** (except tightly coupled pairs like `action-bar` + `sticky-action-bar`).
- **Co-locate stories**: `pattern-name.stories.tsx` next to `pattern-name.tsx`.
- **Barrel exports**: `src/index.ts` re-exports all public APIs; subpath exports (`./patterns/*`, `./selection`) for tree-shaking.

---

## Code style

### Client components

Use `"use client"` directive when:

- Component uses hooks (`useState`, `useEffect`, context).
- Component has event handlers (`onClick`, `onChange`).
- Component wraps Radix primitives that require client-side JS.

Static presentational components (e.g. `StatusBadge`, `AppModuleIcon`) do not need `"use client"`.

### Imports

- **JSX runtime**: React 19 auto-imports JSX; only `import * as React from "react"` when you reference `React.*` APIs (e.g. `React.forwardRef`, `React.ComponentType`).
- **Utilities**: `import { cn } from "@afenda/ui-core/lib/utils"` for class merging.
- **Primitives**: Import from `@afenda/ui-core/primitives/*` (not relative paths).

### Class composition

Always use `cn()` for conditional classes and user `className` overrides:

```tsx
className={cn("base-classes", conditional && "extra", className)}
```

---

## Accessibility

### Live regions

Dynamic counts, notifications, or status changes should announce to screen readers:

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {count} items selected
</div>
```

### Decorative icons

Trend arrows, status dots, module icons (when label is present) should be hidden from assistive tech:

```tsx
<TrendingUp className="h-3 w-3" aria-hidden />
```

### Interactive controls

- Buttons need `type="button"` (prevents form submission).
- Icon-only buttons need `aria-label`.
- Toggles (expand/collapse) need `aria-expanded`.
- Radio groups (e.g. `RecordStatusBar`) use `role="radio"` + `aria-checked`.

---

## Motion

All animations and transitions must respect reduced-motion:

```tsx
className={cn(
  "transition-colors duration-150",
  "motion-reduce:animate-none motion-reduce:transition-none"
)}
```

Shared bundle: `PATTERN_DENSE_MOTION` from `pattern-chrome.ts`.

---

## Design tokens

### Prefer semantic tokens

- `bg-background`, `text-foreground`, `border`, `text-muted-foreground`
- `bg-primary`, `text-destructive`, `bg-success`
- Avoid hardcoded colors unless brand-specific (e.g. module color swatches).

### Shared chrome

| Token                  | Location                           | Use                                                                                                                      |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PATTERN_DENSE_MOTION` | `pattern-chrome.ts`                | Motion safety + tight tracking                                                                                           |
| `PATTERN_DENSE_TEXT`   | `pattern-chrome.ts`                | ~13px executive density                                                                                                  |
| `PATTERN_BAR_SURFACE`  | `pattern-chrome.ts`                | Calm toolbar/notice surface                                                                                              |
| `ACTION_BAR_*`         | `action-bar-chrome.ts`             | Toolbar-specific (dividers, scroll mask; `ACTION_BAR_DESTRUCTIVE` = muted risk shell per Destructive Safety Standard §4) |
| `SELECTION_*`          | `../selection/selection-tokens.ts` | Checkbox column, row states                                                                                              |
| `DATA_GRID_*`          | `../selection/data-grid-tokens.ts` | Column alignment, density, sticky header, row surface                                                                    |

### Global utilities

Mask, blur, and other cross-package utilities live in `@afenda/ui-core/tokens/globals.css` (e.g. `.mask-gradient-x`).

---

## Testing

- **Vitest + RTL** for component logic (render, props, callbacks).
- **Storybook** for visual regression and interaction testing.
- Smoke test checklist: render, conditional rendering (loading, empty), callbacks fire.

---

## Composition patterns

### Children slot

Prefer `children: React.ReactNode` for flexible action/content slots:

```tsx
<ActionBar selectedCount={n}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</ActionBar>
```

### Variant delegation

When a variant requires significantly different layout, delegate to a separate component (e.g. `ActionBar` → `StickyActionBar` for `variant="sticky"`).

---

## Success criteria

- ESLint clean (no unused imports, React namespace only when needed).
- Consistent a11y (live regions, aria-labels, decorative icons).
- Motion-reduce on all animated patterns.
- At least smoke tests for interactive patterns.
- Storybook coverage for all patterns.
