---
name: react-component-quality-index
description: Component Quality Index (0–100) — weighted dimensions for React UI in AFENDA-HYBRID.
---

## Purpose

Provide a **single comparable score** for components/routes while avoiding overfitting to one metric (e.g. only LOC).

## When to Apply

- PR review of large UI changes
- Refactor planning for legacy screens
- Periodic health reviews of critical modules (grids, workflows)

## Anti-Patterns

- Treating the score as objective truth without human judgment
- Punishing necessary complexity (e.g. accessibility-rich grids) without context
- Omitting evidence (file + pattern doc citation)

## Code Examples

Scoring is **evidence-based**. Example note:

> Architecture −10: `ui-core` imports `erp-view-pack` (layer violation). See `package-layering.md`.

## AFENDA Mapping

### Weighted dimensions (100 points)

| Dimension                | Weight  | Signals                                                                    |
| ------------------------ | ------- | -------------------------------------------------------------------------- |
| Architecture compliance  | **25%** | Layering, RSC/client boundaries, metadata vs hard-coded ERP                |
| Performance health       | **20%** | Avoidable re-renders, missing virtualization for large lists, bundle bloat |
| Accessibility compliance | **20%** | Roles/labels, keyboard, focus, live regions for async feedback             |
| Complexity index         | **15%** | See [complexity-index.md](complexity-index.md)                             |
| Type safety              | **10%** | `any`, incorrect props, missing narrowing, unsafe casts                    |
| Pattern consistency      | **10%** | Match `docs/patterns/*` and `_CONVENTIONS.md` for ERP widgets              |

### Rubric bands (guidance)

| Score  | Band                                  |
| ------ | ------------------------------------- |
| 90–100 | Excellent — minor nits only           |
| 75–89  | Good — address before major extension |
| 60–74  | Risky — plan refactor or split        |
| < 60   | Critical — prioritize remediation     |
