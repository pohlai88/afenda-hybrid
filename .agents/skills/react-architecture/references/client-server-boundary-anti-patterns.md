---
name: react-client-server-boundary-anti-patterns
description: Common RSC / "use client" mistakes and how to detect them early.
---

## Purpose

Reduce costly bugs from **wrong module graph** placement: server-only code leaking into client bundles, or accidental serialization errors.

## When to Apply

- Adding `"use client"` to a file
- Importing `fs`, database clients, or secrets into shared modules
- Passing callbacks or class instances from Server → Client Components

## Anti-Patterns

- **Server-only in client:** `import 'server-only'` boundaries violated; env vars used client-side that expose secrets
- **Accidental client boundary:** Large dependency trees pulled in because one child needed `useState` at the top of the tree
- **Async Client Components:** Using `async function` in a `"use client"` module (invalid model)
- **Passing JSX from server with non-serializable props** nested inside

## Code Examples

```tsx
// Bad: server module imported by a client component transitively
"use client";
import { getUserFromDb } from "./server-queries"; // breaks if server-only
```

```tsx
// Good: fetch on server, pass plain data
// page.tsx (server)
const user = await getUserFromDb();
return <Profile name={user.name} />;
```

## AFENDA Mapping

- **`apps/web`:** Audit imports when adding `"use client"`; keep data fetching in Server Components or route handlers.
- **Packages:** Avoid `next/headers`, `next/cache`, or DB in `ui-core` / `view-engine` unless behind a clearly server-only entry (prefer keep server code in the app).
