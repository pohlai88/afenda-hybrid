---
name: react-design-patterns
description: >-
  Implementation patterns for AFENDA-HYBRID React code: custom hooks, compound components,
  error boundaries / error.tsx, forms, server actions, and optimistic updates.
metadata:
  author: AFENDA team
  version: "2026.03.23"
  source: React docs + AFENDA-HYBRID codebase analysis
  official_docs: https://react.dev
---

This skill bridges **generic React patterns** with how AFENDA ships UI: Radix-style primitives in `ui-core`, metadata-driven views, ERP chrome, and Next.js server actions in the app.

> Provenance: see [GENERATION.md](GENERATION.md).

## Core

| Topic               | Description                               | Reference                                                |
| ------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Hooks               | Naming, composition, dependencies         | [hooks-patterns](references/hooks-patterns.md)           |
| Compound components | Context + subcomponents                   | [compound-components](references/compound-components.md) |
| Errors              | Boundaries, `error.tsx`, recovery         | [error-boundaries](references/error-boundaries.md)       |
| Forms               | Validation, server actions, optimistic UI | [form-patterns](references/form-patterns.md)             |

## Non-Goals

This skill does **not**:

- Define business domain models or authorization matrices
- Create new design tokens or ERP typography scales
- Establish REST/GraphQL API contracts
- Replace database validation (`@afenda/db`)

## AFENDA Monorepo Reality Mapping

| Area              | Enforce                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ui-core**       | Hooks are generic (e.g. `use-debounce`, `use-media-query`); no app-specific server action imports                   |
| **view-engine**   | Widgets remain controlled/presentational; validation messages map from metadata where applicable                    |
| **erp-view-pack** | Pattern components compose `ui-core` + `view-engine`; follow `_CONVENTIONS.md` for `"use client"` and `cn()`        |
| **apps/web**      | Server actions live under `src/lib/actions` or colocated patterns; forms use shared validation helpers when present |

## Related skills

- [react-architecture](../react-architecture/SKILL.md) — where state and boundaries live
- [react-accessibility](../react-accessibility/SKILL.md) — form labels, errors, focus
