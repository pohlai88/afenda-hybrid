---
name: react-complexity-index
description: Heuristic component complexity signals for scoring and refactors.
---

## Purpose

Highlight components that are **hard to test, review, and evolve** so teams split or simplify before scores collapse.

## When to Apply

- Files > ~300 lines with mixed concerns
- Components with many hooks and effects
- JSX trees with deep nesting and multiple responsibilities

## Anti-Patterns

- Using complexity metrics to shame without offering a split plan
- Ignoring domain-required complexity (regulated workflows)

## Code Examples

Heuristic formula (guidance, not a linter):

```
raw = w1*props + w2*hooks + w3*useState + w4*useEffect + w5*jsxNodes + w6*branches
complexity_index = normalize(raw)  // map to 0–100 subscore for scoring model
```

Suggested **signals** (tune weights per team):

| Signal                  | Notes                                            |
| ----------------------- | ------------------------------------------------ |
| Prop count              | Many optional props → consider composition       |
| Hook count              | Split into child components or custom hooks      |
| `useEffect` count       | Data sync smells; verify server/client ownership |
| JSX node count          | Extract rows, cells, toolbars                    |
| Cyclomatic-ish branches | Simplify with early returns or strategy objects  |

## AFENDA Mapping

- ERP grids and toolbars may score “high” legitimately — pair complexity with **a11y** and **pattern compliance** evidence.
- Prefer extracting **view-engine** widgets or **erp-view-pack** pattern pieces over growing app route files.
