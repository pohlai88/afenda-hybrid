# Payroll schema (`payroll`)

PostgreSQL schema `payroll`: **compensation**, **statutory catalogs**, **employee payroll profiles**, **periods / runs / entries**, **payslips**, **payments**, **expense claims**, **loans**, and **final settlements**. Most tables are tenant-scoped; `statutory_schemes` / `statutory_scheme_rates` are global (no `tenantId`). Several FKs to `hr.employees` (and related) are attached via custom SQL to avoid circular imports—see per-table docblocks.

## Layout

| Path            | Role                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_schema.ts`    | Drizzle `pgSchema("payroll")`                                                                                                                                                         |
| `_zodShared.ts` | Canonical money strings, `zMoney12_2*` / `zMoney10_2*` factories; `dateValue` is imported from `_shared/zodWire` and re-exported for payroll call sites (internal)                    |
| `_relations.ts` | Single `defineRelations()` graph for RQB (`payrollRelations`)                                                                                                                         |
| `fundamentals/` | Reference data & profiles: bank accounts, compensation, earnings/deduction/expense types, pay components, grade structures, social insurance, statutory schemes + rates, tax profiles |
| `operations/`   | Periods, runs, payroll lines, payslips, payment records, expense claims, loans, final settlements                                                                                     |
| `index.ts`      | Barrel exports (`_zodShared` is **not** exported)                                                                                                                                     |

## Cross-schema dependencies

| From                           | To                                                                          |
| ------------------------------ | --------------------------------------------------------------------------- |
| Tenant-scoped payroll tables   | `core.tenants`                                                              |
| Many fundamentals / operations | `core.currencies`, `core.legalEntities` (where modeled)                     |
| `pay_grade_structures`         | `hr.job_grades`                                                             |
| Employee-scoped rows           | `employeeId` → `hr.employees` (often custom SQL FK)                         |
| Approvers / processors         | `processedBy`, `approvedBy`, etc. → `hr.employees` (custom SQL where noted) |

## Conventions

1. **Relations** — Only `_relations.ts` defines `defineRelations()`. It is merged in [`db.ts`](../../db.ts) with other domains for `db.query.*`. Contract-style coverage: `__tests__/payroll-rqb-nested-relations.test.ts`.
2. **Enums** — Prefer `z.enum([...as const])` with a `*Schema` name for insert/update overrides; align with DB-first guideline Appendix C (`pgEnum` ↔ `z.enum`).
3. **Money (Zod)** — Use `_zodShared.ts`: `zMoney12_2Positive` / `zMoney12_2NonNegative` (and optional/nullable variants) for `numeric(12,2)`; `zMoney10_2Positive` / `zMoney10_2PositiveOptional` for **`numeric(10,2)`** (e.g. expense claim `amount`). Do not duplicate `parseFloat`-only refinements for those precisions.
4. **Defaults** — Columns with DB defaults use `.optional()` on insert Zod where callers may omit the field.
5. **Audit** — Tables with `auditColumns` require **`createdBy` / `updatedBy`** at insert; set them in the API or service layer.
6. **Workflow Zod** — `superRefine` encodes status-driven rules (e.g. payslip timestamps vs status, payroll run approval vs processing, expense claim PAID / REJECTED, loan lifecycle).

## Tests

| File                                                                                                                                                             | Focus                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `payroll-zod-shared.test.ts`                                                                                                                                     | `_zodShared` money helpers & Zod factories          |
| `payroll-periods-zod.test.ts`, `payroll-runs-zod.test.ts`, `payroll-entries-zod.test.ts`                                                                         | Period ordering, run totals / workflow, entry lines |
| `payslips-zod.test.ts`, `payment-records-zod.test.ts`                                                                                                            | Statement amounts, payment amount + enums           |
| `expense-claims-zod.test.ts`, `expense-types-zod.test.ts`                                                                                                        | Claims workflow, expense catalog                    |
| `bank-accounts-zod.test.ts`, `compensation-packages-zod.test.ts`, `earnings-types-zod.test.ts`, `pay-components-zod.test.ts`, `pay-grade-structures-zod.test.ts` | Fundamentals Zod                                    |
| `social-insurance-profiles-zod.test.ts`, `statutory-scheme-rates-zod.test.ts`, `tax-profiles-zod.test.ts`                                                        | Statutory & tax profiles                            |
| `loan-records-zod.test.ts`, `final-settlements-zod.test.ts`                                                                                                      | Loans & exit settlements                            |
| `payroll-rqb-nested-relations.test.ts`                                                                                                                           | RQB nested relations                                |

Run payroll-focused DB tests (prefix / name match as needed):

```bash
pnpm test:db -- src/__tests__/payroll-
pnpm test:db -- src/__tests__/payment-records-zod.test.ts
pnpm test:db -- src/__tests__/payroll-zod-shared.test.ts
```

## Reference

- DB-first patterns: `docs/architecture/01-db-first-guideline.md` (Drizzle + Zod, tenancy, money as string).
