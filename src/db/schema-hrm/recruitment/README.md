# Recruitment schema (`recruitment`)

PostgreSQL schema `recruitment`: talent profiles, requisitions, applications, interviews, offers, checks, onboarding/offboarding, exit interviews, probation, and salary backfill issues.

## Layout

| Path            | Role                                               |
| --------------- | -------------------------------------------------- |
| `_schema.ts`    | Drizzle `pgSchema("recruitment")`                  |
| `fundamentals/` | Shared roots (e.g. `candidates`)                   |
| `operations/`   | Pipeline and ops tables (requisitions → hire/exit) |
| `_relations.ts` | Drizzle relations graph                            |
| `index.ts`      | Barrel exports                                     |

## Conventions

1. **Relations** — `recruitment/_relations.ts` is the single `defineRelations()` graph for this domain. Nested folders (`fundamentals/`, `operations/`) do **not** need their own `_relations.ts`; `scripts/validate-schema-structure.ts` treats them as covered by the parent file.
2. **Enums** — Each PG enum has a `const` array (`as const`), `recruitmentSchema.enum(...)`, and a **Zod** schema `XxxSchema = z.enum(thatArray)` plus `export type Xxx = z.infer<typeof XxxSchema>`. Insert/update schemas override enum columns with these (not `createSelectSchema(pgEnum)`).
3. **Defaults** — If the column has a DB default, the Zod field is usually `.optional()` on insert so callers can omit it.
4. **Audit** — Tables using `auditColumns` document that `createdBy` / `updatedBy` are set by the service or API.
5. **Tenancy** — Cross-table `tenantId` equality is often enforced in services (see per-table docblocks and `src/db/_services/recruitment/*`).

## Related code

- Services: `src/db/_services/recruitment/`
- Zod / lifecycle tests: `src/db/__tests__/*-zod.test.ts`, `checklists-zod.test.ts`, `probation-evaluations-zod.test.ts`
- Product rules: `docs/recruitment-candidate-databank.md`, ADRs under `docs/architecture/adr/`
