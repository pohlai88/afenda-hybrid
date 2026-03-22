/**
 * Benefits Domain Enums Barrel
 *
 * Re-exports all enums from the Benefits schema for easier discovery.
 */

// Plan Types and Statuses
export {
  planTypes,
  planTypeEnum,
  PlanTypeSchema,
  type PlanType,
  planStatuses,
  planStatusEnum,
  PlanStatusSchema,
  type PlanStatus,
} from "./fundamentals/benefitPlans";

// Provider Statuses
export {
  providerStatuses,
  providerStatusEnum,
  ProviderStatusSchema,
  type ProviderStatus,
} from "./fundamentals/benefitsProviders";

// Enrollment Statuses and Coverage Levels
export {
  enrollmentStatuses,
  enrollmentStatusEnum,
  EnrollmentStatusSchema,
  type EnrollmentStatus,
  benefitCoverageLevels,
  CoverageLevelSchema,
  type CoverageLevel,
} from "./operations/benefitEnrollments";

// Claim Statuses
export {
  claimStatuses,
  claimStatusEnum,
  ClaimStatusSchema,
  type ClaimStatus,
} from "./operations/claimsRecords";

// Dependent Coverage Statuses
export {
  coverageStatuses,
  coverageStatusEnum,
  CoverageStatusSchema,
  type CoverageStatus,
} from "./operations/dependentCoverages";

// Benefit Application Statuses
export {
  benefitApplicationStatuses,
  benefitApplicationStatusEnum,
  BenefitApplicationStatusSchema,
  type BenefitApplicationStatus,
} from "./operations/benefitApplications";

// Benefit Ledger Entry Types
export {
  benefitLedgerEntryTypes,
  benefitLedgerEntryTypeEnum,
  BenefitLedgerEntryTypeSchema,
  type BenefitLedgerEntryType,
} from "./operations/benefitLedgerEntries";
