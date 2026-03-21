# Benefits schema (`benefits`)

PostgreSQL schema `benefits`: **providers**, **plans**, **enrollments**, **dependent coverages**, and **claims**. Data is tenant-scoped; several FKs to `hr` are applied via custom SQL to avoid circular imports (see per-table docblocks).

## Layout

| Path            | Role                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `_schema.ts`    | Drizzle `pgSchema("benefits")`                                                                                                |
| `_zodShared.ts` | Decimal string Zod helpers; `dateValue` is imported from `_shared/zodWire` and re-exported for benefits call sites (internal) |
| `_relations.ts` | Single `defineRelations()` graph for RQB                                                                                      |
| `fundamentals/` | `benefits_providers`, `benefit_plans`                                                                                         |
| `operations/`   | `benefit_enrollments`, `dependent_coverages`, `claims_records`                                                                |
| `index.ts`      | Barrel exports (`_zodShared` is **not** exported)                                                                             |

## Cross-schema dependencies

| From                  | To                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| All benefits tables   | `core.tenants`                                                                                      |
| `benefit_plans`       | `core.currencies` (optional), `benefits.benefits_providers` (optional)                              |
| `benefit_enrollments` | `benefit_plans`; `employeeId` → `hr.employees` (custom SQL)                                         |
| `dependent_coverages` | `benefit_enrollments`; `dependentId` → `hr.dependents` (custom SQL)                                 |
| `claims_records`      | `benefit_enrollments`, `core.currencies`; `employeeId` / `reviewedBy` → `hr.employees` (custom SQL) |

## Conventions

1. **Relations** — Only `_relations.ts` defines `defineRelations()`. It is merged with other domains in `src/db/db.ts` (e.g. with `securityRelations`) for `db.query.*`.
2. **Enums** — Each PG enum: `const` array (`as const`), `benefitsSchema.enum(...)`, **`XxxSchema = z.enum(thatArray)`**, **`export type Xxx = z.infer<typeof XxxSchema>`**. Insert/update override enum columns with these Zod enums (not `createSelectSchema(pgEnum)`).
3. **Naming** — `CoverageLevelSchema` is enrollment **coverage tier**; `CoverageStatusSchema` is **dependent_coverage** lifecycle status — do not conflate them in APIs.
4. **Defaults** — Columns with DB defaults use `.optional()` on insert Zod where callers may omit the field.
5. **Audit** — Tables with `auditColumns` require **`createdBy` / `updatedBy`** at the DB level; set them in the API or service layer.
6. **Lifecycle Zod** — `superRefine` encodes product rules (e.g. `TERMINATED` → `terminationReason`, `REJECTED` claim → `rejectionReason`, `PAID` → `paidAt` + `approvedAmount`).

## Tests

| File                                                   | Focus                                           |
| ------------------------------------------------------ | ----------------------------------------------- |
| `src/db/__tests__/benefits-providers-zod.test.ts`      | Provider status, contract dates                 |
| `src/db/__tests__/benefit-plans-zod.test.ts`           | Plan enums, effective range, amounts            |
| `src/db/__tests__/benefit-enrollments-zod.test.ts`     | Enrollment status, coverage level, termination  |
| `src/db/__tests__/dependent-coverages-zod.test.ts`     | Coverage status vs level, termination           |
| `src/db/__tests__/claims-records-zod.test.ts`          | Claim status lifecycle, amounts, dates          |
| `src/db/__tests__/benefits-optional-relations.test.ts` | RQB optional `provider`, `currency`, `reviewer` |

Run all benefits-related DB tests:

```bash
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/benefits-
```

## Optional DB tuning

- If you often filter claims by reviewer, add an index on `(tenantId, reviewedBy)` in a generated migration (not yet in baseline snapshots in all environments).
