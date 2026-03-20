# Documentation cleanup plan

**Purpose**: Prepare a controlled cleanup of **legacy / duplicate** Markdown so the repo has a small set of **canonical** docs and clear rules for what to archive or remove.

**Status**: **Executed** (March 2026). Legacy Markdown lives under **`docs/archive/`**. Drizzle introspect outputs `src/db/migrations/schema.ts` and `relations.ts` were **removed** and **gitignored**; canonical schema remains **`src/db/schema/`**.

---

## Principles

1. **One topic → one canonical doc** (others become redirects, merge targets, or archive).
2. **Time-bound validation reports** belong in `docs/archive/` or are deleted after merge.
3. **Root** should hold at most `README.md` (if added); long reports live under `docs/`.
4. **`.cursor/`** reports are local/agent artifacts — default to **not** shipping them (or list in `.gitignore`).

---

## Canonical docs (keep & maintain)

| Topic | Path | Notes |
|--------|------|--------|
| Schema lockdown & custom SQL process | `docs/SCHEMA_LOCKDOWN.md` | Master policy |
| DB-first architecture | `docs/architecture/01-db-first-guideline.md` | Includes §8.2 custom SQL / migrations |
| Architecture overview | `docs/architecture/00-overview.md` | |
| Quick start / daily commands | `docs/QUICK_START.md` | Merge duplicate command lists here |
| CI gates (single entry) | `docs/CI_GATES.md` | Prefer this over many `CI_GATE_*` files |
| Custom SQL reference (SQL + patterns) | `src/db/schema/audit/CUSTOM_SQL.md` | Executable SQL reference |
| DB layer overview | `src/db/README.md` | Points to SCHEMA_LOCKDOWN + scripts |
| Docker test DB | `docs/testing/DOCKER_TEST_SETUP.md` | |
| Patterns | `docs/patterns/*` | Keep |
| Issue template | `.github/ISSUE_TEMPLATE/custom-sql-request.md` | Keep |

---

## Legacy / duplicate clusters

### A. Migration readiness (high overlap)

| File | Suggestion |
|------|------------|
| `MIGRATION_READINESS_REPORT.md` (repo root) | **Archive** or **delete** after merging any unique bullets into `docs/QUICK_START.md` + `docs/SCHEMA_LOCKDOWN.md` |
| `docs/MIGRATION_READINESS_VALIDATION.md` | **Archive** (deep audit; rarely needed day-to-day) |
| `docs/MIGRATION_VALIDATION_SUMMARY.md` | **Archive** or **merge** unique checklist into `docs/QUICK_START.md` |

**Target state**: One short **`docs/MIGRATIONS.md`** (optional) *or* keep everything in `QUICK_START` + `SCHEMA_LOCKDOWN` only.

---

### B. Environment / “commands verified” (overlap with QUICK_START)

| File | Suggestion |
|------|------------|
| `ENVIRONMENT_SETUP_COMPLETE.md` (root) | **Archive** or **delete**; unique steps → `docs/QUICK_START.md` |
| `docs/BLOCKER_RESOLUTION_SUMMARY.md` | **Archive** (historical) |
| `COMMANDS_VERIFIED.md` (root) | **Delete** or **archive**; redundant with `docs/QUICK_START.md` |

---

### C. Custom SQL implementation wave (time-bound)

| File | Suggestion |
|------|------------|
| `docs/CUSTOM_SQL_IMPLEMENTATION_PLAN.md` | **Archive** (decision log) |
| `docs/CUSTOM_SQL_TEST_RESULTS.md` | **Archive** |
| `docs/CUSTOM_SQL_IMPLEMENTATION_COMPLETE.md` | **Archive** |
| `docs/CUSTOM_SQL_FINAL_SUMMARY.md` | **Archive** |
| `docs/CUSTOM_SQL_FILES_VALIDATION.md` | **Archive** (registry validation narrative) |

**Target state**: Operational truth stays in **`CUSTOM_SQL.md`** + **`CUSTOM_SQL_REGISTRY.json`** + **`docs/SCHEMA_LOCKDOWN.md`**.

---

### D. Schema lockdown validation (one-time audit)

| File | Suggestion |
|------|------------|
| `docs/SCHEMA_LOCKDOWN_VALIDATION_REPORT.md` | **Archive** |

---

### E. CI gate duplication

| File | Suggestion |
|------|------------|
| `docs/CI_GATE_FINAL_SUMMARY.md` | **Archive** |
| `docs/CI_GATE_IMPLEMENTATION_AUDIT.md` | **Archive** |
| `docs/CI_GATE_QUICK_REFERENCE.md` | **Merge** unique tables into `docs/CI_GATES.md`, then **archive** |
| `docs/EXECUTIVE_SUMMARY_CI_GATES.md` | **Archive** |
| `docs/ci-gate-analysis.md` | **Archive** |
| `docs/ci-gate-coverage-matrix.md` | **Archive** |
| `docs/ci-gate-improvements-summary.md` | **Archive** |

**Target state**: **`docs/CI_GATES.md`** as the single maintained CI doc.

---

### F. `.cursor/` (agent / session reports)

| File | Suggestion |
|------|------------|
| `.cursor/CORE_SCHEMA_*.md`, `SHARED_COLUMNS_CI_GATE.md`, `WARNINGS_RESOLUTION_REPORT.md` | **Do not treat as product docs** — **gitignore** or move to local-only notes |

---

## Non-doc artifacts (optional code cleanup)

| Path | Issue | Suggestion |
|------|--------|------------|
| `src/db/migrations/schema.ts` | Drizzle **introspect** output; not your app schema | **Delete** or **gitignore**; canonical schema is `src/db/schema/` |
| `src/db/migrations/relations.ts` | Same | Same |
| `scripts/validate-registry.js` | Ad-hoc helper | **Keep** or fold into `package.json` script + TypeScript |

---

## Recommended folder layout (after cleanup)

```text
docs/
  README.md                    # NEW: index of canonical docs + “archive” pointer
  SCHEMA_LOCKDOWN.md
  CI_GATES.md
  QUICK_START.md
  MIGRATIONS.md                # OPTIONAL: single migration guide
  architecture/
  patterns/
  testing/
  archive/                     # NEW: yyyy-mm or topic subfolders
    2026-03-migration-audit/
    2026-03-custom-sql/
    2026-03-ci-gate-audits/
```

---

## Execution checklist (completed)

1. [x] Create `docs/archive/` with topic subfolders (`migrations`, `environment`, `custom-sql`, `schema-lockdown`, `ci-gates`).
2. [x] Move archive candidates from repo root and `docs/` into `docs/archive/…`.
3. [x] Update `QUICK_START.md`, `CI_GATES.md`, `SCHEMA_LOCKDOWN.md`, `patterns/README.md`, and script `@see` paths.
4. [x] Remove root reports (moved, not duplicated).
5. [x] `docs/README.md` + `docs/archive/README.md` document the map.
6. [ ] Optional: add `.cursor/*.md` to **`.gitignore`** (team policy — not done by default).
7. [x] Remove and gitignore `src/db/migrations/schema.ts` + `relations.ts` (introspect noise).

---

## Quick reference: action legend

- **Keep** — canonical, update over time.
- **Merge** — fold unique content into a canonical doc, then archive or delete source.
- **Archive** — move to `docs/archive/…` for history.
- **Delete** — redundant after merge; no unique value.

---

*Prepared for: legacy documentation cleanup. Execute in a dedicated PR with a short CHANGELOG note.*
