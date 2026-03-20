# HR Schema Entity Relationship Diagram

## Complete Schema Overview

```mermaid
erDiagram
    tenants ||--o{ employees : "tenant isolation"
    tenants ||--o{ departments : "tenant isolation"
    tenants ||--o{ positions : "tenant isolation"
    tenants ||--o{ attendanceLogs : "tenant isolation"
    tenants ||--o{ leaveRequests : "tenant isolation"
    
    organizations ||--o{ departments : "org structure"
    locations ||--o{ employees : "work location"
    
    departments ||--o{ departments : "parent-child"
    departments ||--o{ employees : "department members"
    departments ||--o| employees : "head employee"
    departments ||--o{ positions : "dept positions"
    
    positions ||--o{ employees : "position holders"
    
    employees ||--o{ employees : "manager-subordinate"
    employees ||--o{ attendanceLogs : "time tracking"
    employees ||--o{ leaveRequests : "leave requests"
    employees ||--o{ leaveRequests : "approved by"
    
    employees {
        int employeeId PK
        int tenantId FK
        int personId FK
        text employeeCode UK
        date hireDate
        date terminationDate
        int departmentId FK
        int positionId FK
        int managerId FK
        int locationId FK
        enum status
        text notes
    }
    
    departments {
        int departmentId PK
        int tenantId FK
        text departmentCode UK
        text name
        int organizationId FK
        int parentDepartmentId FK
        int headEmployeeId FK
        enum status
    }
    
    positions {
        int positionId PK
        int tenantId FK
        text positionCode UK
        text name
        text description
        int departmentId FK
        text grade
        int level
        numeric minSalary
        numeric maxSalary
        enum status
    }
    
    attendanceLogs {
        int attendanceLogId PK
        int tenantId FK
        int employeeId FK
        int shiftAssignmentId FK
        int timesheetId FK
        date attendanceDate
        timestamp checkInAt
        timestamp checkOutAt
        enum attendanceType
        text notes
    }
    
    leaveRequests {
        int leaveRequestId PK
        int tenantId FK
        int employeeId FK
        int leaveTypeId FK
        int leaveBalanceId FK
        date startDate
        date endDate
        enum status
        int approvedBy FK
        timestamp approvedAt
        text reason
        text rejectionReason
    }
```

> Payroll batches live in **`payroll.payroll_runs`**, not in `hr`.

## Fundamentals Layer

Master data with structural invariants:

```mermaid
graph TB
    subgraph core[Core Schema]
        tenants[tenants]
        organizations[organizations]
        locations[locations]
    end
    
    subgraph hrFundamentals[HR Fundamentals]
        employees[employees<br/>---<br/>personId FK<br/>employeeCode UK<br/>status enum]
        departments[departments<br/>---<br/>departmentCode UK<br/>status enum<br/>hierarchy]
        positions[positions<br/>---<br/>positionCode UK<br/>salary range<br/>status enum]
    end
    
    tenants -->|tenantId| employees
    tenants -->|tenantId| departments
    tenants -->|tenantId| positions
    
    organizations -->|organizationId| departments
    locations -->|locationId| employees
    
    departments -->|parentDepartmentId| departments
    departments -->|headEmployeeId| employees
    departments -->|departmentId| employees
    departments -->|departmentId| positions
    
    positions -->|positionId| employees
    
    employees -->|managerId| employees
    
    style hrFundamentals fill:#e1f5ff
    style core fill:#fff4e1
```

## Operations Layer

Transactional data with high write volume:

```mermaid
graph TB
    subgraph hrFundamentals[HR Fundamentals]
        employees[employees]
    end
    
    subgraph hrOperations[HR Operations]
        attendanceLogs[attendanceLogs<br/>---<br/>checkIn/checkOut<br/>attendanceType enum<br/>high volume]
        leaveRequests[leaveRequests<br/>---<br/>leaveTypeId FK<br/>status workflow<br/>approval chain]
    end
    
    employees -->|employeeId| attendanceLogs
    employees -->|employeeId| leaveRequests
    employees -->|approvedBy| leaveRequests
    
    style hrOperations fill:#ffe1f5
    style hrFundamentals fill:#e1f5ff
```

## Enums

### Employee Status
- `ACTIVE` - Currently employed
- `ON_LEAVE` - Temporarily absent
- `TERMINATED` - Employment ended
- `SUSPENDED` - Temporarily suspended
- `PENDING` - Onboarding in progress

### Department Status
- `ACTIVE` - Operating department
- `INACTIVE` - Temporarily inactive
- `ARCHIVED` - Historical record

### Position Status
- `ACTIVE` - Open for assignment
- `INACTIVE` - Temporarily closed
- `ARCHIVED` - Historical record

### Attendance Type
- `REGULAR` - Standard work hours
- `OVERTIME` - Extended hours
- `REMOTE` - Work from home
- `ON_SITE` - Office/facility work
- `FIELD_WORK` - External location
- `TRAINING` - Training/development

### Leave Type
- `ANNUAL` - Vacation/PTO
- `SICK` - Medical leave
- `MATERNITY` - Maternity leave
- `PATERNITY` - Paternity leave
- `UNPAID` - Unpaid leave
- `COMPASSIONATE` - Bereavement/family emergency
- `STUDY` - Educational leave
- `SABBATICAL` - Extended break

### Leave Request Status
- `PENDING` - Awaiting approval
- `APPROVED` - Approved by manager
- `REJECTED` - Denied by manager
- `CANCELLED` - Cancelled by system/admin
- `WITHDRAWN` - Withdrawn by employee

### Payroll Run Status
- `DRAFT` - Being prepared
- `PROCESSING` - Calculation in progress
- `COMPLETED` - Successfully processed
- `FAILED` - Processing error
- `CANCELLED` - Cancelled before completion

## Data Flow Examples

### Employee Onboarding
1. Create `employee` record (status: PENDING)
2. Assign `departmentId`, `positionId`, `managerId`
3. Link `locationId` for work location
4. Update status to ACTIVE

### Leave Request Workflow
1. Employee creates `leaveRequest` (status: PENDING)
2. Manager reviews and updates `approvedBy`, `approvedAt`, status → APPROVED
3. Or manager rejects with `rejectionReason`, status → REJECTED
4. System tracks via `attendanceLogs` during leave period

### Payroll Processing
1. Create `payrollRun` (status: DRAFT)
2. Calculate amounts, update `totalAmount`
3. Update status → PROCESSING
4. Complete processing: set `processedBy`, `completedAt`, status → COMPLETED
5. On error: status → FAILED with notes

## Query Examples

### Find all employees in a department with their positions
```typescript
const deptEmployees = await db.query.employees.findMany({
  where: eq(employees.departmentId, deptId),
  with: {
    position: true,
    manager: true,
    location: true,
  },
});
```

### Get department hierarchy with head employees
```typescript
const deptTree = await db.query.departments.findMany({
  where: eq(departments.tenantId, tenantId),
  with: {
    parent: true,
    children: true,
    headEmployee: true,
    organization: true,
  },
});
```

### Find pending leave requests for approval
```typescript
const pendingLeaves = await db.query.leaveRequests.findMany({
  where: and(
    eq(leaveRequests.tenantId, tenantId),
    eq(leaveRequests.status, 'PENDING')
  ),
  with: {
    employee: {
      with: {
        department: true,
        position: true,
      },
    },
  },
  orderBy: [asc(leaveRequests.startDate)],
});
```

### Get attendance summary for an employee
```typescript
const attendance = await db.query.attendanceLogs.findMany({
  where: and(
    eq(attendanceLogs.employeeId, employeeId),
    gte(attendanceLogs.attendanceDate, startDate),
    lte(attendanceLogs.attendanceDate, endDate)
  ),
  orderBy: [desc(attendanceLogs.attendanceDate)],
});
```

## Compliance

✅ **DB-First Guideline**: 100% compliant with all patterns  
✅ **DRY**: No duplicate relation definitions  
✅ **Consistency**: Matches core/security/audit patterns  
✅ **Type Safety**: Branded IDs, Zod 4 schemas, full type inference  
✅ **Integrity**: Foreign keys, check constraints, unique constraints  
✅ **Performance**: Strategic indexes on all query paths  
✅ **Tenancy**: Explicit tenant isolation on all tables  

## References

- [DB-First Guideline](../../../docs/architecture/01-db-first-guideline.md)
- [Circular FK Documentation](./CIRCULAR_FKS.md)
- [Shared Column Mixins](../_shared/README.md)
