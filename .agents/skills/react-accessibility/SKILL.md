---
name: react-accessibility
description: >-
  Accessibility for React UIs in AFENDA-HYBRID: semantic HTML, ARIA, keyboard support,
  focus management, and testing. Use for grids, dialogs, bulk selection, notifications, and command surfaces.
metadata:
  author: AFENDA team
  version: "2026.03.23"
  source: React docs + AFENDA-HYBRID codebase analysis
  official_docs: https://react.dev
---

Accessible ERP UIs require **keyboard-first** workflows, correct **roles/states**, predictable **focus**, and **live region** behavior for async feedback.

**Key ideas**

- Prefer native elements (`button`, `a`, `input`, `label`) before ARIA
- Composite widgets (grid, listbox, menu) follow documented interaction models
- Decorative icons are `aria-hidden`; meaningful icons need accessible names

> Provenance: see [GENERATION.md](GENERATION.md).

## Core

| Topic            | Description                               | Reference                                                |
| ---------------- | ----------------------------------------- | -------------------------------------------------------- |
| ARIA & semantics | Roles, states, properties for ERP widgets | [aria-patterns](references/aria-patterns.md)             |
| Keyboard         | Focus order, trapping, shortcuts          | [keyboard-navigation](references/keyboard-navigation.md) |
| Testing          | Automated a11y checks in CI and Storybook | [testing-a11y](references/testing-a11y.md)               |

## Non-Goals

This skill does **not**:

- Change design tokens, color palettes, or typography scales (see [erp-visual-density-typography-standard.md](../../../docs/patterns/erp-visual-density-typography-standard.md))
- Redefine brand visual design
- Replace product copy or localization strategy

## AFENDA Monorepo Reality Mapping

| Area              | Enforce                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **ui-core**       | Primitives wrap Radix where applicable; ensure labels, descriptions, and focus rings are preserved            |
| **view-engine**   | Metadata-driven controls expose labels and descriptions; don’t strip `id`/`htmlFor` relationships             |
| **erp-view-pack** | Bulk selection, destructive actions, notifications: follow `docs/patterns` (bulk, destructive, notifications) |
| **apps/web**      | Route-level errors (`error.tsx`) remain operable via keyboard; skip links where appropriate                   |

## Related skills

- [react-design-patterns](../react-design-patterns/SKILL.md) — forms and error boundaries interact with a11y
- [react-architecture](../react-architecture/SKILL.md) — client boundaries affect focus restoration and portals
