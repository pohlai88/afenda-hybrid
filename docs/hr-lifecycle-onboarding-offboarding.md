# Employee lifecycle: onboarding vs offboarding (schema reality)

## What you have today

**Onboarding (first-class)**

- [`recruitment.onboarding_checklists`](../src/db/schema-hrm/recruitment/operations/onboardingChecklists.ts) — per-employee tasks with categories (IT, training, compliance, equipment, etc.), assignee, due/completed dates, and sequence.

**Offboarding checklist (first-class, option 2)**  
[`recruitment.offboarding_checklists`](../src/db/schema-hrm/recruitment/operations/offboardingChecklists.ts) mirrors onboarding: per-employee rows with exit-oriented `taskCategory`, assignee, dates, sequence, and status (same enum values as `onboarding_task_status`).

**Exit interview (departure — not ATS interviews)**  
[`recruitment.exit_interviews`](../src/db/schema-hrm/recruitment/operations/exitInterviews.ts) holds the **substance** of the leaving conversation: `scheduledAt` / `conductedAt`, `format`, `conductedByEmployeeId`, free-text `keyThemes`, `summaryNotes`, `concernsRaised`, optional `wouldRehire`, and `status` (`exit_interview_status`).  
**Required product flow:** create an `offboarding_checklists` row with `taskCategory = EXIT_INTERVIEW` first, then create `exit_interviews` with `linkedOffboardingChecklistId` set to that row (column is `NOT NULL`; partial unique index enforces at most one active interview per checklist row).  
Candidate pipeline interviews stay on [`recruitment.interviews`](../src/db/schema-hrm/recruitment/operations/interviews.ts) (`applicationId`-scoped).

**Architecture note — DB enforcement (`EXIT_INTERVIEW` + alignment)**  
**CSQL-015** (`20260320203000_exit_interview_linked_checklist_trigger`): `recruitment.enforce_exit_interview_linked_checklist` on `exit_interviews` (BEFORE INSERT / UPDATE of link + tenant + employee) requires the linked checklist row to exist, not be soft-deleted, have `taskCategory = EXIT_INTERVIEW`, and match `tenantId` / `employeeId`. `recruitment.enforce_offboarding_checklist_for_exit_interviews` on `offboarding_checklists` blocks soft-delete or changing `taskCategory` away from `EXIT_INTERVIEW` or changing `tenantId`/`employeeId` while an active `exit_interviews` row references that checklist. Registered in `src/db/schema-platform/audit/CUSTOM_SQL_REGISTRY.json`. There is still no HTTP/API in this package — services should rely on these invariants when inserting/updating via SQL.

**Exit / separation (still distributed beyond checklist + exit interview)**  
The product carries much of what offboarding workflows need across several domains in addition to the checklist table:

| Concern                     | Where it lives                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Employment end              | [`hr.employees`](../src/db/schema-hrm/hr/fundamentals/employees.ts) — `terminationDate`, `status = TERMINATED`                                                         |
| Notice                      | [`hr.notice_period_records`](../src/db/schema-hrm/hr/employment/noticePeriodRecords.ts)                                                                                |
| Payroll close-out           | [`payroll.final_settlements`](../src/db/schema-hrm/payroll/operations/finalSettlements.ts) — `terminationDate`, `lastWorkingDay`, amounts                              |
| Benefits end                | [`benefits.benefit_enrollments`](../src/db/schema-hrm/benefits/operations/benefitEnrollments.ts) — coverage end / termination reason (and related dependents coverage) |
| Equipment                   | [`hr.asset_assignments`](../src/db/schema-hrm/hr/selfservice/assetAssignments.ts) — track return vs onboarding-style issuance                                          |
| ER / discipline-driven exit | [`talent.disciplinary_actions`](../src/db/schema-hrm/talent/operations/disciplinaryActions.ts) (incl. termination type)                                                |

Operational exit data still spans these tables; the **checklist** layer is now symmetric with onboarding for task tracking.

## Why a dedicated offboarding checklist still matters

For compliance and operations, teams usually want the same properties onboarding has: **ordered tasks**, **owners**, **due dates**, **audit trail**, and **status** for things like:

- Access revocation (IdP, VPN, email)
- Device / badge return
- Final pay and statutory filings (ties to `final_settlements`)
- Benefits continuation messaging (COBRA-like / local equivalent)
- Exit interview / knowledge transfer
- Revocation of internal roles and talent artifacts (pools, succession rows)

Today those steps are either **manual**, **app-workflow only**, or **implied** by updates to the tables above.

## Suggested directions (product + DB)

1. **Generalize onboarding**  
   Add a discriminator on a single table, e.g. `lifecycle_phase` ∈ `JOINING` | `LEAVING`, plus offboarding-specific `task_category` values — one migration, one relations surface, shared reporting.

2. **Mirror table** _(implemented as `recruitment.offboarding_checklists`)_  
   Same shape as `onboarding_checklists` with exit-oriented categories (`offboarding_task_category`) and shared `onboarding_task_status`.

3. **Case-style workflow**  
   A generic `hr.workflow_cases` + `hr.workflow_tasks` (or reuse a future case pattern) keyed by `employeeId` and `caseType`, if you want one engine for onboarding, offboarding, transfers, and leave of absence.

Prefer (1) or (2) for v1 if the only gap is **parity with onboarding checklists**; expand to (3) if you need one workflow engine across HR processes.

---

## Concrete Drizzle sketches: option (1) vs option (2)

**Option (2) is implemented** as [`offboarding_checklists`](../src/db/schema-hrm/recruitment/operations/offboardingChecklists.ts). The sketches below remain useful when comparing to **option (1)** (generalized table). Shapes align with [`onboarding_checklists`](../src/db/schema-hrm/recruitment/operations/onboardingChecklists.ts).

### Shared building blocks (both options)

- **Tenant + employee** — `tenantId`, `employeeId` (same FK / custom-SQL story as today).
- **Task row** — `taskName`, `description`, `assignedTo`, `dueDate`, `completedDate`, `sequenceNumber`, `status`, `notes`, plus your usual `timestampColumns`, `softDeleteColumns`, `auditColumns`.
- **Status enum** — Reuse the same labels as `onboarding_task_status` (`PENDING`, `IN_PROGRESS`, …) unless product wants different semantics for exits.
- **Relations** — `employees`: `many` tasks; `assignedTo` → `employees` optional; keep aliases if multiple `employeeId`-style edges exist.

---

### Option (1) — Generalize: one physical table

**Idea:** One table holds both joining and leaving tasks; filter and report by phase.

**A. Minimal change (keep table name `onboarding_checklists`)**

- Add column: `lifecyclePhase` → new PG enum `recruitment.lifecycle_phase`: `JOINING` | `LEAVING`.
- Backfill: `UPDATE ... SET lifecycle_phase = 'JOINING'`.
- **Extend** `task_category` (or replace with a wider enum) so it includes both today’s join categories and leave-oriented values, e.g.  
  `IT_DEPROVISION`, `PAYROLL_FINAL`, `BENEFITS_CONTINUATION`, `ASSET_RETURN`, `ACCESS_REVOCATION`, `EXIT_INTERVIEW`, `KNOWLEDGE_TRANSFER`, … plus existing `IT_SETUP`, `EQUIPMENT`, etc.
- **Unique sequence:** replace  
  `(tenantId, employeeId, sequenceNumber)`  
  with  
  `(tenantId, employeeId, lifecyclePhase, sequenceNumber)`  
  so join task #1 and leave task #1 can both exist.

**B. Cleaner naming (optional follow-up migration)**

- Rename table → `employee_lifecycle_checklists` (or `recruitment.lifecycle_checklist_items`) and rename PK column for clarity — extra migration and code churn; only worth it if “onboarding” in the name becomes misleading for every consumer.

**Drizzle sketch (core columns only)**

```typescript
// recruitmentSchema.enum("lifecycle_phase", ["JOINING", "LEAVING"]);
// recruitmentSchema.enum("lifecycle_task_category", [ ...join + leave labels... ]);

export const employeeLifecycleChecklists = recruitmentSchema.table(
  "onboarding_checklists", // or renamed table
  {
    checklistId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    lifecyclePhase: lifecyclePhaseEnum().notNull(), // JOINING | LEAVING
    taskName: text().notNull(),
    taskCategory: lifecycleTaskCategoryEnum().notNull(),
    // ... same fields as today: description, assignedTo, dueDate, completedDate,
    // sequenceNumber, status, notes, timestamps, soft delete, audit
  },
  (t) => [
    // indexes: add leading (tenantId, lifecyclePhase) or partial indexes per phase if reporting-heavy
    uniqueIndex("uq_lifecycle_checklists_sequence")
      .on(t.tenantId, t.employeeId, t.lifecyclePhase, t.sequenceNumber)
      .where(sql`${t.deletedAt} IS NULL`),
    // chk_sequence >= 1, fk_tenant, ...
  ]
);
```

**Pros / cons (implementation)**

- Single contract test module, one relations graph, one place for app queries.
- Product must enforce sensible pairs (e.g. `JOINING` + `IT_DEPROVISION` invalid) via CHECK, API validation, or documented convention — or split category enum per phase in DB (two enums + CHECK linking phase to allowed category) if you want hard guarantees.

---

### Option (2) — Mirror: `offboarding_checklists`

**Status:** Implemented in [`offboardingChecklists.ts`](../src/db/schema-hrm/recruitment/operations/offboardingChecklists.ts) (Drizzle migration `20260320160807_offboarding_checklists`).

**Idea:** Second table, parallel to `onboarding_checklists`, offboarding-specific categories and optional enum names.

**Drizzle sketch**

```typescript
export const offboardingTaskCategories = [
  "IT_DEPROVISION",
  "ACCESS_REVOCATION",
  "ASSET_RETURN",
  "PAYROLL",
  "BENEFITS",
  "STATUTORY_FILING",
  "EXIT_INTERVIEW",
  "KNOWLEDGE_TRANSFER",
  "COMPLIANCE",
  "OTHER",
] as const;

export const offboardingTaskCategoryEnum = recruitmentSchema.enum("offboarding_task_category", [
  ...offboardingTaskCategories,
]);

// Status: reuse `onboarding_task_status` in Drizzle if PG enum is identical, or:
// export const offboardingTaskStatusEnum = recruitmentSchema.enum("offboarding_task_status", [...]);

export const offboardingChecklists = recruitmentSchema.table(
  "offboarding_checklists",
  {
    offboardingChecklistId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    taskName: text().notNull(),
    taskCategory: offboardingTaskCategoryEnum().notNull(),
    description: text(),
    assignedTo: integer(),
    dueDate: date(),
    completedDate: date(),
    sequenceNumber: smallint().notNull().default(1),
    status: taskStatusEnum().notNull().default("PENDING"), // shared with onboarding, or a dedicated offboarding enum
    notes: text(),
    // ...timestampColumns, softDeleteColumns, auditColumns
  },
  (t) => [
    index("idx_offboarding_checklists_tenant").on(t.tenantId),
    index("idx_offboarding_checklists_employee").on(t.tenantId, t.employeeId),
    uniqueIndex("uq_offboarding_checklists_sequence")
      .on(t.tenantId, t.employeeId, t.sequenceNumber)
      .where(sql`${t.deletedAt} IS NULL`),
    // fk_tenant, chk_sequence, ...
  ]
);
```

**Relations (`recruitment/_relations.ts`)**

- Mirror the `onboardingChecklists` block: `employees.offboardingChecklists`, `offboardingChecklists.employee`, `assignee`, etc.

**Pros / cons**

- Crystal-clear API and docs (“onboarding” vs “offboarding”).
- Duplicate Zod/contract surface; any change to task row shape may need two edits.

---

### Quick decision guide

| Criterion                                    | Favor (1) generalized                 | Favor (2) mirror      |
| -------------------------------------------- | ------------------------------------- | --------------------- |
| Reporting “all open HR tasks” in one query   | Yes                                   | Need `UNION`          |
| Mental model for recruiters / API naming     | Slightly muddied unless table renamed | Very clear            |
| DB constraints per phase                     | Easier with one table + CHECK         | Natural split         |
| Long-term drift between join vs leave fields | Same columns forced                   | Can diverge if needed |

### Best practice: how to choose (1) vs (2)

Neither option is universally “correct.” **Best practice is to match storage shape to product boundaries and how teams consume the data.**

**Prefer option (1) — one generalized table — when:**

- You want a **single “HR tasks” or “lifecycle tasks”** view (open items, SLAs, audit) across join and leave without `UNION`.
- **Join and leave tasks are the same grain**: same columns, same status machine, same assignment rules; only category and phase differ.
- You are willing to **encode invariants in the database**: e.g. `lifecycle_phase` is `NOT NULL`, unique key includes phase, and (ideally) a `CHECK` or documented rule that **category is valid for that phase** so `JOINING` rows cannot pick `IT_DEPROVISION`.
- You plan to **rename** the physical table (or at least the Drizzle export / API resource) if “onboarding” in the name would confuse integrators — naming is part of the design.

**How to do (1) well:** backfill `lifecycle_phase = 'JOINING'` before enforcing `NOT NULL`; add indexes that match real queries (`(tenantId, lifecyclePhase, status)` is common); keep enums **as small as clarity allows** (avoid one giant grab-bag category enum without phase rules).

**Prefer option (2) — mirrored `offboarding_checklists` — when:**

- **Bounded contexts differ**: recruiting owns onboarding while HRBP/payroll owns offboarding, with different release cadence, RLS, or retention.
- You expect **schema drift** (extra columns on exit only: e.g. `linkedFinalSettlementId`, `exitInterviewCompletedBy`) while onboarding stays stable.
- **APIs and docs** must stay literally “onboarding” vs “offboarding” with zero ambiguity for partners.

**How to do (2) well:** treat the two tables as **one conceptual model**: extract shared column definitions or code-gen from a single spec so a row-shape change is not edited twice by hand; align status enums unless product needs different terminal states for exits. For **exit interviews**, `recruitment.exit_interviews` is **required** to reference the `EXIT_INTERVIEW` checklist row via `linkedOffboardingChecklistId` (`NOT NULL` + one active row per checklist task).

**Pragmatic rule of thumb**

- **One product surface (“all lifecycle tasks”)** → bias toward **(1)**.
- **Two products or two security domains (“recruiting” vs “HR operations”)** → bias toward **(2)**.
- If unsure, **(2)** is often the safer v1 for clarity; **(1)** is the better consolidation play once duplication or reporting pain shows up.

### When you implement either option

1. **Migrations** — enums, column/table, unique index, backfill.
2. **[hr-schema-audit-matrix.md](./hr-schema-audit-matrix.md)** — new or altered row; bump `EXPECTED_TABLES` / `REQUIRED_TALENT_TABLES` only if you add tables under `talent` (not for `recruitment` offboarding).
3. **[hr-data-dictionary.md](./hr-data-dictionary.md)** — replace the “no checklist table” line with the chosen design.
4. **Contract tests** — add a `recruitment` PgTable contract file (or extend an existing one) for the new/changed table.
5. **`CUSTOM_SQL_REGISTRY.json`** — if you add circular-FK avoidance like today’s onboarding table.

---

## Related docs

- [hr-data-dictionary.md](./hr-data-dictionary.md) — process minimums
- [hr-schema-audit-matrix.md](./hr-schema-audit-matrix.md) — full table list
- [talent-management-roadmap.md](./talent-management-roadmap.md) — other future HCM entities

When you add net-new tables, follow [talent-schema-inventory.md § Adding or renaming](./talent-schema-inventory.md#adding-or-renaming-a-talent-table) patterns for **any** new `talent.*` objects; for `hr` / `recruitment`, extend the audit matrix, contracts (if present), and migrations the same way.
