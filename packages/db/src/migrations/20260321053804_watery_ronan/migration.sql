CREATE TYPE "learning"."course_enrollment_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "learning"."path_assignment_status" AS ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "learning"."path_course_progress_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'WAIVED');--> statement-breakpoint
CREATE TABLE "learning"."course_enrollments" (
	"courseEnrollmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."course_enrollments_courseEnrollmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"enrolledAt" date NOT NULL,
	"status" "learning"."course_enrollment_status" DEFAULT 'PENDING'::"learning"."course_enrollment_status" NOT NULL,
	"completionDate" date,
	"dueBy" date,
	"complianceCode" varchar(100),
	"assignedBy" integer,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_course_enrollments_completion_consistency" CHECK (("completionDate" IS NULL OR "status"::text = 'COMPLETED') AND
          ("status"::text != 'COMPLETED' OR "completionDate" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "learning"."learning_path_assignments" (
	"pathAssignmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."learning_path_assignments_pathAssignmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"learningPathId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"assignedAt" date NOT NULL,
	"status" "learning"."path_assignment_status" DEFAULT 'ASSIGNED'::"learning"."path_assignment_status" NOT NULL,
	"dueBy" date,
	"complianceCode" varchar(100),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning"."learning_path_course_progress" (
	"pathCourseProgressId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning"."learning_path_course_progress_pathCourseProgressId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pathAssignmentId" integer NOT NULL,
	"pathCourseId" integer NOT NULL,
	"status" "learning"."path_course_progress_status" DEFAULT 'NOT_STARTED'::"learning"."path_course_progress_status" NOT NULL,
	"completionDate" date,
	"courseEnrollmentId" integer,
	"trainingEnrollmentId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_learning_path_course_progress_single_provenance" CHECK ("courseEnrollmentId" IS NULL OR "trainingEnrollmentId" IS NULL),
	CONSTRAINT "chk_learning_path_course_progress_completion_consistency" CHECK (("completionDate" IS NULL OR "status"::text = 'COMPLETED') AND
          ("status"::text != 'COMPLETED' OR "completionDate" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "learning"."training_enrollments" ADD COLUMN "dueBy" date;--> statement-breakpoint
ALTER TABLE "learning"."training_enrollments" ADD COLUMN "complianceCode" varchar(100);--> statement-breakpoint
CREATE INDEX "idx_training_enrollments_due" ON "learning"."training_enrollments" ("tenantId","dueBy") WHERE "deletedAt" IS NULL AND "dueBy" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_tenant" ON "learning"."course_enrollments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_course" ON "learning"."course_enrollments" ("tenantId","courseId");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_employee" ON "learning"."course_enrollments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_status" ON "learning"."course_enrollments" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_due" ON "learning"."course_enrollments" ("tenantId","dueBy") WHERE "deletedAt" IS NULL AND "dueBy" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_course_enrollments_completed_reporting" ON "learning"."course_enrollments" ("tenantId","completionDate") WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED'::"learning"."course_enrollment_status";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_course_enrollments_course_employee" ON "learning"."course_enrollments" ("tenantId","courseId","employeeId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_learning_path_assignments_tenant" ON "learning"."learning_path_assignments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_assignments_path" ON "learning"."learning_path_assignments" ("tenantId","learningPathId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_assignments_employee" ON "learning"."learning_path_assignments" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_assignments_status" ON "learning"."learning_path_assignments" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_learning_path_assignments_due" ON "learning"."learning_path_assignments" ("tenantId","dueBy") WHERE "deletedAt" IS NULL AND "dueBy" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_path_assignments_path_employee" ON "learning"."learning_path_assignments" ("tenantId","learningPathId","employeeId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_progress_assignment" ON "learning"."learning_path_course_progress" ("pathAssignmentId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_progress_path_course" ON "learning"."learning_path_course_progress" ("pathCourseId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_progress_status" ON "learning"."learning_path_course_progress" ("pathAssignmentId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_path_course_progress_assignment_course" ON "learning"."learning_path_course_progress" ("pathAssignmentId","pathCourseId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "learning"."course_enrollments" ADD CONSTRAINT "fk_course_enrollments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."course_enrollments" ADD CONSTRAINT "fk_course_enrollments_course" FOREIGN KEY ("courseId") REFERENCES "learning"."courses"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_assignments" ADD CONSTRAINT "fk_learning_path_assignments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_assignments" ADD CONSTRAINT "fk_learning_path_assignments_path" FOREIGN KEY ("learningPathId") REFERENCES "learning"."learning_paths"("learningPathId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_course_progress" ADD CONSTRAINT "fk_learning_path_course_progress_assignment" FOREIGN KEY ("pathAssignmentId") REFERENCES "learning"."learning_path_assignments"("pathAssignmentId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_course_progress" ADD CONSTRAINT "fk_learning_path_course_progress_path_course" FOREIGN KEY ("pathCourseId") REFERENCES "learning"."learning_path_courses"("pathCourseId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_course_progress" ADD CONSTRAINT "fk_learning_path_course_progress_course_enrollment" FOREIGN KEY ("courseEnrollmentId") REFERENCES "learning"."course_enrollments"("courseEnrollmentId") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_course_progress" ADD CONSTRAINT "fk_learning_path_course_progress_training_enrollment" FOREIGN KEY ("trainingEnrollmentId") REFERENCES "learning"."training_enrollments"("enrollmentId") ON DELETE SET NULL ON UPDATE CASCADE;