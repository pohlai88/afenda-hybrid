import { eq } from "drizzle-orm";
import type { Database } from "@db/db";
import { departments } from "@db/schema-hrm/hr/fundamentals/departments";
import { employees } from "@db/schema-hrm/hr/fundamentals/employees";
import { positions } from "@db/schema-hrm/hr/fundamentals/positions";
import {
  jobRequisitionInsertSchema,
  jobRequisitions,
  type JobRequisition,
  type NewJobRequisition,
} from "@db/schema-hrm/recruitment/operations/jobRequisitions";

/** Thrown when an optional HR reference (`departmentId`, `positionId`, `hiringManagerId`) belongs to another tenant. */
export class JobRequisitionReferenceTenantMismatchError extends Error {
  readonly code = "JOB_REQUISITION_REFERENCE_TENANT_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "JobRequisitionReferenceTenantMismatchError";
  }
}

export type CreateJobRequisitionInput = Omit<NewJobRequisition, "requisitionId">;

/**
 * Inserts a job requisition after `jobRequisitionInsertSchema` parse. When `departmentId`, `positionId`,
 * or `hiringManagerId` is set, ensures that row’s `tenantId` matches the requisition’s `tenantId`.
 * `currencyId` is global (`core.currencies`) — not tenant-scoped.
 */
export async function createJobRequisition(
  dbOrTx: Database,
  row: CreateJobRequisitionInput,
): Promise<JobRequisition> {
  const parsed = jobRequisitionInsertSchema.parse(row);
  const { tenantId, departmentId, positionId, hiringManagerId } = parsed;

  if (departmentId != null) {
    const [d] = await dbOrTx
      .select({ tenantId: departments.tenantId })
      .from(departments)
      .where(eq(departments.departmentId, departmentId))
      .limit(1);
    if (!d) {
      throw new Error("Department not found for job requisition");
    }
    if (d.tenantId !== tenantId) {
      throw new JobRequisitionReferenceTenantMismatchError("Department tenant mismatch");
    }
  }

  if (positionId != null) {
    const [p] = await dbOrTx
      .select({ tenantId: positions.tenantId })
      .from(positions)
      .where(eq(positions.positionId, positionId))
      .limit(1);
    if (!p) {
      throw new Error("Position not found for job requisition");
    }
    if (p.tenantId !== tenantId) {
      throw new JobRequisitionReferenceTenantMismatchError("Position tenant mismatch");
    }
  }

  if (hiringManagerId != null) {
    const [e] = await dbOrTx
      .select({ tenantId: employees.tenantId })
      .from(employees)
      .where(eq(employees.employeeId, hiringManagerId))
      .limit(1);
    if (!e) {
      throw new Error("Hiring manager employee not found for job requisition");
    }
    if (e.tenantId !== tenantId) {
      throw new JobRequisitionReferenceTenantMismatchError("Hiring manager tenant mismatch");
    }
  }

  const [created] = await dbOrTx.insert(jobRequisitions).values(parsed).returning();
  if (!created) {
    throw new Error("Job requisition insert returned no row");
  }
  return created;
}
