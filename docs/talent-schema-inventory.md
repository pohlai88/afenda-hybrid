# Talent schema inventory (`talent`)

**Purpose:** Single checklist of PostgreSQL objects under `talent` that Drizzle models in [`src/db/schema-hrm/talent`](../src/db/schema-hrm/talent). Use with migrations and [`src/db/__tests__/talent-contracts.test.ts`](../src/db/__tests__/talent-contracts.test.ts). The list below must stay aligned with [`scripts/verify-hr-schema-audit-matrix.ts`](../scripts/verify-hr-schema-audit-matrix.ts) (`REQUIRED_TALENT_TABLES`) and [`docs/hr-schema-audit-matrix.md`](./hr-schema-audit-matrix.md) `talent` rows.

## Tables (17)

| Table                      | Grain                  | Tenant        | Notes                                                                                                        |
| -------------------------- | ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `case_links`               | Polymorphic edge       | Yes           | `sourceType`/`sourceId` ↔ `targetType`/`targetId`; FK to parent rows not enforced in DB                      |
| `certifications`           | Credential master      | Yes           | Referenced by `employee_certifications`, `learning.certification_awards`                                     |
| `competency_frameworks`    | Framework header       | Yes           | `positionId` / `jobRoleId` FKs via custom SQL (ordering)                                                     |
| `competency_skills`        | Framework ↔ skill      | Yes           | `requiredLevel` 1–5, optional `weight`                                                                       |
| `disciplinary_actions`     | ER case                | Yes           | Employee/issuer FKs may be custom SQL                                                                        |
| `employee_certifications`  | Holding + verification | Yes           | Pairs with `learning.certification_awards`; see [talent-domain-boundaries.md](./talent-domain-boundaries.md) |
| `employee_skills`          | Skill inventory        | Yes           | `proficiency` enum; optional sync trigger (CSQL-013) on legacy paths                                         |
| `goal_tracking`            | Append-only progress   | No `tenantId` | FK to `performance_goals` only; `updatedBy` often custom SQL                                                 |
| `grievance_records`        | ER case                | Yes           | Resolution CHECKs                                                                                            |
| `performance_goals`        | Objectives             | Yes           | Employee FK custom SQL                                                                                       |
| `performance_review_goals` | Review ↔ goal snapshot | Yes           | CSQL-014 triggers                                                                                            |
| `performance_reviews`      | Review cycle           | Yes           | CSQL-014 trigger on status                                                                                   |
| `promotion_records`        | Promotion workflow     | Yes           | Approval CHECKs; position/grade/employee FKs often custom SQL                                                |
| `succession_plans`         | Bench row              | Yes           | Lifecycle CHECK on `targetDate`                                                                              |
| `skills`                   | Skill master           | Yes           | CSQL-012 CHECKs on code/name/description                                                                     |
| `talent_pool_memberships`  | Pool membership        | Yes           | Employee FK custom SQL                                                                                       |
| `talent_pools`             | Pool master            | Yes           |                                                                                                              |

## Custom SQL / triggers (registry)

| ID       | Object                                                                                        | Table(s)                   |
| -------- | --------------------------------------------------------------------------------------------- | -------------------------- |
| CSQL-012 | CHECKs on `skillCode`, name length                                                            | `talent.skills`            |
| CSQL-013 | `talent.sync_employee_skill_proficiency` (conditional)                                        | `talent.employee_skills`   |
| CSQL-014 | `enforce_review_goal_final_score_vs_parent_status`, `trg_review_goals_final_vs_parent_status` | `performance_review_goals` |
| CSQL-014 | `enforce_review_status_vs_goal_final_scores`, `trg_reviews_status_vs_goal_finals`             | `performance_reviews`      |

Full entries: [`src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json`](../src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json).

## Adding or renaming a talent table

Do these in one change set (or follow-up PR) so docs, gates, and DB stay aligned:

1. **Drizzle** — table module under [`src/db/schema-hrm/talent`](../src/db/schema-hrm/talent), barrel exports (`index.ts` / `_schema.ts` if applicable), and [`_relations.ts`](../src/db/schema-hrm/talent/_relations.ts).
2. **Migrations** — generated/applied SQL; register custom SQL or triggers in [`CUSTOM_SQL_REGISTRY.json`](../src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json) when needed.
3. **Contracts** — add or update the table entry in [`src/db/__tests__/talent-contracts.test.ts`](../src/db/__tests__/talent-contracts.test.ts); run `pnpm test:db:contracts`.
4. **Audit matrix** — add/rename the row in [`hr-schema-audit-matrix.md`](./hr-schema-audit-matrix.md) (schema `talent`, third column = Drizzle symbol e.g. `performanceReviews`). If the **total** table count across the matrix changes, update `EXPECTED_TABLES` in [`scripts/verify-hr-schema-audit-matrix.ts`](../scripts/verify-hr-schema-audit-matrix.ts).
5. **Verifier list** — update `REQUIRED_TALENT_TABLES` in the same script (must match matrix `talent` rows exactly).
6. **This inventory** — update the table above and the “Tables (N)” heading count.
7. **Data dictionary** — adjust [`hr-data-dictionary.md`](./hr-data-dictionary.md) if grain or PII notes change.

Then run `pnpm check:hr-audit-matrix` and `pnpm test:db:contracts`.

**Renames** also require grep-driven updates (relations, tests, docs, registry strings) for the old Drizzle/table name.

## Related docs

- [talent-domain-boundaries.md](./talent-domain-boundaries.md) — certifications vs L&D awards, `case_links` integrity
- [talent-management-roadmap.md](./talent-management-roadmap.md) — future TM entities
- [preflight-csql-014-review-goal-final-score.sql](./preflight-csql-014-review-goal-final-score.sql) — data checks before CSQL-014
