# Recruitment: candidate talent databank (DB contract)

**Scope:** Database layer only — `recruitment.candidates`, `recruitment.applications`, and how they relate to `jobRequisitions` and HR. For PostgreSQL constraint order, partial uniques, and custom SQL workflow, see [architecture/01-db-first-guideline.md](./architecture/01-db-first-guideline.md) (§7.1, §7.2, §8.2.1). PII context: [hr-data-dictionary.md](./hr-data-dictionary.md). **Enforcement layering** (Zod vs DB CHECKs/triggers vs `src/db/_services/recruitment/*`): [ADR 0002](./architecture/adr/0002-recruitment-lifecycle-enforcement.md).

---

## 0. Canonical model (this repo)

These are **deliberate** choices for Afenda hybrid — not “optional appendix” text mixed with legacy behavior:

| Topic                   | Canonical rule                                                                                                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity / grain**    | One active `candidates` row per person per `tenantId` (partial uniques on email + code). Reapply = new `applications` row.                                                                                                                                      |
| **Pipeline vs profile** | Funnel metrics → `applications` (+ interviews/offers). `candidates.status` = global talent-pool lifecycle only.                                                                                                                                                 |
| **Expected pay**        | Source of truth: `expectedSalaryAmount` + `expectedSalaryCurrencyId` + `expectedSalaryPeriod`. `expectedSalary` (text) is **legacy read/compat only** until an ADR removes it after backfill.                                                                   |
| **Hired / HR bridge**   | `status = HIRED` **iff** both `personId` and `convertedEmployeeId` are set (CHECK + Zod). Staged hire → stay on `OFFER` (or similar) until both IDs exist, then set `HIRED`. Formal decision: [ADR 0001](./architecture/adr/0001-candidate-hired-hr-bridge.md). |
| **Indexes**             | List/pool by tenant + status + recency → `idx_candidates_tenant_status_updated_at` only (no separate `(tenantId, status)` index).                                                                                                                               |

If product later needs **HIRED** before both IDs exist, supersede ADR 0001, migrate the CHECK, and update this section — do not leave DB, Zod, and docs in conflict.

**Concurrency:** partial uniques do not serialize writers — two parallel creates with the same normalized email can race; Postgres rejects one with `23505`. Integration coverage: `src/db/__tests__/candidates-email-concurrency.test.ts`.

---

## 1. Grain: profile vs application

| Concept                       | Table                          | Rule                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Talent profile (databank)** | `recruitment.candidates`       | At most **one active row per candidate identity per tenant**. Identity is enforced by partial uniques on `(tenantId, lower(email))` and `(tenantId, lower(candidateCode))` where `deletedAt IS NULL`. |
| **Application event**         | `recruitment.applications`     | Each row is **one candidate’s application to one requisition**. Reapply or apply to another job = **new `applications` row**, same `candidateId`, different `requisitionId`.                          |
| **Posting**                   | `recruitment.job_requisitions` | Internal requisition the candidate applied to.                                                                                                                                                        |

**Do not** create a second `candidates` row when someone applies again or applies to another opening.

---

## 2. Dual status: which field means what

| Column                | Scope                       | Use                                                                                                                                  |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `candidates.status`   | Person / databank lifecycle | e.g. `NEW`, `SCREENING`, `INTERVIEWING`, `OFFER`, `HIRED`, `REJECTED`, … — overall relationship with the organization’s talent pool. |
| `applications.status` | Per requisition             | e.g. `SUBMITTED`, `SHORTLISTED`, `INTERVIEWING`, `HIRED`, `REJECTED`, … — pipeline for **that** application.                         |

**Funnel and time-in-stage metrics** should primarily use **`applications`** (and downstream `interviews`, `offer_letters`, etc.), not `candidates.status` alone. Document dashboards accordingly to avoid mixing global candidate state with per-req funnel counts.

---

## 3. Reapply and duplicate prevention

- Partial unique **`uq_applications_candidate_requisition`** on `(tenantId, candidateId, requisitionId)` where `deletedAt IS NULL` prevents two active applications from the same candidate to the same requisition.
- After soft-delete of an application, a new application to the same requisition is allowed (new row).
- **Tenant alignment:** `applications.tenantId` must equal both `candidates.tenantId` and `job_requisitions.tenantId` for the referenced rows. The database does not enforce that; use the application-layer helper **`createApplication`** in `src/db/_services/recruitment/applicationsService.ts` (throws `ApplicationTenantMismatchError` on mismatch). Integration test: `src/db/__tests__/applications-tenant-consistency.test.ts`.
- **Background checks:** `recruitment.background_checks.tenantId` must match `candidates.tenantId` for the candidate. Enforce via **`createBackgroundCheck`** in `src/db/_services/recruitment/backgroundChecksService.ts`. Test: `src/db/__tests__/background-checks-tenant-consistency.test.ts`.
- **Interviews:** `recruitment.interviews.tenantId` must match `applications.tenantId` for `applicationId`. Enforce via **`createInterview`** in `src/db/_services/recruitment/interviewsService.ts`. Test: `src/db/__tests__/interviews-tenant-consistency.test.ts`.
- **Offer letters:** `recruitment.offer_letters.tenantId` must match `applications.tenantId` for `applicationId`. Enforce via **`createOfferLetter`** in `src/db/_services/recruitment/offerLettersService.ts`. Test: `src/db/__tests__/offer-letters-tenant-consistency.test.ts`.
- **Job requisitions:** `tenantId` must match optional `hr.departments`, `hr.positions`, and `hr.employees` when those IDs are set. Enforce via **`createJobRequisition`** in `src/db/_services/recruitment/jobRequisitionsService.ts`. Test: `src/db/__tests__/job-requisitions-tenant-consistency.test.ts`.

---

## 4. HR bridge (hire / conversion)

- `personId` → `hr.persons` (data subject).
- `convertedEmployeeId` → `hr.employees` (employment).

Hire semantics and staging are summarized in **§0** (CHECK `chk_candidates_hired_requires_hr_bridge`).

**Cross-schema FKs** to HR may follow the same **custom SQL / circular FK** patterns as elsewhere in recruitment; do not add undocumented cross-schema FKs without ADR ([01-db-first-guideline.md §3.5](./architecture/01-db-first-guideline.md)).

---

## 5. Expected salary (structured vs legacy)

Canonical vs legacy is fixed in **§0**. **Removal policy for `expectedSalary` (text):** do not drop the column until (1) a backfill migration copies parseable text into structured fields where possible, (2) consumers read only structured fields, and (3) an ADR records the cutover.

**Backfill:** migration `20260320172746_volatile_hiroim` strips non-numeric characters conservatively, fills `expectedSalaryAmount` where the result matches `numeric(14,2)` bounds, and inserts review rows into **`recruitment.candidate_salary_backfill_issues`** for the rest (Drizzle: `candidateSalaryBackfillIssues`). `tenantId` on that table is FK to **`core.tenants`** (migration `20260320174013_clean_jasper_sitwell`). Application-layer inserts should use **`createCandidateSalaryBackfillIssue`** (`src/db/_services/recruitment/candidateSalaryBackfillIssuesService.ts`) so `tenantId` matches the candidate. Test: `src/db/__tests__/candidate-salary-backfill-issues-tenant-consistency.test.ts`.

Zod requires **currency + period when amount is set** (`candidates.ts`). Amount may be a **string or number** (both aligned to `numeric(14,2)`).

---

## 6. Microservices and evolution

Stable keys for APIs and workers:

- **`tenantId`** — every query and write must be tenant-scoped.
- **`candidateId`** — long-lived profile id.
- **`applicationId`** — per application event.

New capabilities should prefer **new tables** (see §8) rather than widening `candidates` with unrelated columns.

---

## 7. Phase E roadmap (DB-only — not implemented)

Illustrative future tables (names TBD until product prioritizes):

| Need                  | Direction                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **TRM / touchpoints** | Child rows keyed by `(tenantId, candidateId)` — e.g. activities, comms log, consent — **not** stuffed into `candidates`. |
| **Multiposting**      | Channel / external posting metadata keyed by `requisitionId` (or a dedicated posting entity).                            |
| **Funnel history**    | Optional append-only **stage transition** or event table if BI needs more than current `applications.status`.            |

Prefer **3NF**; use **JSONB + GIN** only for genuine semi-structured metadata ([01-db-first-guideline.md §4.11](./architecture/01-db-first-guideline.md)).

---

## 8. Pool listing index

Composite B-tree **`idx_candidates_tenant_status_updated_at`** on `(tenantId, status, updatedAt)` is the **only** status-scoped btree on candidates: it serves `(tenantId, status)` filters via index prefix and supports `ORDER BY updatedAt`. The older **`idx_candidates_status`** was removed as redundant (fewer index updates on write). Revisit only with `EXPLAIN` / load evidence ([01-db-first-guideline.md §8.2](./architecture/01-db-first-guideline.md)).

---

## Related code

- `src/db/schema-hrm/recruitment/fundamentals/candidates.ts`
- `src/db/schema-hrm/recruitment/operations/applications.ts`
- `src/db/schema-hrm/recruitment/operations/jobRequisitions.ts`
- `src/db/schema-hrm/recruitment/operations/candidateSalaryBackfillIssues.ts`
- `src/db/schema-hrm/recruitment/_relations.ts`
