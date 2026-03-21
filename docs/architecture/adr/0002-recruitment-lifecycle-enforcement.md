# ADR 0002: Recruitment lifecycle enforcement (Zod, DB, service)

| Field      | Value                      |
| ---------- | -------------------------- |
| **Status** | Accepted                   |
| **Date**   | 2026-03-20                 |
| **Owners** | Engineering (schema / API) |

## Context

Recruitment spans multiple tables: **`candidates`**, **`applications`**, **`interviews`**, **`offer_letters`**, **`background_checks`**, **`candidate_salary_backfill_issues`**, **`exit_interviews`**, plus **`job_requisitions`** and **`offboarding_checklists`**. Invariants fall into three buckets:

1. **Single-row shape and enums** — must match PostgreSQL types, CHECKs, and partial uniques.
2. **Cross-column lifecycle semantics** — e.g. “field X only when status Y” or “timestamps required when status is terminal.”
3. **Cross-row tenancy / linkage** — e.g. child `tenantId` matches parent `tenantId`; exit interview matches linked checklist’s tenant and employee.

PostgreSQL **does not** enforce (3) for every FK pair we care about. Some rules are **only** in triggers (custom SQL). API consumers need **fast, stable errors** before round-trips when possible.

## Decision: where each kind of rule lives

| Layer                                                                         | Role                                                                                                                                                                                 | Examples                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zod** (Drizzle `createInsertSchema` / `createUpdateSchema` + `superRefine`) | First line for API payloads; mirrors important CHECKs; encodes **partial-update** contracts (“if you set status in this patch, include sibling fields”).                             | Interview `result` only when `status = COMPLETED`; offer `declineReason` / `respondedAt` when `DECLINED`; positive `tenantId` / FK ids on insert.                                                                                                               |
| **PostgreSQL**                                                                | Source of truth for **integrity** that must hold for all writers (SQL, migrations, batch jobs): CHECKs, FKs, partial uniques, **custom triggers** where ORM cannot express the rule. | `chk_candidates_hired_requires_hr_bridge` ([ADR 0001](./0001-candidate-hired-hr-bridge.md)); `chk_interviews_completed_timing`; `chk_offer_letters_expiry`; CSQL-015 exit interview ↔ checklist trigger; `uq_applications_candidate_requisition` (active rows). |
| **Service helpers** (`src/db/_services/recruitment/*.ts`)                     | **Tenant and parent alignment** before insert; **`schema.parse()`** for defense in depth; stable `Error` subclasses with **`code`** for logging and API mapping.                     | `createApplication`, `createInterview`, `createOfferLetter`, `createBackgroundCheck`, `createCandidateSalaryBackfillIssue`, `createExitInterview`.                                                                                                              |

**Principle:** Prefer **DB** for “must never be violated by any client.” Prefer **Zod** for “HTTP/API contract and ergonomic partial updates.” Prefer **service** for **cross-table tenant checks** that Postgres does not enforce on the FK graph alone.

## Module summary (recruitment pipeline)

| Area                       | DB                                                    | Zod                                                                                       | Service                                                                                  |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Candidates**             | HIRED HR bridge CHECK; salary / email partial uniques | HIRED + salary bundle rules; see [0001](./0001-candidate-hired-hr-bridge.md)              | Optional domain services (not required for every write path)                             |
| **Applications**           | Partial unique active triple                          | Positive `tenantId` / `candidateId` / `requisitionId`                                     | `createApplication` — candidate + requisition tenant match                               |
| **Job requisitions**       | Headcount, salary range CHECKs                        | Salary string shape; `APPROVED` ⇒ approver fields; positive ids                           | `createJobRequisition` — department / position / hiring manager tenant match             |
| **Interviews**             | Duration, rating CHECKs                               | `result` iff `COMPLETED`; positive ids; `meetingUrl`                                      | `createInterview` — `applications.tenantId` match                                        |
| **Offer letters**          | Salary, bonus, expiry CHECKs                          | Lifecycle: `DECLINED` / `APPROVED` / `SENT` / `ACCEPTED` field bundles; signing bonus ≥ 0 | `createOfferLetter` — `applications.tenantId` match                                      |
| **Background checks**      | FKs                                                   | `result` iff `status = COMPLETED`; normalized digits pattern                              | `createBackgroundCheck` — `candidates.tenantId` match                                    |
| **Salary backfill issues** | FKs                                                   | `normalizedDigits` shape when set; positive ids                                           | `createCandidateSalaryBackfillIssue` — candidate tenant match                            |
| **Exit interviews**        | CSQL-015 triggers + completion CHECK                  | `conductedAt` when `COMPLETED`                                                            | `createExitInterview` — linked checklist tenant + employee + category (ahead of trigger) |

Canonical narrative for **profile vs application vs funnel**: `docs/recruitment-candidate-databank.md`. Per-table JSDoc in `src/db/schema-hrm/recruitment/**` points to services where applicable.

## Consequences

- **Pros:** Predictable layering; tests can target Zod (unit), DB (integration), and service (integration) independently; new tables can copy the same template.
- **Cons:** Some rules are **duplicated** (Zod + DB) on purpose — drift requires updating both; service checks **overlap** exit-interview triggers but improve error shape and fail fast.
- **Product loosening** (e.g. `APPROVED` without approver on first insert): change **Zod** first, document here or in a superseding ADR; keep DB CHECKs unless the business invariant truly changes.

## How to change safely

1. **Zod-only relaxation/tightening** — Edit the table’s `*InsertSchema` / `*UpdateSchema`, adjust `src/db/__tests__/*-zod.test.ts`, update this ADR’s module table or add a short “Amendment” subsection with date.
2. **New DB constraint or trigger** — Migration + `pnpm check:migrations`; register custom SQL per [01-db-first-guideline](../01-db-first-guideline.md); add or extend integration tests.
3. **New cross-table tenant guard** — Add or extend `src/db/_services/recruitment/*Service.ts`, add `*-tenant-consistency.test.ts` (or domain-specific name), document in `recruitment-candidate-databank.md` §3-style bullets.
4. **Breaking product policy** — New ADR that **Supersedes** or **Amends** this one; link from README.

## Rollback

No single migration rolls back this _strategy_. Revert individual features by reversing the relevant schema/service/test/doc commits. If an ADR amendment made promises, mark it **Superseded** and link the replacement.

## Verification (pointers)

| Concern           | Tests / scripts                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Zod exports       | `pnpm db:verify-exports`                                                                                  |
| Migrations        | `pnpm exec tsx scripts/validate-migrations.ts`                                                            |
| Candidates        | `candidates-zod.test.ts`, email concurrency, HIRED rules                                                  |
| Applications      | `applications-zod.test.ts`, `applications-tenant-consistency.test.ts`, `applications-concurrency.test.ts` |
| Interviews        | `interviews-zod.test.ts`, `interviews-tenant-consistency.test.ts`                                         |
| Offer letters     | `offer-letters-zod.test.ts`, `offer-letters-tenant-consistency.test.ts`                                   |
| Job requisitions  | `job-requisitions-zod.test.ts`, `job-requisitions-tenant-consistency.test.ts`                             |
| Background checks | `background-checks-zod.test.ts`, tenant + Zod integration tests                                           |
| Backfill issues   | `candidate-salary-backfill-issues-*` tests                                                                |
| Exit interviews   | `exit-interviews-zod.test.ts`, `exit-interviews-tenant-consistency.test.ts`                               |

HR audit matrix: `docs/hr-schema-audit-matrix.md` + `pnpm check:hr-audit-matrix` + `src/db/__tests__/hr-schema-audit-matrix.test.ts` (recruitment + talent required sets and row count).

## Related

- [ADR index / map](./README.md) — how 0001 and 0002 fit together; how to add 0003+
- [ADR 0001 — Candidate HIRED HR-bridge](./0001-candidate-hired-hr-bridge.md)
- [Recruitment candidate databank](../../recruitment-candidate-databank.md)
- [DB-first guideline](../01-db-first-guideline.md) (migrations, CSQL, custom SQL)
