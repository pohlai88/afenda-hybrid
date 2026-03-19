# AFENDA Architecture Documentation

This directory contains the authoritative architecture guidelines and decision records for the AFENDA platform.

## Documents

| # | Document | Status | Description |
|---|----------|--------|-------------|
| 01 | [DB-First Guideline](./01-db-first-guideline.md) | Draft | DB-first with Drizzle ORM + Zod 4: PostgreSQL primitives reference, schema layering, tenancy, migrations, operations, security, and observability. |
| 02 | Integrity and Migrations (planned) | — | Deep-dive on two-phase rollout patterns and migration tooling configuration. |

## Architecture Decision Records

ADRs are stored in `docs/adr/` and referenced from the relevant guideline documents.

## Contributing

1. Propose changes via pull request.
2. Tag the relevant **Schema Owner** or **Migration Approver** for review.
3. Update the table above when adding new documents.
