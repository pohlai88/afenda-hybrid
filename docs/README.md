# Documentation index

Start here for project documentation. Older audits and one-off reports were removed from the tree; use git history if you need them.

## Database & schema

| Doc | Description |
|-----|-------------|
| [SCHEMA_LOCKDOWN.md](./SCHEMA_LOCKDOWN.md) | Schema lockdown rules, custom SQL workflow, validation |
| [QUICK_START.md](./QUICK_START.md) | Commands: DB, Docker, migrations, checks |
| [architecture/01-db-first-guideline.md](./architecture/01-db-first-guideline.md) | DB-first guidelines (incl. custom SQL §8.2) |
| [../src/db/README.md](../src/db/README.md) | DB package overview & script pointers |
| [../src/db/schema/audit/CUSTOM_SQL.md](../src/db/schema/audit/CUSTOM_SQL.md) | Custom SQL patterns & snippets |
| [hr-schema-audit-matrix.md](./hr-schema-audit-matrix.md) | 108-table HCM audit rubric (Pass/Partial/Fail) |
| [hr-data-dictionary.md](./hr-data-dictionary.md) | PII tiers, payroll statutory keys, go-live fields |
| [HR_REPORTING_POLICY.md](./HR_REPORTING_POLICY.md) | `managerId` vs `reporting_lines` source of truth |

## CI & quality gates

| Doc | Description |
|-----|-------------|
| [CI_GATES.md](./CI_GATES.md) | CI gates and local checks |

## Operations

| Doc | Description |
|-----|-------------|
| [testing/DOCKER_TEST_SETUP.md](./testing/DOCKER_TEST_SETUP.md) | Docker test database |

## Patterns

| Doc | Description |
|-----|-------------|
| [patterns/README.md](./patterns/README.md) | Pattern index |
| [patterns/case-insensitive-uniqueness.md](./patterns/case-insensitive-uniqueness.md) | Example pattern |
