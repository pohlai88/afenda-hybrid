---
name: react-aria-patterns
description: ARIA roles, states, and properties for ERP-style React components.
---

## Purpose

Give assistive technologies **correct semantics** for complex widgets: grids, dialogs, toolbars, menus, and status regions.

## When to Apply

- Data grids with sort/filter and row selection
- Command surfaces and overflow menus
- Bulk action bars and destructive confirmations
- Toasts and async status updates

## Anti-Patterns

- Adding `role="button"` on `div` without keyboard handlers
- Using `aria-label` to hide missing visible labels when a visible label is required
- Over-using `aria-live="assertive"` (interrupts screen reader users)

## Code Examples

```tsx
<button type="button" aria-pressed={selected} aria-label={`Select row ${name}`}>
  {name}
</button>
```

```tsx
<div role="status" aria-live="polite" className="sr-only">
  {message}
</div>
```

## AFENDA Mapping

- Cross-check [docs/patterns/bulk-interaction-standard.md](../../../docs/patterns/bulk-interaction-standard.md) and [docs/patterns/data-grid-interaction-standard.md](../../../docs/patterns/data-grid-interaction-standard.md).
- **`erp-view-pack`:** Selection checkboxes and “select all” must expose correct `aria-checked` / mixed states when applicable.
