---
name: react-quality-tooling-map
description: Recommended tooling for static analysis vs metrics — JS-first transforms, Python for reporting.
---

## Purpose

Steer automation to **JS-native** AST and lint tooling for React semantics; use Python for **aggregation and dashboards** when needed.

## When to Apply

- Planning Phase 2 (lint packs, codemods, CI gates)
- Choosing between Biome, ESLint, ts-morph for a task
- Building repo-wide metrics or quality dashboards

## Anti-Patterns

- Using Python to parse TSX for risky transforms (prefer Babel/tsc/ts-morph/SWC ecosystem)
- Duplicating the same rule in three tools without ownership
- Running heavy analysis on every keystroke in dev

## Code Examples

| Task                                          | Suggested tool                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Package layer / forbidden `@afenda/*` imports | **[react-governance CLI](../../../../tools/react-governance/README.md)** (`pnpm react-governance`, `--json`, `--changed`) |
| Lint rules, hooks purity                      | ESLint + `eslint-plugin-react-hooks`                                                                                      |
| Type-safe refactors                           | TypeScript compiler API / **ts-morph**                                                                                    |
| Fast format + some lint                       | **Biome** (evaluate vs existing ESLint stack)                                                                             |
| Bundles                                       | Next.js analyzer, `vite-bundle-visualizer` (context-dependent)                                                            |
| Coverage                                      | Vitest coverage (see [.agents/skills/vitest/SKILL.md](../../vitest/SKILL.md))                                             |

## AFENDA Mapping

- **This repo today:** root ESLint 9 + Prettier + TypeScript; Vitest in packages — align new tooling with `CONTRIBUTING.md` and existing config.
- **Python (v1 shipped):** `tools/react-governance` scans TS/TSX for layer violations and optional ESLint orchestration; reserve `summary.score` in JSON for Phase 3 scoring.
- **Python (Phase 2+):** Aggregate Component Quality Index, trend scores, and pattern frequency across `git` history — not for semantic refactors by default.
