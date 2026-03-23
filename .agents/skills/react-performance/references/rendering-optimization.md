---
name: react-rendering-optimization
description: Runtime React performance — re-renders, keys, and component splitting.
---

## Purpose

Reduce **unnecessary renders** and keep update work proportional to user-visible changes.

## When to Apply

- Profiling shows frequent parent re-renders with expensive child trees
- Lists re-render all rows on minor state changes
- Unstable `key` props cause remounts and lost focus

## Anti-Patterns

- Lifting state high “just in case” when only a leaf needs it
- Using array index as `key` for dynamic/reorderable lists
- Sprinkling `useMemo`/`useCallback` without measurement
- Deriving state from props in render in ways that fight React’s model

## Code Examples

```tsx
// Prefer moving interactive state down
function Row({ id, title }: { id: string; title: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setExpanded((e) => !e)}>
        {title}
      </button>
      {expanded && <Detail id={id} />}
    </div>
  );
}
```

## AFENDA Mapping

- **`view-engine`:** Keep row components pure where possible; pass stable identifiers as keys from metadata record ids.
- **`erp-view-pack`:** Selection stores: subscribe components to minimal state slices to avoid rerendering entire grids.
