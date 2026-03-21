/**
 * Root barrel for `_services`: explicit re-exports only (no `export *`).
 * Add new areas as `./<area>` entrypoints with their own named exports.
 */
export {
  ApplicationTenantMismatchError,
  BackgroundCheckTenantMismatchError,
  CandidateSalaryBackfillIssueTenantMismatchError,
  createApplication,
  createBackgroundCheck,
  createCandidateSalaryBackfillIssue,
  createExitInterview,
  createInterview,
  createJobRequisition,
  createOfferLetter,
  ExitInterviewLinkedChecklistMismatchError,
  InterviewTenantMismatchError,
  JobRequisitionReferenceTenantMismatchError,
  OfferLetterTenantMismatchError,
  type CreateApplicationInput,
  type CreateBackgroundCheckInput,
  type CreateCandidateSalaryBackfillIssueInput,
  type CreateExitInterviewInput,
  type CreateInterviewInput,
  type CreateJobRequisitionInput,
  type CreateOfferLetterInput,
} from "./recruitment";
