# Talent domain boundaries

## HR credentials vs L&D awards

Two tables can represent “employee holds certification X”:

| Table | Schema | Role |
|-------|--------|------|
| `talent.employee_certifications` | Talent | HR record: snapshots (`certificationCodeSnapshot`, etc.), verification (`verifiedBy`, `verificationDate`), statuses including `PENDING_VERIFICATION`. |
| `learning.certification_awards` | Learning | L&D outcome: `awardDate`, optional `certificateUrl`, statuses including `PENDING_RENEWAL`. |

**Guidance**

- Use **employee_certifications** when the source of truth is HR compliance / manual upload / external verification workflows.
- Use **certification_awards** when the credential is issued from **completed learning** paths or LMS-style events.
- Both reference `talent.certifications` as the catalog row (`certificationId`). They are **not** merged at the database layer; avoid writing the same real-world credential twice unless product explicitly allows duplicates.
- Optional future alignment: add nullable `awardId` on `employee_certifications` (FK → `learning.certification_awards`) or a shared “credential instance” table — **product decision**.

## `talent.case_links` integrity

`case_links` is a **polymorphic** graph: `(sourceType, sourceId)` and `(targetType, targetId)` with `sourceType` / `targetType` ∈ `talent.case_entity_type` (`GRIEVANCE`, `DISCIPLINARY`).

PostgreSQL cannot attach a single FK to “one of several tables” without partitioned tables, triggers, or per-type link tables. **Referential integrity for IDs is application-enforced.**

**Invariants (app / batch jobs)**

1. When `sourceType = 'GRIEVANCE'`, `sourceId` must exist in `talent.grievance_records` for the same `tenantId` (and not soft-deleted if your API excludes deleted rows).
2. When `sourceType = 'DISCIPLINARY'`, `sourceId` must exist in `talent.disciplinary_actions` for the same `tenantId`.
3. Same for `targetType` / `targetId`.
4. `chk_case_links_no_self_loop` already prevents same-type-and-id self edges.

**Data-quality check:** `pnpm report:case-links-integrity` counts rows that violate the above (orphan `(type, id)` pairs). See [CI_GATES.md](./CI_GATES.md).

## Related

- [talent-schema-inventory.md](./talent-schema-inventory.md)
- [talent-management-roadmap.md](./talent-management-roadmap.md)
