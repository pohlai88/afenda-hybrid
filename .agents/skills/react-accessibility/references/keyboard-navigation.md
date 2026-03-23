---
name: react-keyboard-navigation
description: Keyboard interaction — focus order, trapping, roving tabindex, shortcuts.
---

## Purpose

Ensure power users and assistive technology users can **complete tasks without a mouse**.

## When to Apply

- Modals/sheets: trap focus, restore focus on close
- Data grids: arrow keys, home/end, page up/down per grid pattern
- Command palette / search: typeahead, escape to dismiss
- Global shortcuts (use shared hooks in `ui-core` when present)

## Anti-Patterns

- Focusable elements with `tabIndex={0}` inserted in random DOM order
- Opening a dialog without moving focus inside
- Hijacking browser shortcuts without discoverability or disable path

## Code Examples

```tsx
// Prefer native focusable controls
<button type="button">Save</button>
```

For app-wide shortcuts, align with existing hooks such as `use-keyboard-shortcut` in `@afenda/ui-core` when available.

## AFENDA Mapping

- **`ui-core`:** Document shortcut conflicts with Radix components (menus, dialogs).
- **`erp-view-pack`:** Toolbar and bulk bars: ensure logical tab order and visible focus.
- **`apps/web`:** Next.js layouts: avoid duplicate skip links; one primary “skip to content” per page where required.
