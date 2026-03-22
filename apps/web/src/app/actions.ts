"use server";

import { db } from "@afenda/db/src/db";
import { eq } from "drizzle-orm";

/**
 * Server Actions for database operations.
 * These run exclusively on the server - DATABASE_URL is never exposed to the client.
 */

export async function getEmployees(tenantId: number) {
  const { employees } = await import("@afenda/db/src/schema-hrm/hr/fundamentals/employees");
  const data = await db.select().from(employees).where(eq(employees.tenantId, tenantId));
  return data;
}

export async function getEmployeeById(employeeId: number) {
  const { employees } = await import("@afenda/db/src/schema-hrm/hr/fundamentals/employees");
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.employeeId, employeeId))
    .limit(1);
  return employee ?? null;
}

export async function getEmployeesWithRelations(tenantId: number) {
  const { employees } = await import("@afenda/db/src/schema-hrm/hr/fundamentals/employees");
  const data = await db.select().from(employees).where(eq(employees.tenantId, tenantId));
  return data;
}
