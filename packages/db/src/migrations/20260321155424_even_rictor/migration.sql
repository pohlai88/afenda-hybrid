CREATE TYPE "core"."audience_type" AS ENUM('ALL', 'DEPARTMENT', 'LOCATION', 'ROLE', 'INDIVIDUAL');--> statement-breakpoint
CREATE TYPE "core"."announcement_status" AS ENUM('DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "core"."email_log_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'BOUNCED');--> statement-breakpoint
CREATE TYPE "core"."letter_instance_status" AS ENUM('DRAFT', 'GENERATED', 'SENT', 'ACKNOWLEDGED');--> statement-breakpoint
CREATE TYPE "core"."letter_type" AS ENUM('APPOINTMENT', 'CONFIRMATION', 'PROMOTION', 'TRANSFER', 'WARNING', 'TERMINATION', 'EXPERIENCE', 'SALARY_REVISION', 'OTHER');--> statement-breakpoint
CREATE TYPE "core"."notification_channel_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "core"."notification_delivery_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');--> statement-breakpoint
CREATE TYPE "core"."notification_status" AS ENUM('PENDING', 'SENT', 'READ', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "core"."notification_channel" AS ENUM('EMAIL', 'IN_APP', 'SMS', 'PUSH', 'WEBHOOK');--> statement-breakpoint
CREATE TYPE "core"."workflow_definition_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "core"."workflow_instance_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'TIMED_OUT');--> statement-breakpoint
CREATE TYPE "core"."workflow_rule_operator" AS ENUM('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'IN');--> statement-breakpoint
CREATE TYPE "hr"."attendance_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "hr"."compensatory_leave_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "payroll"."gratuity_rule_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."tax_slab_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."salary_structure_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."tax_exemption_category_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "payroll"."gratuity_settlement_status" AS ENUM('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "payroll"."payroll_correction_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'APPLIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "payroll"."retention_bonus_status" AS ENUM('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "payroll"."salary_withholding_status" AS ENUM('ACTIVE', 'RELEASED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "payroll"."tax_declaration_status" AS ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "benefits"."benefit_application_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "benefits"."benefit_ledger_entry_type" AS ENUM('ALLOCATION', 'CLAIM', 'ADJUSTMENT', 'FORFEITURE');--> statement-breakpoint
CREATE TYPE "talent"."appraisal_cycle_status" AS ENUM('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "talent"."appraisal_status" AS ENUM('DRAFT', 'SELF_REVIEW', 'MANAGER_REVIEW', 'CALIBRATION', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "talent"."appraisal_template_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "recruitment"."interview_recommendation" AS ENUM('STRONG_HIRE', 'HIRE', 'NEUTRAL', 'NO_HIRE', 'STRONG_NO_HIRE');--> statement-breakpoint
CREATE TYPE "recruitment"."round_interview_type" AS ENUM('PHONE', 'VIDEO', 'IN_PERSON', 'TECHNICAL', 'BEHAVIORAL', 'PANEL', 'CASE_STUDY');--> statement-breakpoint
CREATE TYPE "recruitment"."interview_schedule_status" AS ENUM('SCHEDULED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "recruitment"."staffing_plan_status" AS ENUM('DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TABLE "core"."announcement_audiences" (
	"audienceId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."announcement_audiences_audienceId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"announcementId" integer NOT NULL,
	"audienceType" "core"."audience_type" NOT NULL,
	"audienceRefId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."announcement_posts" (
	"announcementId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."announcement_posts_announcementId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"publishedAt" timestamp with time zone,
	"expiresAt" timestamp with time zone,
	"status" "core"."announcement_status" DEFAULT 'DRAFT'::"core"."announcement_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."email_logs" (
	"logId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."email_logs_logId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"recipientEmail" text NOT NULL,
	"templateId" integer,
	"subject" text NOT NULL,
	"sentAt" timestamp with time zone,
	"failureReason" text,
	"status" "core"."email_log_status" DEFAULT 'PENDING'::"core"."email_log_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."email_templates" (
	"templateId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."email_templates_templateId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"templateCode" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"bodyHtml" text NOT NULL,
	"bodyText" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."letter_instances" (
	"instanceId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."letter_instances_instanceId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"templateId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"generatedContent" text NOT NULL,
	"generatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"sentAt" timestamp with time zone,
	"acknowledgedAt" timestamp with time zone,
	"status" "core"."letter_instance_status" DEFAULT 'DRAFT'::"core"."letter_instance_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."letter_templates" (
	"templateId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."letter_templates_templateId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"templateCode" text NOT NULL,
	"name" text NOT NULL,
	"letterType" "core"."letter_type" NOT NULL,
	"bodyTemplate" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."notification_channels" (
	"channelId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."notification_channels_channelId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"channelType" "core"."notification_channel" NOT NULL,
	"name" text NOT NULL,
	"config" jsonb,
	"status" "core"."notification_channel_status" DEFAULT 'ACTIVE'::"core"."notification_channel_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."notification_deliveries" (
	"deliveryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."notification_deliveries_deliveryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"notificationId" integer NOT NULL,
	"channelType" "core"."notification_channel" NOT NULL,
	"sentAt" timestamp with time zone,
	"deliveredAt" timestamp with time zone,
	"failureReason" text,
	"status" "core"."notification_delivery_status" DEFAULT 'PENDING'::"core"."notification_delivery_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."notifications" (
	"notificationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."notifications_notificationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"recipientUserId" integer NOT NULL,
	"templateId" integer,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"referenceTable" text,
	"referenceId" integer,
	"readAt" timestamp with time zone,
	"status" "core"."notification_status" DEFAULT 'PENDING'::"core"."notification_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."notification_subscriptions" (
	"subscriptionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."notification_subscriptions_subscriptionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"eventType" text NOT NULL,
	"channelType" "core"."notification_channel" NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."notification_templates" (
	"templateId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."notification_templates_templateId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"templateCode" text NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"bodyTemplate" text NOT NULL,
	"channel" "core"."notification_channel" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."workflow_action_logs" (
	"logId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."workflow_action_logs_logId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"instanceId" integer NOT NULL,
	"transitionId" integer,
	"fromStateId" integer NOT NULL,
	"toStateId" integer NOT NULL,
	"actorId" integer NOT NULL,
	"actionedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"comment" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."workflow_definitions" (
	"workflowId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."workflow_definitions_workflowId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"workflowCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"targetSchema" text NOT NULL,
	"targetTable" text NOT NULL,
	"status" "core"."workflow_definition_status" DEFAULT 'DRAFT'::"core"."workflow_definition_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."workflow_instances" (
	"instanceId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."workflow_instances_instanceId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workflowId" integer NOT NULL,
	"tenantId" integer NOT NULL,
	"recordId" integer NOT NULL,
	"recordTable" text NOT NULL,
	"currentStateId" integer NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"status" "core"."workflow_instance_status" DEFAULT 'ACTIVE'::"core"."workflow_instance_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."workflow_states" (
	"stateId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."workflow_states_stateId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workflowId" integer NOT NULL,
	"stateCode" text NOT NULL,
	"name" text NOT NULL,
	"isInitial" boolean DEFAULT false NOT NULL,
	"isFinal" boolean DEFAULT false NOT NULL,
	"sequenceNumber" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_workflow_states_sequence" CHECK ("sequenceNumber" > 0)
);
--> statement-breakpoint
CREATE TABLE "core"."workflow_transition_rules" (
	"ruleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."workflow_transition_rules_ruleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"transitionId" integer NOT NULL,
	"field" text NOT NULL,
	"operator" "core"."workflow_rule_operator" NOT NULL,
	"value" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."workflow_transitions" (
	"transitionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."workflow_transitions_transitionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workflowId" integer NOT NULL,
	"fromStateId" integer NOT NULL,
	"toStateId" integer NOT NULL,
	"action" text NOT NULL,
	"requiredRoleId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."attendance_requests" (
	"requestId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."attendance_requests_requestId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"attendanceDate" date NOT NULL,
	"reason" text NOT NULL,
	"checkInAt" timestamp with time zone,
	"checkOutAt" timestamp with time zone,
	"status" "hr"."attendance_request_status" DEFAULT 'PENDING'::"hr"."attendance_request_status" NOT NULL,
	"approvedAt" timestamp with time zone,
	"approvedBy" integer,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_attendance_requests_time_order" CHECK ("checkOutAt" IS NULL OR "checkInAt" IS NULL OR "checkOutAt" >= "checkInAt")
);
--> statement-breakpoint
CREATE TABLE "hr"."compensatory_leave_requests" (
	"requestId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."compensatory_leave_requests_requestId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"workDate" date NOT NULL,
	"leaveTypeId" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "hr"."compensatory_leave_request_status" DEFAULT 'PENDING'::"hr"."compensatory_leave_request_status" NOT NULL,
	"approvedBy" integer,
	"expiryDate" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."daily_work_summaries" (
	"summaryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."daily_work_summaries_summaryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"summaryDate" date NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."gratuity_rule_slabs" (
	"slabId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."gratuity_rule_slabs_slabId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ruleId" integer NOT NULL,
	"fromYears" numeric(5,2) NOT NULL,
	"toYears" numeric(5,2),
	"fractionOfSalary" numeric(5,4) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_gratuity_rule_slabs_years_range" CHECK ("toYears" IS NULL OR "toYears" > "fromYears"),
	CONSTRAINT "chk_gratuity_rule_slabs_from_years" CHECK ("fromYears" >= 0),
	CONSTRAINT "chk_gratuity_rule_slabs_fraction" CHECK ("fractionOfSalary" >= 0 AND "fractionOfSalary" <= 1)
);
--> statement-breakpoint
CREATE TABLE "payroll"."gratuity_rules" (
	"ruleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."gratuity_rules_ruleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"ruleCode" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"description" text,
	"status" "payroll"."gratuity_rule_status" DEFAULT 'DRAFT'::"payroll"."gratuity_rule_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."income_tax_slab_entries" (
	"entryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."income_tax_slab_entries_entryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"taxSlabId" integer NOT NULL,
	"fromAmount" numeric(15,2) NOT NULL,
	"toAmount" numeric(15,2),
	"taxRate" numeric(5,2) NOT NULL,
	"fixedAmount" numeric(15,2) DEFAULT '0.00' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_income_tax_slab_entries_range" CHECK ("toAmount" IS NULL OR "toAmount" > "fromAmount"),
	CONSTRAINT "chk_income_tax_slab_entries_rate" CHECK ("taxRate" >= 0 AND "taxRate" <= 100),
	CONSTRAINT "chk_income_tax_slab_entries_from_amount" CHECK ("fromAmount" >= 0),
	CONSTRAINT "chk_income_tax_slab_entries_fixed_amount" CHECK ("fixedAmount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."income_tax_slabs" (
	"taxSlabId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."income_tax_slabs_taxSlabId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"taxSlabCode" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"currencyId" integer NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"status" "payroll"."tax_slab_status" DEFAULT 'DRAFT'::"payroll"."tax_slab_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_income_tax_slabs_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);
--> statement-breakpoint
CREATE TABLE "payroll"."salary_structure_details" (
	"detailId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."salary_structure_details_detailId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"structureId" integer NOT NULL,
	"payComponentId" integer NOT NULL,
	"formula" text,
	"amount" numeric(12,2),
	"isEarning" boolean NOT NULL,
	"sequenceNumber" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_salary_structure_details_sequence" CHECK ("sequenceNumber" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."salary_structures" (
	"structureId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."salary_structures_structureId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"structureCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"payFrequency" "payroll"."pay_frequency" NOT NULL,
	"status" "payroll"."salary_structure_status" DEFAULT 'DRAFT'::"payroll"."salary_structure_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."tax_exemption_categories" (
	"categoryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."tax_exemption_categories_categoryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"categoryCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"maxExemptionAmount" numeric(12,2),
	"status" "payroll"."tax_exemption_category_status" DEFAULT 'ACTIVE'::"payroll"."tax_exemption_category_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."arrear_entries" (
	"arrearId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."arrear_entries_arrearId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"payrollRunId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"payComponentId" integer NOT NULL,
	"forPeriodId" integer NOT NULL,
	"arrearAmount" numeric(12,2) NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_arrear_entries_amount" CHECK ("arrearAmount" != 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."gratuity_settlements" (
	"settlementId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."gratuity_settlements_settlementId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"gratuityRuleId" integer NOT NULL,
	"totalYears" numeric(5,2) NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"settlementDate" date NOT NULL,
	"status" "payroll"."gratuity_settlement_status" DEFAULT 'DRAFT'::"payroll"."gratuity_settlement_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_gratuity_settlements_years" CHECK ("totalYears" >= 0),
	CONSTRAINT "chk_gratuity_settlements_amount" CHECK ("amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."payroll_correction_entries" (
	"entryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."payroll_correction_entries_entryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"correctionId" integer NOT NULL,
	"payComponentId" integer NOT NULL,
	"adjustmentAmount" numeric(12,2) NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_payroll_correction_entries_amount" CHECK ("adjustmentAmount" != 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."payroll_corrections" (
	"correctionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."payroll_corrections_correctionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"payrollRunId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "payroll"."payroll_correction_status" DEFAULT 'DRAFT'::"payroll"."payroll_correction_status" NOT NULL,
	"submittedAt" timestamp with time zone,
	"approvedAt" timestamp with time zone,
	"approvedBy" integer,
	"appliedAt" timestamp with time zone,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."retention_bonuses" (
	"bonusId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."retention_bonuses_bonusId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"payableDate" date NOT NULL,
	"reason" text,
	"status" "payroll"."retention_bonus_status" DEFAULT 'DRAFT'::"payroll"."retention_bonus_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_retention_bonuses_amount" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."salary_structure_assignments" (
	"assignmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."salary_structure_assignments_assignmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"structureId" integer NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"baseSalary" numeric(12,2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_salary_structure_assignments_effective_range" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
	CONSTRAINT "chk_salary_structure_assignments_base_salary" CHECK ("baseSalary" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll"."salary_withholdings" (
	"withholdingId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."salary_withholdings_withholdingId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"reason" text NOT NULL,
	"status" "payroll"."salary_withholding_status" DEFAULT 'ACTIVE'::"payroll"."salary_withholding_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_salary_withholdings_date_range" CHECK ("endDate" IS NULL OR "endDate" >= "startDate")
);
--> statement-breakpoint
CREATE TABLE "payroll"."tax_exemption_declaration_entries" (
	"entryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."tax_exemption_declaration_entries_entryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"declarationId" integer NOT NULL,
	"categoryId" integer NOT NULL,
	"declaredAmount" numeric(12,2) NOT NULL,
	"proofSubmitted" boolean DEFAULT false NOT NULL,
	"proofDocumentPath" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."tax_exemption_declarations" (
	"declarationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll"."tax_exemption_declarations_declarationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"payrollPeriodId" integer NOT NULL,
	"totalDeclaredAmount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"status" "payroll"."tax_declaration_status" DEFAULT 'DRAFT'::"payroll"."tax_declaration_status" NOT NULL,
	"submittedAt" timestamp with time zone,
	"verifiedAt" timestamp with time zone,
	"verifiedBy" integer,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benefits"."benefit_application_details" (
	"detailId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."benefit_application_details_detailId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"applicationId" integer NOT NULL,
	"benefitPlanId" integer NOT NULL,
	"electedAmount" numeric(10,2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_benefit_application_details_amount" CHECK ("electedAmount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "benefits"."benefit_applications" (
	"applicationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."benefit_applications_applicationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"benefitPlanId" integer NOT NULL,
	"requestedCoverageLevel" text NOT NULL,
	"effectiveDate" date NOT NULL,
	"status" "benefits"."benefit_application_status" DEFAULT 'DRAFT'::"benefits"."benefit_application_status" NOT NULL,
	"submittedAt" timestamp with time zone,
	"approvedAt" timestamp with time zone,
	"approvedBy" integer,
	"rejectionReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benefits"."benefit_ledger_entries" (
	"ledgerEntryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "benefits"."benefit_ledger_entries_ledgerEntryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"enrollmentId" integer NOT NULL,
	"transactionDate" date NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"entryType" "benefits"."benefit_ledger_entry_type" NOT NULL,
	"balance" numeric(12,2) NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent"."appraisal_cycles" (
	"cycleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."appraisal_cycles_cycleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"cycleCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"status" "talent"."appraisal_cycle_status" DEFAULT 'DRAFT'::"talent"."appraisal_cycle_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_appraisal_cycles_date_range" CHECK ("endDate" >= "startDate")
);
--> statement-breakpoint
CREATE TABLE "talent"."appraisal_goals" (
	"goalId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."appraisal_goals_goalId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"appraisalId" integer NOT NULL,
	"kraId" integer,
	"description" text NOT NULL,
	"weight" numeric(5,2) NOT NULL,
	"selfScore" numeric(5,2),
	"reviewerScore" numeric(5,2),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_appraisal_goals_weight" CHECK ("weight" >= 0 AND "weight" <= 100),
	CONSTRAINT "chk_appraisal_goals_self_score" CHECK ("selfScore" IS NULL OR ("selfScore" >= 0 AND "selfScore" <= 100)),
	CONSTRAINT "chk_appraisal_goals_reviewer_score" CHECK ("reviewerScore" IS NULL OR ("reviewerScore" >= 0 AND "reviewerScore" <= 100))
);
--> statement-breakpoint
CREATE TABLE "talent"."appraisal_kras" (
	"kraId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."appraisal_kras_kraId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"positionId" integer,
	"jobRoleId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent"."appraisals" (
	"appraisalId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."appraisals_appraisalId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"cycleId" integer NOT NULL,
	"templateId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"reviewerId" integer,
	"selfScore" numeric(5,2),
	"reviewerScore" numeric(5,2),
	"finalScore" numeric(5,2),
	"status" "talent"."appraisal_status" DEFAULT 'DRAFT'::"talent"."appraisal_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_appraisals_self_score" CHECK ("selfScore" IS NULL OR ("selfScore" >= 0 AND "selfScore" <= 100)),
	CONSTRAINT "chk_appraisals_reviewer_score" CHECK ("reviewerScore" IS NULL OR ("reviewerScore" >= 0 AND "reviewerScore" <= 100)),
	CONSTRAINT "chk_appraisals_final_score" CHECK ("finalScore" IS NULL OR ("finalScore" >= 0 AND "finalScore" <= 100))
);
--> statement-breakpoint
CREATE TABLE "talent"."appraisal_template_goals" (
	"goalId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."appraisal_template_goals_goalId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"templateId" integer NOT NULL,
	"description" text NOT NULL,
	"weight" numeric(5,2) NOT NULL,
	"sequenceNumber" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_appraisal_template_goals_weight" CHECK ("weight" >= 0 AND "weight" <= 100),
	CONSTRAINT "chk_appraisal_template_goals_sequence" CHECK ("sequenceNumber" > 0)
);
--> statement-breakpoint
CREATE TABLE "talent"."appraisal_templates" (
	"templateId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."appraisal_templates_templateId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"templateCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "talent"."appraisal_template_status" DEFAULT 'DRAFT'::"talent"."appraisal_template_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment"."interview_feedback" (
	"feedbackId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."interview_feedback_feedbackId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"interviewId" integer NOT NULL,
	"interviewerId" integer NOT NULL,
	"rating" numeric(4,2),
	"strengths" text,
	"concerns" text,
	"recommendation" "recruitment"."interview_recommendation",
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_interview_feedback_rating" CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 10))
);
--> statement-breakpoint
CREATE TABLE "recruitment"."interview_rounds" (
	"roundId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."interview_rounds_roundId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"requisitionId" integer,
	"name" text NOT NULL,
	"sequenceNumber" integer NOT NULL,
	"interviewType" "recruitment"."round_interview_type" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_interview_rounds_sequence" CHECK ("sequenceNumber" > 0)
);
--> statement-breakpoint
CREATE TABLE "recruitment"."interview_schedules" (
	"interviewId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."interview_schedules_interviewId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"applicationId" integer NOT NULL,
	"roundId" integer NOT NULL,
	"interviewerId" integer,
	"scheduledAt" timestamp with time zone NOT NULL,
	"durationMinutes" smallint DEFAULT 60 NOT NULL,
	"location" text,
	"meetingLink" text,
	"status" "recruitment"."interview_schedule_status" DEFAULT 'SCHEDULED'::"recruitment"."interview_schedule_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_interview_schedules_duration" CHECK ("durationMinutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "recruitment"."staffing_plan_details" (
	"detailId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."staffing_plan_details_detailId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planId" integer NOT NULL,
	"departmentId" integer,
	"positionId" integer,
	"currentCount" smallint DEFAULT 0 NOT NULL,
	"plannedCount" smallint NOT NULL,
	"estimatedCostPerPosition" numeric(12,2),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_staffing_plan_details_current_count" CHECK ("currentCount" >= 0),
	CONSTRAINT "chk_staffing_plan_details_planned_count" CHECK ("plannedCount" >= 0),
	CONSTRAINT "chk_staffing_plan_details_cost" CHECK ("estimatedCostPerPosition" IS NULL OR "estimatedCostPerPosition" >= 0)
);
--> statement-breakpoint
CREATE TABLE "recruitment"."staffing_plans" (
	"planId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."staffing_plans_planId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"planCode" text NOT NULL,
	"name" text NOT NULL,
	"fiscalYear" smallint NOT NULL,
	"status" "recruitment"."staffing_plan_status" DEFAULT 'DRAFT'::"recruitment"."staffing_plan_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "benefits"."benefit_enrollments" ALTER COLUMN "coverageLevel" SET DATA TYPE text USING "coverageLevel"::text;--> statement-breakpoint
CREATE INDEX "idx_announcement_audiences_announcement" ON "core"."announcement_audiences" ("announcementId");--> statement-breakpoint
CREATE INDEX "idx_announcement_audiences_type" ON "core"."announcement_audiences" ("audienceType");--> statement-breakpoint
CREATE INDEX "idx_announcement_audiences_ref" ON "core"."announcement_audiences" ("audienceType","audienceRefId");--> statement-breakpoint
CREATE INDEX "idx_announcement_posts_tenant" ON "core"."announcement_posts" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_announcement_posts_status" ON "core"."announcement_posts" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_announcement_posts_published_at" ON "core"."announcement_posts" ("tenantId","publishedAt");--> statement-breakpoint
CREATE INDEX "idx_announcement_posts_expires_at" ON "core"."announcement_posts" ("tenantId","expiresAt");--> statement-breakpoint
CREATE INDEX "idx_email_logs_tenant" ON "core"."email_logs" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_email_logs_recipient" ON "core"."email_logs" ("tenantId","recipientEmail");--> statement-breakpoint
CREATE INDEX "idx_email_logs_template" ON "core"."email_logs" ("tenantId","templateId");--> statement-breakpoint
CREATE INDEX "idx_email_logs_status" ON "core"."email_logs" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_email_logs_sent_at" ON "core"."email_logs" ("sentAt");--> statement-breakpoint
CREATE INDEX "idx_email_templates_tenant" ON "core"."email_templates" ("tenantId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_email_templates_code" ON "core"."email_templates" ("tenantId",lower("templateCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_letter_instances_tenant" ON "core"."letter_instances" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_letter_instances_template" ON "core"."letter_instances" ("tenantId","templateId");--> statement-breakpoint
CREATE INDEX "idx_letter_instances_employee" ON "core"."letter_instances" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_letter_instances_status" ON "core"."letter_instances" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_letter_instances_generated_at" ON "core"."letter_instances" ("generatedAt");--> statement-breakpoint
CREATE INDEX "idx_letter_templates_tenant" ON "core"."letter_templates" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_letter_templates_type" ON "core"."letter_templates" ("tenantId","letterType");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_letter_templates_code" ON "core"."letter_templates" ("tenantId",lower("templateCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_notification_channels_tenant" ON "core"."notification_channels" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_notification_channels_type" ON "core"."notification_channels" ("tenantId","channelType");--> statement-breakpoint
CREATE INDEX "idx_notification_channels_status" ON "core"."notification_channels" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_notification" ON "core"."notification_deliveries" ("notificationId");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_channel" ON "core"."notification_deliveries" ("channelType");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_status" ON "core"."notification_deliveries" ("status");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_sent_at" ON "core"."notification_deliveries" ("sentAt");--> statement-breakpoint
CREATE INDEX "idx_notifications_tenant" ON "core"."notifications" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient" ON "core"."notifications" ("tenantId","recipientUserId");--> statement-breakpoint
CREATE INDEX "idx_notifications_template" ON "core"."notifications" ("tenantId","templateId");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "core"."notifications" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_notifications_reference" ON "core"."notifications" ("tenantId","referenceTable","referenceId");--> statement-breakpoint
CREATE INDEX "idx_notifications_created" ON "core"."notifications" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_notification_subscriptions_user" ON "core"."notification_subscriptions" ("userId");--> statement-breakpoint
CREATE INDEX "idx_notification_subscriptions_event" ON "core"."notification_subscriptions" ("eventType");--> statement-breakpoint
CREATE INDEX "idx_notification_subscriptions_channel" ON "core"."notification_subscriptions" ("channelType");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_tenant" ON "core"."notification_templates" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_channel" ON "core"."notification_templates" ("tenantId","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_notification_templates_code" ON "core"."notification_templates" ("tenantId",lower("templateCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workflow_action_logs_instance" ON "core"."workflow_action_logs" ("instanceId");--> statement-breakpoint
CREATE INDEX "idx_workflow_action_logs_actor" ON "core"."workflow_action_logs" ("actorId");--> statement-breakpoint
CREATE INDEX "idx_workflow_action_logs_actioned_at" ON "core"."workflow_action_logs" ("actionedAt");--> statement-breakpoint
CREATE INDEX "idx_workflow_definitions_tenant" ON "core"."workflow_definitions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_workflow_definitions_target" ON "core"."workflow_definitions" ("tenantId","targetSchema","targetTable");--> statement-breakpoint
CREATE INDEX "idx_workflow_definitions_status" ON "core"."workflow_definitions" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workflow_definitions_code" ON "core"."workflow_definitions" ("tenantId",lower("workflowCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workflow_instances_tenant" ON "core"."workflow_instances" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_workflow_instances_workflow" ON "core"."workflow_instances" ("workflowId");--> statement-breakpoint
CREATE INDEX "idx_workflow_instances_record" ON "core"."workflow_instances" ("tenantId","recordTable","recordId");--> statement-breakpoint
CREATE INDEX "idx_workflow_instances_current_state" ON "core"."workflow_instances" ("currentStateId");--> statement-breakpoint
CREATE INDEX "idx_workflow_instances_status" ON "core"."workflow_instances" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_workflow_states_workflow" ON "core"."workflow_states" ("workflowId");--> statement-breakpoint
CREATE INDEX "idx_workflow_transition_rules_transition" ON "core"."workflow_transition_rules" ("transitionId");--> statement-breakpoint
CREATE INDEX "idx_workflow_transitions_workflow" ON "core"."workflow_transitions" ("workflowId");--> statement-breakpoint
CREATE INDEX "idx_workflow_transitions_from_state" ON "core"."workflow_transitions" ("fromStateId");--> statement-breakpoint
CREATE INDEX "idx_workflow_transitions_to_state" ON "core"."workflow_transitions" ("toStateId");--> statement-breakpoint
CREATE INDEX "idx_attendance_requests_tenant" ON "hr"."attendance_requests" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_attendance_requests_employee" ON "hr"."attendance_requests" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_attendance_requests_date" ON "hr"."attendance_requests" ("tenantId","attendanceDate");--> statement-breakpoint
CREATE INDEX "idx_attendance_requests_status" ON "hr"."attendance_requests" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_compensatory_leave_requests_tenant" ON "hr"."compensatory_leave_requests" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_compensatory_leave_requests_employee" ON "hr"."compensatory_leave_requests" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_compensatory_leave_requests_work_date" ON "hr"."compensatory_leave_requests" ("tenantId","workDate");--> statement-breakpoint
CREATE INDEX "idx_compensatory_leave_requests_status" ON "hr"."compensatory_leave_requests" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_daily_work_summaries_tenant" ON "hr"."daily_work_summaries" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_daily_work_summaries_employee" ON "hr"."daily_work_summaries" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_daily_work_summaries_date" ON "hr"."daily_work_summaries" ("tenantId","summaryDate");--> statement-breakpoint
CREATE INDEX "idx_daily_work_summaries_employee_date" ON "hr"."daily_work_summaries" ("tenantId","employeeId","summaryDate");--> statement-breakpoint
CREATE INDEX "idx_gratuity_rule_slabs_rule" ON "payroll"."gratuity_rule_slabs" ("ruleId");--> statement-breakpoint
CREATE INDEX "idx_gratuity_rules_tenant" ON "payroll"."gratuity_rules" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_gratuity_rules_country" ON "payroll"."gratuity_rules" ("tenantId","country");--> statement-breakpoint
CREATE INDEX "idx_gratuity_rules_status" ON "payroll"."gratuity_rules" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_gratuity_rules_code" ON "payroll"."gratuity_rules" ("tenantId",lower("ruleCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_income_tax_slab_entries_slab" ON "payroll"."income_tax_slab_entries" ("taxSlabId");--> statement-breakpoint
CREATE INDEX "idx_income_tax_slabs_tenant" ON "payroll"."income_tax_slabs" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_income_tax_slabs_country_effective" ON "payroll"."income_tax_slabs" ("tenantId","country","effectiveFrom");--> statement-breakpoint
CREATE INDEX "idx_income_tax_slabs_status" ON "payroll"."income_tax_slabs" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_income_tax_slabs_code" ON "payroll"."income_tax_slabs" ("tenantId",lower("taxSlabCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_salary_structure_details_structure" ON "payroll"."salary_structure_details" ("structureId");--> statement-breakpoint
CREATE INDEX "idx_salary_structure_details_component" ON "payroll"."salary_structure_details" ("payComponentId");--> statement-breakpoint
CREATE INDEX "idx_salary_structures_tenant" ON "payroll"."salary_structures" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_salary_structures_status" ON "payroll"."salary_structures" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_salary_structures_code" ON "payroll"."salary_structures" ("tenantId",lower("structureCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_categories_tenant" ON "payroll"."tax_exemption_categories" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_categories_status" ON "payroll"."tax_exemption_categories" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tax_exemption_categories_code" ON "payroll"."tax_exemption_categories" ("tenantId",lower("categoryCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_arrear_entries_run" ON "payroll"."arrear_entries" ("payrollRunId");--> statement-breakpoint
CREATE INDEX "idx_arrear_entries_employee" ON "payroll"."arrear_entries" ("employeeId");--> statement-breakpoint
CREATE INDEX "idx_arrear_entries_period" ON "payroll"."arrear_entries" ("forPeriodId");--> statement-breakpoint
CREATE INDEX "idx_gratuity_settlements_tenant" ON "payroll"."gratuity_settlements" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_gratuity_settlements_employee" ON "payroll"."gratuity_settlements" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_gratuity_settlements_status" ON "payroll"."gratuity_settlements" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_payroll_correction_entries_correction" ON "payroll"."payroll_correction_entries" ("correctionId");--> statement-breakpoint
CREATE INDEX "idx_payroll_correction_entries_component" ON "payroll"."payroll_correction_entries" ("payComponentId");--> statement-breakpoint
CREATE INDEX "idx_payroll_corrections_tenant" ON "payroll"."payroll_corrections" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_payroll_corrections_run" ON "payroll"."payroll_corrections" ("tenantId","payrollRunId");--> statement-breakpoint
CREATE INDEX "idx_payroll_corrections_employee" ON "payroll"."payroll_corrections" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_payroll_corrections_status" ON "payroll"."payroll_corrections" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_retention_bonuses_tenant" ON "payroll"."retention_bonuses" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_retention_bonuses_employee" ON "payroll"."retention_bonuses" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_retention_bonuses_status" ON "payroll"."retention_bonuses" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_retention_bonuses_payable_date" ON "payroll"."retention_bonuses" ("tenantId","payableDate");--> statement-breakpoint
CREATE INDEX "idx_salary_structure_assignments_tenant" ON "payroll"."salary_structure_assignments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_salary_structure_assignments_employee" ON "payroll"."salary_structure_assignments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_salary_structure_assignments_structure" ON "payroll"."salary_structure_assignments" ("tenantId","structureId");--> statement-breakpoint
CREATE INDEX "idx_salary_structure_assignments_effective" ON "payroll"."salary_structure_assignments" ("tenantId","employeeId","effectiveFrom");--> statement-breakpoint
CREATE INDEX "idx_salary_withholdings_tenant" ON "payroll"."salary_withholdings" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_salary_withholdings_employee" ON "payroll"."salary_withholdings" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_salary_withholdings_status" ON "payroll"."salary_withholdings" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_declaration_entries_declaration" ON "payroll"."tax_exemption_declaration_entries" ("declarationId");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_declaration_entries_category" ON "payroll"."tax_exemption_declaration_entries" ("categoryId");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_declarations_tenant" ON "payroll"."tax_exemption_declarations" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_declarations_employee" ON "payroll"."tax_exemption_declarations" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_declarations_period" ON "payroll"."tax_exemption_declarations" ("tenantId","payrollPeriodId");--> statement-breakpoint
CREATE INDEX "idx_tax_exemption_declarations_status" ON "payroll"."tax_exemption_declarations" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_benefit_application_details_application" ON "benefits"."benefit_application_details" ("applicationId");--> statement-breakpoint
CREATE INDEX "idx_benefit_application_details_plan" ON "benefits"."benefit_application_details" ("benefitPlanId");--> statement-breakpoint
CREATE INDEX "idx_benefit_applications_tenant" ON "benefits"."benefit_applications" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_benefit_applications_employee" ON "benefits"."benefit_applications" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_benefit_applications_plan" ON "benefits"."benefit_applications" ("tenantId","benefitPlanId");--> statement-breakpoint
CREATE INDEX "idx_benefit_applications_status" ON "benefits"."benefit_applications" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_benefit_ledger_entries_enrollment" ON "benefits"."benefit_ledger_entries" ("enrollmentId");--> statement-breakpoint
CREATE INDEX "idx_benefit_ledger_entries_date" ON "benefits"."benefit_ledger_entries" ("enrollmentId","transactionDate");--> statement-breakpoint
CREATE INDEX "idx_benefit_ledger_entries_type" ON "benefits"."benefit_ledger_entries" ("enrollmentId","entryType");--> statement-breakpoint
CREATE INDEX "idx_appraisal_cycles_tenant" ON "talent"."appraisal_cycles" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_appraisal_cycles_status" ON "talent"."appraisal_cycles" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_appraisal_cycles_dates" ON "talent"."appraisal_cycles" ("tenantId","startDate","endDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_appraisal_cycles_code" ON "talent"."appraisal_cycles" ("tenantId",lower("cycleCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_appraisal_goals_appraisal" ON "talent"."appraisal_goals" ("appraisalId");--> statement-breakpoint
CREATE INDEX "idx_appraisal_goals_kra" ON "talent"."appraisal_goals" ("kraId");--> statement-breakpoint
CREATE INDEX "idx_appraisal_kras_tenant" ON "talent"."appraisal_kras" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_appraisal_kras_position" ON "talent"."appraisal_kras" ("tenantId","positionId");--> statement-breakpoint
CREATE INDEX "idx_appraisal_kras_job_role" ON "talent"."appraisal_kras" ("tenantId","jobRoleId");--> statement-breakpoint
CREATE INDEX "idx_appraisals_tenant" ON "talent"."appraisals" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_appraisals_cycle" ON "talent"."appraisals" ("tenantId","cycleId");--> statement-breakpoint
CREATE INDEX "idx_appraisals_employee" ON "talent"."appraisals" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_appraisals_reviewer" ON "talent"."appraisals" ("tenantId","reviewerId");--> statement-breakpoint
CREATE INDEX "idx_appraisals_status" ON "talent"."appraisals" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_appraisal_template_goals_template" ON "talent"."appraisal_template_goals" ("templateId");--> statement-breakpoint
CREATE INDEX "idx_appraisal_templates_tenant" ON "talent"."appraisal_templates" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_appraisal_templates_status" ON "talent"."appraisal_templates" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_appraisal_templates_code" ON "talent"."appraisal_templates" ("tenantId",lower("templateCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_interview_feedback_interview" ON "recruitment"."interview_feedback" ("interviewId");--> statement-breakpoint
CREATE INDEX "idx_interview_feedback_interviewer" ON "recruitment"."interview_feedback" ("interviewerId");--> statement-breakpoint
CREATE INDEX "idx_interview_rounds_tenant" ON "recruitment"."interview_rounds" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_interview_rounds_requisition" ON "recruitment"."interview_rounds" ("tenantId","requisitionId");--> statement-breakpoint
CREATE INDEX "idx_interview_schedules_tenant" ON "recruitment"."interview_schedules" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_interview_schedules_application" ON "recruitment"."interview_schedules" ("tenantId","applicationId");--> statement-breakpoint
CREATE INDEX "idx_interview_schedules_round" ON "recruitment"."interview_schedules" ("tenantId","roundId");--> statement-breakpoint
CREATE INDEX "idx_interview_schedules_interviewer" ON "recruitment"."interview_schedules" ("tenantId","interviewerId");--> statement-breakpoint
CREATE INDEX "idx_interview_schedules_scheduled_at" ON "recruitment"."interview_schedules" ("tenantId","scheduledAt");--> statement-breakpoint
CREATE INDEX "idx_interview_schedules_status" ON "recruitment"."interview_schedules" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_staffing_plan_details_plan" ON "recruitment"."staffing_plan_details" ("planId");--> statement-breakpoint
CREATE INDEX "idx_staffing_plan_details_department" ON "recruitment"."staffing_plan_details" ("departmentId");--> statement-breakpoint
CREATE INDEX "idx_staffing_plan_details_position" ON "recruitment"."staffing_plan_details" ("positionId");--> statement-breakpoint
CREATE INDEX "idx_staffing_plans_tenant" ON "recruitment"."staffing_plans" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_staffing_plans_fiscal_year" ON "recruitment"."staffing_plans" ("tenantId","fiscalYear");--> statement-breakpoint
CREATE INDEX "idx_staffing_plans_status" ON "recruitment"."staffing_plans" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_staffing_plans_code" ON "recruitment"."staffing_plans" ("tenantId",lower("planCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "core"."announcement_audiences" ADD CONSTRAINT "fk_announcement_audiences_announcement" FOREIGN KEY ("announcementId") REFERENCES "core"."announcement_posts"("announcementId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."announcement_posts" ADD CONSTRAINT "fk_announcement_posts_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."email_logs" ADD CONSTRAINT "fk_email_logs_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."email_logs" ADD CONSTRAINT "fk_email_logs_template" FOREIGN KEY ("templateId") REFERENCES "core"."email_templates"("templateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."email_templates" ADD CONSTRAINT "fk_email_templates_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."letter_instances" ADD CONSTRAINT "fk_letter_instances_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."letter_instances" ADD CONSTRAINT "fk_letter_instances_template" FOREIGN KEY ("templateId") REFERENCES "core"."letter_templates"("templateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."letter_instances" ADD CONSTRAINT "fk_letter_instances_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."letter_templates" ADD CONSTRAINT "fk_letter_templates_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."notification_channels" ADD CONSTRAINT "fk_notification_channels_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."notification_deliveries" ADD CONSTRAINT "fk_notification_deliveries_notification" FOREIGN KEY ("notificationId") REFERENCES "core"."notifications"("notificationId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."notifications" ADD CONSTRAINT "fk_notifications_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."notifications" ADD CONSTRAINT "fk_notifications_template" FOREIGN KEY ("templateId") REFERENCES "core"."notification_templates"("templateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."notification_templates" ADD CONSTRAINT "fk_notification_templates_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_action_logs" ADD CONSTRAINT "fk_workflow_action_logs_instance" FOREIGN KEY ("instanceId") REFERENCES "core"."workflow_instances"("instanceId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_action_logs" ADD CONSTRAINT "fk_workflow_action_logs_transition" FOREIGN KEY ("transitionId") REFERENCES "core"."workflow_transitions"("transitionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_action_logs" ADD CONSTRAINT "fk_workflow_action_logs_from_state" FOREIGN KEY ("fromStateId") REFERENCES "core"."workflow_states"("stateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_action_logs" ADD CONSTRAINT "fk_workflow_action_logs_to_state" FOREIGN KEY ("toStateId") REFERENCES "core"."workflow_states"("stateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_definitions" ADD CONSTRAINT "fk_workflow_definitions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_instances" ADD CONSTRAINT "fk_workflow_instances_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_instances" ADD CONSTRAINT "fk_workflow_instances_workflow" FOREIGN KEY ("workflowId") REFERENCES "core"."workflow_definitions"("workflowId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_instances" ADD CONSTRAINT "fk_workflow_instances_current_state" FOREIGN KEY ("currentStateId") REFERENCES "core"."workflow_states"("stateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_states" ADD CONSTRAINT "fk_workflow_states_workflow" FOREIGN KEY ("workflowId") REFERENCES "core"."workflow_definitions"("workflowId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_transition_rules" ADD CONSTRAINT "fk_workflow_transition_rules_transition" FOREIGN KEY ("transitionId") REFERENCES "core"."workflow_transitions"("transitionId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_transitions" ADD CONSTRAINT "fk_workflow_transitions_workflow" FOREIGN KEY ("workflowId") REFERENCES "core"."workflow_definitions"("workflowId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_transitions" ADD CONSTRAINT "fk_workflow_transitions_from_state" FOREIGN KEY ("fromStateId") REFERENCES "core"."workflow_states"("stateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."workflow_transitions" ADD CONSTRAINT "fk_workflow_transitions_to_state" FOREIGN KEY ("toStateId") REFERENCES "core"."workflow_states"("stateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."attendance_requests" ADD CONSTRAINT "fk_attendance_requests_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."attendance_requests" ADD CONSTRAINT "fk_attendance_requests_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."compensatory_leave_requests" ADD CONSTRAINT "fk_compensatory_leave_requests_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."compensatory_leave_requests" ADD CONSTRAINT "fk_compensatory_leave_requests_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."compensatory_leave_requests" ADD CONSTRAINT "fk_compensatory_leave_requests_leave_type" FOREIGN KEY ("leaveTypeId") REFERENCES "hr"."leave_types"("leaveTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."daily_work_summaries" ADD CONSTRAINT "fk_daily_work_summaries_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "hr"."daily_work_summaries" ADD CONSTRAINT "fk_daily_work_summaries_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."gratuity_rule_slabs" ADD CONSTRAINT "fk_gratuity_rule_slabs_rule" FOREIGN KEY ("ruleId") REFERENCES "payroll"."gratuity_rules"("ruleId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."gratuity_rules" ADD CONSTRAINT "fk_gratuity_rules_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."income_tax_slab_entries" ADD CONSTRAINT "fk_income_tax_slab_entries_slab" FOREIGN KEY ("taxSlabId") REFERENCES "payroll"."income_tax_slabs"("taxSlabId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."income_tax_slabs" ADD CONSTRAINT "fk_income_tax_slabs_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."income_tax_slabs" ADD CONSTRAINT "fk_income_tax_slabs_currency" FOREIGN KEY ("currencyId") REFERENCES "core"."currencies"("currencyId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_structure_details" ADD CONSTRAINT "fk_salary_structure_details_structure" FOREIGN KEY ("structureId") REFERENCES "payroll"."salary_structures"("structureId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_structure_details" ADD CONSTRAINT "fk_salary_structure_details_component" FOREIGN KEY ("payComponentId") REFERENCES "payroll"."pay_components"("payComponentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_structures" ADD CONSTRAINT "fk_salary_structures_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."tax_exemption_categories" ADD CONSTRAINT "fk_tax_exemption_categories_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."arrear_entries" ADD CONSTRAINT "fk_arrear_entries_run" FOREIGN KEY ("payrollRunId") REFERENCES "payroll"."payroll_runs"("payrollRunId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."arrear_entries" ADD CONSTRAINT "fk_arrear_entries_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."arrear_entries" ADD CONSTRAINT "fk_arrear_entries_component" FOREIGN KEY ("payComponentId") REFERENCES "payroll"."pay_components"("payComponentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."arrear_entries" ADD CONSTRAINT "fk_arrear_entries_period" FOREIGN KEY ("forPeriodId") REFERENCES "payroll"."payroll_periods"("payrollPeriodId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."gratuity_settlements" ADD CONSTRAINT "fk_gratuity_settlements_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."gratuity_settlements" ADD CONSTRAINT "fk_gratuity_settlements_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."gratuity_settlements" ADD CONSTRAINT "fk_gratuity_settlements_rule" FOREIGN KEY ("gratuityRuleId") REFERENCES "payroll"."gratuity_rules"("ruleId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_correction_entries" ADD CONSTRAINT "fk_payroll_correction_entries_correction" FOREIGN KEY ("correctionId") REFERENCES "payroll"."payroll_corrections"("correctionId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_correction_entries" ADD CONSTRAINT "fk_payroll_correction_entries_component" FOREIGN KEY ("payComponentId") REFERENCES "payroll"."pay_components"("payComponentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_corrections" ADD CONSTRAINT "fk_payroll_corrections_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_corrections" ADD CONSTRAINT "fk_payroll_corrections_run" FOREIGN KEY ("payrollRunId") REFERENCES "payroll"."payroll_runs"("payrollRunId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."payroll_corrections" ADD CONSTRAINT "fk_payroll_corrections_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."retention_bonuses" ADD CONSTRAINT "fk_retention_bonuses_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."retention_bonuses" ADD CONSTRAINT "fk_retention_bonuses_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_structure_assignments" ADD CONSTRAINT "fk_salary_structure_assignments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_structure_assignments" ADD CONSTRAINT "fk_salary_structure_assignments_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_structure_assignments" ADD CONSTRAINT "fk_salary_structure_assignments_structure" FOREIGN KEY ("structureId") REFERENCES "payroll"."salary_structures"("structureId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_withholdings" ADD CONSTRAINT "fk_salary_withholdings_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."salary_withholdings" ADD CONSTRAINT "fk_salary_withholdings_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."tax_exemption_declaration_entries" ADD CONSTRAINT "fk_tax_exemption_declaration_entries_declaration" FOREIGN KEY ("declarationId") REFERENCES "payroll"."tax_exemption_declarations"("declarationId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."tax_exemption_declaration_entries" ADD CONSTRAINT "fk_tax_exemption_declaration_entries_category" FOREIGN KEY ("categoryId") REFERENCES "payroll"."tax_exemption_categories"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."tax_exemption_declarations" ADD CONSTRAINT "fk_tax_exemption_declarations_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."tax_exemption_declarations" ADD CONSTRAINT "fk_tax_exemption_declarations_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll"."tax_exemption_declarations" ADD CONSTRAINT "fk_tax_exemption_declarations_period" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll"."payroll_periods"("payrollPeriodId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_application_details" ADD CONSTRAINT "fk_benefit_application_details_application" FOREIGN KEY ("applicationId") REFERENCES "benefits"."benefit_applications"("applicationId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_application_details" ADD CONSTRAINT "fk_benefit_application_details_plan" FOREIGN KEY ("benefitPlanId") REFERENCES "benefits"."benefit_plans"("benefitPlanId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_applications" ADD CONSTRAINT "fk_benefit_applications_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_applications" ADD CONSTRAINT "fk_benefit_applications_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_applications" ADD CONSTRAINT "fk_benefit_applications_plan" FOREIGN KEY ("benefitPlanId") REFERENCES "benefits"."benefit_plans"("benefitPlanId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "benefits"."benefit_ledger_entries" ADD CONSTRAINT "fk_benefit_ledger_entries_enrollment" FOREIGN KEY ("enrollmentId") REFERENCES "benefits"."benefit_enrollments"("enrollmentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_cycles" ADD CONSTRAINT "fk_appraisal_cycles_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_goals" ADD CONSTRAINT "fk_appraisal_goals_appraisal" FOREIGN KEY ("appraisalId") REFERENCES "talent"."appraisals"("appraisalId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_goals" ADD CONSTRAINT "fk_appraisal_goals_kra" FOREIGN KEY ("kraId") REFERENCES "talent"."appraisal_kras"("kraId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_kras" ADD CONSTRAINT "fk_appraisal_kras_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_kras" ADD CONSTRAINT "fk_appraisal_kras_position" FOREIGN KEY ("positionId") REFERENCES "hr"."positions"("positionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_kras" ADD CONSTRAINT "fk_appraisal_kras_job_role" FOREIGN KEY ("jobRoleId") REFERENCES "hr"."job_roles"("jobRoleId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisals" ADD CONSTRAINT "fk_appraisals_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisals" ADD CONSTRAINT "fk_appraisals_cycle" FOREIGN KEY ("cycleId") REFERENCES "talent"."appraisal_cycles"("cycleId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisals" ADD CONSTRAINT "fk_appraisals_template" FOREIGN KEY ("templateId") REFERENCES "talent"."appraisal_templates"("templateId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisals" ADD CONSTRAINT "fk_appraisals_employee" FOREIGN KEY ("employeeId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisals" ADD CONSTRAINT "fk_appraisals_reviewer" FOREIGN KEY ("reviewerId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_template_goals" ADD CONSTRAINT "fk_appraisal_template_goals_template" FOREIGN KEY ("templateId") REFERENCES "talent"."appraisal_templates"("templateId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."appraisal_templates" ADD CONSTRAINT "fk_appraisal_templates_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_feedback" ADD CONSTRAINT "fk_interview_feedback_interview" FOREIGN KEY ("interviewId") REFERENCES "recruitment"."interview_schedules"("interviewId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_feedback" ADD CONSTRAINT "fk_interview_feedback_interviewer" FOREIGN KEY ("interviewerId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_rounds" ADD CONSTRAINT "fk_interview_rounds_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_rounds" ADD CONSTRAINT "fk_interview_rounds_requisition" FOREIGN KEY ("requisitionId") REFERENCES "recruitment"."job_requisitions"("requisitionId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_schedules" ADD CONSTRAINT "fk_interview_schedules_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_schedules" ADD CONSTRAINT "fk_interview_schedules_application" FOREIGN KEY ("applicationId") REFERENCES "recruitment"."applications"("applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_schedules" ADD CONSTRAINT "fk_interview_schedules_round" FOREIGN KEY ("roundId") REFERENCES "recruitment"."interview_rounds"("roundId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."interview_schedules" ADD CONSTRAINT "fk_interview_schedules_interviewer" FOREIGN KEY ("interviewerId") REFERENCES "hr"."employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."staffing_plan_details" ADD CONSTRAINT "fk_staffing_plan_details_plan" FOREIGN KEY ("planId") REFERENCES "recruitment"."staffing_plans"("planId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."staffing_plan_details" ADD CONSTRAINT "fk_staffing_plan_details_department" FOREIGN KEY ("departmentId") REFERENCES "hr"."departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."staffing_plan_details" ADD CONSTRAINT "fk_staffing_plan_details_position" FOREIGN KEY ("positionId") REFERENCES "hr"."positions"("positionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."staffing_plans" ADD CONSTRAINT "fk_staffing_plans_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
DROP TYPE "benefits"."benefit_coverage_level";