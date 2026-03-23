---
name: react-form-patterns
description: Forms with Zod, server actions, and optimistic updates in Next.js.
---

## Purpose

Keep forms **validated, accessible, and resilient**: server-authoritative validation with good client UX.

## When to Apply

- Create/edit dialogs in `apps/web`
- Metadata-driven forms in `view-engine` that post through app adapters
- Optimistic list updates after mutations

## Anti-Patterns

- Trusting client-only validation for security or invariants
- Clearing form state on every keystroke (focus loss)
- Optimistic updates without rollback/reconciliation on failure

## Code Examples

Server action shape (conceptual):

```tsx
"use server";

import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export async function createEmployee(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, errors: parsed.error.flatten() };
  // persist...
  return { ok: true as const };
}
```

## AFENDA Mapping

- Reuse shared validation helpers from `apps/web/src/lib/form-validation.ts` when present.
- Optimistic flows: align with hooks such as `use-optimistic-mutation` in the app layer.
- Cross-check [docs/patterns/destructive-action-safety-standard.md](../../../docs/patterns/destructive-action-safety-standard.md) for high-impact submits.
