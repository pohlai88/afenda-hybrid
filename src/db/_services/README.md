# Database Services Layer

This directory contains service modules that provide a clean API for database operations.
Services encapsulate business logic, authorization checks, and session context management.

## Conventions

### File Naming

- One service file per domain: `leaveService.ts`, `payrollService.ts`, `employeeService.ts`
- Shared utilities: `_utils.ts`, `_types.ts`
- Authorization: `authorization.ts` (already implemented)

### Service Structure

```typescript
// Example: leaveService.ts

import { db } from "../db";
import { setSessionContext } from "../_session/setSessionContext";
import { can, AuthContext } from "./authorization";
import { leaveRequests, leaveBalances } from "../schema-hrm/hr";

export interface LeaveServiceContext {
  tenantId: number;
  userId: number;
  departmentId?: number;
}

export async function getLeaveRequests(
  ctx: LeaveServiceContext,
  filters?: { status?: string; employeeId?: number }
) {
  // 1. Set session context for RLS
  await setSessionContext(ctx.tenantId, ctx.userId);

  // 2. Check authorization
  const authCtx: AuthContext = { userId: ctx.userId, tenantId: ctx.tenantId };
  const canView = await can(authCtx, "leave", "view");
  if (!canView.allowed) {
    throw new Error(`Unauthorized: ${canView.reason}`);
  }

  // 3. Execute query using Drizzle relational API
  return db.query.leaveRequests.findMany({
    where: (lr, { eq, and }) => {
      const conditions = [];
      if (filters?.status) conditions.push(eq(lr.status, filters.status));
      if (filters?.employeeId) conditions.push(eq(lr.employeeId, filters.employeeId));
      return conditions.length > 0 ? and(...conditions) : undefined;
    },
    with: {
      employee: true,
      leaveType: true,
      approver: true,
    },
  });
}

export async function approveLeaveRequest(
  ctx: LeaveServiceContext,
  leaveRequestId: number
) {
  await setSessionContext(ctx.tenantId, ctx.userId);

  // Check authorization with resource context
  const authCtx: AuthContext = { 
    userId: ctx.userId, 
    tenantId: ctx.tenantId,
    departmentId: ctx.departmentId,
  };
  const canApprove = await can(authCtx, "leave", "approve", {
    // Resource context for policy evaluation
    departmentId: ctx.departmentId,
  });
  if (!canApprove.allowed) {
    throw new Error(`Unauthorized: ${canApprove.reason}`);
  }

  // Execute update
  return db
    .update(leaveRequests)
    .set({
      status: "APPROVED",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
      updatedBy: ctx.userId,
    })
    .where(eq(leaveRequests.leaveRequestId, leaveRequestId))
    .returning();
}
```

### Key Principles

1. **Session Context First**: Always call `setSessionContext()` before any database operation.
   This ensures RLS policies are enforced.

2. **Authorization Check**: Use the `can()` function to check permissions before operations.
   Pass resource context for dynamic policy evaluation.

3. **Relational Queries**: Use Drizzle's relational API (`db.query.*`) for reads.
   This leverages the relations defined in `db.ts`.

4. **Explicit Audit Fields**: Always set `createdBy`/`updatedBy` in mutations.
   These are required columns.

5. **Return Types**: Return Drizzle's inferred types or explicitly typed DTOs.
   Avoid returning raw query results.

### Error Handling

```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "NOT_FOUND" | "VALIDATION" | "CONFLICT",
    public details?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

// Usage
if (!canApprove.allowed) {
  throw new ServiceError(
    `Cannot approve leave: ${canApprove.reason}`,
    "UNAUTHORIZED",
    { matchedPolicy: canApprove.matchedPolicy }
  );
}
```

### Transaction Support

```typescript
import { db } from "../db";

export async function transferEmployee(
  ctx: ServiceContext,
  employeeId: number,
  newDepartmentId: number
) {
  await setSessionContext(ctx.tenantId, ctx.userId);

  return db.transaction(async (tx) => {
    // Update employee
    await tx
      .update(employees)
      .set({ departmentId: newDepartmentId, updatedBy: ctx.userId })
      .where(eq(employees.employeeId, employeeId));

    // Create transfer record
    await tx.insert(employeeTransfers).values({
      tenantId: ctx.tenantId,
      employeeId,
      toDepartmentId: newDepartmentId,
      effectiveDate: new Date(),
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
  });
}
```

## Available Services

- `authorization.ts` - Permission checking with 3-layer cascade (direct, role, policy)

## Planned Services

- `leaveService.ts` - Leave request management
- `payrollService.ts` - Payroll run and payslip operations
- `employeeService.ts` - Employee CRUD and lifecycle
- `recruitmentService.ts` - Candidate and application management
