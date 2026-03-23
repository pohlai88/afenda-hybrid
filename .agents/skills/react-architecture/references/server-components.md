---
name: react-server-components
description: Server Components, data fetching, and Suspense boundaries in Next.js App Router.
---

## Purpose

Define how **Server Components** (RSC) should fetch data, stream UI, and compose with Suspense so client boundaries stay minimal and correct.

## When to Apply

- Default exports in `app/` routes that do not need `useState`, `useEffect`, or browser APIs
- Loading skeletons via `loading.tsx` and granular `<Suspense>` boundaries
- Passing **serializable** props from server to client components

## Anti-Patterns

- Marking an entire route tree `"use client"` to avoid thinking about boundaries
- Passing functions, class instances, or non-serializable data as props to Client Components
- Performing side effects during render on the server (mutations, timers, subscriptions)
- Importing server-only modules into files that are bundled for the client

## Code Examples

```tsx
// Server Component (no "use client") — async allowed in Next.js RSC
export default async function Page() {
  const data = await fetchData();
  return <ClientToolbar initialFilter={data.defaultFilter} />;
}
```

```tsx
"use client";
import { useState } from "react";

export function ClientToolbar({ initialFilter }: { initialFilter: string }) {
  const [filter, setFilter] = useState(initialFilter);
  // ...
}
```

## AFENDA Mapping

- **`apps/web`:** Prefer async Server Components for page-level data; push interactivity to leaf client components.
- **`packages/*`:** Packages should not assume Next.js data APIs unless explicitly documented; keep `ui-core` free of `next/*` server imports.
