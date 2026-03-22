CREATE TYPE "talent"."employee_certification_status" AS ENUM('ACTIVE', 'EXPIRED', 'REVOKED', 'PENDING_VERIFICATION');--> statement-breakpoint
CREATE TYPE "talent"."pool_membership_status" AS ENUM('ACTIVE', 'EXITED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "talent"."case_entity_type" AS ENUM('GRIEVANCE', 'DISCIPLINARY');--> statement-breakpoint
CREATE TYPE "talent"."case_link_type" AS ENUM('ESCALATES_TO', 'RELATED_TO', 'DERIVED_FROM');--> statement-breakpoint
CREATE TABLE "talent"."employee_certifications" (
	"employeeCertificationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."employee_certifications_employeeCertificationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"certificationId" integer NOT NULL,
	"certificationCodeSnapshot" text NOT NULL,
	"certificationNameSnapshot" text NOT NULL,
	"issuingOrganizationSnapshot" text NOT NULL,
	"certificationNumber" text,
	"issuedDate" date NOT NULL,
	"expiryDate" date,
	"verifiedBy" integer,
	"verificationDate" date,
	"status" "talent"."employee_certification_status" DEFAULT 'ACTIVE'::"talent"."employee_certification_status" NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_employee_certifications_dates" CHECK ("expiryDate" IS NULL OR "issuedDate" IS NULL OR "expiryDate" >= "issuedDate")
);
--> statement-breakpoint
CREATE TABLE "talent"."performance_review_goals" (
	"reviewGoalId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."performance_review_goals_reviewGoalId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"reviewId" integer NOT NULL,
	"goalId" integer NOT NULL,
	"goalTitleSnapshot" text NOT NULL,
	"goalWeightSnapshot" numeric(5,2),
	"goalTargetSnapshot" text,
	"goalDueDateSnapshot" date,
	"managerScore" numeric(5,2),
	"employeeScore" numeric(5,2),
	"finalScore" numeric(5,2),
	"comment" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_performance_review_goals_scores" CHECK (("managerScore" IS NULL OR ("managerScore" >= 0 AND "managerScore" <= 5)) AND
          ("employeeScore" IS NULL OR ("employeeScore" >= 0 AND "employeeScore" <= 5)) AND
          ("finalScore" IS NULL OR ("finalScore" >= 0 AND "finalScore" <= 5)))
);
--> statement-breakpoint
CREATE TABLE "talent"."talent_pool_memberships" (
	"talentPoolMembershipId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."talent_pool_memberships_talentPoolMembershipId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"talentPoolId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"nominatedBy" integer,
	"joinedDate" date NOT NULL,
	"exitedDate" date,
	"status" "talent"."pool_membership_status" DEFAULT 'ACTIVE'::"talent"."pool_membership_status" NOT NULL,
	"rationale" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_talent_pool_memberships_dates" CHECK ("exitedDate" IS NULL OR "exitedDate" >= "joinedDate")
);
--> statement-breakpoint
CREATE TABLE "talent"."case_links" (
	"caseLinkId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."case_links_caseLinkId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"sourceType" "talent"."case_entity_type" NOT NULL,
	"sourceId" integer NOT NULL,
	"targetType" "talent"."case_entity_type" NOT NULL,
	"targetId" integer NOT NULL,
	"linkType" "talent"."case_link_type" NOT NULL,
	"reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_case_links_no_self_loop" CHECK (NOT ("sourceType" = "targetType" AND "sourceId" = "targetId"))
);
--> statement-breakpoint
DROP INDEX "talent"."idx_employee_skills_level";--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" ADD COLUMN "tenantId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" ADD COLUMN "createdBy" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" ADD COLUMN "updatedBy" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "talent"."employee_skills" ADD COLUMN "proficiency" "talent"."proficiency_level" DEFAULT 'BEGINNER'::"talent"."proficiency_level" NOT NULL;--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" DROP COLUMN "isRequired";--> statement-breakpoint
ALTER TABLE "talent"."employee_skills" DROP COLUMN "proficiencyLevel";--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" ALTER COLUMN "requiredLevel" DROP DEFAULT;--> statement-breakpoint
DROP INDEX "talent"."idx_competency_skills_framework";--> statement-breakpoint
CREATE INDEX "idx_competency_skills_framework" ON "talent"."competency_skills" ("tenantId","frameworkId");--> statement-breakpoint
DROP INDEX "talent"."idx_competency_skills_skill";--> statement-breakpoint
CREATE INDEX "idx_competency_skills_skill" ON "talent"."competency_skills" ("tenantId","skillId");--> statement-breakpoint
DROP INDEX "talent"."uq_competency_skills_framework_skill";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_competency_skills_framework_skill" ON "talent"."competency_skills" ("tenantId","frameworkId","skillId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employee_skills_proficiency" ON "talent"."employee_skills" ("tenantId","proficiency");--> statement-breakpoint
CREATE INDEX "idx_employee_certifications_tenant" ON "talent"."employee_certifications" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_employee_certifications_employee" ON "talent"."employee_certifications" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_employee_certifications_certification" ON "talent"."employee_certifications" ("tenantId","certificationId");--> statement-breakpoint
CREATE INDEX "idx_employee_certifications_status" ON "talent"."employee_certifications" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_employee_certifications_active" ON "talent"."employee_certifications" ("tenantId","employeeId","certificationId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_performance_review_goals_tenant" ON "talent"."performance_review_goals" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_performance_review_goals_review" ON "talent"."performance_review_goals" ("tenantId","reviewId");--> statement-breakpoint
CREATE INDEX "idx_performance_review_goals_goal" ON "talent"."performance_review_goals" ("tenantId","goalId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_performance_review_goals_review_goal" ON "talent"."performance_review_goals" ("tenantId","reviewId","goalId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_talent_pool_memberships_tenant" ON "talent"."talent_pool_memberships" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_talent_pool_memberships_pool" ON "talent"."talent_pool_memberships" ("tenantId","talentPoolId");--> statement-breakpoint
CREATE INDEX "idx_talent_pool_memberships_employee" ON "talent"."talent_pool_memberships" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_talent_pool_memberships_status" ON "talent"."talent_pool_memberships" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_talent_pool_memberships_active" ON "talent"."talent_pool_memberships" ("tenantId","talentPoolId","employeeId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_case_links_tenant" ON "talent"."case_links" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_case_links_source" ON "talent"."case_links" ("tenantId","sourceType","sourceId");--> statement-breakpoint
CREATE INDEX "idx_case_links_target" ON "talent"."case_links" ("tenantId","targetType","targetId");--> statement-breakpoint
CREATE INDEX "idx_case_links_link_type" ON "talent"."case_links" ("tenantId","linkType");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_case_links_tuple" ON "talent"."case_links" ("tenantId","sourceType","sourceId","targetType","targetId","linkType") WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "talent"."competency_skills" ADD CONSTRAINT "fk_competency_skills_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."employee_certifications" ADD CONSTRAINT "fk_employee_certifications_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."employee_certifications" ADD CONSTRAINT "fk_employee_certifications_certification" FOREIGN KEY ("certificationId") REFERENCES "talent"."certifications"("certificationId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."performance_review_goals" ADD CONSTRAINT "fk_performance_review_goals_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."performance_review_goals" ADD CONSTRAINT "fk_performance_review_goals_review" FOREIGN KEY ("reviewId") REFERENCES "talent"."performance_reviews"("reviewId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."performance_review_goals" ADD CONSTRAINT "fk_performance_review_goals_goal" FOREIGN KEY ("goalId") REFERENCES "talent"."performance_goals"("goalId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."talent_pool_memberships" ADD CONSTRAINT "fk_talent_pool_memberships_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."talent_pool_memberships" ADD CONSTRAINT "fk_talent_pool_memberships_pool" FOREIGN KEY ("talentPoolId") REFERENCES "talent"."talent_pools"("talentPoolId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."case_links" ADD CONSTRAINT "fk_case_links_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "talent"."skills" ADD CONSTRAINT "chk_skills_skill_code" CHECK ("skillCode" ~ '^[A-Za-z0-9_-]+$' AND char_length("skillCode") >= 2 AND char_length("skillCode") <= 50);--> statement-breakpoint
ALTER TABLE "talent"."skills" ADD CONSTRAINT "chk_skills_name_length" CHECK (char_length("name") >= 1 AND char_length("name") <= 200);--> statement-breakpoint
ALTER TABLE "talent"."skills" ADD CONSTRAINT "chk_skills_description_length" CHECK (("description" IS NULL OR char_length("description") <= 1000));