---
name: react-refactor-safety-rules
description: Confidence-based refactor tiers (A–D) for enterprise-safe AI assistance.
---

## Purpose

Replace binary “safe/unsafe” with **tiered actions** tied to confidence and blast radius.

## When to Apply

- Any automated or AI-suggested code edit
- Large refactors proposed from audit findings
- Codemods or formatting changes touching many files

## Anti-Patterns

- Auto-applying tier B/C/D without user approval
- Hiding uncertainty — if unsure, use tier D
- Mixing business-logic edits with style-only edits in one changeset

## Code Examples

Deliverable template for humans:

```md
**Tier:** B (confidence ~88%)
**Problem:** Unstable inline object prop causes list row re-renders.
**Why:** Parent passes `style={{ width: 100 }}` each render.
**Fix:** Lift constant styles or memoize by row id.
**Before/After:** (patch preview)
```

## AFENDA Mapping

### Confidence tiers

| Tier  | Confidence | Action                                                                                              |
| ----- | ---------- | --------------------------------------------------------------------------------------------------- |
| **A** | **> 95%**  | Safe auto-apply: import ordering, formatting, trivial renames, obvious dead code with no references |
| **B** | **80–95%** | Suggest with **before/after** preview; user applies                                                 |
| **C** | **50–80%** | **Human review required** — include problem / why / fix / risks                                     |
| **D** | **< 50%**  | **Analysis only** — no code suggestion; list open questions                                         |

### Escalation rules

- Touching **auth**, **money**, **bulk destructive** actions → minimum tier **B**, often **C**
- Cross-package **public API** changes → minimum tier **C**
- **RSC boundary** changes → minimum tier **B**
