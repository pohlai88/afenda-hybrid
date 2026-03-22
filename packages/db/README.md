# @afenda/db

PostgreSQL schema (Drizzle), migrations, scripts, and tests.

```bash
# From repo root (after pnpm install + .env with DATABASE_URL)
pnpm docker:test:start
pnpm db:migrate
pnpm test:db
```

**Docs:** [docs/QUICK_START.md](../../docs/QUICK_START.md) · [docs/README.md](../../docs/README.md) · [src/README.md](./src/README.md) · [scripts/README.md](./scripts/README.md) (CI / preflight / prepare layout)

**Common:** `pnpm db:generate` · `pnpm gate:early` · `pnpm --filter @afenda/db <script>` or root shortcuts (`pnpm db:migrate`, …).
