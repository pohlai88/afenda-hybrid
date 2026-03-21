# ADR 0001: Candidate `HIRED` HR-bridge policy

| Field      | Value                |
| ---------- | -------------------- |
| **Status** | Accepted             |
| **Date**   | 2026-03-20           |
| **Owners** | Product, Engineering |

## Context

- Talent profile grain: one `recruitment.candidates` row per identity per `tenantId` (partial uniques on normalized email and code).
- Dual lifecycle: `candidates.status` (global pool) vs `applications.status` (per requisition).
- Hire conversion uses `personId` → `hr.persons` and `convertedEmployeeId` → `hr.employees`.

## Decision

1. **Database:** Keep CHECK `chk_candidates_hired_requires_hr_bridge` on `recruitment.candidates`: when `status = HIRED`, both `personId` and `convertedEmployeeId` must be non-null.
2. **Application:** Mirror the rule in Zod:
   - **Insert:** `status = HIRED` requires both IDs in the payload.
   - **Update:** If `status = HIRED`, forbid explicit `null` on either HR id; if either HR id key is present in the patch, require **both** as positive integers in the same request. A patch of only `{ status: "HIRED" }` is allowed so the DB can validate rows where IDs were set in earlier updates.
3. **Staged hire:** Use an earlier status (e.g. `OFFER`) until both IDs exist, then set `HIRED`.

## Consequences

- **Pros:** Single invariant across API validation and DB; fewer “HIRED” rows missing HR linkage.
- **Cons:** Cannot persist `HIRED` without both IDs; phased hire must use intermediate statuses.
- **Changing this policy** requires: ADR superseding this one, migration to drop or replace the CHECK, doc updates (`recruitment-candidate-databank.md` §0), and Zod changes.

## Rollback / relaxation

1. Migration: `ALTER TABLE recruitment.candidates DROP CONSTRAINT chk_candidates_hired_requires_hr_bridge;` (and optionally replace with a weaker CHECK).
2. Update `candidates.ts` Zod refinements and module JSDoc.
3. Update §0 in `docs/recruitment-candidate-databank.md` and mark this ADR **Superseded** with a link to the new ADR.

## Related data quality: legacy `expectedSalary` text

Structured fields (`expectedSalaryAmount`, currency, period) are canonical. Backfill from legacy text is handled by migration `20260320172746_volatile_hiroim` (see `recruitment.candidate_salary_backfill_issues` for rows that need manual review).

## Verification (test matrix)

### Unit (Zod)

| Case                                                                    | Expect               |
| ----------------------------------------------------------------------- | -------------------- |
| Insert `expectedSalaryAmount` valid string + currency + period          | Pass                 |
| Insert amount without currency/period                                   | Fail                 |
| Insert amount number with ≤2 decimals                                   | Pass after normalize |
| Insert amount number with >2 decimals                                   | Fail                 |
| Insert `status: HIRED` without both HR ids                              | Fail                 |
| Update `{ status: "HIRED" }` only                                       | Pass (DB enforces)   |
| Update `{ status: "HIRED", personId: 1 }` without `convertedEmployeeId` | Fail                 |
| Update `{ status: "HIRED", personId: null }`                            | Fail                 |

### Integration (follow-up)

| Case                                        | Expect                                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Concurrent creates same `tenantId` + email  | One success; other `23505` on `uq_candidates_email` — see `src/db/__tests__/candidates-email-concurrency.test.ts` |
| Zod-valid insert → DB → read numeric salary | Round-trip matches                                                                                                |

Run: `pnpm vitest run --config vitest.db.config.ts src/db/__tests__/candidates-zod.test.ts`

## See also

- [ADR index / map](./README.md)
- [ADR 0002 — Recruitment lifecycle enforcement](./0002-recruitment-lifecycle-enforcement.md) — pipeline-wide Zod / DB / service pattern (this ADR is the `candidates` HIRED slice only)
