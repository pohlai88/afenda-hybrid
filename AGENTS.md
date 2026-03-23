# AFENDA-HYBRID — Agent & AI governance

This file is the **entry point** for automated agents working in this repository. Read it before changing React UI, patterns, or quality-related code.

## Monorepo map

| Package / app            | NPM name                | Role                                                                  |
| ------------------------ | ----------------------- | --------------------------------------------------------------------- |
| `packages/db`            | `@afenda/db`            | Schema, migrations, Drizzle — **not** React UI                        |
| `packages/ui-core`       | `@afenda/ui-core`       | Radix primitives, layout patterns, hooks, design tokens               |
| `packages/view-engine`   | `@afenda/view-engine`   | Metadata-driven views, widgets, list/kanban/form renderers            |
| `packages/erp-view-pack` | `@afenda/erp-view-pack` | ERP chrome, selection/bulk UX, pattern tokens on top of view-engine   |
| `apps/web`               | (Next.js app)           | App Router, routes, server actions, composition of workspace packages |

**Declared pnpm workspace:** `packages/*` only. If `apps/web` is present locally, treat it as the primary Next.js consumer; add it to `pnpm-workspace.yaml` if you need it as a first-class workspace package.

## React layer hierarchy (dependency direction)

```
@afenda/ui-core  →  @afenda/view-engine  →  @afenda/erp-view-pack  →  apps/web
```

- **Never** import “up” the stack (e.g. `ui-core` must not depend on `view-engine`).
- **Apps** may compose all layers; **libraries** only depend on layers below them.

## Mechanical enforcement (react-governance CLI)

Layer and cross-package import rules are **machine-checked** by the Python CLI under [tools/react-governance/](tools/react-governance/) (stable rule IDs: `LAYER_001`–`LAYER_004`, `IMPORT_001`).

| Command                      | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `pnpm react-governance`      | Full scan; exit **1** on ERROR rules                            |
| `pnpm react-governance:ci`   | Same + **fail on WARN** (strict CI)                             |
| `pnpm react-governance:json` | JSON for dashboards / future scoring (`summary.score` reserved) |

Subcommands: `python -m react_governance rules` · `explain LAYER_001`. See [tools/react-governance/README.md](tools/react-governance/README.md). This is the enforcement counterpart to [react-architecture — package layering](.agents/skills/react-architecture/references/package-layering.md).

## Cross-cutting rules

- **React:** Prefer React 19 APIs and [Rules of React](https://react.dev/reference/rules) (purity, hooks, no direct component invocation).
- **TypeScript:** Respect strict typing; do not widen types to silence errors without a documented reason.
- **Next.js App Router:** Server Components by default; add `"use client"` only at interaction boundaries.
- **Styling:** Tailwind v4 where used; follow repo PostCSS / `@import "tailwindcss"` conventions.
- **Human process:** See [CONTRIBUTING.md](CONTRIBUTING.md) for doc tiers, gates, and commit hooks.

## Pattern standards (human + agent)

Canonical UX/architecture standards live under [docs/patterns/](docs/patterns/) (see [docs/patterns/README.md](docs/patterns/README.md)). ERP React implementations should align with [packages/erp-view-pack/src/patterns/\_CONVENTIONS.md](packages/erp-view-pack/src/patterns/_CONVENTIONS.md) and [packages/erp-view-pack/src/patterns/\_AUDIT_MATRIX.md](packages/erp-view-pack/src/patterns/_AUDIT_MATRIX.md).

## Agent skills (`.agents/skills/`)

| Skill                                                                  | When to use                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [react-architecture](.agents/skills/react-architecture/SKILL.md)       | RSC/client boundaries, composition, state placement, package layering                       |
| [react-performance](.agents/skills/react-performance/SKILL.md)         | Runtime re-renders, virtualization, bundles, compiler-related performance                   |
| [react-accessibility](.agents/skills/react-accessibility/SKILL.md)     | ARIA, keyboard, focus, screen readers, a11y testing                                         |
| [react-design-patterns](.agents/skills/react-design-patterns/SKILL.md) | Hooks, compound components, errors, forms, server actions                                   |
| [react-quality-engine](.agents/skills/react-quality-engine/SKILL.md)   | **Meta-skill:** audits, scoring, refactor safety tiers — orchestrates the four skills above |

### Meta-skill: React Quality Orchestrator

The **react-quality-engine** skill coordinates:

- `react-architecture` — structural compliance
- `react-performance` — runtime + build health
- `react-accessibility` — a11y compliance
- `react-design-patterns` — pattern consistency

Use it for full-file or full-route quality reviews and for guided refactors with confidence tiers.

### Skill Invocation Matrix

Use this table to pick the **primary** skill first; add the **secondary** when the task spans concerns.

| Situation                       | Primary skill         | Secondary skill             |
| ------------------------------- | --------------------- | --------------------------- |
| Designing new shared component  | react-architecture    | react-design-patterns       |
| Fixing re-render performance    | react-performance     | react-quality-engine        |
| ERP grid keyboard issues        | react-accessibility   | react-design-patterns       |
| Large legacy component refactor | react-quality-engine  | react-architecture          |
| Layering / import violations    | react-architecture    | react-quality-engine        |
| Writing new custom hook         | react-design-patterns | react-architecture          |
| Adding ARIA to bulk selection   | react-accessibility   | react-architecture          |
| Optimizing data grid render     | react-performance     | react-accessibility         |
| Full component quality audit    | react-quality-engine  | (all four knowledge skills) |

## Other skills in this repo

| Location                                                                                   | Topic                                           |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| [.agents/skills/vitest/SKILL.md](.agents/skills/vitest/SKILL.md)                           | Vitest, mocks, coverage, monorepo test commands |
| [.agents/skills/storybook-ai/SKILL.md](.agents/skills/storybook-ai/SKILL.md)               | Storybook AI / MCP workflow                     |
| [.cursor/skills/tailwind-v4-upgrade/SKILL.md](.cursor/skills/tailwind-v4-upgrade/SKILL.md) | Tailwind v3 → v4 migration                      |

## Non-goals for agents (repository-wide)

This `AGENTS.md` does **not** authorize:

- Rewriting business rules or API contracts without explicit product/owner approval
- Changing design tokens or global typography scales without following [docs/patterns/erp-visual-density-typography-standard.md](docs/patterns/erp-visual-density-typography-standard.md)
- Silent auto-fix of logic-heavy refactors — use **react-quality-engine** confidence tiers and human review

---

**Official React reference:** https://react.dev
