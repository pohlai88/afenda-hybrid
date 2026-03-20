# HR Schema

Human Resources domain schema for AFENDA-HYBRID.

## Structure

```
hr/
├── _schema.ts              # Schema declaration (pgSchema("hr"))
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

Payroll batches are in **`payroll.payroll_runs`** — see `src/db/schema/payroll/operations/payrollRuns.ts` and `payroll/_relations.ts`.

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
export const statusZodEnum = createSelectSchema(statusEnum);
```

This provides:
- TypeScript literal type from `as const` array
- PostgreSQL enum via `hrSchema.enum()`
- Zod enum schema for runtime validation

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

- [DB-First Guideline](../../../docs/architecture/01-db-first-guideline.md)
- [Circular FK Handling](./CIRCULAR_FKS.md)
- [Custom SQL Registry](../audit/CUSTOM_SQL_REGISTRY.json)
