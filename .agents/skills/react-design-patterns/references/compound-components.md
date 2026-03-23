---
name: react-compound-components
description: Compound components and context for design-system style APIs.
---

## Purpose

Expose **ergonomic APIs** (`<Card><Card.Header /></Card>`) while keeping internal state encapsulated.

## When to Apply

- Primitives built on Radix in `ui-core`
- Pattern components with multiple coordinated regions (toolbar zones, panels)

## Anti-Patterns

- Context for data that should be explicit props (hurts discoverability)
- Deep provider trees for purely visual grouping
- Breaking ref forwarding without documenting it

## Code Examples

```tsx
const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState("a");
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab must be used within Tabs");
  const selected = ctx.active === id;
  return (
    <button type="button" aria-selected={selected} onClick={() => ctx.setActive(id)}>
      {children}
    </button>
  );
}
```

## AFENDA Mapping

- **`ui-core`:** Follow Radix composition models; avoid inventing parallel prop APIs for the same behavior.
- **`erp-view-pack`:** Compound APIs for command surfaces should align with [docs/patterns/command-surface-toolbar-standard.md](../../../docs/patterns/command-surface-toolbar-standard.md).
