# AFENDA Relations Generator

Python tool that introspects PostgreSQL FK metadata and auto-generates Drizzle
`defineRelations()` TypeScript code for all 9 AFENDA schemas.

## Why

Manually writing `_relations.ts` files for 122+ tables is error-prone and
drifts from the actual database constraints. This tool reads the source of
truth (PostgreSQL `information_schema`) and produces complete, consistent
relation definitions.

## Prerequisites

- Python 3.11+
- PostgreSQL database with AFENDA migrations applied
- `DATABASE_URL` environment variable (falls back to local Docker test DB)

## Setup

```bash
cd packages/db/tools/relations
pip install "psycopg[binary]>=3.1" "rich>=13.0" "typer>=0.12"
```

## Commands

### `audit` — Coverage report

Show how many tables and FKs exist per domain, with coverage percentages.

```bash
python cli.py audit
python cli.py audit --domain hr
```

### `generate` — Produce `_relations.ts` files

Generate complete relation files from live database FK metadata.

```bash
# Print to stdout (review first)
python cli.py generate --domain learning

# Write to a separate directory for comparison
python cli.py generate --output ./generated

# Write as _relations.generated.ts alongside existing files
python cli.py generate --write
```

### `diff` — Compare existing vs generated

Show which tables are missing from existing `_relations.ts` files.

```bash
python cli.py diff
python cli.py diff --domain hr
```

### `fk-gaps` — Detect missing FK constraints

Find columns that look like foreign keys (naming convention matches PK
patterns) but have no actual FK constraint in the database.

**Intentional non-FKs** (polymorphic refs, opaque IDs, trace UUIDs) are listed in
`config.py` as `INTENTIONAL_NON_FK_COLUMNS` (schema, table, column **as stored in
PostgreSQL** — this project uses quoted **camelCase** column names). Those rows
are omitted from the report so the command can read **0 gaps** when the DB is
fully aligned.

```bash
python cli.py fk-gaps
python cli.py fk-gaps --domain hr
```

### `tables` — List tables per domain

```bash
python cli.py tables --domain core
```

## Architecture

```
cli.py          CLI entry point (typer)
config.py       Domain mapping, naming conventions, PG→TS translation
introspect.py   PostgreSQL information_schema queries
analyze.py      FK → relation graph (one/many, aliases, cross-schema)
generate.py     Relation graph → TypeScript defineRelations() code
```

### How it works

1. **Introspect**: Query `information_schema` for all tables, columns, FKs,
   and unique constraints across the 9 AFENDA PostgreSQL schemas
2. **Analyze**: Build a relation graph per domain — classify each FK as
   `r.one` (child→parent) and generate reverse `r.many` (parent→children).
   Detect duplicate FK targets that need aliases (e.g., `approvedBy` and
   `employeeId` both pointing to `employees`)
3. **Generate**: Produce TypeScript code matching the existing
   `defineRelations()` pattern with correct imports, from/to fields,
   `optional` flags, and alias strings

### Key design decisions

- **DB as source of truth**: Relations are generated from actual FK
  constraints, not from TypeScript AST parsing. This ensures the generated
  code matches what PostgreSQL enforces.
- **`fk-gaps` command**: Detects columns that _should_ have FK constraints
  but don't — revealing a gap between Drizzle schema definitions and the
  actual database.
- **Generated files use `.generated.ts` suffix**: When using `--write`, files
  are written as `_relations.generated.ts` to avoid overwriting hand-crafted
  relations. Review and rename manually.

## Workflow

1. Run `python cli.py audit` to see current coverage
2. Run `python cli.py fk-gaps` to find missing FK constraints
3. Fix FK gaps in Drizzle schema files + run `pnpm db:generate` + `pnpm db:migrate`
4. Run `python cli.py generate --write` to produce updated relations
5. Review `.generated.ts` files, merge semantic names (rename auto-generated
   relation names to domain-meaningful names like `approver` instead of
   `approvedByEmployee`). **`security.userRoles`**: keep the relation name
   `assignedByUser` (and alias `user_roles_assigner`) to match tests — the
   generator may emit `assigner`; rename after merge.
6. Run `pnpm typecheck` to verify
