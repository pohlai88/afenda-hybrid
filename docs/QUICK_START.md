# Quick start

Work from the **repo root**. Database code: `packages/db/` (`@afenda/db`).

## Once

```bash
pnpm install
cp .env.example .env   # DATABASE_URL required
pnpm docker:test:start
pnpm db:migrate
```

## Often

```bash
pnpm docker:test:start | stop | reset | status
pnpm db:generate       # after editing schema/*.ts
pnpm db:migrate
pnpm check:migrations
pnpm check:drift
pnpm test:db:smoke
pnpm test:db
pnpm gate:early
```

Single test (from `packages/db`): `pnpm test:db -- src/__tests__/smoke.test.ts`

## Schema change

Edit `packages/db/src/schema-platform/` or `schema-hrm/` → `pnpm db:generate` → review `src/migrations/` → append `-- CUSTOM: …` only at file end if needed → register in `CUSTOM_SQL_REGISTRY.json` and [CUSTOM_SQL.md](../packages/db/src/schema-platform/audit/CUSTOM_SQL.md) → `pnpm db:migrate` → `pnpm gate:early`.

Avoid `db:push` in normal flow ([SCHEMA_LOCKDOWN.md](./SCHEMA_LOCKDOWN.md)).

## Layout

- `packages/db/src/schema-platform/` — core, security, audit
- `packages/db/src/schema-hrm/` — hr, payroll, talent, recruitment, …
- `packages/db/src/migrations/` — generated SQL

**More:** [README.md](./README.md) · [packages/db/README.md](../packages/db/README.md)
