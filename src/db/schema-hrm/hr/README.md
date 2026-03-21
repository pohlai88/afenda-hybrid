# HR Schema

Human Resources domain schema for AFENDA-HYBRID.

## Structure

```
hr/
├── _schema.ts              # Schema declaration (pgSchema("hr"))
├── _zodShared.ts           # HR bounds, refinements; re-exports `_shared/zodWire` date/timestamptz helpers
├── _relations.ts           # HR relations (fundamentals, people, time, operations)
├── index.ts                # Barrel export
├── CIRCULAR_FKS.md         # Circular FK handling documentation
├── README.md               # This file
├── people/                 # Person identity (names, contacts, dependents, …)
├── employment/             # Contracts, grades, reporting lines, transfers, …
├── time/                   # Schedules, shifts, timesheets, leave types/balances, …
├── selfservice/            # HR self-service requests
├── fundamentals/           # employees, departments, positions
└── operations/             # attendanceLogs, leaveRequests
```

Payroll execution lives in the **`payroll`** pgSchema (`payroll.operations.payrollRuns`), not under `hr.operations`.

## Tables

### Fundamentals (Master Data)

#### `employees`

Work relationship: links a **person** (`personId` → `hr.persons`) to the organization.

**Key Fields:**

- `employeeId` (PK), `tenantId` (FK → core.tenants), `personId` (FK → hr.persons)
- `employeeCode` (unique per tenant)
- `hireDate`, `terminationDate`
- `departmentId` (FK → departments), `positionId` (FK → positions)
- `managerId` (self-ref), `locationId` (FK → core.locations)
- `status` enum: ACTIVE, ON_LEAVE, TERMINATED, SUSPENDED, PENDING, PROBATION
- `notes`

Identity (name, email, DOB, etc.) is on **`hr.persons`** and related people tables.

**Check Constraints:**

- Hire date >= 1900-01-01
- Termination date >= hire date (when set)
- TERMINATED status requires termination date

**Indexes:**

- Tenant-leading on all FK columns
- Unique on (tenant, lower(employeeCode))

#### `departments`

Department hierarchy with organizational structure.

**Key Fields:**

- `departmentId` (PK), `tenantId` (FK → core.tenants)
- `departmentCode` (unique per tenant), `name`
- `organizationId` (FK → core.organizations)
- `parentDepartmentId` (self-ref), `headEmployeeId` (FK → employees)
- `status` enum: ACTIVE, INACTIVE, ARCHIVED

**Indexes:**

- Tenant-leading on organization, parent, head
- Unique on (tenant, lower(departmentCode))

#### `positions`

Job position definitions with salary ranges.

**Key Fields:**

- `positionId` (PK), `tenantId` (FK → core.tenants)
- `positionCode` (unique per tenant), `name`, `description`
- `departmentId` (FK → departments)
- `grade`, `level`
- `minSalary`, `maxSalary` (numeric 12,2)
- `status` enum: ACTIVE, INACTIVE, ARCHIVED

**Check Constraints:**

- minSalary <= maxSalary (when both set)
- Both salaries >= 0 (when set)

**Indexes:**

- Tenant-leading on department, grade
- Unique on (tenant, lower(positionCode))

### Operations (Transactional Data)

#### `attendanceLogs`

Time tracking for employees.

**Key Fields:**

- `attendanceLogId` (PK), `tenantId` (FK → core.tenants)
- `employeeId` (FK → employees)
- `attendanceDate`, `checkInAt`, `checkOutAt`
- `attendanceType` enum: REGULAR, OVERTIME, REMOTE, ON_SITE, FIELD_WORK, TRAINING
- `notes`

**Check Constraints:**

- checkOutAt > checkInAt (when both set)

**Indexes:**

- Composite: (tenant, employee, date)
- Composite: (tenant, date)
- Composite: (tenant, type, date)

#### `leaveRequests`

Leave/vacation request workflow.

**Key Fields:**

- `leaveRequestId` (PK), `tenantId` (FK → core.tenants)
- `employeeId` (FK → employees)
- `leaveTypeId` (FK → hr.leave_types), optional `leaveBalanceId` (FK → hr.leave_balances)
- `startDate`, `endDate`
- `status` enum: PENDING, APPROVED, REJECTED, CANCELLED, WITHDRAWN
- `approvedBy` (FK → employees), `approvedAt`
- `reason`, `rejectionReason`

**Check Constraints:**

- endDate >= startDate
- APPROVED status requires approvedBy and approvedAt
- REJECTED status requires rejectionReason

**Indexes:**

- Composite: (tenant, employee, startDate)
- Composite: (tenant, status, startDate)
- Composite: (tenant, startDate, endDate)

#### Payroll runs (moved)

Payroll batches are in **`payroll.payroll_runs`** — see `src/db/schema-hrm/payroll/operations/payrollRuns.ts` and `payroll/_relations.ts`.

## Relations

HR relations are defined in `_relations.ts` using Drizzle's `defineRelations()` API, including **people** (persons and children), **time** (schedules, shifts, timesheets, leave types/balances), **fundamentals**, and **operations** (attendance with optional shift/timesheet; leave with leave type and optional balance).

Payroll-side relations for runs, payslips, and entries live in **`payroll/_relations.ts`**.

## Circular Foreign Keys

Due to TypeScript circular import restrictions, some FKs are added via custom SQL in migrations:

- `employees.departmentId` → `departments.departmentId`
- `employees.positionId` → `positions.positionId`
- `departments.headEmployeeId` → `employees.employeeId`
- `positions.departmentId` → `departments.departmentId`

See [`CIRCULAR_FKS.md`](./CIRCULAR_FKS.md) for detailed explanation and migration instructions.

## Shared Patterns

All tables follow AFENDA DB-first guideline patterns:

- **Tenant isolation**: Explicit `tenantId` with FK to `core.tenants`
- **Timestamps**: `createdAt`, `updatedAt` (via `timestampColumns` mixin)
- **Soft delete**: `deletedAt` (via `softDeleteColumns` mixin)
- **Audit trail**: `createdBy`, `updatedBy` (via `auditColumns` mixin)
- **Branded IDs**: Zod branded types for type safety (`EmployeeId`, `DepartmentId`, etc.)
- **Zod schemas**: `selectSchema`, `insertSchema`, `updateSchema` for each table
- **Partial unique indexes**: Include `WHERE deletedAt IS NULL` for soft-delete compatibility
- **Tenant-leading indexes**: All indexes start with `tenantId` for query performance

## Enums

All enums follow the canonical pattern:

```typescript
export const statuses = ["VALUE1", "VALUE2"] as const;
export const statusEnum = hrSchema.enum("enum_name", [...statuses]);
/** Insert/update DTOs: explicit `z.enum` aligned with the same tuple (DB-first §3.6). */
export const statusZodEnum = z.enum(statuses);
```

- TypeScript literal type from `as const` array
- PostgreSQL enum via `hrSchema.enum()`
- **`z.enum(tuple)`** for write-path validation; `createSelectSchema(table)` remains on **tables** for select schemas

## Cross-field refinements catalog

Domain-specific helpers live in `_zodShared.ts`. **Wire formats** (`dateStringSchema`, `timestamptzWireNullableOptionalSchema`, `nullableOptional`, …) are defined once in `src/db/_shared/zodWire.ts` and re-exported from `_zodShared` for convenience.

| Refinement / schema                                                                                                                | DB-backed                                                                | Wired in                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `refineHireDateMin`                                                                                                                | yes (`chk_employees_hire_date`)                                          | `employeeInsertSchema` / `employeeUpdateSchema`                                                                                                                                                                             |
| `refineTerminationOnOrAfterHire`                                                                                                   | yes (`chk_employees_termination_after_hire`)                             | employees insert/update                                                                                                                                                                                                     |
| `refineTerminatedRequiresTerminationDate`                                                                                          | yes (`chk_employees_terminated_status`)                                  | employees insert/update                                                                                                                                                                                                     |
| `refineEndDateOnOrAfterStartDate`                                                                                                  | yes (`chk_leave_requests_date_range`)                                    | `leaveRequestInsertSchema` / `leaveRequestUpdateSchema`                                                                                                                                                                     |
| `refineLeaveApprovedRequiresApproverAndTime`                                                                                       | yes (`chk_leave_requests_approval_fields`)                               | leave requests insert/update                                                                                                                                                                                                |
| `refineLeaveRejectedRequiresReason`                                                                                                | yes (`chk_leave_requests_rejection_reason`)                              | leave requests insert/update                                                                                                                                                                                                |
| `refineCheckOutAfterCheckIn`                                                                                                       | yes (`chk_attendance_checkout_after_checkin`)                            | `attendanceLogInsertSchema` / `attendanceLogUpdateSchema` (string or `Date`)                                                                                                                                                |
| `leaveTotalDaysStringSchema` / `isValidLeaveTotalDaysString`                                                                       | yes (`chk_leave_requests_total_days`)                                    | leave requests                                                                                                                                                                                                              |
| `refinePositionSalaryOrderAndBounds` / `positionSalaryStringSchema` / `positionFteStringSchema`                                    | yes (`chk_positions_salary_*`, `chk_positions_fte`)                      | `positionInsertSchema` / `positionUpdateSchema`                                                                                                                                                                             |
| `refineContractEndOnOrAfterStart`                                                                                                  | yes (`chk_employment_contracts_dates`)                                   | `employmentContractInsertSchema` / `employmentContractUpdateSchema`                                                                                                                                                         |
| `refineProbationEndOnOrAfterStart`                                                                                                 | yes (`chk_employment_contracts_probation`)                               | employment contracts insert/update                                                                                                                                                                                          |
| `refineNoticePeriodDaysNonNegative`                                                                                                | yes (`chk_employment_contracts_notice_period`)                           | employment contracts insert/update                                                                                                                                                                                          |
| `refineContractWorkingHoursString` / `contractWorkingHoursStringSchema`                                                            | yes (`chk_employment_contracts_hours`)                                   | employment contracts insert/update                                                                                                                                                                                          |
| `refineOptionalIsoEndOnOrAfterStart`                                                                                               | yes (effective-range & date-pair CHECKs)                                 | `reportingLine*`, `shiftAssignment*`, `positionAssignment*`, `personName*`, `address*`, `nationalIdentifier*` (issue/expiry), `assetAssignment*` (issued/actual return), plus timesheets / secondments / notice / probation |
| `refineJobGradeSalaryLadder` / `hrSalary12_2StringSchema`                                                                          | yes (`chk_job_grades_*`)                                                 | `jobGradeInsertSchema` / `jobGradeUpdateSchema`                                                                                                                                                                             |
| `refineSecondment*` (dates, host on insert, host patch)                                                                            | yes (`chk_secondments_*`)                                                | `secondmentInsertSchema` / `secondmentUpdateSchema`                                                                                                                                                                         |
| `refineEmployeeTransferHasChangeOnInsert`                                                                                          | yes (`chk_employee_transfers_has_change`)                                | `employeeTransferInsertSchema` only                                                                                                                                                                                         |
| `refineReportingLineNotSelf`                                                                                                       | yes (`chk_reporting_lines_not_self`)                                     | reporting lines insert/update                                                                                                                                                                                               |
| `refineNoticeExpectedLastOnOrAfterNoticeDate` / `refineNoticeActualLastOnOrAfterNoticeDate`                                        | yes (`chk_notice_period_records_*`)                                      | notice period records insert/update                                                                                                                                                                                         |
| `refineProbationOriginalEndOnOrAfterStart` / `refineProbationExtendedOnOrAfterOriginal` / `refineProbationActualEndOnOrAfterStart` | yes (`chk_probation_records_*`)                                          | probation records insert/update                                                                                                                                                                                             |
| `refineShiftSwapDifferentEmployees`                                                                                                | yes (`chk_shift_swaps_different_employees`)                              | shift swaps insert/update                                                                                                                                                                                                   |
| `timesheetHoursStringSchema` / `refineTimesheetHoursNonNegative`                                                                   | yes (`chk_timesheets_hours_positive`)                                    | `timesheet*`; `refineLeaveBalanceQuantityStringsNonNegative` on entitled/used/pending/carriedOver                                                                                                                           |
| `refineLeaveTypeCarryOverMaxNonNegative`                                                                                           | yes (`chk_leave_types_carry_over`)                                       | `leaveTypeInsertSchema` / `leaveTypeUpdateSchema`                                                                                                                                                                           |
| `overtimeHoursStringSchema` / `overtimeMultiplierStringSchema`                                                                     | yes (`chk_overtime_records_*`)                                           | `overtimeRecordInsertSchema` / `overtimeRecordUpdateSchema`                                                                                                                                                                 |
| `refineAbsenceDateNotAfterUtcToday`                                                                                                | yes (`chk_absence_records_date`, UTC wire approximation)                 | `absenceRecordInsertSchema` / `absenceRecordUpdateSchema`                                                                                                                                                                   |
| `weeklyHours41StringSchema`                                                                                                        | Zod-only (matches `numeric(4,1)` shape for `work_schedules.weeklyHours`) | `workScheduleInsertSchema` / `workScheduleUpdateSchema`                                                                                                                                                                     |

**Patch semantics (nullable clears):** All HR write schemas that expose nullable FK/text/date/timestamptz columns use `nullableOptional(...)`, `dateNullableOptionalSchema`, and/or `timestamptzWireNullableOptionalSchema` on **`departmentUpdateSchema`**, **`personUpdateSchema`**, **`dependentUpdateSchema`**, **`addressUpdateSchema`**, **`nationalIdentifierUpdateSchema`**, **`personDocumentUpdateSchema`**, **`contactMethodUpdateSchema`**, **`emergencyContactUpdateSchema`**, **`jobFamilyUpdateSchema`**, **`jobRoleUpdateSchema`**, **`holidayCalendarUpdateSchema`**, **`holidayCalendarEntryUpdateSchema`**, **`workScheduleUpdateSchema`**, **`documentRequestUpdateSchema`**, **`employeeDeclarationUpdateSchema`**, **`serviceRequestUpdateSchema`**, **`assetAssignmentUpdateSchema`**, plus the operational tables listed earlier. Omit a key to leave the column unchanged.

## Tests

```bash
pnpm vitest run --config vitest.db.config.ts src/db/__tests__/hr-operational-zod.test.ts
```

## Type Safety

Each table exports:

- **Branded ID**: `z.number().int().brand<"TableId">()`
- **Select schema**: Full row type from DB
- **Insert schema**: Insert payload with refinements
- **Update schema**: Partial update payload
- **TypeScript types**: `Table`, `NewTable` inferred from Drizzle

## Cross-Schema References

- `employees.locationId` → `core.locations.locationId`
- `departments.organizationId` → `core.organizations.organizationId`

Reverse relations are defined in `core/_relations.ts`:

- `organizations.departments`
- `locations.employees`

## Migration Workflow

1. **Edit schema files** in `fundamentals/` or `operations/`
2. **Generate migration**: `pnpm db:generate`
3. **Review generated SQL**: Check `src/db/migrations/`
4. **Add circular FKs**: Append custom SQL per `CIRCULAR_FKS.md`
5. **Register custom SQL**: Add entry to `audit/CUSTOM_SQL_REGISTRY.json`
6. **Validate**: `pnpm db:check && pnpm check:migrations`
7. **Apply**: `pnpm db:migrate`

## References

- [DB-First Guideline](../../../docs/architecture/01-db-first-guideline.md) — **§3.6** domain module package pattern, **§3.7** HR alignment plan
- [Circular FK Handling](./CIRCULAR_FKS.md)
- [Custom SQL Registry](../audit/CUSTOM_SQL_REGISTRY.json)
