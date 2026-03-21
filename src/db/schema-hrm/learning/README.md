# Learning schema (`learning`) — Learning & Development (L&D)

PostgreSQL schema `learning` is the **Learning & Development (L&D)** domain: **course catalog** (courses, modules), **curriculum paths**, **scheduled delivery** (sessions), **session-based enrollments**, **sessionless / self-paced course enrollments**, **path assignments and per-course progress**, **assessments**, **certification awards** (linked to `talent.certifications`), **feedback**, and **session costs**.

This is **not** the same as **succession / talent “development plans”** (e.g. `developmentPlan` on `talent.succession_plans`). Those stay in the talent domain unless product adds an explicit cross-schema link.

## Layout

| Path            | Role                                                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_schema.ts`    | Drizzle `pgSchema("learning")`                                                                                                                                                                                                                                                                                |
| `_zodShared.ts` | **`learningBounds`**, field `*Schema`s, `learningOptional`, cross-field refinements; **date/timestamptz wire formats** are imported from `../../_shared/zodWire` and re-exported (same symbols as before). Catalog: file docblock + [Cross-field refinements catalog](#cross-field-refinements-catalog) below |
| `_relations.ts` | `defineRelations()` graph for RQB (`learningRelations`), merged in `src/db/db.ts`                                                                                                                                                                                                                             |
| `fundamentals/` | Courses, modules, trainers, learning paths, path–course junction                                                                                                                                                                                                                                              |
| `operations/`   | Sessions, training enrollments, **course enrollments** (sessionless), **path assignments**, **path course progress**, assessments, certification awards, feedback, cost records                                                                                                                               |
| `index.ts`      | Barrel exports                                                                                                                                                                                                                                                                                                |

## Cross-schema dependencies

| From                     | To                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Tenant-scoped L&D tables | `core.tenants`                                                                                  |
| Courses, costs           | `core.currencies` (where modeled)                                                               |
| Sessions                 | `core.locations`                                                                                |
| Employee-scoped rows     | `employeeId` → `hr.employees` (Drizzle often omits FK to avoid cycles; see per-table docblocks) |
| Certification awards     | `talent.certifications`                                                                         |

## Conventions

1. **Enums in Zod** — Each Postgres enum has a `const` tuple and **`z.enum(thatTuple)`** for insert/update overrides (not `createSelectSchema(pgEnum)`), aligned with other domains’ README guidance.
2. **Session vs sessionless** — `training_enrollments` always reference `training_sessions`. **Sessionless** progress uses `course_enrollments` (enforce allowed `courses.format` in the application or API; not a cross-table DB `CHECK`).
3. **Completion consistency** — For enrollments and path progress, `completionDate` is set if and only if status is `COMPLETED` (DB `CHECK` + `refineRequiresCompletionDateIfCompleted`, implemented with generic `refineFieldWhenStatusEquals`).
4. **Training completion vs attendance** — `training_enrollments`: if `status = COMPLETED`, then `attendancePercent` is null or ≥ `LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT` (80). Zod: `refineAttendanceCompletionConsistency`; DB: `chk_training_enrollments_completed_min_attendance` (migration literal `80` must match the TS constant).
5. **Courses (Zod-only cross-field)** — `status = ACTIVE` requires non-blank `objectives`; `isMandatory = true` requires non-blank `prerequisites` (`refineRequiresObjectivesIfActive`, `refineRequiresPrerequisitesIfMandatory`). Partial updates must include the dependent field in the same payload when flipping those flags. **Format:** insert uses `applyDefaultFormat: "CLASSROOM"` so omitted `format` matches the table default; effective **CLASSROOM** requires positive `maxParticipants`; **CLASSROOM** / **WORKSHOP** require positive `durationHours` (`refineRequiresCapacityForClassroom`, `refineRequiresDurationForInstructorLed`). Updates without `format` skip those rules; patches that set `format` to CLASSROOM/WORKSHOP must include the dependent columns in the same payload. **`refineRequiresContentUrlForOnline`** applies only to composite DTOs (no `contentUrl` on `courses`). Add `CHECK` later if the DB should enforce too.
6. **Compliance** — Optional `dueBy` and `complianceCode` on `course_enrollments`, `learning_path_assignments`, and `training_enrollments` for per-employee obligations and reporting.
7. **Path progress** — Rows reference `learning_path_course_progress.pathCourseId` (junction row). The application must ensure that `path_course` belongs to the same `learning_path` as the parent assignment when creating/updating rows.
8. **Audit** — Tables with `auditColumns` require `createdBy` / `updatedBy` on insert from the service layer.
9. **Validation stack** — Prefer: constant in `_zodShared.ts` → refinement (and optional `CHECK`) → Vitest (`learning-ld-*` / `courses-zod`) → convention note here.
10. **Postgres `date` / `timestamptz` in Zod** — Required **`date`**: **`dateStringSchema`**. Optional on insert: **`dateOptionalSchema`**. Nullable **`date`** on update: **`dateNullableOptionalSchema`**. Native **`Date`**: **`dateCoerceSchema`**. **`timestamptz`**: **`timestamptzStringSchema`** / **`timestamptzOptionalSchema`**; nullable **`timestamptz`** patches: **`timestamptzNullableOptionalSchema`**. See `_zodShared.ts` docblock table.
11. **Update (`*UpdateSchema`) patch semantics** — Each `createUpdateSchema` export carries a short JSDoc: `.optional()` means omit or assign; **`nullableOptional`**, **`dateNullableOptionalSchema`**, and **`timestamptzNullableOptionalSchema`** also allow explicitly clearing nullable columns to SQL NULL. Tables whose updates are only `.optional()` note that there are no explicit NULL clears on that schema.
12. **Temporal cross-field rules** — When two calendar fields appear in the same payload, refinements enforce ordering (sessions **`endDate` ≥ `startDate`**, awards **`expiryDate` ≥ `awardDate`**, enrollments **`completionDate` ≤ `dueBy`**, path assignments **`dueBy` ≥ `assignedAt`**). Catalog below; add DB `CHECK` when the rule must be a hard invariant.

## Cross-field refinements catalog

Canonical list lives in the `_zodShared.ts` docblock; this table is the team-facing summary.

| Refinement                                                                                    | DB-backed                                                 | Wired in / notes                                                                                                            |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `refineRequiresCurrencyIfCost` / `refineCurrencyIdWhenCourseCostSet`                          | yes (`chk_courses_cost`)                                  | `courses` insert/update                                                                                                     |
| `refineRequiresObjectivesIfActive`                                                            | Zod only                                                  | `courses` insert/update                                                                                                     |
| `refineRequiresPrerequisitesIfMandatory`                                                      | Zod only                                                  | `courses` insert/update                                                                                                     |
| `refineRequiresDurationForInstructorLed`                                                      | Zod only                                                  | `courses` insert/update; insert passes `applyDefaultFormat: "CLASSROOM"`                                                    |
| `refineRequiresCapacityForClassroom`                                                          | Zod only                                                  | `courses` insert/update; insert passes default format as above                                                              |
| `refineRequiresContentUrlForOnline`                                                           | Zod only                                                  | Composite payloads with `format` + `contentUrl` — not the `courses` row                                                     |
| `refineRequiresCompletionDateIfCompleted` / `refineLearningCompletionRequiresCompletedStatus` | yes (`chk_*_completion_consistency`)                      | Aliases; course/path/training enrollment & progress schemas                                                                 |
| `refineFieldWhenStatusEquals`                                                                 | —                                                         | Generic helper for status-dependent fields                                                                                  |
| `refineEstimatedHoursConsistency`                                                             | partial (`chk_learning_paths_hours` > 0 when set)         | Learning paths; often redundant with `pathEstimatedHoursSchema`                                                             |
| `refineAttendanceCompletionConsistency`                                                       | yes (`chk_training_enrollments_completed_min_attendance`) | `training_enrollments` insert/update; constant `LEARNING_MIN_ATTENDANCE_PERCENT_FOR_COMPLETED_DEFAULT` must match migration |
| `refineAssessmentPassingVsMaxScore`                                                           | yes (`chk_assessments_passing_score`)                     | `assessments` insert/update when both scores are in the payload                                                             |
| `refineEndDateOnOrAfterStartDate`                                                             | yes (`chk_training_sessions_dates`)                       | `training_sessions` insert/update when both dates are in the payload                                                        |
| `refineCompletionDateOnOrBeforeDueBy`                                                         | Zod only                                                  | `course_enrollments` / `training_enrollments` — completion not after `dueBy`                                                |
| `refineExpiryDateOnOrAfterAwardDate`                                                          | yes (`chk_certification_awards_expiry`)                   | `certification_awards` insert/update                                                                                        |
| `refineDueByOnOrAfterAssignedAt`                                                              | Zod only                                                  | `learning_path_assignments` — `dueBy` not before `assignedAt`                                                               |

## Tests

| File                                  | Focus                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `learning-ld-enrollments-zod.test.ts` | Course/path/training enrollment Zod — completion vs status, `dueBy` vs `assignedAt`, completion vs `dueBy`                                                         |
| `course-modules-zod.test.ts`          | Course modules — `moduleCode` trim + lowercase (Zod, matches `lower(moduleCode)` uniqueness)                                                                       |
| `courses-zod.test.ts`                 | Courses — `courseCode` normalization, cost + `currencyId`, format→duration/capacity, ACTIVE/objectives, mandatory/prerequisites, composite `contentUrl` refinement |
| `learning-path-courses-zod.test.ts`   | Path–course junction — sequence max, partial updates (`isRequired`, `sequenceNumber`)                                                                              |
| `assessments-zod.test.ts`             | Assessments — `assessmentDate` format, timestamptz strings, `passingScore` vs `maxScore`                                                                           |
| `training-sessions-zod.test.ts`       | Training sessions — `endDate` ≥ `startDate` (Zod + DB `CHECK` mirror)                                                                                              |
| `certification-awards-zod.test.ts`    | Certification awards — `expiryDate` ≥ `awardDate`                                                                                                                  |

```bash
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/learning-ld-enrollments-zod.test.ts
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/course-modules-zod.test.ts
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/courses-zod.test.ts
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/learning-path-courses-zod.test.ts
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/assessments-zod.test.ts
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/training-sessions-zod.test.ts
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/certification-awards-zod.test.ts
```

## Reference

- DB-first patterns: `docs/architecture/01-db-first-guideline.md`
