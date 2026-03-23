# Contributing to AFENDA-HYBRID

## Documentation Strategy

This repo uses **layered READMEs** with clear responsibilities. When making changes, update the appropriate layer.

### README Tiers

| Layer                    | File                                            | Responsibility                                           | When to update                                                                    |
| ------------------------ | ----------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Map**                  | [README.md](README.md)                          | What this repo is, where code lives, links to docs       | New top-level package, renamed primary focus, or "first 60 seconds" story changes |
| **Operate (package)**    | [packages/db/README.md](packages/db/README.md)  | Install, env, canonical commands, pointers               | New npm scripts users must know, Docker/test DB changes                           |
| **Operate (procedures)** | [docs/QUICK_START.md](docs/QUICK_START.md)      | Copy-paste flows: Docker, migrate, test, troubleshooting | Any change to those procedures                                                    |
| **Navigate**             | [docs/README.md](docs/README.md)                | Curated link tables by audience                          | New major doc area under `docs/`                                                  |
| **Explain / decide**     | [docs/architecture/](docs/architecture/) + ADRs | Why the system is shaped this way, constraints           | New cross-cutting decision or guideline change                                    |
| **Local context**        | `packages/db/src/**/README.md`                  | Layout, boundaries, import rules for that subtree        | Folder layout or conventions for that area                                        |

### Single Source of Truth

- **Commands:** Document full matrices in [docs/CI_GATES.md](docs/CI_GATES.md); short repeats in QUICK_START / package README. Avoid third divergent lists.
- **Schema:** Code + migrations are authoritative; READMEs and `check-docs-sync` reduce drift.

### Doc Impact Checklist (for PRs)

New pull requests use [`.github/pull_request_template.md`](.github/pull_request_template.md) with a short **Doc impact** section. Before submitting a PR, ask:

- [ ] Did I add/rename/move a folder under `packages/db/src/`? → Update layout table in `packages/db/src/README.md`
- [ ] Did I add a new npm script users should know? → Update `packages/db/README.md` and optionally `docs/QUICK_START.md`
- [ ] Did I change Docker setup, test DB port, or migration flow? → Update `docs/QUICK_START.md`
- [ ] Did I add a new doc area under `docs/` (new folder or major guide)? → Add link in `docs/README.md`
- [ ] Did I add view-engine / frontend / Vitest documentation? → Place under `docs/view-engine/`, `docs/frontend/`, or `docs/testing/` and link from those indexes
- [ ] Did I make a cross-cutting architectural decision? → Create ADR in `docs/architecture/adr/` and list it in `adr/README.md`
- [ ] Did I add/change architecture guidance? → Update `docs/architecture/*.md` as appropriate

CI enforces some of these rules (architecture layout, ADR index consistency). Others rely on team habit.

## Architecture Documentation Rules

**Required files** (CI enforced):

- `docs/architecture/00-overview.md`
- `docs/architecture/01-db-first-guideline.md`
- `docs/architecture/adr/README.md`

**Allowed under `docs/architecture/`**:

- `.md` files in the root of `docs/architecture/`
- ADRs under `adr/` (format: `NNNN-*.md`)
- Explicitly allowlisted subdirs only (none yet; edit `check-architecture-docs.ts` if adding `diagrams/` etc.)

**ADR index:** Every ADR file under `adr/` (except `README.md`) must be mentioned in `adr/README.md` (substring match).

**Why?** Keeps architecture docs discoverable and prevents drift between index and actual files.

## Pre-commit Hooks

Husky runs on `git commit`:

1. TypeScript check
2. Drizzle consistency check
3. Schema drift check (skip with `SKIP_DRIFT_CHECK=1`)
4. Migration validation (skip with `SKIP_MIGRATION_CHECK=1`)
5. Zod exports verification
6. lint-staged (ESLint + Prettier on changed files; schema checks on `schema-platform/`)

If pre-commit fails, fix the issues and commit again. Do not use `--no-verify` unless absolutely necessary.

## Local Testing

Before pushing:

```bash
# Fast static checks (no DB)
pnpm gate:full

# Full 360 (requires Docker test DB on port 5433, DATABASE_URL, migrations applied)
```

**One-shot helper** (cross-platform via Node: starts Docker test DB, applies migrations, clears accidental strict env, defaults `DATABASE_URL` if unset):

```bash
pnpm gate:360:local
```

Flags (same on all platforms): `--verbose` / `-v` (echo each step), `--skip-docker` (DB already running), `--strict` (keep `CI_STRICT_WARNINGS=1` if set).

**macOS / Linux** (optional direct shell wrapper):

```bash
bash packages/db/scripts/ops/gate-360-local.sh --verbose
```

**Windows** (optional PowerShell wrapper maps `-SkipDocker` → `--skip-docker`, etc.):

```powershell
powershell -ExecutionPolicy Bypass -File packages/db/scripts/ops/gate-360-local.ps1 -SkipDocker -Verbose
```

**Manual sequence** (any OS):

1. `pnpm docker:test:start`
2. Set `DATABASE_URL` — e.g. `postgresql://postgres:postgres@localhost:5433/afenda_test` (printed when Docker starts), or define it in the **repo-root** `.env` so tools that load `../..\.env` see it.
3. `pnpm db:migrate`
4. `pnpm gate:360`

**Environment hygiene**

- **`CI_STRICT_WARNINGS`:** Leave **unset** for normal local runs. When set to `1`, several `check:*` scripts treat **warnings as errors** (e.g. `check:branded-ids`), which can make `gate:360` fail even though CI on PRs only uses strict mode when the workflow is dispatched with **strict_mode**. If you turned it on for a one-off check, unset it when done (`Remove-Item Env:CI_STRICT_WARNINGS` in PowerShell).
- **`DATABASE_URL`:** Required for `check:preflight`, `check:custom-sql-syntax` (against a live DB), and `pnpm test:db`. Without it, `gate:360` fails late after minutes of static checks — set it early or use `pnpm gate:360:local`.

See [docs/CI_GATES.md](docs/CI_GATES.md) for category-specific gates and auto-fix commands.

## Questions?

- **Setup issues:** [docs/QUICK_START.md](docs/QUICK_START.md)
- **Schema rules:** [docs/SCHEMA_LOCKDOWN.md](docs/SCHEMA_LOCKDOWN.md)
- **DB design:** [docs/architecture/01-db-first-guideline.md](docs/architecture/01-db-first-guideline.md)
- **CI failures:** [docs/CI_GATES.md](docs/CI_GATES.md)
