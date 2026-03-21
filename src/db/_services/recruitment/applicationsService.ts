import { eq } from "drizzle-orm";
import type { Database } from "@db/db";
import { candidates } from "@db/schema-hrm/recruitment/fundamentals/candidates";
import { jobRequisitions } from "@db/schema-hrm/recruitment/operations/jobRequisitions";
import {
  applications,
  type Application,
  type NewApplication,
} from "@db/schema-hrm/recruitment/operations/applications";

/** Thrown when `tenantId` on the insert does not match the candidate’s or requisition’s tenant. */
export class ApplicationTenantMismatchError extends Error {
  readonly code = "APPLICATION_TENANT_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "ApplicationTenantMismatchError";
  }
}

export type CreateApplicationInput = Omit<NewApplication, "applicationId">;

/**
 * Inserts an application only if `row.tenantId` matches both `candidates.tenantId` and
 * `job_requisitions.tenantId` for the given IDs. PostgreSQL does not enforce cross-FK tenant equality;
 * this is the application-layer guardrail (see `applications` table JSDoc).
 */
export async function createApplication(dbOrTx: Database, row: CreateApplicationInput): Promise<Application> {
  const { tenantId, candidateId, requisitionId } = row;

  const [candidate] = await dbOrTx
    .select({ tenantId: candidates.tenantId })
    .from(candidates)
    .where(eq(candidates.candidateId, candidateId))
    .limit(1);

  if (!candidate) {
    throw new Error("Candidate not found for application");
  }
  if (candidate.tenantId !== tenantId) {
    throw new ApplicationTenantMismatchError("Candidate tenant mismatch");
  }

  const [requisition] = await dbOrTx
    .select({ tenantId: jobRequisitions.tenantId })
    .from(jobRequisitions)
    .where(eq(jobRequisitions.requisitionId, requisitionId))
    .limit(1);

  if (!requisition) {
    throw new Error("Requisition not found for application");
  }
  if (requisition.tenantId !== tenantId) {
    throw new ApplicationTenantMismatchError("Requisition tenant mismatch");
  }

  const [created] = await dbOrTx.insert(applications).values(row).returning();
  if (!created) {
    throw new Error("Application insert returned no row");
  }
  return created;
}
