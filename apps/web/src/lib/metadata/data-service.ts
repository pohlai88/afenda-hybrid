import { and, asc, eq, isNull } from "drizzle-orm";
import { withTenantContext } from "@afenda/db/session";
import { employees, organizations } from "@afenda/db/schema";
import type { Database } from "@afenda/db";
import { getModelEntry } from "./model-registry";

function isoDate(d: unknown): string | null {
  if (d == null) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return String(d);
}

/** Serialize DB row for metadata-driven list cells (JSON-safe). */
export function serializeEmployeeRow(row: typeof employees.$inferSelect): Record<string, unknown> {
  return {
    employeeId: row.employeeId,
    employeeCode: row.employeeCode,
    status: row.status,
    hireDate: isoDate(row.hireDate),
    personId: row.personId,
    departmentId: row.departmentId,
    positionId: row.positionId,
  };
}

export function serializeOrganizationRow(
  row: typeof organizations.$inferSelect
): Record<string, unknown> {
  return {
    organizationId: row.organizationId,
    orgCode: row.orgCode,
    name: row.name,
    orgType: row.orgType,
    status: row.status,
  };
}

/**
 * Tier: domain rows — always fresh query under tenant RLS context (plan §4g).
 * userId is required to ensure proper RLS context.
 */
export async function loadRecords(
  modelName: string,
  tenantId: number,
  userId: number
): Promise<Record<string, unknown>[]> {
  const entry = getModelEntry(modelName);
  if (!entry) {
    console.warn(`[data-service] Unknown model: ${modelName}`);
    return [];
  }

  return withTenantContext({ tenantId, userId }, async (tx) => {
    const dbx = tx as unknown as Database;

    if (modelName === "hr.employee") {
      const rows = await dbx
        .select()
        .from(employees)
        .where(and(eq(employees.tenantId, tenantId), isNull(employees.deletedAt)))
        .orderBy(asc(employees.employeeCode));
      return rows.map(serializeEmployeeRow);
    }

    if (modelName === "core.organization") {
      const rows = await dbx
        .select()
        .from(organizations)
        .where(and(eq(organizations.tenantId, tenantId), isNull(organizations.deletedAt)))
        .orderBy(asc(organizations.orgCode));
      return rows.map(serializeOrganizationRow);
    }

    return [];
  });
}

/**
 * Load a single record by ID.
 * userId is required to ensure proper RLS context.
 */
export async function loadRecord(
  modelName: string,
  tenantId: number,
  recordId: string,
  userId: number
): Promise<Record<string, unknown> | null> {
  const entry = getModelEntry(modelName);
  if (!entry) {
    console.warn(`[data-service] Unknown model: ${modelName}`);
    return null;
  }

  return withTenantContext({ tenantId, userId }, async (tx) => {
    const dbx = tx as unknown as Database;

    if (modelName === "hr.employee") {
      const id = Number(recordId);
      if (!Number.isFinite(id)) return null;
      const [row] = await dbx
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.employeeId, id),
            eq(employees.tenantId, tenantId),
            isNull(employees.deletedAt)
          )
        )
        .limit(1);
      return row ? serializeEmployeeRow(row) : null;
    }

    if (modelName === "core.organization") {
      const id = Number(recordId);
      if (!Number.isFinite(id)) return null;
      const [row] = await dbx
        .select()
        .from(organizations)
        .where(
          and(
            eq(organizations.organizationId, id),
            eq(organizations.tenantId, tenantId),
            isNull(organizations.deletedAt)
          )
        )
        .limit(1);
      return row ? serializeOrganizationRow(row) : null;
    }

    return null;
  });
}
