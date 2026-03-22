import { eq } from "drizzle-orm";
import type { Database } from "@db/db";
import { offboardingChecklists } from "@db/schema-hrm/recruitment/operations/offboardingChecklists";
import {
  exitInterviewInsertSchema,
  exitInterviews,
  type ExitInterview,
  type NewExitInterview,
} from "@db/schema-hrm/recruitment/operations/exitInterviews";

/** Linked checklist row disagrees with exit interview `tenantId` or `employeeId` (see CSQL-015). */
export class ExitInterviewLinkedChecklistMismatchError extends Error {
  readonly code = "EXIT_INTERVIEW_LINKED_CHECKLIST_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "ExitInterviewLinkedChecklistMismatchError";
  }
}

export type CreateExitInterviewInput = Omit<NewExitInterview, "exitInterviewId">;

/**
 * Inserts an exit interview after `exitInterviewInsertSchema` parse and validation that the linked
 * `offboarding_checklists` row exists, is active, `EXIT_INTERVIEW`, and matches `tenantId` / `employeeId`.
 * PostgreSQL trigger CSQL-015 enforces the same at commit time; this fails earlier with stable errors.
 */
export async function createExitInterview(
  dbOrTx: Database,
  row: CreateExitInterviewInput
): Promise<ExitInterview> {
  const parsed = exitInterviewInsertSchema.parse(row);
  const { tenantId, employeeId, linkedOffboardingChecklistId } = parsed;

  const [checklist] = await dbOrTx
    .select({
      tenantId: offboardingChecklists.tenantId,
      employeeId: offboardingChecklists.employeeId,
      taskCategory: offboardingChecklists.taskCategory,
      deletedAt: offboardingChecklists.deletedAt,
    })
    .from(offboardingChecklists)
    .where(eq(offboardingChecklists.offboardingChecklistId, linkedOffboardingChecklistId))
    .limit(1);

  if (!checklist) {
    throw new Error("Linked offboarding checklist not found");
  }
  if (checklist.deletedAt != null) {
    throw new Error("Linked offboarding checklist is soft-deleted");
  }
  if (checklist.taskCategory !== "EXIT_INTERVIEW") {
    throw new Error("Linked offboarding checklist must have taskCategory EXIT_INTERVIEW");
  }
  if (checklist.tenantId !== tenantId) {
    throw new ExitInterviewLinkedChecklistMismatchError("Checklist tenant mismatch");
  }
  if (checklist.employeeId !== employeeId) {
    throw new ExitInterviewLinkedChecklistMismatchError("Checklist employee mismatch");
  }

  const [created] = await dbOrTx.insert(exitInterviews).values(parsed).returning();
  if (!created) {
    throw new Error("Exit interview insert returned no row");
  }
  return created;
}
