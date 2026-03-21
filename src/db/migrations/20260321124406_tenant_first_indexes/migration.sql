CREATE INDEX "idx_persons_created" ON "hr"."persons" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_employees_created" ON "hr"."employees" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_departments_status" ON "hr"."departments" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_departments_created" ON "hr"."departments" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_positions_created" ON "hr"."positions" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_employment_contracts_created" ON "hr"."employment_contracts" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_timesheets_created" ON "hr"."timesheets" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_created" ON "hr"."attendance_logs" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_created" ON "hr"."leave_requests" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_created" ON "payroll"."payroll_runs" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_payslips_created" ON "payroll"."payslips" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_benefit_enrollments_created" ON "benefits"."benefit_enrollments" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_created" ON "talent"."performance_reviews" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_succession_plans_created" ON "talent"."succession_plans" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_created" ON "talent"."grievance_records" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_courses_created" ON "learning"."courses" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_candidates_created" ON "recruitment"."candidates" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_applications_created" ON "recruitment"."applications" ("tenantId","createdAt");