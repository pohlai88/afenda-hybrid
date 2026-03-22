import { eq } from "drizzle-orm";
import type { Database } from "@db/db";
import { applications } from "@db/schema-hrm/recruitment/operations/applications";
import {
  interviewInsertSchema,
  interviews,
  type Interview,
  type NewInterview,
} from "@db/schema-hrm/recruitment/operations/interviews";

/** Thrown when `tenantId` on the insert does not match `applications.tenantId`. */
export class InterviewTenantMismatchError extends Error {
  readonly code = "INTERVIEW_TENANT_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "InterviewTenantMismatchError";
  }
}

export type CreateInterviewInput = Omit<NewInterview, "interviewId">;

/**
 * Inserts an interview only if `row.tenantId` matches `applications.tenantId` for `applicationId`.
 * Rows are parsed with `interviewInsertSchema` before insert.
 */
export async function createInterview(
  dbOrTx: Database,
  row: CreateInterviewInput
): Promise<Interview> {
  const parsed = interviewInsertSchema.parse(row);
  const { tenantId, applicationId } = parsed;

  const [application] = await dbOrTx
    .select({ tenantId: applications.tenantId })
    .from(applications)
    .where(eq(applications.applicationId, applicationId))
    .limit(1);

  if (!application) {
    throw new Error("Application not found for interview");
  }
  if (application.tenantId !== tenantId) {
    throw new InterviewTenantMismatchError("Application tenant mismatch");
  }

  const [created] = await dbOrTx.insert(interviews).values(parsed).returning();
  if (!created) {
    throw new Error("Interview insert returned no row");
  }
  return created;
}
