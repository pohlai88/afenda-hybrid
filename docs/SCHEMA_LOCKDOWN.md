# Schema lockdown

- Schema is defined in **Drizzle TypeScript** under `packages/db/src/schema-*`.
- Migrations come from **`pnpm db:generate`**; do not hand-author whole migration files.
- **Custom SQL** (partitions, triggers, …): append at the **end** of the generated file with `-- CUSTOM: … (CSQL-xxx)`, add **`CUSTOM_SQL_REGISTRY.json`**, and mention the id in **`packages/db/src/schema-platform/audit/CUSTOM_SQL.md`**.

Normal flow: no `db:push`. Local escape hatch: `pnpm --filter @afenda/db db:push:unsafe`.

**Detail:** [architecture/01-db-first-guideline.md](./architecture/01-db-first-guideline.md) · [CUSTOM_SQL.md](../packages/db/src/schema-platform/audit/CUSTOM_SQL.md)
