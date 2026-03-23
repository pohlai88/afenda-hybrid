---
name: react-state-management
description: Where state lives — React state, server state, URL, and client stores in the monorepo.
---

## Purpose

Place state **as close as possible** to where it is used, and use the **simplest** store that satisfies constraints (SSR, sharing, persistence).

## When to Apply

- Form drafts and UI toggles: local `useState` / `useReducer` in client components
- Shareable list selection or ERP chrome: Zustand in `erp-view-pack` (client-only)
- Deep-linkable filters: URL search params via Next.js/navigation APIs in the app

## Anti-Patterns

- Global store for values that only one screen needs
- Storing non-serializable data in URL or in server-passed props
- Mutating props or state snapshots during render

## Code Examples

```tsx
"use client";
import { useState } from "react";

export function FilterBar() {
  const [query, setQuery] = useState("");
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

## AFENDA Mapping

- **`ui-core`:** No Zustand; use React state or controlled patterns from parents.
- **`erp-view-pack`:** Selection and bulk UX may use Zustand stores; document store scope (per-module vs global).
- **`apps/web`:** Server state from loaders/actions; client state for interaction; align with server actions for mutations.
