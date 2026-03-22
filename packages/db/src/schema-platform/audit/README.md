# Audit schema (`audit`)

Immutable **audit trail** and **retention** metadata. Heavy use of **custom SQL** (partitioning, triggers, immutability).

**Tables:** `audit_trail`, `retention_policies`.

**Registry:** [`CUSTOM_SQL_REGISTRY.json`](./CUSTOM_SQL_REGISTRY.json) — **narrative / snippets:** [`CUSTOM_SQL.md`](./CUSTOM_SQL.md).

**Conventions:** [schema lockdown](../../../../docs/SCHEMA_LOCKDOWN.md) and [DB-first guideline §8](../../../../docs/architecture/01-db-first-guideline.md).
