---
name: react-error-boundaries
description: Error boundaries, Next.js error.tsx, and recovery UX.
---

## Purpose

Prevent **full-app crashes** from isolated UI failures and give users a recoverable path.

## When to Apply

- Risky third-party widgets
- Large route segments where partial failure is acceptable
- Next.js App Router: `error.tsx` boundaries per route segment

## Anti-Patterns

- Catching errors in render with try/catch (class error boundaries or framework boundaries handle tree errors)
- Swallowing errors without logging/monitoring hooks
- Error UI that traps focus or hides navigation

## Code Examples

Next.js segment error file (conceptual):

```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
```

## AFENDA Mapping

- **`apps/web`:** Align dashboard/public layouts with route `error.tsx` patterns; ensure a11y (`role="alert"`, keyboard reset).
- **Packages:** Prefer throwing clear errors during development; avoid silent failures in metadata renderers.
