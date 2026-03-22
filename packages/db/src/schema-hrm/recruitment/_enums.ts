/**
 * Recruitment Domain Enums Barrel
 *
 * Re-exports all enums from the Recruitment schema for easier discovery.
 */

export {
  candidateSources,
  candidateSourceEnum,
  CandidateSourceSchema,
  type CandidateSource,
  candidateStatuses,
  candidateStatusEnum,
  CandidateStatusSchema,
  type CandidateStatus,
  expectedSalaryPeriods,
  expectedSalaryPeriodEnum,
  ExpectedSalaryPeriodSchema,
  type ExpectedSalaryPeriod,
} from "./fundamentals/candidates";

export {
  applicationStatuses,
  applicationStatusEnum,
  ApplicationStatusSchema,
  type ApplicationStatus,
} from "./operations/applications";

export {
  roundInterviewTypes,
  roundInterviewTypeEnum,
  RoundInterviewTypeSchema,
  type RoundInterviewType,
} from "./operations/interviewRounds";

export {
  interviewScheduleStatuses,
  interviewScheduleStatusEnum,
  InterviewScheduleStatusSchema,
  type InterviewScheduleStatus,
} from "./operations/interviewSchedules";

export {
  interviewRecommendations,
  interviewRecommendationEnum,
  InterviewRecommendationSchema,
  type InterviewRecommendation,
} from "./operations/interviewFeedback";

export {
  staffingPlanStatuses,
  staffingPlanStatusEnum,
  StaffingPlanStatusSchema,
  type StaffingPlanStatus,
} from "./operations/staffingPlans";
