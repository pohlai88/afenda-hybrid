---
name: react-hooks-patterns
description: Conventions for custom hooks in the monorepo.
---

## Purpose

Custom hooks encapsulate **reusable stateful logic** with stable, testable APIs.

## When to Apply

- Repeated logic across multiple components (media queries, shortcuts, clipboard)
- Sharing non-visual behavior between `ui-core` patterns and app code
- Isolating subscriptions (event listeners, observers)

## Anti-Patterns

- Hooks that hide side effects that should be explicit (`useEffect` doing surprise fetches)
- Returning unstable object identities every render without need
- Calling hooks conditionally or from non-component functions

## Code Examples

```ts
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

## AFENDA Mapping

- Place generic hooks in `packages/ui-core/src/hooks/` and export from the package public API when stable.
- ERP-specific hooks belong in `erp-view-pack` or `view-engine`, not `ui-core`.
