/**
 * Talent Domain Enums Barrel
 * 
 * Re-exports all enums from the Talent schema for easier discovery.
 */

// Performance Reviews
export {
  reviewTypes,
  reviewTypeEnum,
  reviewTypeZodEnum,
  reviewStatuses,
  reviewStatusEnum,
  reviewStatusZodEnum,
} from "./operations/performanceReviews";

// Succession Plans
export {
  readinessLevels,
  readinessLevelEnum,
  readinessLevelZodEnum,
  successionPlanStatuses,
  successionPlanStatusEnum,
  successionPlanStatusZodEnum,
} from "./operations/successionPlans";

// Grievances
export {
  grievanceTypes,
  grievanceTypeEnum,
  grievanceTypeZodEnum,
  grievanceStatuses,
  grievanceStatusEnum,
  grievanceStatusZodEnum,
} from "./operations/grievanceRecords";

// Appraisal Cycles
export {
  appraisalCycleStatuses,
  appraisalCycleStatusEnum,
  AppraisalCycleStatusSchema,
  type AppraisalCycleStatus,
} from "./operations/appraisalCycles";

// Appraisal Templates
export {
  appraisalTemplateStatuses,
  appraisalTemplateStatusEnum,
  AppraisalTemplateStatusSchema,
  type AppraisalTemplateStatus,
} from "./operations/appraisalTemplates";

// Appraisals
export {
  appraisalStatuses,
  appraisalStatusEnum,
  AppraisalStatusSchema,
  type AppraisalStatus,
} from "./operations/appraisals";
