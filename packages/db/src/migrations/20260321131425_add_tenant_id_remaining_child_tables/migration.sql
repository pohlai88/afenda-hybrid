ALTER TABLE "talent"."goal_tracking" ADD COLUMN "tenantId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_courses" ADD COLUMN "tenantId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_course_progress" ADD COLUMN "tenantId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "learning"."training_feedback" ADD COLUMN "tenantId" integer NOT NULL;--> statement-breakpoint
DROP INDEX "talent"."idx_goal_tracking_goal";--> statement-breakpoint
CREATE INDEX "idx_goal_tracking_goal" ON "talent"."goal_tracking" ("tenantId","goalId");--> statement-breakpoint
DROP INDEX "talent"."idx_goal_tracking_date";--> statement-breakpoint
CREATE INDEX "idx_goal_tracking_date" ON "talent"."goal_tracking" ("tenantId","goalId","trackingDate");--> statement-breakpoint
DROP INDEX "talent"."idx_goal_tracking_tracking_date";--> statement-breakpoint
CREATE INDEX "idx_goal_tracking_tracking_date" ON "talent"."goal_tracking" ("tenantId","trackingDate");--> statement-breakpoint
DROP INDEX "talent"."uq_goal_tracking_goal_date";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_goal_tracking_goal_date" ON "talent"."goal_tracking" ("tenantId","goalId","trackingDate");--> statement-breakpoint
DROP INDEX "learning"."idx_learning_path_courses_path";--> statement-breakpoint
CREATE INDEX "idx_learning_path_courses_path" ON "learning"."learning_path_courses" ("tenantId","learningPathId");--> statement-breakpoint
DROP INDEX "learning"."idx_learning_path_courses_course";--> statement-breakpoint
CREATE INDEX "idx_learning_path_courses_course" ON "learning"."learning_path_courses" ("tenantId","courseId");--> statement-breakpoint
DROP INDEX "learning"."idx_learning_path_courses_sequence";--> statement-breakpoint
CREATE INDEX "idx_learning_path_courses_sequence" ON "learning"."learning_path_courses" ("tenantId","learningPathId","sequenceNumber");--> statement-breakpoint
DROP INDEX "learning"."uq_learning_path_courses_path_course";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_path_courses_path_course" ON "learning"."learning_path_courses" ("tenantId","learningPathId","courseId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
DROP INDEX "learning"."uq_learning_path_courses_sequence";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_path_courses_sequence" ON "learning"."learning_path_courses" ("tenantId","learningPathId","sequenceNumber") WHERE "deletedAt" IS NULL;--> statement-breakpoint
DROP INDEX "learning"."idx_learning_path_course_progress_assignment";--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_progress_assignment" ON "learning"."learning_path_course_progress" ("tenantId","pathAssignmentId");--> statement-breakpoint
DROP INDEX "learning"."idx_learning_path_course_progress_path_course";--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_progress_path_course" ON "learning"."learning_path_course_progress" ("tenantId","pathCourseId");--> statement-breakpoint
DROP INDEX "learning"."idx_learning_path_course_progress_status";--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_progress_status" ON "learning"."learning_path_course_progress" ("tenantId","pathAssignmentId","status");--> statement-breakpoint
DROP INDEX "learning"."uq_learning_path_course_progress_assignment_course";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_path_course_progress_assignment_course" ON "learning"."learning_path_course_progress" ("tenantId","pathAssignmentId","pathCourseId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
DROP INDEX "learning"."idx_training_feedback_session";--> statement-breakpoint
CREATE INDEX "idx_training_feedback_session" ON "learning"."training_feedback" ("tenantId","sessionId");--> statement-breakpoint
DROP INDEX "learning"."idx_training_feedback_employee";--> statement-breakpoint
CREATE INDEX "idx_training_feedback_employee" ON "learning"."training_feedback" ("tenantId","employeeId");--> statement-breakpoint
DROP INDEX "learning"."uq_training_feedback_session_employee";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_training_feedback_session_employee" ON "learning"."training_feedback" ("tenantId","sessionId","employeeId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_goal_tracking_tenant" ON "talent"."goal_tracking" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_courses_tenant" ON "learning"."learning_path_courses" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_progress_tenant" ON "learning"."learning_path_course_progress" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_training_feedback_tenant" ON "learning"."training_feedback" ("tenantId");--> statement-breakpoint
ALTER TABLE "talent"."goal_tracking" ADD CONSTRAINT "fk_goal_tracking_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_courses" ADD CONSTRAINT "fk_learning_path_courses_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."learning_path_course_progress" ADD CONSTRAINT "fk_learning_path_course_progress_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."training_feedback" ADD CONSTRAINT "fk_training_feedback_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;