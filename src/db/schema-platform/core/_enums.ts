/**
 * Core Platform Enums Barrel
 * 
 * Re-exports all enums from the Core schema for easier discovery.
 */

// Tenant Statuses
export {
  tenantStatuses,
  tenantStatusEnum,
  tenantStatusZodEnum,
} from "./tenants";

// Organization Types and Statuses
export {
  organizationTypes,
  organizationTypeEnum,
  organizationTypeZodEnum,
  organizationStatuses,
  organizationStatusEnum,
  organizationStatusZodEnum,
} from "./organizations";

// Region Types and Statuses
export {
  regionTypes,
  regionTypeEnum,
  regionTypeZodEnum,
  regionStatuses,
  regionStatusEnum,
  regionStatusZodEnum,
} from "./regions";

// Location Statuses
export {
  locationStatuses,
  locationStatusEnum,
  locationStatusZodEnum,
} from "./locations";

// Legal Entity Statuses
export {
  legalEntityStatuses,
  legalEntityStatusEnum,
  legalEntityStatusZodEnum,
} from "./legalEntities";

// Currency Statuses
export {
  currencyStatuses,
  currencyStatusEnum,
  currencyStatusZodEnum,
} from "./currencies";

// Cost Center Statuses
export {
  costCenterStatuses,
  costCenterStatusEnum,
  costCenterStatusZodEnum,
} from "./costCenters";

// Workflow Definition Statuses
export {
  workflowDefinitionStatuses,
  workflowDefinitionStatusEnum,
  WorkflowDefinitionStatusSchema,
  type WorkflowDefinitionStatus,
} from "./workflowDefinitions";

// Workflow Instance Statuses
export {
  workflowInstanceStatuses,
  workflowInstanceStatusEnum,
  WorkflowInstanceStatusSchema,
  type WorkflowInstanceStatus,
} from "./workflowInstances";

// Workflow Rule Operators
export {
  workflowRuleOperators,
  workflowRuleOperatorEnum,
  WorkflowRuleOperatorSchema,
  type WorkflowRuleOperator,
} from "./workflowTransitionRules";

// Notification Channels
export {
  notificationChannelValues,
  notificationChannelEnum,
  NotificationChannelSchema,
  type NotificationChannel,
} from "./notificationTemplates";

// Notification Channel Statuses
export {
  notificationChannelStatuses,
  notificationChannelStatusEnum,
  NotificationChannelStatusSchema,
  type NotificationChannelStatus,
} from "./notificationChannels";

// Notification Statuses
export {
  notificationStatuses,
  notificationStatusEnum,
  NotificationStatusSchema,
  type NotificationStatus,
} from "./notifications";

// Notification Delivery Statuses
export {
  notificationDeliveryStatuses,
  notificationDeliveryStatusEnum,
  NotificationDeliveryStatusSchema,
  type NotificationDeliveryStatus,
} from "./notificationDeliveries";

// Email Log Statuses
export {
  emailLogStatuses,
  emailLogStatusEnum,
  EmailLogStatusSchema,
  type EmailLogStatus,
} from "./emailLogs";

// Letter Types
export {
  letterTypes,
  letterTypeEnum,
  LetterTypeSchema,
  type LetterType,
} from "./letterTemplates";

// Letter Instance Statuses
export {
  letterInstanceStatuses,
  letterInstanceStatusEnum,
  LetterInstanceStatusSchema,
  type LetterInstanceStatus,
} from "./letterInstances";

// Announcement Statuses
export {
  announcementStatuses,
  announcementStatusEnum,
  AnnouncementStatusSchema,
  type AnnouncementStatus,
} from "./announcementPosts";

// Audience Types
export {
  audienceTypes,
  audienceTypeEnum,
  AudienceTypeSchema,
  type AudienceType,
} from "./announcementAudiences";
