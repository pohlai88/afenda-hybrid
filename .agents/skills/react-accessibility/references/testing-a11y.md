---
name: react-testing-a11y
description: Testing accessibility — axe, Storybook addon, Vitest + Testing Library.
---

## Purpose

Catch regressions with **automated checks** plus targeted interaction tests.

## When to Apply

- New composite widgets or pattern components
- Changes to focus management or live regions
- CI gates for critical flows (login, create record, bulk delete confirm)

## Anti-Patterns

- Relying only on snapshot tests for a11y
- Ignoring Storybook a11y violations as “cosmetic”
- Testing `aria-*` strings without simulating keyboard use

## Code Examples

Vitest + Testing Library (conceptual):

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("dialog traps focus", async () => {
  const user = userEvent.setup();
  render(<ConfirmDialog open />);
  await user.tab();
  expect(screen.getByRole("button", { name: /confirm/i })).toHaveFocus();
});
```

## AFENDA Mapping

- Use [.agents/skills/vitest/SKILL.md](../../vitest/SKILL.md) for test runner conventions.
- Use [.agents/skills/storybook-ai/SKILL.md](../../storybook-ai/SKILL.md) when Storybook + `addon-a11y` / MCP workflows apply.
- **`erp-view-pack` / `view-engine`:** Prefer tests that combine roles + keyboard navigation for grids and toolbars.
