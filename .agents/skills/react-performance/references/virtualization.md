---
name: react-virtualization
description: Virtualized lists and grids for large datasets — TanStack Virtual and patterns.
---

## Purpose

Render **only visible rows** for large tables/lists to keep main-thread work bounded.

## When to Apply

- Lists > ~200 rows with complex cells on typical hardware
- Kanban columns with many cards
- Metadata-driven grids where record count is unbounded

## Anti-Patterns

- Mapping thousands of DOM nodes without windowing
- Virtualizing without stable row height strategy (janky scroll) — document fixed vs dynamic row heights
- Breaking keyboard navigation by stripping focusable elements from the DOM incorrectly

## Code Examples

Conceptual pattern (adapter varies by table implementation):

```tsx
// Parent computes visible slice; row component stays pure and memo-friendly
const virtualRows = rowVirtualizer.getVirtualItems();
return virtualRows.map((v) => (
  <Row key={v.key} row={rows[v.index]} style={{ transform: `translateY(${v.start}px)` }} />
));
```

## AFENDA Mapping

- Align with [docs/patterns/data-grid-interaction-standard.md](../../../docs/patterns/data-grid-interaction-standard.md): selection, focus, and scroll must stay coherent.
- **`view-engine`:** Prefer virtualization in list/kanban renderers when metadata signals large collections.
