-- Schemas created in later migration 20260320002149_wild_taskmaster
--> statement-breakpoint
CREATE TYPE "core"."currency_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "core"."legal_entity_status" AS ENUM('ACTIVE', 'INACTIVE', 'DISSOLVED');--> statement-breakpoint
CREATE TYPE "core"."cost_center_status" AS ENUM('ACTIVE', 'INACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "audit"."actor_type" AS ENUM('USER', 'SERVICE_PRINCIPAL', 'SYSTEM', 'ANONYMOUS');--> statement-breakpoint
CREATE TYPE "audit"."archive_destination" AS ENUM('S3', 'GCS', 'AZURE_BLOB', 'LOCAL', 'NONE');--> statement-breakpoint
CREATE TYPE "audit"."retention_execution_status" AS ENUM('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "audit"."retention_policy_status" AS ENUM('ACTIVE', 'PAUSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."gender" AS ENUM('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."marital_status" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'DOMESTIC_PARTNERSHIP', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."person_status" AS ENUM('ACTIVE', 'INACTIVE', 'DECEASED');--> statement-breakpoint
CREATE TYPE "hr"."name_type" AS ENUM('LEGAL', 'PREFERRED', 'FORMER', 'MAIDEN', 'ALIAS');--> statement-breakpoint
CREATE TYPE "hr"."contact_type" AS ENUM('EMAIL', 'PHONE', 'MOBILE', 'WORK_PHONE', 'WORK_EMAIL', 'FAX', 'SOCIAL');--> statement-breakpoint
CREATE TYPE "hr"."address_type" AS ENUM('RESIDENTIAL', 'MAILING', 'EMERGENCY', 'WORK', 'TEMPORARY');--> statement-breakpoint
CREATE TYPE "hr"."identifier_type" AS ENUM('PASSPORT', 'TAX_ID', 'SSN', 'NATIONAL_ID', 'DRIVER_LICENSE', 'WORK_PERMIT', 'VISA', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."emergency_relationship" AS ENUM('SPOUSE', 'PARENT', 'CHILD', 'SIBLING', 'RELATIVE', 'FRIEND', 'COLLEAGUE', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."dependent_relationship" AS ENUM('SPOUSE', 'CHILD', 'PARENT', 'DOMESTIC_PARTNER', 'STEPCHILD', 'FOSTER_CHILD', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."dependent_status" AS ENUM('ACTIVE', 'INACTIVE', 'DECEASED');--> statement-breakpoint
CREATE TYPE "hr"."document_status" AS ENUM('ACTIVE', 'ARCHIVED', 'EXPIRED', 'PENDING_REVIEW');--> statement-breakpoint
CREATE TYPE "hr"."document_type" AS ENUM('ID_CARD', 'PASSPORT_COPY', 'VISA_COPY', 'WORK_PERMIT', 'CONTRACT', 'CERTIFICATE', 'DEGREE', 'RESUME', 'PHOTO', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."department_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."position_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED', 'FROZEN');--> statement-breakpoint
CREATE TYPE "hr"."job_family_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."job_role_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."job_grade_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."contract_status" AS ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "hr"."contract_type" AS ENUM('PERMANENT', 'FIXED_TERM', 'CONTRACTOR', 'INTERN', 'TEMPORARY', 'PART_TIME', 'PROBATIONARY');--> statement-breakpoint
CREATE TYPE "hr"."probation_outcome" AS ENUM('PENDING', 'PASSED', 'EXTENDED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "hr"."notice_initiator" AS ENUM('EMPLOYEE', 'EMPLOYER', 'MUTUAL');--> statement-breakpoint
CREATE TYPE "hr"."notice_status" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'WITHDRAWN', 'WAIVED');--> statement-breakpoint
CREATE TYPE "hr"."report_type" AS ENUM('DIRECT', 'DOTTED', 'FUNCTIONAL', 'ADMINISTRATIVE');--> statement-breakpoint
CREATE TYPE "hr"."transfer_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "hr"."transfer_type" AS ENUM('DEPARTMENT', 'LOCATION', 'POSITION', 'LATERAL', 'PROMOTION', 'DEMOTION');--> statement-breakpoint
CREATE TYPE "hr"."secondment_status" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXTENDED');--> statement-breakpoint
CREATE TYPE "hr"."schedule_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."schedule_type" AS ENUM('FIXED', 'ROTATING', 'FLEXIBLE', 'COMPRESSED', 'SPLIT');--> statement-breakpoint
CREATE TYPE "hr"."timesheet_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PROCESSED');--> statement-breakpoint
CREATE TYPE "hr"."overtime_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');--> statement-breakpoint
CREATE TYPE "hr"."overtime_type" AS ENUM('REGULAR', 'WEEKEND', 'HOLIDAY', 'NIGHT', 'EMERGENCY');--> statement-breakpoint
CREATE TYPE "hr"."holiday_calendar_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."leave_type_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "hr"."absence_status" AS ENUM('RECORDED', 'EXCUSED', 'UNEXCUSED', 'CONVERTED_TO_LEAVE');--> statement-breakpoint
CREATE TYPE "hr"."absence_type" AS ENUM('NO_SHOW', 'EMERGENCY', 'MEDICAL', 'FAMILY', 'WEATHER', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."shift_swap_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "hr"."attendance_type" AS ENUM('REGULAR', 'OVERTIME', 'REMOTE', 'ON_SITE', 'FIELD_WORK', 'TRAINING');--> statement-breakpoint
CREATE TYPE "hr"."leave_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "hr"."request_category" AS ENUM('PAYROLL', 'BENEFITS', 'LEAVE', 'POLICY', 'IT_ACCESS', 'DOCUMENT', 'COMPLAINT', 'GENERAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."request_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "hr"."request_status" AS ENUM('OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "hr"."document_request_status" AS ENUM('PENDING', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "hr"."document_request_type" AS ENUM('EMPLOYMENT_CERTIFICATE', 'SALARY_CERTIFICATE', 'EXPERIENCE_LETTER', 'NOC', 'REFERENCE_LETTER', 'TAX_DOCUMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."declaration_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "hr"."declaration_type" AS ENUM('TAX_DECLARATION', 'INVESTMENT_PROOF', 'RENT_DECLARATION', 'INSURANCE_PROOF', 'DEPENDENT_DECLARATION', 'COMPLIANCE_ACKNOWLEDGMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."asset_condition" AS ENUM('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');--> statement-breakpoint
CREATE TYPE "hr"."asset_type" AS ENUM('LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADSET', 'ID_CARD', 'ACCESS_CARD', 'VEHICLE', 'FURNITURE', 'OTHER');--> statement-breakpoint
CREATE TYPE "hr"."assignment_status" AS ENUM('ASSIGNED', 'RETURNED', 'LOST', 'DAMAGED', 'TRANSFERRED');--> statement-breakpoint
CREATE TYPE "payroll"."compensation_status" AS ENUM('DRAFT', 'ACTIVE', 'SUPERSEDED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "payroll"."pay_frequency" AS ENUM('MONTHLY', 'BIWEEKLY', 'WEEKLY', 'SEMI_MONTHLY', 'ANNUAL');--> statement-breakpoint
CREATE TYPE "payroll"."pay_component_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."pay_component_type" AS ENUM('EARNING', 'DEDUCTION', 'BENEFIT', 'REIMBURSEMENT');--> statement-breakpoint
CREATE TYPE "payroll"."pay_grade_structure_status" AS ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."earnings_category" AS ENUM('SALARY', 'OVERTIME', 'BONUS', 'COMMISSION', 'ALLOWANCE', 'INCENTIVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "payroll"."earnings_type_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."deduction_category" AS ENUM('TAX', 'SOCIAL_INSURANCE', 'PENSION', 'HEALTH_INSURANCE', 'LOAN', 'GARNISHMENT', 'UNION_DUES', 'OTHER');--> statement-breakpoint
CREATE TYPE "payroll"."deduction_type_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."expense_category" AS ENUM('TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'EQUIPMENT', 'COMMUNICATION', 'TRAINING', 'OTHER');--> statement-breakpoint
CREATE TYPE "payroll"."expense_type_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."bank_account_status" AS ENUM('ACTIVE', 'INACTIVE', 'CLOSED', 'PENDING_VERIFICATION');--> statement-breakpoint
CREATE TYPE "payroll"."filing_status" AS ENUM('SINGLE', 'MARRIED_FILING_JOINTLY', 'MARRIED_FILING_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'QUALIFYING_WIDOW');--> statement-breakpoint
CREATE TYPE "payroll"."tax_profile_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "payroll"."social_insurance_status" AS ENUM('ACTIVE', 'INACTIVE', 'EXEMPT', 'PENDING');--> statement-breakpoint
CREATE TYPE "payroll"."period_status" AS ENUM('OPEN', 'PROCESSING', 'CLOSED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "payroll"."payroll_run_status" AS ENUM('DRAFT', 'CALCULATING', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED');--> statement-breakpoint
CREATE TYPE "payroll"."entry_type" AS ENUM('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "payroll"."payslip_status" AS ENUM('DRAFT', 'GENERATED', 'SENT', 'VIEWED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."payment_method" AS ENUM('BANK_TRANSFER', 'CHECK', 'CASH', 'DIRECT_DEPOSIT');--> statement-breakpoint
CREATE TYPE "payroll"."payment_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "payroll"."expense_claim_status" AS ENUM('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSING', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "payroll"."loan_status" AS ENUM('PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "payroll"."loan_type" AS ENUM('SALARY_ADVANCE', 'PERSONAL_LOAN', 'EMERGENCY_LOAN', 'HOUSING_LOAN', 'EDUCATION_LOAN', 'OTHER');--> statement-breakpoint
CREATE TYPE "payroll"."settlement_status" AS ENUM('DRAFT', 'CALCULATING', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "benefits"."plan_status" AS ENUM('DRAFT', 'ACTIVE', 'SUSPENDED', 'DISCONTINUED');--> statement-breakpoint
CREATE TYPE "benefits"."plan_type" AS ENUM('HEALTH_INSURANCE', 'DENTAL', 'VISION', 'LIFE_INSURANCE', 'DISABILITY', 'RETIREMENT', 'WELLNESS', 'OTHER');--> statement-breakpoint
CREATE TYPE "benefits"."provider_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "benefits"."enrollment_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "benefits"."coverage_status" AS ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "benefits"."claim_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "talent"."skill_category" AS ENUM('TECHNICAL', 'SOFT', 'LANGUAGE', 'CERTIFICATION', 'TOOL', 'DOMAIN', 'OTHER');--> statement-breakpoint
CREATE TYPE "talent"."skill_status" AS ENUM('ACTIVE', 'INACTIVE', 'DEPRECATED');--> statement-breakpoint
CREATE TYPE "talent"."certification_status" AS ENUM('ACTIVE', 'INACTIVE', 'DEPRECATED');--> statement-breakpoint
CREATE TYPE "talent"."framework_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "talent"."pool_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "talent"."proficiency_level" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER');--> statement-breakpoint
CREATE TYPE "talent"."review_status" AS ENUM('DRAFT', 'SELF_ASSESSMENT', 'MANAGER_REVIEW', 'CALIBRATION', 'COMPLETED', 'ACKNOWLEDGED');--> statement-breakpoint
CREATE TYPE "talent"."review_type" AS ENUM('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'PROBATION', 'PROJECT', 'AD_HOC');--> statement-breakpoint
CREATE TYPE "talent"."goal_status" AS ENUM('DRAFT', 'ACTIVE', 'ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "talent"."goal_type" AS ENUM('INDIVIDUAL', 'TEAM', 'DEPARTMENT', 'COMPANY', 'DEVELOPMENT');--> statement-breakpoint
CREATE TYPE "talent"."promotion_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "talent"."readiness_level" AS ENUM('READY_NOW', 'READY_1_YEAR', 'READY_2_YEARS', 'DEVELOPMENT_NEEDED', 'NOT_READY');--> statement-breakpoint
CREATE TYPE "talent"."succession_plan_status" AS ENUM('DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "talent"."disciplinary_status" AS ENUM('DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'APPEALED', 'RESOLVED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "talent"."disciplinary_type" AS ENUM('VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'SUSPENSION', 'DEMOTION', 'TERMINATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "talent"."grievance_status" AS ENUM('SUBMITTED', 'UNDER_INVESTIGATION', 'PENDING_RESOLUTION', 'RESOLVED', 'ESCALATED', 'CLOSED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "talent"."grievance_type" AS ENUM('HARASSMENT', 'DISCRIMINATION', 'WORKPLACE_SAFETY', 'POLICY_VIOLATION', 'MANAGEMENT', 'COMPENSATION', 'WORKING_CONDITIONS', 'OTHER');--> statement-breakpoint
CREATE TYPE "learning"."course_format" AS ENUM('CLASSROOM', 'ONLINE', 'BLENDED', 'SELF_PACED', 'WORKSHOP', 'WEBINAR', 'ON_THE_JOB');--> statement-breakpoint
CREATE TYPE "learning"."course_status" AS ENUM('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "learning"."module_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "learning"."trainer_status" AS ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE');--> statement-breakpoint
CREATE TYPE "learning"."trainer_type" AS ENUM('INTERNAL', 'EXTERNAL', 'VENDOR');--> statement-breakpoint
CREATE TYPE "learning"."path_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "learning"."session_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');--> statement-breakpoint
CREATE TYPE "learning"."training_enrollment_status" AS ENUM('PENDING', 'APPROVED', 'ENROLLED', 'ATTENDED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'WAITLISTED');--> statement-breakpoint
CREATE TYPE "learning"."assessment_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'GRADED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "learning"."assessment_type" AS ENUM('QUIZ', 'EXAM', 'PRACTICAL', 'PROJECT', 'PRESENTATION', 'CERTIFICATION_EXAM');--> statement-breakpoint
CREATE TYPE "learning"."award_status" AS ENUM('ACTIVE', 'EXPIRED', 'REVOKED', 'PENDING_RENEWAL');--> statement-breakpoint
CREATE TYPE "learning"."cost_category" AS ENUM('TRAINER_FEE', 'VENUE', 'MATERIALS', 'TRAVEL', 'CATERING', 'EQUIPMENT', 'CERTIFICATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "recruitment"."candidate_source" AS ENUM('JOB_BOARD', 'REFERRAL', 'CAREER_SITE', 'SOCIAL_MEDIA', 'AGENCY', 'UNIVERSITY', 'INTERNAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "recruitment"."candidate_status" AS ENUM('NEW', 'SCREENING', 'INTERVIEWING', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD');--> statement-breakpoint
CREATE TYPE "recruitment"."requisition_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'OPEN', 'ON_HOLD', 'FILLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "recruitment"."requisition_type" AS ENUM('NEW_POSITION', 'REPLACEMENT', 'EXPANSION', 'TEMPORARY', 'CONTRACTOR');--> statement-breakpoint
CREATE TYPE "recruitment"."application_status" AS ENUM('SUBMITTED', 'SCREENING', 'SHORTLISTED', 'INTERVIEWING', 'OFFER_PENDING', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "recruitment"."interview_result" AS ENUM('STRONG_YES', 'YES', 'MAYBE', 'NO', 'STRONG_NO');--> statement-breakpoint
CREATE TYPE "recruitment"."interview_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');--> statement-breakpoint
CREATE TYPE "recruitment"."interview_type" AS ENUM('PHONE_SCREEN', 'VIDEO', 'IN_PERSON', 'PANEL', 'TECHNICAL', 'BEHAVIORAL', 'FINAL');--> statement-breakpoint
CREATE TYPE "recruitment"."offer_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'DECLINED', 'NEGOTIATING', 'EXPIRED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "recruitment"."check_result" AS ENUM('CLEAR', 'FLAGGED', 'DISCREPANCY', 'FAILED', 'INCONCLUSIVE');--> statement-breakpoint
CREATE TYPE "recruitment"."check_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "recruitment"."check_type" AS ENUM('IDENTITY', 'EMPLOYMENT', 'EDUCATION', 'CRIMINAL', 'CREDIT', 'REFERENCE', 'DRUG_TEST', 'OTHER');--> statement-breakpoint
CREATE TYPE "recruitment"."task_category" AS ENUM('DOCUMENTATION', 'IT_SETUP', 'TRAINING', 'COMPLIANCE', 'INTRODUCTION', 'EQUIPMENT', 'ACCESS', 'OTHER');--> statement-breakpoint
CREATE TYPE "recruitment"."onboarding_task_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "recruitment"."evaluation_outcome" AS ENUM('PASS', 'EXTEND', 'FAIL', 'PENDING');--> statement-breakpoint
CREATE TYPE "recruitment"."evaluation_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'TRUNCATE';--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'LOGIN';--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'LOGOUT';--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'ACCESS';--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'EXPORT';--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'GRANT';--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'REVOKE';--> statement-breakpoint
ALTER TYPE "audit"."audit_operation" ADD VALUE 'CONFIG_CHANGE';--> statement-breakpoint
ALTER TYPE "hr"."employee_status" ADD VALUE 'SUSPENDED' BEFORE 'PENDING';--> statement-breakpoint
ALTER TYPE "hr"."employee_status" ADD VALUE 'PROBATION';--> statement-breakpoint
CREATE TABLE "core"."currencies" (
	"currencyId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."currencies_currencyId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"currencyCode" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"decimalPlaces" smallint DEFAULT 2 NOT NULL,
	"status" "core"."currency_status" DEFAULT 'ACTIVE'::"core"."currency_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."legal_entities" (
	"legalEntityId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."legal_entities_legalEntityId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"legalEntityCode" text NOT NULL,
	"name" text NOT NULL,
	"registrationNumber" text,
	"taxId" text,
	"country" text NOT NULL,
	"defaultCurrencyId" integer,
	"address" text,
	"status" "core"."legal_entity_status" DEFAULT 'ACTIVE'::"core"."legal_entity_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."cost_centers" (
	"costCenterId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."cost_centers_costCenterId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"costCenterCode" text NOT NULL,
	"name" text NOT NULL,
	"legalEntityId" integer,
	"parentCostCenterId" integer,
	"description" text,
	"status" "core"."cost_center_status" DEFAULT 'ACTIVE'::"core"."cost_center_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit"."retention_executions" (
	"executionId" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit"."retention_executions_executionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"policyId" integer NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"status" "audit"."retention_execution_status" DEFAULT 'RUNNING'::"audit"."retention_execution_status" NOT NULL,
	"recordsProcessed" bigint,
	"recordsArchived" bigint,
	"recordsDeleted" bigint,
	"errorMessage" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit"."retention_policies" (
	"policyId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit"."retention_policies_policyId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer,
	"schemaName" text,
	"tableName" text,
	"retentionDays" integer DEFAULT 2555 NOT NULL,
	"status" "audit"."retention_policy_status" DEFAULT 'ACTIVE'::"audit"."retention_policy_status" NOT NULL,
	"archiveEnabled" boolean DEFAULT true NOT NULL,
	"archiveDestination" "audit"."archive_destination" DEFAULT 'S3'::"audit"."archive_destination",
	"archivePath" text,
	"archiveEncrypted" boolean DEFAULT true NOT NULL,
	"description" text,
	"effectiveFrom" timestamp with time zone,
	"lastAppliedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_retention_minimum_days" CHECK ("retentionDays" >= 365),
	CONSTRAINT "chk_archive_destination_required" CHECK ("archiveEnabled" = false OR "archiveDestination" IS NOT NULL),
	CONSTRAINT "chk_archive_path_required" CHECK ("archiveDestination" = 'NONE' OR "archiveDestination" IS NULL OR "archivePath" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "hr"."persons" (
	"personId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."persons_personId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personCode" text NOT NULL,
	"dateOfBirth" date,
	"gender" "hr"."gender",
	"maritalStatus" "hr"."marital_status",
	"nationality" text,
	"primaryLanguage" text,
	"photoUrl" text,
	"status" "hr"."person_status" DEFAULT 'ACTIVE'::"hr"."person_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."person_names" (
	"personNameId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."person_names_personNameId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personId" integer NOT NULL,
	"nameType" "hr"."name_type" DEFAULT 'LEGAL'::"hr"."name_type" NOT NULL,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"suffix" text,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_person_names_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "hr"."contact_methods" (
	"contactMethodId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."contact_methods_contactMethodId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personId" integer NOT NULL,
	"contactType" "hr"."contact_type" NOT NULL,
	"value" text NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"verifiedAt" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."addresses" (
	"addressId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."addresses_addressId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personId" integer NOT NULL,
	"addressType" "hr"."address_type" NOT NULL,
	"street1" text NOT NULL,
	"street2" text,
	"city" text NOT NULL,
	"stateProvince" text,
	"postalCode" text,
	"country" text NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_addresses_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "hr"."national_identifiers" (
	"nationalIdentifierId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."national_identifiers_nationalIdentifierId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personId" integer NOT NULL,
	"identifierType" "hr"."identifier_type" NOT NULL,
	"identifierValue" text NOT NULL,
	"issuingCountry" text,
	"issueDate" date,
	"expiryDate" date,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_national_identifiers_dates" CHECK ("expiryDate" IS NULL OR "issueDate" IS NULL OR "expiryDate" >= "issueDate")
);
--> statement-breakpoint
CREATE TABLE "hr"."emergency_contacts" (
	"emergencyContactId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."emergency_contacts_emergencyContactId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personId" integer NOT NULL,
	"name" text NOT NULL,
	"relationship" "hr"."emergency_relationship" NOT NULL,
	"phone" text NOT NULL,
	"alternatePhone" text,
	"email" text,
	"address" text,
	"priority" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_emergency_contacts_priority" CHECK ("priority" >= 1 AND "priority" <= 10)
);
--> statement-breakpoint
CREATE TABLE "hr"."dependents" (
	"dependentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."dependents_dependentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personId" integer NOT NULL,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"dateOfBirth" date,
	"gender" "hr"."gender",
	"relationship" "hr"."dependent_relationship" NOT NULL,
	"nationalId" text,
	"isStudent" boolean DEFAULT false NOT NULL,
	"isDisabled" boolean DEFAULT false NOT NULL,
	"status" "hr"."dependent_status" DEFAULT 'ACTIVE'::"hr"."dependent_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."person_documents" (
	"documentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."person_documents_documentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"personId" integer NOT NULL,
	"documentType" "hr"."document_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"filePath" text NOT NULL,
	"fileName" text NOT NULL,
	"mimeType" text NOT NULL,
	"fileSize" bigint,
	"uploadedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiryDate" date,
	"status" "hr"."document_status" DEFAULT 'ACTIVE'::"hr"."document_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_person_documents_file_size" CHECK ("fileSize" IS NULL OR "fileSize" > 0)
);
--> statement-breakpoint
CREATE TABLE "hr"."departments" (
	"departmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."departments_departmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"departmentCode" text NOT NULL,
	"name" text NOT NULL,
	"organizationId" integer,
	"legalEntityId" integer,
	"costCenterId" integer,
	"parentDepartmentId" integer,
	"headEmployeeId" integer,
	"description" text,
	"status" "hr"."department_status" DEFAULT 'ACTIVE'::"hr"."department_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."positions" (
	"positionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."positions_positionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"positionCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"departmentId" integer,
	"jobRoleId" integer,
	"jobGradeId" integer,
	"headcount" smallint DEFAULT 1 NOT NULL,
	"fte" numeric(3,2) DEFAULT '1.00' NOT NULL,
	"minSalary" numeric(12,2),
	"maxSalary" numeric(12,2),
	"status" "hr"."position_status" DEFAULT 'ACTIVE'::"hr"."position_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_positions_salary_range" CHECK ("minSalary" IS NULL OR "maxSalary" IS NULL OR "minSalary" <= "maxSalary"),
	CONSTRAINT "chk_positions_salary_positive" CHECK (("minSalary" IS NULL OR "minSalary" >= 0) AND ("maxSalary" IS NULL OR "maxSalary" >= 0)),
	CONSTRAINT "chk_positions_headcount" CHECK ("headcount" >= 0),
	CONSTRAINT "chk_positions_fte" CHECK ("fte" > 0 AND "fte" <= 1)
);
--> statement-breakpoint
CREATE TABLE "hr"."job_families" (
	"jobFamilyId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."job_families_jobFamilyId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"familyCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "hr"."job_family_status" DEFAULT 'ACTIVE'::"hr"."job_family_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."job_roles" (
	"jobRoleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."job_roles_jobRoleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"roleCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"jobFamilyId" integer,
	"responsibilities" text,
	"qualifications" text,
	"status" "hr"."job_role_status" DEFAULT 'ACTIVE'::"hr"."job_role_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."job_grades" (
	"jobGradeId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."job_grades_jobGradeId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"gradeCode" text NOT NULL,
	"name" text NOT NULL,
	"level" smallint NOT NULL,
	"minSalary" numeric(12,2),
	"midSalary" numeric(12,2),
	"maxSalary" numeric(12,2),
	"currencyId" integer,
	"description" text,
	"status" "hr"."job_grade_status" DEFAULT 'ACTIVE'::"hr"."job_grade_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_job_grades_salary_range" CHECK ("minSalary" IS NULL OR "maxSalary" IS NULL OR "minSalary" <= "maxSalary"),
	CONSTRAINT "chk_job_grades_mid_salary" CHECK ("midSalary" IS NULL OR (
        ("minSalary" IS NULL OR "midSalary" >= "minSalary") AND
        ("maxSalary" IS NULL OR "midSalary" <= "maxSalary")
      )),
	CONSTRAINT "chk_job_grades_salary_positive" CHECK (("minSalary" IS NULL OR "minSalary" >= 0) AND
          ("midSalary" IS NULL OR "midSalary" >= 0) AND
          ("maxSalary" IS NULL OR "maxSalary" >= 0)),
	CONSTRAINT "chk_job_grades_level_positive" CHECK ("level" >= 1)
);
--> statement-breakpoint
CREATE TABLE "hr"."employment_contracts" (
	"contractId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."employment_contracts_contractId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"contractCode" text NOT NULL,
	"contractType" "hr"."contract_type" NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"probationEndDate" date,
	"noticePeriodDays" integer DEFAULT 30,
	"workingHoursPerWeek" numeric(4,1),
	"status" "hr"."contract_status" DEFAULT 'DRAFT'::"hr"."contract_status" NOT NULL,
	"terms" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_employment_contracts_dates" CHECK ("endDate" IS NULL OR "endDate" >= "startDate"),
	CONSTRAINT "chk_employment_contracts_probation" CHECK ("probationEndDate" IS NULL OR "probationEndDate" >= "startDate"),
	CONSTRAINT "chk_employment_contracts_notice_period" CHECK ("noticePeriodDays" IS NULL OR "noticePeriodDays" >= 0),
	CONSTRAINT "chk_employment_contracts_hours" CHECK ("workingHoursPerWeek" IS NULL OR ("workingHoursPerWeek" > 0 AND "workingHoursPerWeek" <= 168))
);
--> statement-breakpoint
CREATE TABLE "hr"."employment_status_history" (
	"statusHistoryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."employment_status_history_statusHistoryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"previousStatus" "hr"."employee_status",
	"newStatus" "hr"."employee_status" NOT NULL,
	"effectiveDate" date NOT NULL,
	"reason" text,
	"changedBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."probation_records" (
	"probationRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."probation_records_probationRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"startDate" date NOT NULL,
	"originalEndDate" date NOT NULL,
	"extendedEndDate" date,
	"actualEndDate" date,
	"outcome" "hr"."probation_outcome" DEFAULT 'PENDING'::"hr"."probation_outcome" NOT NULL,
	"reviewedBy" integer,
	"reviewDate" date,
	"reviewNotes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_probation_records_original_dates" CHECK ("originalEndDate" >= "startDate"),
	CONSTRAINT "chk_probation_records_extended_dates" CHECK ("extendedEndDate" IS NULL OR "extendedEndDate" >= "originalEndDate"),
	CONSTRAINT "chk_probation_records_actual_dates" CHECK ("actualEndDate" IS NULL OR "actualEndDate" >= "startDate")
);
--> statement-breakpoint
CREATE TABLE "hr"."notice_period_records" (
	"noticePeriodRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."notice_period_records_noticePeriodRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"initiatedBy" "hr"."notice_initiator" NOT NULL,
	"noticeDate" date NOT NULL,
	"requiredNoticeDays" integer NOT NULL,
	"actualLastDay" date,
	"expectedLastDay" date NOT NULL,
	"status" "hr"."notice_status" DEFAULT 'PENDING'::"hr"."notice_status" NOT NULL,
	"reason" text,
	"approvedBy" integer,
	"approvalDate" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_notice_period_records_expected_date" CHECK ("expectedLastDay" >= "noticeDate"),
	CONSTRAINT "chk_notice_period_records_actual_date" CHECK ("actualLastDay" IS NULL OR "actualLastDay" >= "noticeDate"),
	CONSTRAINT "chk_notice_period_records_notice_days" CHECK ("requiredNoticeDays" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hr"."reporting_lines" (
	"reportingLineId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."reporting_lines_reportingLineId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"managerId" integer NOT NULL,
	"reportType" "hr"."report_type" DEFAULT 'DIRECT'::"hr"."report_type" NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_reporting_lines_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
	CONSTRAINT "chk_reporting_lines_not_self" CHECK ("employeeId" != "managerId")
);
--> statement-breakpoint
CREATE TABLE "hr"."employee_transfers" (
	"transferId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."employee_transfers_transferId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"transferType" "hr"."transfer_type" NOT NULL,
	"fromDepartmentId" integer,
	"toDepartmentId" integer,
	"fromLocationId" integer,
	"toLocationId" integer,
	"fromPositionId" integer,
	"toPositionId" integer,
	"effectiveDate" date NOT NULL,
	"reason" text,
	"status" "hr"."transfer_status" DEFAULT 'PENDING'::"hr"."transfer_status" NOT NULL,
	"approvedBy" integer,
	"approvalDate" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_employee_transfers_has_change" CHECK ("fromDepartmentId" IS DISTINCT FROM "toDepartmentId" OR
          "fromLocationId" IS DISTINCT FROM "toLocationId" OR
          "fromPositionId" IS DISTINCT FROM "toPositionId")
);
--> statement-breakpoint
CREATE TABLE "hr"."secondments" (
	"secondmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."secondments_secondmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"hostDepartmentId" integer,
	"hostLocationId" integer,
	"hostLegalEntityId" integer,
	"startDate" date NOT NULL,
	"originalEndDate" date NOT NULL,
	"actualEndDate" date,
	"reason" text,
	"status" "hr"."secondment_status" DEFAULT 'PENDING'::"hr"."secondment_status" NOT NULL,
	"approvedBy" integer,
	"approvalDate" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_secondments_dates" CHECK ("originalEndDate" >= "startDate"),
	CONSTRAINT "chk_secondments_actual_date" CHECK ("actualEndDate" IS NULL OR "actualEndDate" >= "startDate"),
	CONSTRAINT "chk_secondments_has_host" CHECK ("hostDepartmentId" IS NOT NULL OR "hostLocationId" IS NOT NULL OR "hostLegalEntityId" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "hr"."position_assignments" (
	"assignmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."position_assignments_assignmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"positionId" integer NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"isPrimary" boolean DEFAULT true NOT NULL,
	"fte" numeric(3,2) DEFAULT '1.00' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_position_assignments_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
	CONSTRAINT "chk_position_assignments_fte" CHECK ("fte" > 0 AND "fte" <= 1)
);
--> statement-breakpoint
CREATE TABLE "hr"."work_schedules" (
	"scheduleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."work_schedules_scheduleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"scheduleCode" text NOT NULL,
	"name" text NOT NULL,
	"scheduleType" "hr"."schedule_type" DEFAULT 'FIXED'::"hr"."schedule_type" NOT NULL,
	"weeklyHours" numeric(4,1) DEFAULT '40.0' NOT NULL,
	"description" text,
	"status" "hr"."schedule_status" DEFAULT 'ACTIVE'::"hr"."schedule_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."shift_assignments" (
	"shiftAssignmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."shift_assignments_shiftAssignmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"scheduleId" integer NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_shift_assignments_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "hr"."timesheets" (
	"timesheetId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."timesheets_timesheetId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"periodStart" date NOT NULL,
	"periodEnd" date NOT NULL,
	"regularHours" numeric(5,2) DEFAULT '0' NOT NULL,
	"overtimeHours" numeric(5,2) DEFAULT '0' NOT NULL,
	"totalHours" numeric(5,2) DEFAULT '0' NOT NULL,
	"status" "hr"."timesheet_status" DEFAULT 'DRAFT'::"hr"."timesheet_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_timesheets_period" CHECK ("periodEnd" >= "periodStart"),
	CONSTRAINT "chk_timesheets_hours_positive" CHECK ("regularHours" >= 0 AND "overtimeHours" >= 0 AND "totalHours" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hr"."overtime_records" (
	"overtimeRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."overtime_records_overtimeRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"overtimeDate" date NOT NULL,
	"overtimeType" "hr"."overtime_type" DEFAULT 'REGULAR'::"hr"."overtime_type" NOT NULL,
	"hours" numeric(4,2) NOT NULL,
	"multiplier" numeric(3,2) DEFAULT '1.50' NOT NULL,
	"reason" text,
	"status" "hr"."overtime_status" DEFAULT 'PENDING'::"hr"."overtime_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_overtime_records_hours" CHECK ("hours" > 0 AND "hours" <= 24),
	CONSTRAINT "chk_overtime_records_multiplier" CHECK ("multiplier" >= 1)
);
--> statement-breakpoint
CREATE TABLE "hr"."holiday_calendars" (
	"calendarId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."holiday_calendars_calendarId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"calendarCode" text NOT NULL,
	"name" text NOT NULL,
	"regionId" integer,
	"year" smallint NOT NULL,
	"description" text,
	"status" "hr"."holiday_calendar_status" DEFAULT 'DRAFT'::"hr"."holiday_calendar_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."holiday_calendar_entries" (
	"entryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."holiday_calendar_entries_entryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"calendarId" integer NOT NULL,
	"holidayDate" date NOT NULL,
	"name" text NOT NULL,
	"isHalfDay" boolean DEFAULT false NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hr"."leave_types" (
	"leaveTypeId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."leave_types_leaveTypeId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"leaveTypeCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"defaultDaysPerYear" smallint,
	"isPaid" boolean DEFAULT true NOT NULL,
	"requiresApproval" boolean DEFAULT true NOT NULL,
	"requiresDocumentation" boolean DEFAULT false NOT NULL,
	"maxConsecutiveDays" smallint,
	"minNoticeDays" smallint DEFAULT 0,
	"allowCarryOver" boolean DEFAULT false NOT NULL,
	"maxCarryOverDays" smallint,
	"status" "hr"."leave_type_status" DEFAULT 'ACTIVE'::"hr"."leave_type_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_leave_types_default_days" CHECK ("defaultDaysPerYear" IS NULL OR "defaultDaysPerYear" >= 0),
	CONSTRAINT "chk_leave_types_max_consecutive" CHECK ("maxConsecutiveDays" IS NULL OR "maxConsecutiveDays" > 0),
	CONSTRAINT "chk_leave_types_carry_over" CHECK ("allowCarryOver" = false OR "maxCarryOverDays" IS NULL OR "maxCarryOverDays" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hr"."leave_balances" (
	"leaveBalanceId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."leave_balances_leaveBalanceId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"leaveTypeId" integer NOT NULL,
	"year" smallint NOT NULL,
	"entitled" numeric(5,2) DEFAULT '0' NOT NULL,
	"used" numeric(5,2) DEFAULT '0' NOT NULL,
	"pending" numeric(5,2) DEFAULT '0' NOT NULL,
	"carriedOver" numeric(5,2) DEFAULT '0' NOT NULL,
	"adjustment" numeric(5,2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_leave_balances_entitled" CHECK ("entitled" >= 0),
	CONSTRAINT "chk_leave_balances_used" CHECK ("used" >= 0),
	CONSTRAINT "chk_leave_balances_pending" CHECK ("pending" >= 0),
	CONSTRAINT "chk_leave_balances_carried_over" CHECK ("carriedOver" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hr"."absence_records" (
	"absenceRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."absence_records_absenceRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"absenceDate" date NOT NULL,
	"absenceType" "hr"."absence_type" NOT NULL,
	"status" "hr"."absence_status" DEFAULT 'RECORDED'::"hr"."absence_status" NOT NULL,
	"reason" text,
	"recordedBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_absence_records_date" CHECK ("absenceDate" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "hr"."shift_swaps" (
	"shiftSwapId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."shift_swaps_shiftSwapId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"requestingEmployeeId" integer NOT NULL,
	"targetEmployeeId" integer NOT NULL,
	"originalDate" date NOT NULL,
	"swapDate" date NOT NULL,
	"reason" text,
	"status" "hr"."shift_swap_status" DEFAULT 'PENDING'::"hr"."shift_swap_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_shift_swaps_different_employees" CHECK ("requestingEmployeeId" != "targetEmployeeId")
);
--> statement-breakpoint
CREATE TABLE "hr"."attendance_logs" (
	"attendanceLogId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."attendance_logs_attendanceLogId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"shiftAssignmentId" integer,
	"timesheetId" integer,
	"attendanceDate" date NOT NULL,
	"checkInAt" timestamp with time zone,
	"checkOutAt" timestamp with time zone,
	"attendanceType" "hr"."attendance_type" DEFAULT 'REGULAR'::"hr"."attendance_type" NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_attendance_checkout_after_checkin" CHECK ("checkOutAt" IS NULL OR "checkInAt" IS NULL OR "checkOutAt" > "checkInAt")
);
--> statement-breakpoint
CREATE TABLE "hr"."leave_requests" (
	"leaveRequestId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."leave_requests_leaveRequestId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"leaveTypeId" integer NOT NULL,
	"leaveBalanceId" integer,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"totalDays" numeric(4,1) NOT NULL,
	"isHalfDay" boolean DEFAULT false NOT NULL,
	"status" "hr"."leave_request_status" DEFAULT 'PENDING'::"hr"."leave_request_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" timestamp with time zone,
	"reason" text,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_leave_requests_date_range" CHECK ("endDate" >= "startDate"),
	CONSTRAINT "chk_leave_requests_total_days" CHECK ("totalDays" > 0),
	CONSTRAINT "chk_leave_requests_approval_fields" CHECK ("status" != 'APPROVED' OR ("approvedBy" IS NOT NULL AND "approvedAt" IS NOT NULL)),
	CONSTRAINT "chk_leave_requests_rejection_reason" CHECK ("status" != 'REJECTED' OR "rejectionReason" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "hr"."service_requests" (
	"serviceRequestId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."service_requests_serviceRequestId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"requestNumber" text NOT NULL,
	"category" "hr"."request_category" NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"priority" "hr"."request_priority" DEFAULT 'MEDIUM'::"hr"."request_priority" NOT NULL,
	"assignedTo" integer,
	"status" "hr"."request_status" DEFAULT 'OPEN'::"hr"."request_status" NOT NULL,
	"resolution" text,
	"resolvedAt" timestamp with time zone,
	"closedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."document_requests" (
	"documentRequestId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."document_requests_documentRequestId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"requestNumber" text NOT NULL,
	"documentType" "hr"."document_request_type" NOT NULL,
	"purpose" text,
	"addressedTo" text,
	"requiredBy" date,
	"status" "hr"."document_request_status" DEFAULT 'PENDING'::"hr"."document_request_status" NOT NULL,
	"processedBy" integer,
	"processedAt" timestamp with time zone,
	"documentPath" text,
	"deliveredAt" timestamp with time zone,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."employee_declarations" (
	"declarationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."employee_declarations_declarationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"declarationType" "hr"."declaration_type" NOT NULL,
	"fiscalYear" smallint NOT NULL,
	"declarationData" text,
	"documentPath" text,
	"submittedAt" date,
	"status" "hr"."declaration_status" DEFAULT 'DRAFT'::"hr"."declaration_status" NOT NULL,
	"verifiedBy" integer,
	"verifiedAt" date,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_employee_declarations_year" CHECK ("fiscalYear" >= 2000 AND "fiscalYear" <= 2100)
);
--> statement-breakpoint
CREATE TABLE "hr"."asset_assignments" (
	"assignmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."asset_assignments_assignmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"assetType" "hr"."asset_type" NOT NULL,
	"assetTag" text NOT NULL,
	"assetName" text NOT NULL,
	"serialNumber" text,
	"manufacturer" text,
	"model" text,
	"conditionAtIssue" "hr"."asset_condition" DEFAULT 'NEW'::"hr"."asset_condition" NOT NULL,
	"conditionAtReturn" "hr"."asset_condition",
	"issuedDate" date NOT NULL,
	"expectedReturnDate" date,
	"actualReturnDate" date,
	"issuedBy" integer,
	"status" "hr"."assignment_status" DEFAULT 'ASSIGNED'::"hr"."assignment_status" NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_asset_assignments_return_date" CHECK ("actualReturnDate" IS NULL OR "actualReturnDate" >= "issuedDate")
);
--> statement-breakpoint
CREATE TABLE "payroll"."compensation_packages" (
	"compensationPackageId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."compensation_packages_compensationPackageId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"baseSalary" numeric(12,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"payFrequency" "payroll"."pay_frequency" DEFAULT 'MONTHLY'::"payroll"."pay_frequency" NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"reason" text,
	"status" "payroll"."compensation_status" DEFAULT 'DRAFT'::"payroll"."compensation_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_compensation_packages_salary" CHECK ("baseSalary" >= 0),
	CONSTRAINT "chk_compensation_packages_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "payroll"."pay_components" (
	"payComponentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."pay_components_payComponentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"componentCode" text NOT NULL,
	"name" text NOT NULL,
	"componentType" "payroll"."pay_component_type" NOT NULL,
	"description" text,
	"isTaxable" boolean DEFAULT true NOT NULL,
	"isRecurring" boolean DEFAULT true NOT NULL,
	"affectsGrossPay" boolean DEFAULT true NOT NULL,
	"status" "payroll"."pay_component_status" DEFAULT 'ACTIVE'::"payroll"."pay_component_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."pay_grade_structures" (
	"payGradeStructureId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."pay_grade_structures_payGradeStructureId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"structureCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"jobGradeId" integer NOT NULL,
	"minSalary" numeric(12,2),
	"midSalary" numeric(12,2),
	"maxSalary" numeric(12,2),
	"currencyId" integer NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"status" "payroll"."pay_grade_structure_status" DEFAULT 'DRAFT'::"payroll"."pay_grade_structure_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_pay_grade_structures_salary_range" CHECK ("minSalary" IS NULL OR "maxSalary" IS NULL OR "minSalary" <= "maxSalary"),
	CONSTRAINT "chk_pay_grade_structures_mid_salary" CHECK ("midSalary" IS NULL OR (
        ("minSalary" IS NULL OR "midSalary" >= "minSalary") AND
        ("maxSalary" IS NULL OR "midSalary" <= "maxSalary")
      )),
	CONSTRAINT "chk_pay_grade_structures_salary_positive" CHECK (("minSalary" IS NULL OR "minSalary" >= 0) AND
          ("midSalary" IS NULL OR "midSalary" >= 0) AND
          ("maxSalary" IS NULL OR "maxSalary" >= 0)),
	CONSTRAINT "chk_pay_grade_structures_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "payroll"."earnings_types" (
	"earningsTypeId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."earnings_types_earningsTypeId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"earningsCode" text NOT NULL,
	"name" text NOT NULL,
	"category" "payroll"."earnings_category" NOT NULL,
	"description" text,
	"defaultRate" numeric(5,2),
	"isTaxable" boolean DEFAULT true NOT NULL,
	"isPensionable" boolean DEFAULT true NOT NULL,
	"status" "payroll"."earnings_type_status" DEFAULT 'ACTIVE'::"payroll"."earnings_type_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_earnings_types_rate" CHECK ("defaultRate" IS NULL OR "defaultRate" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."deduction_types" (
	"deductionTypeId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."deduction_types_deductionTypeId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"deductionCode" text NOT NULL,
	"name" text NOT NULL,
	"category" "payroll"."deduction_category" NOT NULL,
	"description" text,
	"defaultRate" numeric(5,4),
	"isPreTax" boolean DEFAULT false NOT NULL,
	"isMandatory" boolean DEFAULT false NOT NULL,
	"status" "payroll"."deduction_type_status" DEFAULT 'ACTIVE'::"payroll"."deduction_type_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_deduction_types_rate" CHECK ("defaultRate" IS NULL OR ("defaultRate" >= 0 AND "defaultRate" <= 1))
);
--> statement-breakpoint
CREATE TABLE "payroll"."expense_types" (
	"expenseTypeId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."expense_types_expenseTypeId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"expenseCode" text NOT NULL,
	"name" text NOT NULL,
	"category" "payroll"."expense_category" NOT NULL,
	"description" text,
	"maxAmount" numeric(10,2),
	"requiresReceipt" boolean DEFAULT true NOT NULL,
	"requiresApproval" boolean DEFAULT true NOT NULL,
	"status" "payroll"."expense_type_status" DEFAULT 'ACTIVE'::"payroll"."expense_type_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_expense_types_max_amount" CHECK ("maxAmount" IS NULL OR "maxAmount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."bank_accounts" (
	"bankAccountId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."bank_accounts_bankAccountId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"bankName" text NOT NULL,
	"branchName" text,
	"accountNumber" text NOT NULL,
	"accountHolderName" text NOT NULL,
	"routingNumber" text,
	"swiftCode" text,
	"iban" text,
	"currencyId" integer,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"status" "payroll"."bank_account_status" DEFAULT 'PENDING_VERIFICATION'::"payroll"."bank_account_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."tax_profiles" (
	"taxProfileId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."tax_profiles_taxProfileId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"taxYear" smallint NOT NULL,
	"taxIdNumber" text,
	"filingStatus" "payroll"."filing_status" DEFAULT 'SINGLE'::"payroll"."filing_status" NOT NULL,
	"allowances" smallint DEFAULT 0 NOT NULL,
	"additionalWithholding" integer DEFAULT 0,
	"isExempt" integer DEFAULT 0 NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"status" "payroll"."tax_profile_status" DEFAULT 'ACTIVE'::"payroll"."tax_profile_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_tax_profiles_allowances" CHECK ("allowances" >= 0),
	CONSTRAINT "chk_tax_profiles_withholding" CHECK ("additionalWithholding" IS NULL OR "additionalWithholding" >= 0),
	CONSTRAINT "chk_tax_profiles_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "payroll"."social_insurance_profiles" (
	"socialInsuranceProfileId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."social_insurance_profiles_socialInsuranceProfileId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"insuranceNumber" text,
	"schemeName" text NOT NULL,
	"employeeContributionRate" numeric(5,4) NOT NULL,
	"employerContributionRate" numeric(5,4) NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"status" "payroll"."social_insurance_status" DEFAULT 'ACTIVE'::"payroll"."social_insurance_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_social_insurance_profiles_employee_rate" CHECK ("employeeContributionRate" >= 0 AND "employeeContributionRate" <= 1),
	CONSTRAINT "chk_social_insurance_profiles_employer_rate" CHECK ("employerContributionRate" >= 0 AND "employerContributionRate" <= 1),
	CONSTRAINT "chk_social_insurance_profiles_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "payroll"."payroll_periods" (
	"payrollPeriodId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."payroll_periods_payrollPeriodId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"periodCode" text NOT NULL,
	"name" text NOT NULL,
	"periodStart" date NOT NULL,
	"periodEnd" date NOT NULL,
	"payDate" date NOT NULL,
	"status" "payroll"."period_status" DEFAULT 'OPEN'::"payroll"."period_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_payroll_periods_dates" CHECK ("periodEnd" >= "periodStart"),
	CONSTRAINT "chk_payroll_periods_pay_date" CHECK ("payDate" >= "periodEnd")
);
--> statement-breakpoint
CREATE TABLE "payroll"."payroll_runs" (
	"payrollRunId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."payroll_runs_payrollRunId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"payrollPeriodId" integer NOT NULL,
	"runCode" text NOT NULL,
	"runDate" date NOT NULL,
	"totalGross" numeric(14,2) DEFAULT '0' NOT NULL,
	"totalDeductions" numeric(14,2) DEFAULT '0' NOT NULL,
	"totalNet" numeric(14,2) DEFAULT '0' NOT NULL,
	"employeeCount" integer DEFAULT 0 NOT NULL,
	"currencyId" integer NOT NULL,
	"status" "payroll"."payroll_run_status" DEFAULT 'DRAFT'::"payroll"."payroll_run_status" NOT NULL,
	"processedBy" integer,
	"processedAt" timestamp with time zone,
	"approvedBy" integer,
	"approvedAt" timestamp with time zone,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_payroll_runs_totals" CHECK ("totalGross" >= 0 AND "totalDeductions" >= 0 AND "totalNet" >= 0),
	CONSTRAINT "chk_payroll_runs_employee_count" CHECK ("employeeCount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."payroll_entries" (
	"payrollEntryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."payroll_entries_payrollEntryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"payrollRunId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"payComponentId" integer,
	"entryType" "payroll"."entry_type" NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(8,2) DEFAULT '1',
	"rate" numeric(12,4),
	"amount" numeric(12,2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	CONSTRAINT "chk_payroll_entries_quantity" CHECK ("quantity" IS NULL OR "quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."payslips" (
	"payslipId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."payslips_payslipId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"payrollRunId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"payslipNumber" text NOT NULL,
	"periodStart" date NOT NULL,
	"periodEnd" date NOT NULL,
	"payDate" date NOT NULL,
	"grossPay" numeric(12,2) NOT NULL,
	"totalDeductions" numeric(12,2) NOT NULL,
	"netPay" numeric(12,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"status" "payroll"."payslip_status" DEFAULT 'DRAFT'::"payroll"."payslip_status" NOT NULL,
	"generatedAt" timestamp with time zone,
	"sentAt" timestamp with time zone,
	"viewedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_payslips_amounts" CHECK ("grossPay" >= 0 AND "totalDeductions" >= 0 AND "netPay" >= 0),
	CONSTRAINT "chk_payslips_period" CHECK ("periodEnd" >= "periodStart")
);
--> statement-breakpoint
CREATE TABLE "payroll"."payment_records" (
	"paymentRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."payment_records_paymentRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"payslipId" integer NOT NULL,
	"bankAccountId" integer,
	"paymentMethod" "payroll"."payment_method" DEFAULT 'BANK_TRANSFER'::"payroll"."payment_method" NOT NULL,
	"paymentReference" text NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"paymentDate" date NOT NULL,
	"status" "payroll"."payment_status" DEFAULT 'PENDING'::"payroll"."payment_status" NOT NULL,
	"processedAt" timestamp with time zone,
	"failureReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_payment_records_amount" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."expense_claims" (
	"expenseClaimId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."expense_claims_expenseClaimId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"claimNumber" text NOT NULL,
	"expenseTypeId" integer NOT NULL,
	"expenseDate" date NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"description" text NOT NULL,
	"receiptPath" text,
	"status" "payroll"."expense_claim_status" DEFAULT 'DRAFT'::"payroll"."expense_claim_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" timestamp with time zone,
	"paidAt" timestamp with time zone,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_expense_claims_amount" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."loan_records" (
	"loanRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."loan_records_loanRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"loanNumber" text NOT NULL,
	"loanType" "payroll"."loan_type" NOT NULL,
	"principalAmount" numeric(12,2) NOT NULL,
	"interestRate" numeric(5,4) DEFAULT '0' NOT NULL,
	"totalAmount" numeric(12,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"disbursementDate" date,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"monthlyDeduction" numeric(10,2) NOT NULL,
	"totalPaid" numeric(12,2) DEFAULT '0' NOT NULL,
	"outstandingBalance" numeric(12,2) NOT NULL,
	"status" "payroll"."loan_status" DEFAULT 'PENDING'::"payroll"."loan_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_loan_records_principal" CHECK ("principalAmount" > 0),
	CONSTRAINT "chk_loan_records_interest" CHECK ("interestRate" >= 0),
	CONSTRAINT "chk_loan_records_total" CHECK ("totalAmount" >= "principalAmount"),
	CONSTRAINT "chk_loan_records_deduction" CHECK ("monthlyDeduction" > 0),
	CONSTRAINT "chk_loan_records_dates" CHECK ("endDate" > "startDate"),
	CONSTRAINT "chk_loan_records_paid" CHECK ("totalPaid" >= 0 AND "totalPaid" <= "totalAmount"),
	CONSTRAINT "chk_loan_records_balance" CHECK ("outstandingBalance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."final_settlements" (
	"finalSettlementId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."final_settlements_finalSettlementId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"settlementNumber" text NOT NULL,
	"terminationDate" date NOT NULL,
	"lastWorkingDay" date NOT NULL,
	"unpaidSalary" numeric(12,2) DEFAULT '0' NOT NULL,
	"leaveEncashment" numeric(12,2) DEFAULT '0' NOT NULL,
	"gratuity" numeric(12,2) DEFAULT '0' NOT NULL,
	"bonus" numeric(12,2) DEFAULT '0' NOT NULL,
	"otherEarnings" numeric(12,2) DEFAULT '0' NOT NULL,
	"totalEarnings" numeric(12,2) NOT NULL,
	"loanRecovery" numeric(12,2) DEFAULT '0' NOT NULL,
	"advanceRecovery" numeric(12,2) DEFAULT '0' NOT NULL,
	"otherDeductions" numeric(12,2) DEFAULT '0' NOT NULL,
	"totalDeductions" numeric(12,2) NOT NULL,
	"netSettlement" numeric(12,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"status" "payroll"."settlement_status" DEFAULT 'DRAFT'::"payroll"."settlement_status" NOT NULL,
	"processedBy" integer,
	"processedAt" timestamp with time zone,
	"approvedBy" integer,
	"approvedAt" timestamp with time zone,
	"paidAt" timestamp with time zone,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_final_settlements_earnings" CHECK ("unpaidSalary" >= 0 AND "leaveEncashment" >= 0 AND "gratuity" >= 0 AND "bonus" >= 0 AND "otherEarnings" >= 0),
	CONSTRAINT "chk_final_settlements_deductions" CHECK ("loanRecovery" >= 0 AND "advanceRecovery" >= 0 AND "otherDeductions" >= 0),
	CONSTRAINT "chk_final_settlements_totals" CHECK ("totalEarnings" >= 0 AND "totalDeductions" >= 0),
	CONSTRAINT "chk_final_settlements_dates" CHECK ("lastWorkingDay" <= "terminationDate")
);
--> statement-breakpoint
CREATE TABLE "benefits"."benefit_plans" (
	"benefitPlanId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."benefit_plans_benefitPlanId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"planCode" text NOT NULL,
	"name" text NOT NULL,
	"planType" "benefits"."plan_type" NOT NULL,
	"description" text,
	"providerId" integer,
	"employeeContribution" numeric(10,2) DEFAULT '0',
	"employerContribution" numeric(10,2) DEFAULT '0',
	"currencyId" integer,
	"coverageAmount" numeric(12,2),
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"allowsDependents" boolean DEFAULT true NOT NULL,
	"maxDependents" integer,
	"eligibilityWaitingDays" integer DEFAULT 0,
	"status" "benefits"."plan_status" DEFAULT 'DRAFT'::"benefits"."plan_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_benefit_plans_contributions" CHECK ("employeeContribution" IS NULL OR "employeeContribution" >= 0),
	CONSTRAINT "chk_benefit_plans_employer_contribution" CHECK ("employerContribution" IS NULL OR "employerContribution" >= 0),
	CONSTRAINT "chk_benefit_plans_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
	CONSTRAINT "chk_benefit_plans_max_dependents" CHECK ("maxDependents" IS NULL OR "maxDependents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "benefits"."benefits_providers" (
	"providerId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."benefits_providers_providerId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"providerCode" text NOT NULL,
	"name" text NOT NULL,
	"contactPerson" text,
	"email" text,
	"phone" text,
	"address" text,
	"website" text,
	"contractNumber" text,
	"contractStartDate" text,
	"contractEndDate" text,
	"status" "benefits"."provider_status" DEFAULT 'ACTIVE'::"benefits"."provider_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benefits"."benefit_enrollments" (
	"enrollmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."benefit_enrollments_enrollmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"benefitPlanId" integer NOT NULL,
	"enrollmentDate" date NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"employeeContribution" numeric(10,2),
	"coverageLevel" text,
	"status" "benefits"."enrollment_status" DEFAULT 'PENDING'::"benefits"."enrollment_status" NOT NULL,
	"terminationReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_benefit_enrollments_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
	CONSTRAINT "chk_benefit_enrollments_contribution" CHECK ("employeeContribution" IS NULL OR "employeeContribution" >= 0)
);
--> statement-breakpoint
CREATE TABLE "benefits"."dependent_coverages" (
	"dependentCoverageId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."dependent_coverages_dependentCoverageId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"enrollmentId" integer NOT NULL,
	"dependentId" integer NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"status" "benefits"."coverage_status" DEFAULT 'ACTIVE'::"benefits"."coverage_status" NOT NULL,
	"terminationReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_dependent_coverages_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "benefits"."claims_records" (
	"claimRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."claims_records_claimRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"enrollmentId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"claimNumber" text NOT NULL,
	"claimDate" date NOT NULL,
	"serviceDate" date NOT NULL,
	"claimAmount" numeric(10,2) NOT NULL,
	"approvedAmount" numeric(10,2),
	"currencyId" integer NOT NULL,
	"description" text NOT NULL,
	"providerName" text,
	"receiptPath" text,
	"status" "benefits"."claim_status" DEFAULT 'DRAFT'::"benefits"."claim_status" NOT NULL,
	"reviewedBy" integer,
	"reviewedAt" timestamp with time zone,
	"paidAt" timestamp with time zone,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_claims_records_amount" CHECK ("claimAmount" > 0),
	CONSTRAINT "chk_claims_records_approved_amount" CHECK ("approvedAmount" IS NULL OR ("approvedAmount" >= 0 AND "approvedAmount" <= "claimAmount")),
	CONSTRAINT "chk_claims_records_service_date" CHECK ("serviceDate" <= "claimDate")
);
--> statement-breakpoint
CREATE TABLE "talent"."skills" (
	"skillId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."skills_skillId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"skillCode" text NOT NULL,
	"name" text NOT NULL,
	"category" "talent"."skill_category" NOT NULL,
	"description" text,
	"parentSkillId" integer,
	"status" "talent"."skill_status" DEFAULT 'ACTIVE'::"talent"."skill_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent"."certifications" (
	"certificationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."certifications_certificationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"certificationCode" text NOT NULL,
	"name" text NOT NULL,
	"issuingOrganization" text NOT NULL,
	"description" text,
	"validityMonths" smallint,
	"url" text,
	"status" "talent"."certification_status" DEFAULT 'ACTIVE'::"talent"."certification_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_certifications_validity" CHECK ("validityMonths" IS NULL OR "validityMonths" > 0)
);
--> statement-breakpoint
CREATE TABLE "talent"."competency_frameworks" (
	"frameworkId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."competency_frameworks_frameworkId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"frameworkCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"positionId" integer,
	"jobRoleId" integer,
	"status" "talent"."framework_status" DEFAULT 'DRAFT'::"talent"."framework_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent"."competency_skills" (
	"competencySkillId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."competency_skills_competencySkillId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"frameworkId" integer NOT NULL,
	"skillId" integer NOT NULL,
	"requiredLevel" smallint DEFAULT 3 NOT NULL,
	"isRequired" integer DEFAULT 1 NOT NULL,
	"weight" smallint DEFAULT 1,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	CONSTRAINT "chk_competency_skills_level" CHECK ("requiredLevel" >= 1 AND "requiredLevel" <= 5),
	CONSTRAINT "chk_competency_skills_weight" CHECK ("weight" IS NULL OR "weight" >= 1)
);
--> statement-breakpoint
CREATE TABLE "talent"."talent_pools" (
	"talentPoolId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."talent_pools_talentPoolId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"poolCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"criteria" text,
	"status" "talent"."pool_status" DEFAULT 'ACTIVE'::"talent"."pool_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent"."employee_skills" (
	"employeeSkillId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."employee_skills_employeeSkillId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"skillId" integer NOT NULL,
	"proficiencyLevel" "talent"."proficiency_level" NOT NULL,
	"yearsOfExperience" smallint,
	"lastAssessedDate" date,
	"assessedBy" integer,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_employee_skills_experience" CHECK ("yearsOfExperience" IS NULL OR "yearsOfExperience" >= 0)
);
--> statement-breakpoint
CREATE TABLE "talent"."performance_reviews" (
	"reviewId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."performance_reviews_reviewId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"reviewerId" integer NOT NULL,
	"reviewType" "talent"."review_type" NOT NULL,
	"reviewPeriodStart" date NOT NULL,
	"reviewPeriodEnd" date NOT NULL,
	"selfRating" smallint,
	"managerRating" smallint,
	"finalRating" smallint,
	"overallScore" numeric(3,2),
	"strengths" text,
	"areasForImprovement" text,
	"managerComments" text,
	"employeeComments" text,
	"status" "talent"."review_status" DEFAULT 'DRAFT'::"talent"."review_status" NOT NULL,
	"completedDate" date,
	"acknowledgedDate" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_performance_reviews_period" CHECK ("reviewPeriodEnd" >= "reviewPeriodStart"),
	CONSTRAINT "chk_performance_reviews_ratings" CHECK (("selfRating" IS NULL OR ("selfRating" >= 1 AND "selfRating" <= 5)) AND
          ("managerRating" IS NULL OR ("managerRating" >= 1 AND "managerRating" <= 5)) AND
          ("finalRating" IS NULL OR ("finalRating" >= 1 AND "finalRating" <= 5))),
	CONSTRAINT "chk_performance_reviews_score" CHECK ("overallScore" IS NULL OR ("overallScore" >= 0 AND "overallScore" <= 5))
);
--> statement-breakpoint
CREATE TABLE "talent"."performance_goals" (
	"goalId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."performance_goals_goalId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"goalType" "talent"."goal_type" DEFAULT 'INDIVIDUAL'::"talent"."goal_type" NOT NULL,
	"startDate" date NOT NULL,
	"targetDate" date NOT NULL,
	"completedDate" date,
	"weight" smallint DEFAULT 1,
	"targetValue" numeric(10,2),
	"actualValue" numeric(10,2),
	"progressPercent" smallint DEFAULT 0,
	"status" "talent"."goal_status" DEFAULT 'DRAFT'::"talent"."goal_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_performance_goals_dates" CHECK ("targetDate" >= "startDate"),
	CONSTRAINT "chk_performance_goals_progress" CHECK ("progressPercent" IS NULL OR ("progressPercent" >= 0 AND "progressPercent" <= 100)),
	CONSTRAINT "chk_performance_goals_weight" CHECK ("weight" IS NULL OR "weight" >= 1)
);
--> statement-breakpoint
CREATE TABLE "talent"."goal_tracking" (
	"trackingId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."goal_tracking_trackingId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"goalId" integer NOT NULL,
	"trackingDate" date NOT NULL,
	"progressPercent" smallint NOT NULL,
	"actualValue" numeric(10,2),
	"notes" text,
	"updatedBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_goal_tracking_progress" CHECK ("progressPercent" >= 0 AND "progressPercent" <= 100)
);
--> statement-breakpoint
CREATE TABLE "talent"."promotion_records" (
	"promotionRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."promotion_records_promotionRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"fromPositionId" integer,
	"toPositionId" integer,
	"fromGradeId" integer,
	"toGradeId" integer,
	"effectiveDate" date NOT NULL,
	"salaryIncrease" numeric(12,2),
	"salaryIncreasePercent" numeric(5,2),
	"currencyId" integer,
	"reason" text,
	"status" "talent"."promotion_status" DEFAULT 'PENDING'::"talent"."promotion_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_promotion_records_salary_increase" CHECK ("salaryIncrease" IS NULL OR "salaryIncrease" >= 0),
	CONSTRAINT "chk_promotion_records_salary_percent" CHECK ("salaryIncreasePercent" IS NULL OR "salaryIncreasePercent" >= 0)
);
--> statement-breakpoint
CREATE TABLE "talent"."succession_plans" (
	"successionPlanId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."succession_plans_successionPlanId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"positionId" integer NOT NULL,
	"incumbentId" integer,
	"successorId" integer NOT NULL,
	"readinessLevel" "talent"."readiness_level" NOT NULL,
	"priority" smallint DEFAULT 1 NOT NULL,
	"developmentPlan" text,
	"targetDate" date,
	"status" "talent"."succession_plan_status" DEFAULT 'DRAFT'::"talent"."succession_plan_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_succession_plans_priority" CHECK ("priority" >= 1 AND "priority" <= 10),
	CONSTRAINT "chk_succession_plans_different" CHECK ("incumbentId" IS NULL OR "incumbentId" != "successorId")
);
--> statement-breakpoint
CREATE TABLE "talent"."disciplinary_actions" (
	"disciplinaryActionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."disciplinary_actions_disciplinaryActionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"actionType" "talent"."disciplinary_type" NOT NULL,
	"incidentDate" date NOT NULL,
	"issueDate" date NOT NULL,
	"description" text NOT NULL,
	"policyViolated" text,
	"correctiveAction" text,
	"issuedBy" integer NOT NULL,
	"witnessId" integer,
	"employeeResponse" text,
	"acknowledgedDate" date,
	"expiryDate" date,
	"status" "talent"."disciplinary_status" DEFAULT 'DRAFT'::"talent"."disciplinary_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent"."grievance_records" (
	"grievanceRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."grievance_records_grievanceRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"grievanceType" "talent"."grievance_type" NOT NULL,
	"submissionDate" date NOT NULL,
	"incidentDate" date,
	"description" text NOT NULL,
	"againstEmployeeId" integer,
	"assignedTo" integer,
	"investigationNotes" text,
	"resolution" text,
	"resolvedBy" integer,
	"resolvedDate" date,
	"status" "talent"."grievance_status" DEFAULT 'SUBMITTED'::"talent"."grievance_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."courses" (
	"courseId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."courses_courseId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"courseCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"format" "learning"."course_format" DEFAULT 'CLASSROOM'::"learning"."course_format" NOT NULL,
	"durationHours" smallint,
	"maxParticipants" smallint,
	"cost" numeric(10,2),
	"currencyId" integer,
	"isMandatory" boolean DEFAULT false NOT NULL,
	"prerequisites" text,
	"objectives" text,
	"status" "learning"."course_status" DEFAULT 'DRAFT'::"learning"."course_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_courses_duration" CHECK ("durationHours" IS NULL OR "durationHours" > 0),
	CONSTRAINT "chk_courses_max_participants" CHECK ("maxParticipants" IS NULL OR "maxParticipants" > 0),
	CONSTRAINT "chk_courses_cost" CHECK ("cost" IS NULL OR "cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "learning"."course_modules" (
	"moduleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."course_modules_moduleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"courseId" integer NOT NULL,
	"moduleCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sequenceNumber" smallint NOT NULL,
	"durationMinutes" smallint,
	"contentUrl" text,
	"status" "learning"."module_status" DEFAULT 'DRAFT'::"learning"."module_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_course_modules_sequence" CHECK ("sequenceNumber" >= 1),
	CONSTRAINT "chk_course_modules_duration" CHECK ("durationMinutes" IS NULL OR "durationMinutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "learning"."trainers" (
	"trainerId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."trainers_trainerId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"trainerCode" text NOT NULL,
	"name" text NOT NULL,
	"trainerType" "learning"."trainer_type" DEFAULT 'INTERNAL'::"learning"."trainer_type" NOT NULL,
	"employeeId" integer,
	"email" text,
	"phone" text,
	"specializations" text,
	"bio" text,
	"status" "learning"."trainer_status" DEFAULT 'ACTIVE'::"learning"."trainer_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."learning_paths" (
	"learningPathId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."learning_paths_learningPathId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"pathCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"targetAudience" text,
	"estimatedHours" smallint,
	"status" "learning"."path_status" DEFAULT 'DRAFT'::"learning"."path_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_learning_paths_hours" CHECK ("estimatedHours" IS NULL OR "estimatedHours" > 0)
);
--> statement-breakpoint
CREATE TABLE "learning"."learning_path_courses" (
	"pathCourseId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."learning_path_courses_pathCourseId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"learningPathId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"sequenceNumber" smallint NOT NULL,
	"isRequired" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	CONSTRAINT "chk_learning_path_courses_sequence" CHECK ("sequenceNumber" >= 1)
);
--> statement-breakpoint
CREATE TABLE "learning"."training_sessions" (
	"sessionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."training_sessions_sessionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"sessionCode" text NOT NULL,
	"trainerId" integer,
	"locationId" integer,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"startTime" timestamp with time zone,
	"endTime" timestamp with time zone,
	"maxParticipants" smallint,
	"enrolledCount" smallint DEFAULT 0,
	"venue" text,
	"meetingUrl" text,
	"status" "learning"."session_status" DEFAULT 'SCHEDULED'::"learning"."session_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_training_sessions_dates" CHECK ("endDate" >= "startDate"),
	CONSTRAINT "chk_training_sessions_max_participants" CHECK ("maxParticipants" IS NULL OR "maxParticipants" > 0),
	CONSTRAINT "chk_training_sessions_enrolled" CHECK ("enrolledCount" IS NULL OR "enrolledCount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "learning"."training_enrollments" (
	"enrollmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."training_enrollments_enrollmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"sessionId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"enrollmentDate" date NOT NULL,
	"status" "learning"."training_enrollment_status" DEFAULT 'PENDING'::"learning"."training_enrollment_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"attendancePercent" smallint,
	"completionDate" date,
	"score" smallint,
	"feedback" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_training_enrollments_attendance" CHECK ("attendancePercent" IS NULL OR ("attendancePercent" >= 0 AND "attendancePercent" <= 100)),
	CONSTRAINT "chk_training_enrollments_score" CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100))
);
--> statement-breakpoint
CREATE TABLE "learning"."assessments" (
	"assessmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."assessments_assessmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"assessmentType" "learning"."assessment_type" NOT NULL,
	"assessmentDate" date NOT NULL,
	"startTime" timestamp with time zone,
	"endTime" timestamp with time zone,
	"maxScore" smallint DEFAULT 100 NOT NULL,
	"passingScore" smallint DEFAULT 60 NOT NULL,
	"actualScore" smallint,
	"passed" integer,
	"attempts" smallint DEFAULT 1,
	"notes" text,
	"status" "learning"."assessment_status" DEFAULT 'SCHEDULED'::"learning"."assessment_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_assessments_max_score" CHECK ("maxScore" > 0),
	CONSTRAINT "chk_assessments_passing_score" CHECK ("passingScore" > 0 AND "passingScore" <= "maxScore"),
	CONSTRAINT "chk_assessments_actual_score" CHECK ("actualScore" IS NULL OR ("actualScore" >= 0 AND "actualScore" <= "maxScore")),
	CONSTRAINT "chk_assessments_attempts" CHECK ("attempts" IS NULL OR "attempts" >= 1)
);
--> statement-breakpoint
CREATE TABLE "learning"."certification_awards" (
	"awardId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."certification_awards_awardId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"certificationId" integer NOT NULL,
	"awardDate" date NOT NULL,
	"expiryDate" date,
	"certificateNumber" text,
	"certificateUrl" text,
	"status" "learning"."award_status" DEFAULT 'ACTIVE'::"learning"."award_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_certification_awards_expiry" CHECK ("expiryDate" IS NULL OR "expiryDate" >= "awardDate")
);
--> statement-breakpoint
CREATE TABLE "learning"."training_feedback" (
	"feedbackId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."training_feedback_feedbackId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"overallRating" smallint NOT NULL,
	"contentRating" smallint,
	"trainerRating" smallint,
	"venueRating" smallint,
	"comments" text,
	"suggestions" text,
	"wouldRecommend" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	CONSTRAINT "chk_training_feedback_overall" CHECK ("overallRating" >= 1 AND "overallRating" <= 5),
	CONSTRAINT "chk_training_feedback_content" CHECK ("contentRating" IS NULL OR ("contentRating" >= 1 AND "contentRating" <= 5)),
	CONSTRAINT "chk_training_feedback_trainer" CHECK ("trainerRating" IS NULL OR ("trainerRating" >= 1 AND "trainerRating" <= 5)),
	CONSTRAINT "chk_training_feedback_venue" CHECK ("venueRating" IS NULL OR ("venueRating" >= 1 AND "venueRating" <= 5))
);
--> statement-breakpoint
CREATE TABLE "learning"."training_cost_records" (
	"costRecordId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."training_cost_records_costRecordId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"sessionId" integer NOT NULL,
	"costCategory" "learning"."cost_category" NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"costDate" date NOT NULL,
	"invoiceNumber" text,
	"vendorName" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_training_cost_records_amount" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "recruitment"."candidates" (
	"candidateId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."candidates_candidateId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"candidateCode" text NOT NULL,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"linkedinUrl" text,
	"resumePath" text,
	"source" "recruitment"."candidate_source" DEFAULT 'JOB_BOARD'::"recruitment"."candidate_source" NOT NULL,
	"referredBy" integer,
	"currentCompany" text,
	"currentTitle" text,
	"expectedSalary" text,
	"availableFrom" date,
	"personId" integer,
	"convertedEmployeeId" integer,
	"status" "recruitment"."candidate_status" DEFAULT 'NEW'::"recruitment"."candidate_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment"."job_requisitions" (
	"requisitionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."job_requisitions_requisitionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"requisitionCode" text NOT NULL,
	"title" text NOT NULL,
	"positionId" integer,
	"departmentId" integer,
	"requisitionType" "recruitment"."requisition_type" DEFAULT 'NEW_POSITION'::"recruitment"."requisition_type" NOT NULL,
	"headcount" smallint DEFAULT 1 NOT NULL,
	"hiringManagerId" integer,
	"minSalary" numeric(12,2),
	"maxSalary" numeric(12,2),
	"currencyId" integer,
	"targetStartDate" date,
	"closingDate" date,
	"jobDescription" text,
	"requirements" text,
	"status" "recruitment"."requisition_status" DEFAULT 'DRAFT'::"recruitment"."requisition_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_job_requisitions_headcount" CHECK ("headcount" >= 1),
	CONSTRAINT "chk_job_requisitions_salary_range" CHECK ("minSalary" IS NULL OR "maxSalary" IS NULL OR "minSalary" <= "maxSalary")
);
--> statement-breakpoint
CREATE TABLE "recruitment"."applications" (
	"applicationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."applications_applicationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"candidateId" integer NOT NULL,
	"requisitionId" integer NOT NULL,
	"applicationDate" date NOT NULL,
	"coverLetter" text,
	"resumeVersion" text,
	"status" "recruitment"."application_status" DEFAULT 'SUBMITTED'::"recruitment"."application_status" NOT NULL,
	"rejectionReason" text,
	"withdrawalReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment"."interviews" (
	"interviewId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."interviews_interviewId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"applicationId" integer NOT NULL,
	"interviewType" "recruitment"."interview_type" NOT NULL,
	"interviewerId" integer NOT NULL,
	"scheduledDate" date NOT NULL,
	"scheduledTime" timestamp with time zone,
	"durationMinutes" smallint DEFAULT 60,
	"location" text,
	"meetingUrl" text,
	"status" "recruitment"."interview_status" DEFAULT 'SCHEDULED'::"recruitment"."interview_status" NOT NULL,
	"result" "recruitment"."interview_result",
	"overallRating" smallint,
	"feedback" text,
	"strengths" text,
	"concerns" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_interviews_duration" CHECK ("durationMinutes" IS NULL OR "durationMinutes" > 0),
	CONSTRAINT "chk_interviews_rating" CHECK ("overallRating" IS NULL OR ("overallRating" >= 1 AND "overallRating" <= 5))
);
--> statement-breakpoint
CREATE TABLE "recruitment"."offer_letters" (
	"offerLetterId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."offer_letters_offerLetterId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"applicationId" integer NOT NULL,
	"offerCode" text NOT NULL,
	"positionId" integer,
	"baseSalary" numeric(12,2) NOT NULL,
	"currencyId" integer NOT NULL,
	"signingBonus" numeric(12,2),
	"startDate" date NOT NULL,
	"expiryDate" date NOT NULL,
	"benefits" text,
	"terms" text,
	"status" "recruitment"."offer_status" DEFAULT 'DRAFT'::"recruitment"."offer_status" NOT NULL,
	"approvedBy" integer,
	"approvedAt" date,
	"sentAt" date,
	"respondedAt" date,
	"declineReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_offer_letters_salary" CHECK ("baseSalary" > 0),
	CONSTRAINT "chk_offer_letters_bonus" CHECK ("signingBonus" IS NULL OR "signingBonus" >= 0),
	CONSTRAINT "chk_offer_letters_expiry" CHECK ("expiryDate" >= "startDate")
);
--> statement-breakpoint
CREATE TABLE "recruitment"."background_checks" (
	"backgroundCheckId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."background_checks_backgroundCheckId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"candidateId" integer NOT NULL,
	"checkType" "recruitment"."check_type" NOT NULL,
	"vendorName" text,
	"requestedDate" date NOT NULL,
	"completedDate" date,
	"status" "recruitment"."check_status" DEFAULT 'PENDING'::"recruitment"."check_status" NOT NULL,
	"result" "recruitment"."check_result",
	"findings" text,
	"documentPath" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment"."onboarding_checklists" (
	"checklistId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."onboarding_checklists_checklistId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"taskName" text NOT NULL,
	"taskCategory" "recruitment"."task_category" NOT NULL,
	"description" text,
	"assignedTo" integer,
	"dueDate" date,
	"completedDate" date,
	"sequenceNumber" smallint DEFAULT 1 NOT NULL,
	"status" "recruitment"."onboarding_task_status" DEFAULT 'PENDING'::"recruitment"."onboarding_task_status" NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_onboarding_checklists_sequence" CHECK ("sequenceNumber" >= 1)
);
--> statement-breakpoint
CREATE TABLE "recruitment"."probation_evaluations" (
	"evaluationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."probation_evaluations_evaluationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"evaluatorId" integer NOT NULL,
	"evaluationDate" date NOT NULL,
	"evaluationPeriodStart" date NOT NULL,
	"evaluationPeriodEnd" date NOT NULL,
	"performanceRating" smallint,
	"attendanceRating" smallint,
	"attitudeRating" smallint,
	"overallRating" smallint,
	"strengths" text,
	"areasForImprovement" text,
	"recommendations" text,
	"outcome" "recruitment"."evaluation_outcome",
	"extensionDays" smallint,
	"status" "recruitment"."evaluation_status" DEFAULT 'SCHEDULED'::"recruitment"."evaluation_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_probation_evaluations_period" CHECK ("evaluationPeriodEnd" >= "evaluationPeriodStart"),
	CONSTRAINT "chk_probation_evaluations_ratings" CHECK (("performanceRating" IS NULL OR ("performanceRating" >= 1 AND "performanceRating" <= 5)) AND
          ("attendanceRating" IS NULL OR ("attendanceRating" >= 1 AND "attendanceRating" <= 5)) AND
          ("attitudeRating" IS NULL OR ("attitudeRating" >= 1 AND "attitudeRating" <= 5)) AND
          ("overallRating" IS NULL OR ("overallRating" >= 1 AND "overallRating" <= 5))),
	CONSTRAINT "chk_probation_evaluations_extension" CHECK ("extensionDays" IS NULL OR "extensionDays" > 0)
);
--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" DROP CONSTRAINT "audit_trail_tenantId_tenants_tenantId_fkey";--> statement-breakpoint
ALTER TABLE "hr"."employees" DROP CONSTRAINT "employees_tenantId_tenants_tenantId_fkey";--> statement-breakpoint
DROP INDEX "audit"."idx_audit_trail_tenant_date";--> statement-breakpoint
DROP INDEX "audit"."idx_audit_trail_table";--> statement-breakpoint
DROP INDEX "hr"."uq_employees_email";--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "actorId" integer;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "actorType" "audit"."actor_type" DEFAULT 'USER'::"audit"."actor_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "schemaName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "occurredAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "recordedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "sourceIp" inet;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "sourceLocation" text;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "correlationId" uuid;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "requestId" uuid;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "rowKey" text;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "affectedColumns" text[];--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "targetActorId" integer;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "clientInfo" jsonb;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "sessionId" text;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD COLUMN "personId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD COLUMN "terminationDate" date;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD COLUMN "departmentId" integer;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD COLUMN "positionId" integer;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD COLUMN "managerId" integer;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD COLUMN "locationId" integer;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" DROP COLUMN "rowId";--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" DROP COLUMN "changedBy";--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" DROP COLUMN "changedAt";--> statement-breakpoint
ALTER TABLE "hr"."employees" DROP COLUMN "firstName";--> statement-breakpoint
ALTER TABLE "hr"."employees" DROP COLUMN "lastName";--> statement-breakpoint
ALTER TABLE "hr"."employees" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD PRIMARY KEY ("auditId");--> statement-breakpoint
ALTER TABLE "core"."locations" ALTER COLUMN "postalCode" SET DATA TYPE varchar(32) USING "postalCode"::varchar(32);--> statement-breakpoint
DROP INDEX "hr"."uq_employees_code";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_employees_code" ON "hr"."employees" ("tenantId",lower("employeeCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_currencies_code" ON "core"."currencies" (upper("currencyCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_currencies_status" ON "core"."currencies" ("status");--> statement-breakpoint
CREATE INDEX "idx_legal_entities_tenant" ON "core"."legal_entities" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_legal_entities_country" ON "core"."legal_entities" ("tenantId","country");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_legal_entities_code" ON "core"."legal_entities" ("tenantId",lower("legalEntityCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_legal_entities_tax_id" ON "core"."legal_entities" ("tenantId","taxId") WHERE "deletedAt" IS NULL AND "taxId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_cost_centers_tenant" ON "core"."cost_centers" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_cost_centers_legal_entity" ON "core"."cost_centers" ("tenantId","legalEntityId");--> statement-breakpoint
CREATE INDEX "idx_cost_centers_parent" ON "core"."cost_centers" ("tenantId","parentCostCenterId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cost_centers_code" ON "core"."cost_centers" ("tenantId",lower("costCenterCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_audit_tenant_occurred" ON "audit"."audit_trail" ("tenantId","occurredAt");--> statement-breakpoint
CREATE INDEX "idx_audit_actor" ON "audit"."audit_trail" ("tenantId","actorId","occurredAt");--> statement-breakpoint
CREATE INDEX "idx_audit_table" ON "audit"."audit_trail" ("schemaName","tableName","occurredAt");--> statement-breakpoint
CREATE INDEX "idx_audit_row_key" ON "audit"."audit_trail" ("tenantId","tableName","rowKey");--> statement-breakpoint
CREATE INDEX "idx_audit_correlation" ON "audit"."audit_trail" ("correlationId");--> statement-breakpoint
CREATE INDEX "idx_audit_request" ON "audit"."audit_trail" ("requestId");--> statement-breakpoint
CREATE INDEX "idx_audit_session" ON "audit"."audit_trail" ("tenantId","sessionId","occurredAt");--> statement-breakpoint
CREATE INDEX "idx_audit_tenant_table_op_date" ON "audit"."audit_trail" ("tenantId","tableName","operation","occurredAt");--> statement-breakpoint
CREATE INDEX "idx_audit_auth_ops" ON "audit"."audit_trail" ("tenantId","actorId","occurredAt") WHERE "operation" IN ('LOGIN', 'LOGOUT');--> statement-breakpoint
CREATE INDEX "idx_retention_exec_policy" ON "audit"."retention_executions" ("policyId","startedAt");--> statement-breakpoint
CREATE INDEX "idx_retention_exec_status" ON "audit"."retention_executions" ("status","startedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_retention_policy_scope" ON "audit"."retention_policies" (COALESCE("tenantId", 0),COALESCE("schemaName", ''),COALESCE("tableName", '')) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_retention_tenant" ON "audit"."retention_policies" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_retention_schema" ON "audit"."retention_policies" ("schemaName","tableName");--> statement-breakpoint
CREATE INDEX "idx_retention_status" ON "audit"."retention_policies" ("status");--> statement-breakpoint
CREATE INDEX "idx_persons_tenant" ON "hr"."persons" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_persons_status" ON "hr"."persons" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_persons_nationality" ON "hr"."persons" ("tenantId","nationality");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_persons_code" ON "hr"."persons" ("tenantId",lower("personCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_person_names_tenant" ON "hr"."person_names" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_person_names_person" ON "hr"."person_names" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_person_names_type" ON "hr"."person_names" ("tenantId","personId","nameType");--> statement-breakpoint
CREATE INDEX "idx_person_names_effective" ON "hr"."person_names" ("tenantId","personId","effectiveFrom");--> statement-breakpoint
CREATE INDEX "idx_contact_methods_tenant" ON "hr"."contact_methods" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_contact_methods_person" ON "hr"."contact_methods" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_contact_methods_type" ON "hr"."contact_methods" ("tenantId","personId","contactType");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contact_methods_primary" ON "hr"."contact_methods" ("tenantId","personId","contactType") WHERE "deletedAt" IS NULL AND "isPrimary" = true;--> statement-breakpoint
CREATE INDEX "idx_addresses_tenant" ON "hr"."addresses" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_addresses_person" ON "hr"."addresses" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_addresses_type" ON "hr"."addresses" ("tenantId","personId","addressType");--> statement-breakpoint
CREATE INDEX "idx_addresses_effective" ON "hr"."addresses" ("tenantId","personId","effectiveFrom");--> statement-breakpoint
CREATE INDEX "idx_national_identifiers_tenant" ON "hr"."national_identifiers" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_national_identifiers_person" ON "hr"."national_identifiers" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_national_identifiers_type" ON "hr"."national_identifiers" ("tenantId","personId","identifierType");--> statement-breakpoint
CREATE INDEX "idx_national_identifiers_expiry" ON "hr"."national_identifiers" ("tenantId","expiryDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_national_identifiers_value" ON "hr"."national_identifiers" ("tenantId","identifierType","issuingCountry","identifierValue") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_emergency_contacts_tenant" ON "hr"."emergency_contacts" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_emergency_contacts_person" ON "hr"."emergency_contacts" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_emergency_contacts_priority" ON "hr"."emergency_contacts" ("tenantId","personId","priority");--> statement-breakpoint
CREATE INDEX "idx_dependents_tenant" ON "hr"."dependents" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_dependents_person" ON "hr"."dependents" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_dependents_relationship" ON "hr"."dependents" ("tenantId","personId","relationship");--> statement-breakpoint
CREATE INDEX "idx_dependents_status" ON "hr"."dependents" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_person_documents_tenant" ON "hr"."person_documents" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_person_documents_person" ON "hr"."person_documents" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_person_documents_type" ON "hr"."person_documents" ("tenantId","personId","documentType");--> statement-breakpoint
CREATE INDEX "idx_person_documents_expiry" ON "hr"."person_documents" ("tenantId","expiryDate");--> statement-breakpoint
CREATE INDEX "idx_person_documents_status" ON "hr"."person_documents" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_employees_person" ON "hr"."employees" ("tenantId","personId");--> statement-breakpoint
CREATE INDEX "idx_employees_department" ON "hr"."employees" ("tenantId","departmentId");--> statement-breakpoint
CREATE INDEX "idx_employees_position" ON "hr"."employees" ("tenantId","positionId");--> statement-breakpoint
CREATE INDEX "idx_employees_manager" ON "hr"."employees" ("tenantId","managerId");--> statement-breakpoint
CREATE INDEX "idx_employees_location" ON "hr"."employees" ("tenantId","locationId");--> statement-breakpoint
CREATE INDEX "idx_employees_hire_date" ON "hr"."employees" ("tenantId","hireDate");--> statement-breakpoint
CREATE INDEX "idx_departments_tenant" ON "hr"."departments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_departments_organization" ON "hr"."departments" ("tenantId","organizationId");--> statement-breakpoint
CREATE INDEX "idx_departments_legal_entity" ON "hr"."departments" ("tenantId","legalEntityId");--> statement-breakpoint
CREATE INDEX "idx_departments_cost_center" ON "hr"."departments" ("tenantId","costCenterId");--> statement-breakpoint
CREATE INDEX "idx_departments_parent" ON "hr"."departments" ("tenantId","parentDepartmentId");--> statement-breakpoint
CREATE INDEX "idx_departments_head" ON "hr"."departments" ("tenantId","headEmployeeId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_departments_code" ON "hr"."departments" ("tenantId",lower("departmentCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_positions_tenant" ON "hr"."positions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_positions_department" ON "hr"."positions" ("tenantId","departmentId");--> statement-breakpoint
CREATE INDEX "idx_positions_job_role" ON "hr"."positions" ("tenantId","jobRoleId");--> statement-breakpoint
CREATE INDEX "idx_positions_job_grade" ON "hr"."positions" ("tenantId","jobGradeId");--> statement-breakpoint
CREATE INDEX "idx_positions_status" ON "hr"."positions" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_positions_code" ON "hr"."positions" ("tenantId",lower("positionCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_job_families_tenant" ON "hr"."job_families" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_job_families_status" ON "hr"."job_families" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_families_code" ON "hr"."job_families" ("tenantId",lower("familyCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_job_roles_tenant" ON "hr"."job_roles" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_job_roles_family" ON "hr"."job_roles" ("tenantId","jobFamilyId");--> statement-breakpoint
CREATE INDEX "idx_job_roles_status" ON "hr"."job_roles" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_roles_code" ON "hr"."job_roles" ("tenantId",lower("roleCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_job_grades_tenant" ON "hr"."job_grades" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_job_grades_level" ON "hr"."job_grades" ("tenantId","level");--> statement-breakpoint
CREATE INDEX "idx_job_grades_status" ON "hr"."job_grades" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_grades_code" ON "hr"."job_grades" ("tenantId",lower("gradeCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_grades_level" ON "hr"."job_grades" ("tenantId","level") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employment_contracts_tenant" ON "hr"."employment_contracts" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_employment_contracts_employee" ON "hr"."employment_contracts" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_employment_contracts_type" ON "hr"."employment_contracts" ("tenantId","contractType");--> statement-breakpoint
CREATE INDEX "idx_employment_contracts_status" ON "hr"."employment_contracts" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_employment_contracts_dates" ON "hr"."employment_contracts" ("tenantId","startDate","endDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_employment_contracts_code" ON "hr"."employment_contracts" ("tenantId",lower("contractCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employment_status_history_tenant" ON "hr"."employment_status_history" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_employment_status_history_employee" ON "hr"."employment_status_history" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_employment_status_history_date" ON "hr"."employment_status_history" ("tenantId","employeeId","effectiveDate");--> statement-breakpoint
CREATE INDEX "idx_employment_status_history_status" ON "hr"."employment_status_history" ("tenantId","newStatus");--> statement-breakpoint
CREATE INDEX "idx_probation_records_tenant" ON "hr"."probation_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_probation_records_employee" ON "hr"."probation_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_probation_records_outcome" ON "hr"."probation_records" ("tenantId","outcome");--> statement-breakpoint
CREATE INDEX "idx_probation_records_dates" ON "hr"."probation_records" ("tenantId","startDate","originalEndDate");--> statement-breakpoint
CREATE INDEX "idx_notice_period_records_tenant" ON "hr"."notice_period_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_notice_period_records_employee" ON "hr"."notice_period_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_notice_period_records_status" ON "hr"."notice_period_records" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_notice_period_records_dates" ON "hr"."notice_period_records" ("tenantId","noticeDate","expectedLastDay");--> statement-breakpoint
CREATE INDEX "idx_reporting_lines_tenant" ON "hr"."reporting_lines" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_reporting_lines_employee" ON "hr"."reporting_lines" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_reporting_lines_manager" ON "hr"."reporting_lines" ("tenantId","managerId");--> statement-breakpoint
CREATE INDEX "idx_reporting_lines_type" ON "hr"."reporting_lines" ("tenantId","reportType");--> statement-breakpoint
CREATE INDEX "idx_reporting_lines_effective" ON "hr"."reporting_lines" ("tenantId","employeeId","effectiveFrom");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reporting_lines_active" ON "hr"."reporting_lines" ("tenantId","employeeId","reportType") WHERE "deletedAt" IS NULL AND "effectiveTo" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employee_transfers_tenant" ON "hr"."employee_transfers" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_employee_transfers_employee" ON "hr"."employee_transfers" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_employee_transfers_status" ON "hr"."employee_transfers" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_employee_transfers_type" ON "hr"."employee_transfers" ("tenantId","transferType");--> statement-breakpoint
CREATE INDEX "idx_employee_transfers_effective" ON "hr"."employee_transfers" ("tenantId","effectiveDate");--> statement-breakpoint
CREATE INDEX "idx_secondments_tenant" ON "hr"."secondments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_secondments_employee" ON "hr"."secondments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_secondments_status" ON "hr"."secondments" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_secondments_dates" ON "hr"."secondments" ("tenantId","startDate","originalEndDate");--> statement-breakpoint
CREATE INDEX "idx_position_assignments_tenant" ON "hr"."position_assignments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_position_assignments_employee" ON "hr"."position_assignments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_position_assignments_position" ON "hr"."position_assignments" ("tenantId","positionId");--> statement-breakpoint
CREATE INDEX "idx_position_assignments_effective" ON "hr"."position_assignments" ("tenantId","employeeId","effectiveFrom");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_position_assignments_primary" ON "hr"."position_assignments" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "effectiveTo" IS NULL AND "isPrimary" = true;--> statement-breakpoint
CREATE INDEX "idx_work_schedules_tenant" ON "hr"."work_schedules" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_work_schedules_type" ON "hr"."work_schedules" ("tenantId","scheduleType");--> statement-breakpoint
CREATE INDEX "idx_work_schedules_status" ON "hr"."work_schedules" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_work_schedules_code" ON "hr"."work_schedules" ("tenantId",lower("scheduleCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_shift_assignments_tenant" ON "hr"."shift_assignments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_shift_assignments_employee" ON "hr"."shift_assignments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_shift_assignments_schedule" ON "hr"."shift_assignments" ("tenantId","scheduleId");--> statement-breakpoint
CREATE INDEX "idx_shift_assignments_effective" ON "hr"."shift_assignments" ("tenantId","employeeId","effectiveFrom");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_shift_assignments_active" ON "hr"."shift_assignments" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "effectiveTo" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_timesheets_tenant" ON "hr"."timesheets" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_timesheets_employee" ON "hr"."timesheets" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_timesheets_period" ON "hr"."timesheets" ("tenantId","periodStart","periodEnd");--> statement-breakpoint
CREATE INDEX "idx_timesheets_status" ON "hr"."timesheets" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_timesheets_employee_period" ON "hr"."timesheets" ("tenantId","employeeId","periodStart","periodEnd") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_overtime_records_tenant" ON "hr"."overtime_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_overtime_records_employee" ON "hr"."overtime_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_overtime_records_date" ON "hr"."overtime_records" ("tenantId","overtimeDate");--> statement-breakpoint
CREATE INDEX "idx_overtime_records_status" ON "hr"."overtime_records" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_overtime_records_type" ON "hr"."overtime_records" ("tenantId","overtimeType");--> statement-breakpoint
CREATE INDEX "idx_holiday_calendars_tenant" ON "hr"."holiday_calendars" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_holiday_calendars_region" ON "hr"."holiday_calendars" ("tenantId","regionId");--> statement-breakpoint
CREATE INDEX "idx_holiday_calendars_year" ON "hr"."holiday_calendars" ("tenantId","year");--> statement-breakpoint
CREATE INDEX "idx_holiday_calendars_status" ON "hr"."holiday_calendars" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_holiday_calendars_code" ON "hr"."holiday_calendars" ("tenantId",lower("calendarCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_holiday_calendars_region_year" ON "hr"."holiday_calendars" ("tenantId","regionId","year") WHERE "deletedAt" IS NULL AND "regionId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_holiday_calendar_entries_calendar" ON "hr"."holiday_calendar_entries" ("calendarId");--> statement-breakpoint
CREATE INDEX "idx_holiday_calendar_entries_date" ON "hr"."holiday_calendar_entries" ("calendarId","holidayDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_holiday_calendar_entries_date" ON "hr"."holiday_calendar_entries" ("calendarId","holidayDate") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_leave_types_tenant" ON "hr"."leave_types" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_leave_types_status" ON "hr"."leave_types" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_leave_types_code" ON "hr"."leave_types" ("tenantId",lower("leaveTypeCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_leave_balances_tenant" ON "hr"."leave_balances" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_leave_balances_employee" ON "hr"."leave_balances" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_leave_balances_type" ON "hr"."leave_balances" ("tenantId","leaveTypeId");--> statement-breakpoint
CREATE INDEX "idx_leave_balances_year" ON "hr"."leave_balances" ("tenantId","year");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_leave_balances_employee_type_year" ON "hr"."leave_balances" ("tenantId","employeeId","leaveTypeId","year") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_absence_records_tenant" ON "hr"."absence_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_absence_records_employee" ON "hr"."absence_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_absence_records_date" ON "hr"."absence_records" ("tenantId","absenceDate");--> statement-breakpoint
CREATE INDEX "idx_absence_records_type" ON "hr"."absence_records" ("tenantId","absenceType");--> statement-breakpoint
CREATE INDEX "idx_absence_records_status" ON "hr"."absence_records" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_shift_swaps_tenant" ON "hr"."shift_swaps" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_shift_swaps_requesting" ON "hr"."shift_swaps" ("tenantId","requestingEmployeeId");--> statement-breakpoint
CREATE INDEX "idx_shift_swaps_target" ON "hr"."shift_swaps" ("tenantId","targetEmployeeId");--> statement-breakpoint
CREATE INDEX "idx_shift_swaps_dates" ON "hr"."shift_swaps" ("tenantId","originalDate","swapDate");--> statement-breakpoint
CREATE INDEX "idx_shift_swaps_status" ON "hr"."shift_swaps" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_tenant" ON "hr"."attendance_logs" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_employee" ON "hr"."attendance_logs" ("tenantId","employeeId","attendanceDate");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_date" ON "hr"."attendance_logs" ("tenantId","attendanceDate");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_type" ON "hr"."attendance_logs" ("tenantId","attendanceType","attendanceDate");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_shift" ON "hr"."attendance_logs" ("tenantId","shiftAssignmentId");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_timesheet" ON "hr"."attendance_logs" ("tenantId","timesheetId");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_tenant" ON "hr"."leave_requests" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_employee" ON "hr"."leave_requests" ("tenantId","employeeId","startDate");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_type" ON "hr"."leave_requests" ("tenantId","leaveTypeId");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_balance" ON "hr"."leave_requests" ("tenantId","leaveBalanceId");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_status" ON "hr"."leave_requests" ("tenantId","status","startDate");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_approver" ON "hr"."leave_requests" ("tenantId","approvedBy");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_date_range" ON "hr"."leave_requests" ("tenantId","startDate","endDate");--> statement-breakpoint
CREATE INDEX "idx_service_requests_tenant" ON "hr"."service_requests" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_service_requests_employee" ON "hr"."service_requests" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_service_requests_category" ON "hr"."service_requests" ("tenantId","category");--> statement-breakpoint
CREATE INDEX "idx_service_requests_status" ON "hr"."service_requests" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_service_requests_priority" ON "hr"."service_requests" ("tenantId","priority");--> statement-breakpoint
CREATE INDEX "idx_service_requests_assigned" ON "hr"."service_requests" ("tenantId","assignedTo");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_service_requests_number" ON "hr"."service_requests" ("tenantId",lower("requestNumber")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_document_requests_tenant" ON "hr"."document_requests" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_document_requests_employee" ON "hr"."document_requests" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_document_requests_type" ON "hr"."document_requests" ("tenantId","documentType");--> statement-breakpoint
CREATE INDEX "idx_document_requests_status" ON "hr"."document_requests" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_requests_number" ON "hr"."document_requests" ("tenantId",lower("requestNumber")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employee_declarations_tenant" ON "hr"."employee_declarations" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_employee_declarations_employee" ON "hr"."employee_declarations" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_employee_declarations_type" ON "hr"."employee_declarations" ("tenantId","declarationType");--> statement-breakpoint
CREATE INDEX "idx_employee_declarations_year" ON "hr"."employee_declarations" ("tenantId","fiscalYear");--> statement-breakpoint
CREATE INDEX "idx_employee_declarations_status" ON "hr"."employee_declarations" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_employee_declarations_employee_type_year" ON "hr"."employee_declarations" ("tenantId","employeeId","declarationType","fiscalYear") WHERE "deletedAt" IS NULL AND "status" NOT IN ('REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE INDEX "idx_asset_assignments_tenant" ON "hr"."asset_assignments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_asset_assignments_employee" ON "hr"."asset_assignments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_asset_assignments_type" ON "hr"."asset_assignments" ("tenantId","assetType");--> statement-breakpoint
CREATE INDEX "idx_asset_assignments_status" ON "hr"."asset_assignments" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_asset_assignments_tag" ON "hr"."asset_assignments" ("tenantId",lower("assetTag")) WHERE "deletedAt" IS NULL AND "status" = 'ASSIGNED';--> statement-breakpoint
CREATE INDEX "idx_compensation_packages_tenant" ON "payroll"."compensation_packages" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_compensation_packages_employee" ON "payroll"."compensation_packages" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_compensation_packages_effective" ON "payroll"."compensation_packages" ("tenantId","employeeId","effectiveFrom");--> statement-breakpoint
CREATE INDEX "idx_compensation_packages_status" ON "payroll"."compensation_packages" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_compensation_packages_active" ON "payroll"."compensation_packages" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE' AND "effectiveTo" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pay_components_tenant" ON "payroll"."pay_components" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_pay_components_type" ON "payroll"."pay_components" ("tenantId","componentType");--> statement-breakpoint
CREATE INDEX "idx_pay_components_status" ON "payroll"."pay_components" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pay_components_code" ON "payroll"."pay_components" ("tenantId",lower("componentCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pay_grade_structures_tenant" ON "payroll"."pay_grade_structures" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_pay_grade_structures_structure" ON "payroll"."pay_grade_structures" ("tenantId","structureCode");--> statement-breakpoint
CREATE INDEX "idx_pay_grade_structures_grade" ON "payroll"."pay_grade_structures" ("tenantId","jobGradeId");--> statement-breakpoint
CREATE INDEX "idx_pay_grade_structures_effective" ON "payroll"."pay_grade_structures" ("tenantId","effectiveFrom","effectiveTo");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pay_grade_structures_row" ON "payroll"."pay_grade_structures" ("tenantId",lower("structureCode"),"jobGradeId","effectiveFrom") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_earnings_types_tenant" ON "payroll"."earnings_types" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_earnings_types_category" ON "payroll"."earnings_types" ("tenantId","category");--> statement-breakpoint
CREATE INDEX "idx_earnings_types_status" ON "payroll"."earnings_types" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_earnings_types_code" ON "payroll"."earnings_types" ("tenantId",lower("earningsCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_deduction_types_tenant" ON "payroll"."deduction_types" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_deduction_types_category" ON "payroll"."deduction_types" ("tenantId","category");--> statement-breakpoint
CREATE INDEX "idx_deduction_types_status" ON "payroll"."deduction_types" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_deduction_types_code" ON "payroll"."deduction_types" ("tenantId",lower("deductionCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_expense_types_tenant" ON "payroll"."expense_types" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_expense_types_category" ON "payroll"."expense_types" ("tenantId","category");--> statement-breakpoint
CREATE INDEX "idx_expense_types_status" ON "payroll"."expense_types" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_expense_types_code" ON "payroll"."expense_types" ("tenantId",lower("expenseCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_bank_accounts_tenant" ON "payroll"."bank_accounts" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_bank_accounts_employee" ON "payroll"."bank_accounts" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_bank_accounts_status" ON "payroll"."bank_accounts" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bank_accounts_primary" ON "payroll"."bank_accounts" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "isPrimary" = true AND "status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "idx_tax_profiles_tenant" ON "payroll"."tax_profiles" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_tax_profiles_employee" ON "payroll"."tax_profiles" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_tax_profiles_year" ON "payroll"."tax_profiles" ("tenantId","taxYear");--> statement-breakpoint
CREATE INDEX "idx_tax_profiles_status" ON "payroll"."tax_profiles" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tax_profiles_employee_year" ON "payroll"."tax_profiles" ("tenantId","employeeId","taxYear") WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "idx_social_insurance_profiles_tenant" ON "payroll"."social_insurance_profiles" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_social_insurance_profiles_employee" ON "payroll"."social_insurance_profiles" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_social_insurance_profiles_status" ON "payroll"."social_insurance_profiles" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_social_insurance_profiles_active" ON "payroll"."social_insurance_profiles" ("tenantId","employeeId","schemeName") WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE' AND "effectiveTo" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_payroll_periods_tenant" ON "payroll"."payroll_periods" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_payroll_periods_dates" ON "payroll"."payroll_periods" ("tenantId","periodStart","periodEnd");--> statement-breakpoint
CREATE INDEX "idx_payroll_periods_status" ON "payroll"."payroll_periods" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payroll_periods_code" ON "payroll"."payroll_periods" ("tenantId",lower("periodCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payroll_periods_dates" ON "payroll"."payroll_periods" ("tenantId","periodStart","periodEnd") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_tenant" ON "payroll"."payroll_runs" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_period" ON "payroll"."payroll_runs" ("tenantId","payrollPeriodId");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_date" ON "payroll"."payroll_runs" ("tenantId","runDate");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_status" ON "payroll"."payroll_runs" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payroll_runs_code" ON "payroll"."payroll_runs" ("tenantId",lower("runCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_tenant" ON "payroll"."payroll_entries" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_run" ON "payroll"."payroll_entries" ("tenantId","payrollRunId");--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_employee" ON "payroll"."payroll_entries" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_type" ON "payroll"."payroll_entries" ("tenantId","entryType");--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_component" ON "payroll"."payroll_entries" ("tenantId","payComponentId");--> statement-breakpoint
CREATE INDEX "idx_payslips_tenant" ON "payroll"."payslips" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_payslips_run" ON "payroll"."payslips" ("tenantId","payrollRunId");--> statement-breakpoint
CREATE INDEX "idx_payslips_employee" ON "payroll"."payslips" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_payslips_period" ON "payroll"."payslips" ("tenantId","periodStart","periodEnd");--> statement-breakpoint
CREATE INDEX "idx_payslips_status" ON "payroll"."payslips" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payslips_number" ON "payroll"."payslips" ("tenantId",lower("payslipNumber")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payslips_employee_run" ON "payroll"."payslips" ("tenantId","employeeId","payrollRunId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_payment_records_tenant" ON "payroll"."payment_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_payment_records_payslip" ON "payroll"."payment_records" ("tenantId","payslipId");--> statement-breakpoint
CREATE INDEX "idx_payment_records_bank_account" ON "payroll"."payment_records" ("tenantId","bankAccountId");--> statement-breakpoint
CREATE INDEX "idx_payment_records_date" ON "payroll"."payment_records" ("tenantId","paymentDate");--> statement-breakpoint
CREATE INDEX "idx_payment_records_status" ON "payroll"."payment_records" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payment_records_reference" ON "payroll"."payment_records" ("tenantId",lower("paymentReference")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_expense_claims_tenant" ON "payroll"."expense_claims" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_employee" ON "payroll"."expense_claims" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_type" ON "payroll"."expense_claims" ("tenantId","expenseTypeId");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_date" ON "payroll"."expense_claims" ("tenantId","expenseDate");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_status" ON "payroll"."expense_claims" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_expense_claims_number" ON "payroll"."expense_claims" ("tenantId",lower("claimNumber")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_loan_records_tenant" ON "payroll"."loan_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_loan_records_employee" ON "payroll"."loan_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_loan_records_type" ON "payroll"."loan_records" ("tenantId","loanType");--> statement-breakpoint
CREATE INDEX "idx_loan_records_status" ON "payroll"."loan_records" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_loan_records_dates" ON "payroll"."loan_records" ("tenantId","startDate","endDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_loan_records_number" ON "payroll"."loan_records" ("tenantId",lower("loanNumber")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_final_settlements_tenant" ON "payroll"."final_settlements" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_final_settlements_employee" ON "payroll"."final_settlements" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_final_settlements_status" ON "payroll"."final_settlements" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_final_settlements_date" ON "payroll"."final_settlements" ("tenantId","terminationDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_final_settlements_number" ON "payroll"."final_settlements" ("tenantId",lower("settlementNumber")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_final_settlements_employee" ON "payroll"."final_settlements" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "status" != 'CANCELLED';--> statement-breakpoint
CREATE INDEX "idx_benefit_plans_tenant" ON "benefits"."benefit_plans" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_benefit_plans_type" ON "benefits"."benefit_plans" ("tenantId","planType");--> statement-breakpoint
CREATE INDEX "idx_benefit_plans_provider" ON "benefits"."benefit_plans" ("tenantId","providerId");--> statement-breakpoint
CREATE INDEX "idx_benefit_plans_status" ON "benefits"."benefit_plans" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_benefit_plans_code" ON "benefits"."benefit_plans" ("tenantId",lower("planCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_benefits_providers_tenant" ON "benefits"."benefits_providers" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_benefits_providers_status" ON "benefits"."benefits_providers" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_benefits_providers_code" ON "benefits"."benefits_providers" ("tenantId",lower("providerCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_benefit_enrollments_tenant" ON "benefits"."benefit_enrollments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_benefit_enrollments_employee" ON "benefits"."benefit_enrollments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_benefit_enrollments_plan" ON "benefits"."benefit_enrollments" ("tenantId","benefitPlanId");--> statement-breakpoint
CREATE INDEX "idx_benefit_enrollments_status" ON "benefits"."benefit_enrollments" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_benefit_enrollments_effective" ON "benefits"."benefit_enrollments" ("tenantId","effectiveFrom","effectiveTo");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_benefit_enrollments_active" ON "benefits"."benefit_enrollments" ("tenantId","employeeId","benefitPlanId") WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE' AND "effectiveTo" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_dependent_coverages_tenant" ON "benefits"."dependent_coverages" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_dependent_coverages_enrollment" ON "benefits"."dependent_coverages" ("tenantId","enrollmentId");--> statement-breakpoint
CREATE INDEX "idx_dependent_coverages_dependent" ON "benefits"."dependent_coverages" ("tenantId","dependentId");--> statement-breakpoint
CREATE INDEX "idx_dependent_coverages_status" ON "benefits"."dependent_coverages" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_dependent_coverages_active" ON "benefits"."dependent_coverages" ("tenantId","enrollmentId","dependentId") WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE' AND "effectiveTo" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_claims_records_tenant" ON "benefits"."claims_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_claims_records_enrollment" ON "benefits"."claims_records" ("tenantId","enrollmentId");--> statement-breakpoint
CREATE INDEX "idx_claims_records_employee" ON "benefits"."claims_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_claims_records_date" ON "benefits"."claims_records" ("tenantId","claimDate");--> statement-breakpoint
CREATE INDEX "idx_claims_records_status" ON "benefits"."claims_records" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_claims_records_number" ON "benefits"."claims_records" ("tenantId",lower("claimNumber")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_skills_tenant" ON "talent"."skills" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_skills_category" ON "talent"."skills" ("tenantId","category");--> statement-breakpoint
CREATE INDEX "idx_skills_parent" ON "talent"."skills" ("tenantId","parentSkillId");--> statement-breakpoint
CREATE INDEX "idx_skills_status" ON "talent"."skills" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_skills_code" ON "talent"."skills" ("tenantId",lower("skillCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_certifications_tenant" ON "talent"."certifications" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_certifications_issuer" ON "talent"."certifications" ("tenantId","issuingOrganization");--> statement-breakpoint
CREATE INDEX "idx_certifications_status" ON "talent"."certifications" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_certifications_code" ON "talent"."certifications" ("tenantId",lower("certificationCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_competency_frameworks_tenant" ON "talent"."competency_frameworks" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_competency_frameworks_position" ON "talent"."competency_frameworks" ("tenantId","positionId");--> statement-breakpoint
CREATE INDEX "idx_competency_frameworks_role" ON "talent"."competency_frameworks" ("tenantId","jobRoleId");--> statement-breakpoint
CREATE INDEX "idx_competency_frameworks_status" ON "talent"."competency_frameworks" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_competency_frameworks_code" ON "talent"."competency_frameworks" ("tenantId",lower("frameworkCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_competency_skills_framework" ON "talent"."competency_skills" ("frameworkId");--> statement-breakpoint
CREATE INDEX "idx_competency_skills_skill" ON "talent"."competency_skills" ("skillId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_competency_skills_framework_skill" ON "talent"."competency_skills" ("frameworkId","skillId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_talent_pools_tenant" ON "talent"."talent_pools" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_talent_pools_status" ON "talent"."talent_pools" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_talent_pools_code" ON "talent"."talent_pools" ("tenantId",lower("poolCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employee_skills_tenant" ON "talent"."employee_skills" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_employee_skills_employee" ON "talent"."employee_skills" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_employee_skills_skill" ON "talent"."employee_skills" ("tenantId","skillId");--> statement-breakpoint
CREATE INDEX "idx_employee_skills_level" ON "talent"."employee_skills" ("tenantId","proficiencyLevel");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_employee_skills_employee_skill" ON "talent"."employee_skills" ("tenantId","employeeId","skillId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_tenant" ON "talent"."performance_reviews" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_employee" ON "talent"."performance_reviews" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_reviewer" ON "talent"."performance_reviews" ("tenantId","reviewerId");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_type" ON "talent"."performance_reviews" ("tenantId","reviewType");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_status" ON "talent"."performance_reviews" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_period" ON "talent"."performance_reviews" ("tenantId","reviewPeriodStart","reviewPeriodEnd");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_performance_reviews_employee_period" ON "talent"."performance_reviews" ("tenantId","employeeId","reviewType","reviewPeriodStart","reviewPeriodEnd") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_performance_goals_tenant" ON "talent"."performance_goals" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_performance_goals_employee" ON "talent"."performance_goals" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_performance_goals_type" ON "talent"."performance_goals" ("tenantId","goalType");--> statement-breakpoint
CREATE INDEX "idx_performance_goals_status" ON "talent"."performance_goals" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_performance_goals_dates" ON "talent"."performance_goals" ("tenantId","startDate","targetDate");--> statement-breakpoint
CREATE INDEX "idx_goal_tracking_goal" ON "talent"."goal_tracking" ("goalId");--> statement-breakpoint
CREATE INDEX "idx_goal_tracking_date" ON "talent"."goal_tracking" ("goalId","trackingDate");--> statement-breakpoint
CREATE INDEX "idx_promotion_records_tenant" ON "talent"."promotion_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_promotion_records_employee" ON "talent"."promotion_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_promotion_records_status" ON "talent"."promotion_records" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_promotion_records_date" ON "talent"."promotion_records" ("tenantId","effectiveDate");--> statement-breakpoint
CREATE INDEX "idx_succession_plans_tenant" ON "talent"."succession_plans" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_succession_plans_position" ON "talent"."succession_plans" ("tenantId","positionId");--> statement-breakpoint
CREATE INDEX "idx_succession_plans_incumbent" ON "talent"."succession_plans" ("tenantId","incumbentId");--> statement-breakpoint
CREATE INDEX "idx_succession_plans_successor" ON "talent"."succession_plans" ("tenantId","successorId");--> statement-breakpoint
CREATE INDEX "idx_succession_plans_readiness" ON "talent"."succession_plans" ("tenantId","readinessLevel");--> statement-breakpoint
CREATE INDEX "idx_succession_plans_status" ON "talent"."succession_plans" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_disciplinary_actions_tenant" ON "talent"."disciplinary_actions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_disciplinary_actions_employee" ON "talent"."disciplinary_actions" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_disciplinary_actions_type" ON "talent"."disciplinary_actions" ("tenantId","actionType");--> statement-breakpoint
CREATE INDEX "idx_disciplinary_actions_status" ON "talent"."disciplinary_actions" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_disciplinary_actions_date" ON "talent"."disciplinary_actions" ("tenantId","incidentDate");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_tenant" ON "talent"."grievance_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_employee" ON "talent"."grievance_records" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_type" ON "talent"."grievance_records" ("tenantId","grievanceType");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_status" ON "talent"."grievance_records" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_date" ON "talent"."grievance_records" ("tenantId","submissionDate");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_assigned" ON "talent"."grievance_records" ("tenantId","assignedTo");--> statement-breakpoint
CREATE INDEX "idx_courses_tenant" ON "learning"."courses" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_courses_format" ON "learning"."courses" ("tenantId","format");--> statement-breakpoint
CREATE INDEX "idx_courses_status" ON "learning"."courses" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_courses_mandatory" ON "learning"."courses" ("tenantId","isMandatory");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_courses_code" ON "learning"."courses" ("tenantId",lower("courseCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_course_modules_course" ON "learning"."course_modules" ("courseId");--> statement-breakpoint
CREATE INDEX "idx_course_modules_sequence" ON "learning"."course_modules" ("courseId","sequenceNumber");--> statement-breakpoint
CREATE INDEX "idx_course_modules_status" ON "learning"."course_modules" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_course_modules_code" ON "learning"."course_modules" ("courseId",lower("moduleCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_course_modules_sequence" ON "learning"."course_modules" ("courseId","sequenceNumber") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_trainers_tenant" ON "learning"."trainers" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_trainers_type" ON "learning"."trainers" ("tenantId","trainerType");--> statement-breakpoint
CREATE INDEX "idx_trainers_employee" ON "learning"."trainers" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_trainers_status" ON "learning"."trainers" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_trainers_code" ON "learning"."trainers" ("tenantId",lower("trainerCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_learning_paths_tenant" ON "learning"."learning_paths" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_learning_paths_status" ON "learning"."learning_paths" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_paths_code" ON "learning"."learning_paths" ("tenantId",lower("pathCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_learning_path_courses_path" ON "learning"."learning_path_courses" ("learningPathId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_courses_course" ON "learning"."learning_path_courses" ("courseId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_courses_sequence" ON "learning"."learning_path_courses" ("learningPathId","sequenceNumber");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_path_courses_path_course" ON "learning"."learning_path_courses" ("learningPathId","courseId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_path_courses_sequence" ON "learning"."learning_path_courses" ("learningPathId","sequenceNumber") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_training_sessions_tenant" ON "learning"."training_sessions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_course" ON "learning"."training_sessions" ("tenantId","courseId");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_trainer" ON "learning"."training_sessions" ("tenantId","trainerId");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_location" ON "learning"."training_sessions" ("tenantId","locationId");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_dates" ON "learning"."training_sessions" ("tenantId","startDate","endDate");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_status" ON "learning"."training_sessions" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_training_sessions_code" ON "learning"."training_sessions" ("tenantId",lower("sessionCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_training_enrollments_tenant" ON "learning"."training_enrollments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_training_enrollments_session" ON "learning"."training_enrollments" ("tenantId","sessionId");--> statement-breakpoint
CREATE INDEX "idx_training_enrollments_employee" ON "learning"."training_enrollments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_training_enrollments_status" ON "learning"."training_enrollments" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_training_enrollments_session_employee" ON "learning"."training_enrollments" ("tenantId","sessionId","employeeId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_assessments_tenant" ON "learning"."assessments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_assessments_course" ON "learning"."assessments" ("tenantId","courseId");--> statement-breakpoint
CREATE INDEX "idx_assessments_employee" ON "learning"."assessments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_assessments_type" ON "learning"."assessments" ("tenantId","assessmentType");--> statement-breakpoint
CREATE INDEX "idx_assessments_date" ON "learning"."assessments" ("tenantId","assessmentDate");--> statement-breakpoint
CREATE INDEX "idx_assessments_status" ON "learning"."assessments" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_certification_awards_tenant" ON "learning"."certification_awards" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_certification_awards_employee" ON "learning"."certification_awards" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_certification_awards_certification" ON "learning"."certification_awards" ("tenantId","certificationId");--> statement-breakpoint
CREATE INDEX "idx_certification_awards_status" ON "learning"."certification_awards" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_certification_awards_expiry" ON "learning"."certification_awards" ("tenantId","expiryDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_certification_awards_certificate" ON "learning"."certification_awards" ("tenantId","certificateNumber") WHERE "deletedAt" IS NULL AND "certificateNumber" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_training_feedback_session" ON "learning"."training_feedback" ("sessionId");--> statement-breakpoint
CREATE INDEX "idx_training_feedback_employee" ON "learning"."training_feedback" ("employeeId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_training_feedback_session_employee" ON "learning"."training_feedback" ("sessionId","employeeId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_training_cost_records_tenant" ON "learning"."training_cost_records" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_training_cost_records_session" ON "learning"."training_cost_records" ("tenantId","sessionId");--> statement-breakpoint
CREATE INDEX "idx_training_cost_records_category" ON "learning"."training_cost_records" ("tenantId","costCategory");--> statement-breakpoint
CREATE INDEX "idx_training_cost_records_date" ON "learning"."training_cost_records" ("tenantId","costDate");--> statement-breakpoint
CREATE INDEX "idx_candidates_tenant" ON "recruitment"."candidates" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_candidates_source" ON "recruitment"."candidates" ("tenantId","source");--> statement-breakpoint
CREATE INDEX "idx_candidates_status" ON "recruitment"."candidates" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_candidates_person" ON "recruitment"."candidates" ("tenantId","personId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_candidates_code" ON "recruitment"."candidates" ("tenantId",lower("candidateCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_candidates_email" ON "recruitment"."candidates" ("tenantId",lower("email")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_job_requisitions_tenant" ON "recruitment"."job_requisitions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_job_requisitions_position" ON "recruitment"."job_requisitions" ("tenantId","positionId");--> statement-breakpoint
CREATE INDEX "idx_job_requisitions_department" ON "recruitment"."job_requisitions" ("tenantId","departmentId");--> statement-breakpoint
CREATE INDEX "idx_job_requisitions_type" ON "recruitment"."job_requisitions" ("tenantId","requisitionType");--> statement-breakpoint
CREATE INDEX "idx_job_requisitions_status" ON "recruitment"."job_requisitions" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_job_requisitions_manager" ON "recruitment"."job_requisitions" ("tenantId","hiringManagerId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_requisitions_code" ON "recruitment"."job_requisitions" ("tenantId",lower("requisitionCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_applications_tenant" ON "recruitment"."applications" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_applications_candidate" ON "recruitment"."applications" ("tenantId","candidateId");--> statement-breakpoint
CREATE INDEX "idx_applications_requisition" ON "recruitment"."applications" ("tenantId","requisitionId");--> statement-breakpoint
CREATE INDEX "idx_applications_status" ON "recruitment"."applications" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_applications_date" ON "recruitment"."applications" ("tenantId","applicationDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_applications_candidate_requisition" ON "recruitment"."applications" ("tenantId","candidateId","requisitionId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_interviews_tenant" ON "recruitment"."interviews" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_interviews_application" ON "recruitment"."interviews" ("tenantId","applicationId");--> statement-breakpoint
CREATE INDEX "idx_interviews_interviewer" ON "recruitment"."interviews" ("tenantId","interviewerId");--> statement-breakpoint
CREATE INDEX "idx_interviews_type" ON "recruitment"."interviews" ("tenantId","interviewType");--> statement-breakpoint
CREATE INDEX "idx_interviews_status" ON "recruitment"."interviews" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_interviews_date" ON "recruitment"."interviews" ("tenantId","scheduledDate");--> statement-breakpoint
CREATE INDEX "idx_offer_letters_tenant" ON "recruitment"."offer_letters" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_offer_letters_application" ON "recruitment"."offer_letters" ("tenantId","applicationId");--> statement-breakpoint
CREATE INDEX "idx_offer_letters_position" ON "recruitment"."offer_letters" ("tenantId","positionId");--> statement-breakpoint
CREATE INDEX "idx_offer_letters_status" ON "recruitment"."offer_letters" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_offer_letters_code" ON "recruitment"."offer_letters" ("tenantId",lower("offerCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_background_checks_tenant" ON "recruitment"."background_checks" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_background_checks_candidate" ON "recruitment"."background_checks" ("tenantId","candidateId");--> statement-breakpoint
CREATE INDEX "idx_background_checks_type" ON "recruitment"."background_checks" ("tenantId","checkType");--> statement-breakpoint
CREATE INDEX "idx_background_checks_status" ON "recruitment"."background_checks" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_onboarding_checklists_tenant" ON "recruitment"."onboarding_checklists" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_onboarding_checklists_employee" ON "recruitment"."onboarding_checklists" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_onboarding_checklists_category" ON "recruitment"."onboarding_checklists" ("tenantId","taskCategory");--> statement-breakpoint
CREATE INDEX "idx_onboarding_checklists_status" ON "recruitment"."onboarding_checklists" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_onboarding_checklists_assigned" ON "recruitment"."onboarding_checklists" ("tenantId","assignedTo");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_onboarding_checklists_sequence" ON "recruitment"."onboarding_checklists" ("tenantId","employeeId","sequenceNumber") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_probation_evaluations_tenant" ON "recruitment"."probation_evaluations" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_probation_evaluations_employee" ON "recruitment"."probation_evaluations" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_probation_evaluations_evaluator" ON "recruitment"."probation_evaluations" ("tenantId","evaluatorId");--> statement-breakpoint
CREATE INDEX "idx_probation_evaluations_status" ON "recruitment"."probation_evaluations" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_probation_evaluations_date" ON "recruitment"."probation_evaluations" ("tenantId","evaluationDate");--> statement-breakpoint
ALTER TABLE "core"."legal_entities" ADD CONSTRAINT "fk_legal_entities_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."legal_entities" ADD CONSTRAINT "fk_legal_entities_currency" FOREIGN KEY ("defaultCurrencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."cost_centers" ADD CONSTRAINT "fk_cost_centers_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."cost_centers" ADD CONSTRAINT "fk_cost_centers_legal_entity" FOREIGN KEY ("legalEntityId") REFERENCES "core"."legal_entities"("legalEntityId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."cost_centers" ADD CONSTRAINT "fk_cost_centers_parent" FOREIGN KEY ("parentCostCenterId") REFERENCES "core"."cost_centers"("costCenterId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD CONSTRAINT "fk_audit_trail_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "audit"."retention_executions" ADD CONSTRAINT "fk_retention_exec_policy" FOREIGN KEY ("policyId") REFERENCES "audit"."retention_policies"("policyId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "audit"."retention_policies" ADD CONSTRAINT "fk_retention_policy_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."persons" ADD CONSTRAINT "fk_persons_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."person_names" ADD CONSTRAINT "fk_person_names_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."person_names" ADD CONSTRAINT "fk_person_names_person" FOREIGN KEY ("personId") REFERENCES "hr"."persons"("personId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."contact_methods" ADD CONSTRAINT "fk_contact_methods_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."contact_methods" ADD CONSTRAINT "fk_contact_methods_person" FOREIGN KEY ("personId") REFERENCES "hr"."persons"("personId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."addresses" ADD CONSTRAINT "fk_addresses_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."addresses" ADD CONSTRAINT "fk_addresses_person" FOREIGN KEY ("personId") REFERENCES "hr"."persons"("personId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."national_identifiers" ADD CONSTRAINT "fk_national_identifiers_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."national_identifiers" ADD CONSTRAINT "fk_national_identifiers_person" FOREIGN KEY ("personId") REFERENCES "hr"."persons"("personId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."emergency_contacts" ADD CONSTRAINT "fk_emergency_contacts_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."emergency_contacts" ADD CONSTRAINT "fk_emergency_contacts_person" FOREIGN KEY ("personId") REFERENCES "hr"."persons"("personId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."dependents" ADD CONSTRAINT "fk_dependents_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."dependents" ADD CONSTRAINT "fk_dependents_person" FOREIGN KEY ("personId") REFERENCES "hr"."persons"("personId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."person_documents" ADD CONSTRAINT "fk_person_documents_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."person_documents" ADD CONSTRAINT "fk_person_documents_person" FOREIGN KEY ("personId") REFERENCES "hr"."persons"("personId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD CONSTRAINT "fk_employees_manager" FOREIGN KEY ("managerId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD CONSTRAINT "fk_employees_location" FOREIGN KEY ("locationId") REFERENCES "core"."locations"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."departments" ADD CONSTRAINT "fk_departments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."departments" ADD CONSTRAINT "fk_departments_organization" FOREIGN KEY ("organizationId") REFERENCES "core"."organizations"("organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."departments" ADD CONSTRAINT "fk_departments_legal_entity" FOREIGN KEY ("legalEntityId") REFERENCES "core"."legal_entities"("legalEntityId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."departments" ADD CONSTRAINT "fk_departments_cost_center" FOREIGN KEY ("costCenterId") REFERENCES "core"."cost_centers"("costCenterId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."departments" ADD CONSTRAINT "fk_departments_parent" FOREIGN KEY ("parentDepartmentId") REFERENCES "hr"."departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."positions" ADD CONSTRAINT "fk_positions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."job_families" ADD CONSTRAINT "fk_job_families_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."job_roles" ADD CONSTRAINT "fk_job_roles_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."job_roles" ADD CONSTRAINT "fk_job_roles_family" FOREIGN KEY ("jobFamilyId") REFERENCES "hr"."job_families"("jobFamilyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."job_grades" ADD CONSTRAINT "fk_job_grades_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."job_grades" ADD CONSTRAINT "fk_job_grades_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."employment_contracts" ADD CONSTRAINT "fk_employment_contracts_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."employment_status_history" ADD CONSTRAINT "fk_employment_status_history_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."probation_records" ADD CONSTRAINT "fk_probation_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."notice_period_records" ADD CONSTRAINT "fk_notice_period_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."reporting_lines" ADD CONSTRAINT "fk_reporting_lines_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."employee_transfers" ADD CONSTRAINT "fk_employee_transfers_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."secondments" ADD CONSTRAINT "fk_secondments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."position_assignments" ADD CONSTRAINT "fk_position_assignments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."work_schedules" ADD CONSTRAINT "fk_work_schedules_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."shift_assignments" ADD CONSTRAINT "fk_shift_assignments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."shift_assignments" ADD CONSTRAINT "fk_shift_assignments_schedule" FOREIGN KEY ("scheduleId") REFERENCES "hr"."work_schedules"("scheduleId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."timesheets" ADD CONSTRAINT "fk_timesheets_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."overtime_records" ADD CONSTRAINT "fk_overtime_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."holiday_calendars" ADD CONSTRAINT "fk_holiday_calendars_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."holiday_calendars" ADD CONSTRAINT "fk_holiday_calendars_region" FOREIGN KEY ("regionId") REFERENCES "core"."regions"("regionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."holiday_calendar_entries" ADD CONSTRAINT "fk_holiday_calendar_entries_calendar" FOREIGN KEY ("calendarId") REFERENCES "hr"."holiday_calendars"("calendarId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."leave_types" ADD CONSTRAINT "fk_leave_types_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."leave_balances" ADD CONSTRAINT "fk_leave_balances_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."leave_balances" ADD CONSTRAINT "fk_leave_balances_leave_type" FOREIGN KEY ("leaveTypeId") REFERENCES "hr"."leave_types"("leaveTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."absence_records" ADD CONSTRAINT "fk_absence_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."shift_swaps" ADD CONSTRAINT "fk_shift_swaps_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."attendance_logs" ADD CONSTRAINT "fk_attendance_logs_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."attendance_logs" ADD CONSTRAINT "fk_attendance_logs_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."leave_requests" ADD CONSTRAINT "fk_leave_requests_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."leave_requests" ADD CONSTRAINT "fk_leave_requests_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."leave_requests" ADD CONSTRAINT "fk_leave_requests_approver" FOREIGN KEY ("approvedBy") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."service_requests" ADD CONSTRAINT "fk_service_requests_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."document_requests" ADD CONSTRAINT "fk_document_requests_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."employee_declarations" ADD CONSTRAINT "fk_employee_declarations_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."asset_assignments" ADD CONSTRAINT "fk_asset_assignments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."compensation_packages" ADD CONSTRAINT "fk_compensation_packages_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."compensation_packages" ADD CONSTRAINT "fk_compensation_packages_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."pay_components" ADD CONSTRAINT "fk_pay_components_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."pay_grade_structures" ADD CONSTRAINT "fk_pay_grade_structures_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."pay_grade_structures" ADD CONSTRAINT "fk_pay_grade_structures_job_grade" FOREIGN KEY ("jobGradeId") REFERENCES "hr"."job_grades"("jobGradeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."pay_grade_structures" ADD CONSTRAINT "fk_pay_grade_structures_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."earnings_types" ADD CONSTRAINT "fk_earnings_types_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."deduction_types" ADD CONSTRAINT "fk_deduction_types_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."expense_types" ADD CONSTRAINT "fk_expense_types_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."bank_accounts" ADD CONSTRAINT "fk_bank_accounts_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."bank_accounts" ADD CONSTRAINT "fk_bank_accounts_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."tax_profiles" ADD CONSTRAINT "fk_tax_profiles_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."social_insurance_profiles" ADD CONSTRAINT "fk_social_insurance_profiles_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_periods" ADD CONSTRAINT "fk_payroll_periods_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_runs" ADD CONSTRAINT "fk_payroll_runs_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_runs" ADD CONSTRAINT "fk_payroll_runs_period" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll"."payroll_periods"("payrollPeriodId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_runs" ADD CONSTRAINT "fk_payroll_runs_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_entries" ADD CONSTRAINT "fk_payroll_entries_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_entries" ADD CONSTRAINT "fk_payroll_entries_run" FOREIGN KEY ("payrollRunId") REFERENCES "payroll"."payroll_runs"("payrollRunId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_entries" ADD CONSTRAINT "fk_payroll_entries_component" FOREIGN KEY ("payComponentId") REFERENCES "payroll"."pay_components"("payComponentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payslips" ADD CONSTRAINT "fk_payslips_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payslips" ADD CONSTRAINT "fk_payslips_run" FOREIGN KEY ("payrollRunId") REFERENCES "payroll"."payroll_runs"("payrollRunId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payslips" ADD CONSTRAINT "fk_payslips_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payment_records" ADD CONSTRAINT "fk_payment_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payment_records" ADD CONSTRAINT "fk_payment_records_payslip" FOREIGN KEY ("payslipId") REFERENCES "payroll"."payslips"("payslipId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payment_records" ADD CONSTRAINT "fk_payment_records_bank_account" FOREIGN KEY ("bankAccountId") REFERENCES "payroll"."bank_accounts"("bankAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payment_records" ADD CONSTRAINT "fk_payment_records_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."expense_claims" ADD CONSTRAINT "fk_expense_claims_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."expense_claims" ADD CONSTRAINT "fk_expense_claims_type" FOREIGN KEY ("expenseTypeId") REFERENCES "payroll"."expense_types"("expenseTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."expense_claims" ADD CONSTRAINT "fk_expense_claims_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."loan_records" ADD CONSTRAINT "fk_loan_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."loan_records" ADD CONSTRAINT "fk_loan_records_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."final_settlements" ADD CONSTRAINT "fk_final_settlements_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."final_settlements" ADD CONSTRAINT "fk_final_settlements_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_plans" ADD CONSTRAINT "fk_benefit_plans_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_plans" ADD CONSTRAINT "fk_benefit_plans_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefits_providers" ADD CONSTRAINT "fk_benefits_providers_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_enrollments" ADD CONSTRAINT "fk_benefit_enrollments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_enrollments" ADD CONSTRAINT "fk_benefit_enrollments_plan" FOREIGN KEY ("benefitPlanId") REFERENCES "benefits"."benefit_plans"("benefitPlanId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."dependent_coverages" ADD CONSTRAINT "fk_dependent_coverages_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."dependent_coverages" ADD CONSTRAINT "fk_dependent_coverages_enrollment" FOREIGN KEY ("enrollmentId") REFERENCES "benefits"."benefit_enrollments"("enrollmentId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."claims_records" ADD CONSTRAINT "fk_claims_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."claims_records" ADD CONSTRAINT "fk_claims_records_enrollment" FOREIGN KEY ("enrollmentId") REFERENCES "benefits"."benefit_enrollments"("enrollmentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."claims_records" ADD CONSTRAINT "fk_claims_records_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."skills" ADD CONSTRAINT "fk_skills_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."skills" ADD CONSTRAINT "fk_skills_parent" FOREIGN KEY ("parentSkillId") REFERENCES "talent"."skills"("skillId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."certifications" ADD CONSTRAINT "fk_certifications_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."competency_frameworks" ADD CONSTRAINT "fk_competency_frameworks_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" ADD CONSTRAINT "fk_competency_skills_framework" FOREIGN KEY ("frameworkId") REFERENCES "talent"."competency_frameworks"("frameworkId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" ADD CONSTRAINT "fk_competency_skills_skill" FOREIGN KEY ("skillId") REFERENCES "talent"."skills"("skillId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."talent_pools" ADD CONSTRAINT "fk_talent_pools_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."employee_skills" ADD CONSTRAINT "fk_employee_skills_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."employee_skills" ADD CONSTRAINT "fk_employee_skills_skill" FOREIGN KEY ("skillId") REFERENCES "talent"."skills"("skillId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."performance_reviews" ADD CONSTRAINT "fk_performance_reviews_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."performance_goals" ADD CONSTRAINT "fk_performance_goals_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."goal_tracking" ADD CONSTRAINT "fk_goal_tracking_goal" FOREIGN KEY ("goalId") REFERENCES "talent"."performance_goals"("goalId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."promotion_records" ADD CONSTRAINT "fk_promotion_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."promotion_records" ADD CONSTRAINT "fk_promotion_records_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."succession_plans" ADD CONSTRAINT "fk_succession_plans_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."disciplinary_actions" ADD CONSTRAINT "fk_disciplinary_actions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."grievance_records" ADD CONSTRAINT "fk_grievance_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."courses" ADD CONSTRAINT "fk_courses_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."courses" ADD CONSTRAINT "fk_courses_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."course_modules" ADD CONSTRAINT "fk_course_modules_course" FOREIGN KEY ("courseId") REFERENCES "learning"."courses"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."trainers" ADD CONSTRAINT "fk_trainers_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_paths" ADD CONSTRAINT "fk_learning_paths_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_courses" ADD CONSTRAINT "fk_learning_path_courses_path" FOREIGN KEY ("learningPathId") REFERENCES "learning"."learning_paths"("learningPathId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_courses" ADD CONSTRAINT "fk_learning_path_courses_course" FOREIGN KEY ("courseId") REFERENCES "learning"."courses"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_sessions" ADD CONSTRAINT "fk_training_sessions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_sessions" ADD CONSTRAINT "fk_training_sessions_course" FOREIGN KEY ("courseId") REFERENCES "learning"."courses"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_sessions" ADD CONSTRAINT "fk_training_sessions_trainer" FOREIGN KEY ("trainerId") REFERENCES "learning"."trainers"("trainerId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_sessions" ADD CONSTRAINT "fk_training_sessions_location" FOREIGN KEY ("locationId") REFERENCES "core"."locations"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_enrollments" ADD CONSTRAINT "fk_training_enrollments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_enrollments" ADD CONSTRAINT "fk_training_enrollments_session" FOREIGN KEY ("sessionId") REFERENCES "learning"."training_sessions"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."assessments" ADD CONSTRAINT "fk_assessments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."assessments" ADD CONSTRAINT "fk_assessments_course" FOREIGN KEY ("courseId") REFERENCES "learning"."courses"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."certification_awards" ADD CONSTRAINT "fk_certification_awards_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_feedback" ADD CONSTRAINT "fk_training_feedback_session" FOREIGN KEY ("sessionId") REFERENCES "learning"."training_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_cost_records" ADD CONSTRAINT "fk_training_cost_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_cost_records" ADD CONSTRAINT "fk_training_cost_records_session" FOREIGN KEY ("sessionId") REFERENCES "learning"."training_sessions"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_cost_records" ADD CONSTRAINT "fk_training_cost_records_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."candidates" ADD CONSTRAINT "fk_candidates_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."job_requisitions" ADD CONSTRAINT "fk_job_requisitions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."job_requisitions" ADD CONSTRAINT "fk_job_requisitions_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."applications" ADD CONSTRAINT "fk_applications_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."applications" ADD CONSTRAINT "fk_applications_candidate" FOREIGN KEY ("candidateId") REFERENCES "recruitment"."candidates"("candidateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."applications" ADD CONSTRAINT "fk_applications_requisition" FOREIGN KEY ("requisitionId") REFERENCES "recruitment"."job_requisitions"("requisitionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interviews" ADD CONSTRAINT "fk_interviews_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interviews" ADD CONSTRAINT "fk_interviews_application" FOREIGN KEY ("applicationId") REFERENCES "recruitment"."applications"("applicationId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."offer_letters" ADD CONSTRAINT "fk_offer_letters_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."offer_letters" ADD CONSTRAINT "fk_offer_letters_application" FOREIGN KEY ("applicationId") REFERENCES "recruitment"."applications"("applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."offer_letters" ADD CONSTRAINT "fk_offer_letters_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."background_checks" ADD CONSTRAINT "fk_background_checks_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."background_checks" ADD CONSTRAINT "fk_background_checks_candidate" FOREIGN KEY ("candidateId") REFERENCES "recruitment"."candidates"("candidateId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."onboarding_checklists" ADD CONSTRAINT "fk_onboarding_checklists_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."probation_evaluations" ADD CONSTRAINT "fk_probation_evaluations_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."employees" DROP CONSTRAINT "fk_employees_tenant", ADD CONSTRAINT "fk_employees_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD CONSTRAINT "chk_audit_data_ops_have_table" CHECK ("operation" NOT IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') OR "tableName" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD CONSTRAINT "chk_audit_update_has_columns" CHECK ("operation" != 'UPDATE' OR "affectedColumns" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD CONSTRAINT "chk_audit_source_location_format" CHECK ("sourceLocation" IS NULL OR "sourceLocation" ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$');--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD CONSTRAINT "chk_employees_hire_date" CHECK ("hireDate" >= '1900-01-01');--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD CONSTRAINT "chk_employees_termination_after_hire" CHECK ("terminationDate" IS NULL OR "terminationDate" >= "hireDate");--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD CONSTRAINT "chk_employees_terminated_status" CHECK ("status" != 'TERMINATED' OR "terminationDate" IS NOT NULL);--> statement-breakpoint
CREATE MATERIALIZED VIEW "audit"."mv_actor_activity" AS (
    SELECT
      "audit"."audit_trail"."tenantId" AS tenant_id,
      "audit"."audit_trail"."actorId" AS actor_id,
      "audit"."audit_trail"."actorType" AS actor_type,
      date_trunc('day', "audit"."audit_trail"."occurredAt") AS summary_date,
      count(*)::bigint AS total_actions,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" = 'INSERT')::bigint AS insert_count,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" = 'UPDATE')::bigint AS update_count,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" = 'DELETE')::bigint AS delete_count,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" = 'LOGIN')::bigint AS login_count,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" = 'LOGOUT')::bigint AS logout_count,
      count(DISTINCT "audit"."audit_trail"."tableName")::bigint AS tables_accessed,
      count(DISTINCT "audit"."audit_trail"."sessionId")::bigint AS unique_sessions,
      count(DISTINCT "audit"."audit_trail"."sourceIp")::bigint AS unique_ips,
      min("audit"."audit_trail"."occurredAt") AS first_activity,
      max("audit"."audit_trail"."occurredAt") AS last_activity
    FROM "audit"."audit_trail"
    GROUP BY
      "audit"."audit_trail"."tenantId",
      "audit"."audit_trail"."actorId",
      "audit"."audit_trail"."actorType",
      date_trunc('day', "audit"."audit_trail"."occurredAt")
  );--> statement-breakpoint
CREATE MATERIALIZED VIEW "audit"."mv_audit_summary" AS (
    SELECT
      "audit"."audit_trail"."tenantId" AS tenant_id,
      "audit"."audit_trail"."schemaName" AS schema_name,
      "audit"."audit_trail"."tableName" AS table_name,
      "audit"."audit_trail"."operation" AS operation,
      "audit"."audit_trail"."actorType" AS actor_type,
      date_trunc('day', "audit"."audit_trail"."occurredAt") AS summary_date,
      count(*)::bigint AS event_count,
      count(DISTINCT "audit"."audit_trail"."actorId")::bigint AS unique_actors,
      count(DISTINCT "audit"."audit_trail"."rowKey")::bigint AS unique_rows,
      min("audit"."audit_trail"."occurredAt") AS first_occurred_at,
      max("audit"."audit_trail"."occurredAt") AS last_occurred_at
    FROM "audit"."audit_trail"
    GROUP BY
      "audit"."audit_trail"."tenantId",
      "audit"."audit_trail"."schemaName",
      "audit"."audit_trail"."tableName",
      "audit"."audit_trail"."operation",
      "audit"."audit_trail"."actorType",
      date_trunc('day', "audit"."audit_trail"."occurredAt")
  );--> statement-breakpoint
CREATE MATERIALIZED VIEW "audit"."mv_tenant_audit_overview" AS (
    SELECT
      "audit"."audit_trail"."tenantId" AS tenant_id,
      date_trunc('month', "audit"."audit_trail"."occurredAt") AS summary_month,
      count(*)::bigint AS total_events,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'))::bigint AS data_operations,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" IN ('LOGIN', 'LOGOUT', 'ACCESS', 'EXPORT'))::bigint AS access_operations,
      count(*) FILTER (WHERE "audit"."audit_trail"."operation" IN ('GRANT', 'REVOKE', 'CONFIG_CHANGE'))::bigint AS admin_operations,
      count(DISTINCT "audit"."audit_trail"."actorId") FILTER (WHERE "audit"."audit_trail"."actorType" = 'USER')::bigint AS active_users,
      count(DISTINCT "audit"."audit_trail"."actorId") FILTER (WHERE "audit"."audit_trail"."actorType" = 'SERVICE_PRINCIPAL')::bigint AS active_service_principals,
      count(*) FILTER (WHERE "audit"."audit_trail"."actorType" = 'SYSTEM')::bigint AS system_events,
      count(DISTINCT "audit"."audit_trail"."tableName")::bigint AS tables_audited,
      count(DISTINCT "audit"."audit_trail"."schemaName")::bigint AS schemas_audited
    FROM "audit"."audit_trail"
    GROUP BY
      "audit"."audit_trail"."tenantId",
      date_trunc('month', "audit"."audit_trail"."occurredAt")
  );