---
name: react-composition-patterns
description: Component composition — children, slots, and render delegation in React.
---

## Purpose

Keep components **reusable and testable** by composing small pieces instead of prop-drilling optional UI everywhere.

## When to Apply

- Shared primitives in `@afenda/ui-core` (e.g. dialog + header + footer slots)
- Pattern components in `@afenda/erp-view-pack` that wrap chrome (toolbars, panels)
- View-engine renderers that delegate field rendering to registered widgets

## Anti-Patterns

- “God components” with dozens of boolean props (`showX`, `variantY`)
- Rendering unrelated concerns in one component to avoid creating a child file
- Calling component functions as plain functions instead of using JSX (breaks rules of React)

## Code Examples

```tsx
function PageHeader({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {actions}
    </header>
  );
}
```

## AFENDA Mapping

- **`ui-core`:** Prefer composition + `children` or small subcomponents over growing prop surfaces.
- **`view-engine`:** Use metadata + widget registry to compose views; avoid hard-coding ERP labels in generic renderers.
- **`erp-view-pack`:** Compose using documented pattern tokens (command surface, selection bars) per `docs/patterns/`.
