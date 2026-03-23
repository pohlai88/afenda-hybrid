---
name: react-quality-engine
description: >-
  Meta-skill: React Quality Orchestrator for AFENDA-HYBRID. Coordinates architecture, performance,
  accessibility, and design-pattern skills for audits, scoring (Component Quality Index), and
  confidence-tiered refactors. Use for full-route reviews, legacy refactors, and governance checks.
metadata:
  author: AFENDA team
  version: "2026.03.23"
  source: AFENDA-HYBRID governance + React docs
  official_docs: https://react.dev
---

This skill **coordinates**:

- [react-architecture](../react-architecture/SKILL.md) — structural compliance, RSC/client boundaries, package layering
- [react-performance](../react-performance/SKILL.md) — runtime + build health
- [react-accessibility](../react-accessibility/SKILL.md) — a11y compliance
- [react-design-patterns](../react-design-patterns/SKILL.md) — hooks, forms, errors, composition consistency

Use **[AGENTS.md](../../../AGENTS.md)** for routing (Skill Invocation Matrix) and repo-wide non-goals.

**Automated package-layer gate:** `pnpm react-governance` (see [tools/react-governance/README.md](../../../tools/react-governance/README.md); `check --json` reserves `summary.score` for scoring pipelines).

> Provenance: see [GENERATION.md](GENERATION.md).

## Orchestration protocol

1. **Classify** the task (audit vs targeted fix vs refactor).
2. **Pick primary skill** from the matrix in `AGENTS.md`; pull secondaries only as needed.
3. For audits, walk dimensions in [scoring-model](references/scoring-model.md) and record evidence.
4. For code changes, assign a **confidence tier** per [refactor-safety-rules](references/refactor-safety-rules.md).
5. **Output** for humans: problem, why it matters, suggested fix, before/after (when tier allows), tier, and score impact.

## Core references

| Topic      | Description                         | Reference                                                        |
| ---------- | ----------------------------------- | ---------------------------------------------------------------- |
| Scoring    | Component Quality Index (0–100)     | [scoring-model](references/scoring-model.md)                     |
| Safety     | Confidence tiers A–D                | [refactor-safety-rules](references/refactor-safety-rules.md)     |
| Governance | Layers, imports, `"use client"`     | [architecture-governance](references/architecture-governance.md) |
| Complexity | Complexity index signals            | [complexity-index](references/complexity-index.md)               |
| Tooling    | ESLint, TS, Biome, ts-morph, Python | [tool-recommendations](references/tool-recommendations.md)       |

## Non-Goals

This skill does **not**:

- Bypass human review for tier C/D changes
- Change product requirements or authorization rules
- Run production deploys or mutate infrastructure
- Implement CI jobs or ESLint rule packs (Phase 2 tooling)

## AFENDA Monorepo Reality Mapping

| Area                   | Enforce                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| **All React packages** | Scoring and tiers apply; evidence should cite file paths and pattern docs                    |
| **erp-view-pack**      | Cross-check `_CONVENTIONS.md` / `_AUDIT_MATRIX.md` when scoring pattern compliance           |
| **apps/web**           | Next.js boundaries and server actions weigh heavily under architecture + pattern consistency |
| **db / non-UI**        | Out of scope except type safety or shared types touching UI                                  |

## Entry point

Repository agents should start at [AGENTS.md](../../../AGENTS.md), then open this meta-skill when performing **quality audits** or **guided refactors**.
