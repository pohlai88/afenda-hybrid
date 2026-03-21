# `talent` schema

Workforce capability, performance management, succession, employee relations (grievance/disciplinary), and polymorphic case linking.

## Tables (Drizzle → PostgreSQL)

| Drizzle / DB table         | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `skills`                   | Skill master data                                            |
| `certifications`           | Credential catalog                                           |
| `competency_frameworks`    | Role/position competency headers                             |
| `competency_skills`        | Framework ↔ skill matrix                                     |
| `talent_pools`             | Pool definitions                                             |
| `employee_skills`          | Employee skill inventory                                     |
| `employee_certifications`  | Held credentials + verification                              |
| `performance_goals`        | Objectives                                                   |
| `goal_tracking`            | Append-only goal progress                                    |
| `performance_reviews`      | Review cycles (CSQL-014 trigger on status)                   |
| `performance_review_goals` | Goal snapshots per review (CSQL-014 trigger on `finalScore`) |
| `talent_pool_memberships`  | Pool membership                                              |
| `promotion_records`        | Promotion workflow                                           |
| `succession_plans`         | Bench / replacement rows                                     |
| `grievance_records`        | ER complaints                                                |
| `disciplinary_actions`     | ER corrective actions                                        |
| `case_links`               | Polymorphic edges between grievance/discipline cases         |

## Drizzle relations

Employee-centric talent collections (`employeeSkills`, `performanceReviews`, `performanceGoals`, ER tables, etc.) are wired on **`talentRelations`** in [`_relations.ts`](./_relations.ts). They are not duplicated on `hrRelations.employees`, so use the talent relation graph (or compose both) when querying HR employees together with talent children.

## Documentation

- [docs/talent-schema-inventory.md](../../../../docs/talent-schema-inventory.md)
- [docs/talent-domain-boundaries.md](../../../../docs/talent-domain-boundaries.md)
- [docs/talent-management-roadmap.md](../../../../docs/talent-management-roadmap.md)

## Tests

DB contracts: `src/db/__tests__/talent-contracts.test.ts` (`pnpm test:db:contracts`).

## Changing the schema

Checklist for new or renamed tables: [docs/talent-schema-inventory.md — Adding or renaming a talent table](../../../../docs/talent-schema-inventory.md#adding-or-renaming-a-talent-table).
