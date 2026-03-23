# react-governance (Python CLI)

Read-only **package-layer governance** for the AFENDA monorepo: enforces `ui-core` → `view-engine` → `erp-view-pack` → `apps/web` import rules and flags cross-package relative imports (IMPORT_001, warn).

## Requirements

- Python **3.11+**
- Git (optional; for `--changed`)

## Run from repo root

```bash
# Recommended (see root package.json)
pnpm react-governance

# Or manually
cross-env PYTHONPATH=tools/react-governance/src python -m react_governance check
```

### Commands

| Command             | Description                                         |
| ------------------- | --------------------------------------------------- |
| `check`             | Scan `packages/*` and `apps/web` TypeScript sources |
| `rules`             | List rule IDs                                       |
| `explain LAYER_001` | Longer documentation for a rule                     |

### `check` flags

| Flag             | Description                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`         | Machine-readable output (`summary.score` reserved for future use)                                                                     |
| `--eslint`       | After governance, run `pnpm lint` at repo root                                                                                        |
| `--fail-on-warn` | Non-zero exit if any warning (e.g. IMPORT_001)                                                                                        |
| `--changed`      | Only files changed vs `main` (`GITHUB_BASE_REF` overrides base name). If git fails, **falls back to full scan** with a stderr warning |
| `--base REF`     | Base ref for `--changed`                                                                                                              |
| `--root PATH`    | Monorepo root (default: auto-discover from cwd)                                                                                       |

## Tests

```bash
pnpm test:react-governance
```

Or from this directory:

```bash
set PYTHONPATH=src   # Windows
export PYTHONPATH=src  # Unix
python -m pytest tests -q
```

## Limitations (v1)

- Import extraction is **regex-based**; dynamic `import(expr)` with non-literal strings is not analyzed.
- TypeScript `paths` aliases are **not** fully resolved; prefer `@afenda/*` for accurate layer checks.
- IMPORT_001 uses filesystem resolution of relative paths; may miss extensionless Node resolution edge cases.

## Rule IDs

- **LAYER_001** — `ui-core` must not import `@afenda/view-engine`
- **LAYER_002** — `ui-core` must not import `@afenda/erp-view-pack`
- **LAYER_003** — `view-engine` must not import `@afenda/erp-view-pack`
- **LAYER_004** — `packages/*` must not import `apps/web`
- **IMPORT_001** — Relative import resolves into another `packages/*` tree (warning)

Policy alignment: [.agents/skills/react-architecture/references/package-layering.md](../../.agents/skills/react-architecture/references/package-layering.md), [react-quality-engine](../../.agents/skills/react-quality-engine/SKILL.md), and root [AGENTS.md](../../AGENTS.md).

CI: use `pnpm react-governance:ci` for strict mode (warnings fail). `GITHUB_BASE_REF` is normalized (`refs/heads/*` stripped) for `--changed`.
