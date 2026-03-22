# Custom SQL (CSQL)

PostgreSQL features Drizzle cannot express (partitions, many triggers/functions, some indexes) ship as **hand-appended SQL** at the end of generated migrations, marked with `-- CUSTOM: …`.

**Workflow:** `pnpm db:generate` → review SQL → append custom block → register in [`CUSTOM_SQL_REGISTRY.json`](./CUSTOM_SQL_REGISTRY.json) → ensure this file mentions the same **CSQL-xxx** id → `pnpm gate:early`.

**Source of truth for DDL:** `packages/db/src/migrations/*/migration.sql` and the registry (purpose, rollback, `sqlLines`). This page is an index, not a full SQL dump.

## Registry entries

`pnpm check:docs-sync` requires every registry id to appear in this file. Canonical rows:

| ID           | Type             | Purpose                                                                                                                                         |
| ------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **CSQL-001** | PARTITION        | `audit_trail` range-partitioned by quarter                                                                                                      |
| **CSQL-002** | PARTITION        | Quarterly partitions for `audit_trail`                                                                                                          |
| **CSQL-003** | INDEX            | GIN on `old_data` / `new_data` (`jsonb_path_ops`)                                                                                               |
| **CSQL-004** | FUNCTION         | `audit.create_next_quarter_partition()`                                                                                                         |
| **CSQL-005** | TRIGGER_FUNCTION | `audit.log_change_7w1h()`                                                                                                                       |
| **CSQL-006** | TRIGGER          | Audit triggers on tenant-scoped tables with `auditColumns`                                                                                      |
| **CSQL-007** | TRIGGER          | Immutability on `audit.audit_trail`                                                                                                             |
| **CSQL-008** | TRIGGER_FUNCTION | `core.check_same_tenant_parent()`                                                                                                               |
| **CSQL-009** | TRIGGER          | Same-tenant parent on `core.organizations`                                                                                                      |
| **CSQL-010** | FUNCTION         | Harden `log_change_7w1h()` (columns / PK)                                                                                                       |
| **CSQL-011** | FUNCTION         | Column names aligned to `audit_trail`                                                                                                           |
| **CSQL-012** | CONSTRAINT       | `talent.skills` CHECKs (code + lengths)                                                                                                         |
| **CSQL-013** | TRIGGER_FUNCTION | Optional `employee_skills` proficiency sync                                                                                                     |
| **CSQL-014** | TRIGGER          | Review goals `finalScore` vs parent review status                                                                                               |
| **CSQL-015** | TRIGGER          | `exit_interviews` ↔ `offboarding_checklists` rules                                                                                              |
| **CSQL-016** | POLICY           | FORCE RLS + `tenant_isolation` on remaining core/security tenant tables (announcements, messaging, workflows, sessions, preferences, app shell) |

## Migrations in repo (examples)

- **CSQL-008, CSQL-009:** `migrations/20260320124500_core_org_same_tenant_parent_trigger/`
- **CSQL-012:** `migrations/20260320182000_skills_code_name_checks/`
- **CSQL-013:** `migrations/20260320174000_employee_skills_proficiency_backfill/`
- **CSQL-014:** `migrations/20260320125500_review_goal_final_score_triggers/`
- **CSQL-015:** `migrations/20260320203000_exit_interview_linked_checklist_trigger/`
- **CSQL-016:** `migrations/20260322103000_rls_platform_tables_remaining/`

Other ids may map to registry migration names that are not yet present as folders; implement SQL there when you add those migrations.

## Session context for audit / RLS

Callers set Postgres GUCs via [`_session/setSessionContext.ts`](../../_session/setSessionContext.ts) (`afenda.*` keys). Triggers and policies read those settings.
