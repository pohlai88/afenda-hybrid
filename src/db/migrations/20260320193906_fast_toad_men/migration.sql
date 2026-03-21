DROP INDEX "recruitment"."uq_exit_interviews_linked_checklist_active";--> statement-breakpoint
DROP INDEX "recruitment"."uq_candidate_salary_backfill_issues_candidate";--> statement-breakpoint
CREATE INDEX "idx_person_documents_tenant_op_date" ON "hr"."person_documents" ("tenantId","status","uploadedAt");--> statement-breakpoint
CREATE INDEX "idx_timesheets_tenant_op_date" ON "hr"."timesheets" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_overtime_records_tenant_op_date" ON "hr"."overtime_records" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_shift_swaps_tenant_op_date" ON "hr"."shift_swaps" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_tenant_op_date" ON "hr"."leave_requests" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_service_requests_tenant_op_date" ON "hr"."service_requests" ("tenantId","status","resolvedAt");--> statement-breakpoint
CREATE INDEX "idx_document_requests_tenant_op_date" ON "hr"."document_requests" ("tenantId","status","processedAt");--> statement-breakpoint
CREATE INDEX "idx_employee_declarations_tenant_op_date" ON "hr"."employee_declarations" ("tenantId","status","submittedAt");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_tenant_op_date" ON "payroll"."payroll_runs" ("tenantId","status","processedAt");--> statement-breakpoint
CREATE INDEX "idx_payslips_tenant_op_date" ON "payroll"."payslips" ("tenantId","status","generatedAt");--> statement-breakpoint
CREATE INDEX "idx_payment_records_tenant_op_date" ON "payroll"."payment_records" ("tenantId","status","processedAt");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_tenant_op_date" ON "payroll"."expense_claims" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_loan_records_tenant_op_date" ON "payroll"."loan_records" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_final_settlements_tenant_op_date" ON "payroll"."final_settlements" ("tenantId","status","processedAt");--> statement-breakpoint
CREATE INDEX "idx_claims_records_tenant_op_date" ON "benefits"."claims_records" ("tenantId","status","reviewedAt");--> statement-breakpoint
CREATE INDEX "idx_promotion_records_tenant_op_date" ON "talent"."promotion_records" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_training_enrollments_tenant_op_date" ON "learning"."training_enrollments" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_job_requisitions_tenant_op_date" ON "recruitment"."job_requisitions" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_offer_letters_tenant_op_date" ON "recruitment"."offer_letters" ("tenantId","status","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_exit_interviews_tenant_op_date" ON "recruitment"."exit_interviews" ("tenantId","status","scheduledAt");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exit_interviews_tenant_linked_checklist_active" ON "recruitment"."exit_interviews" ("tenantId","linkedOffboardingChecklistId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_candidate_salary_backfill_issues_tenant_candidate" ON "recruitment"."candidate_salary_backfill_issues" ("tenantId","candidateId");--> statement-breakpoint
ALTER TABLE "benefits"."benefit_plans" ADD CONSTRAINT "fk_benefit_plans_provider" FOREIGN KEY ("providerId") REFERENCES "benefits"."benefits_providers"("providerId") ON DELETE RESTRICT ON UPDATE CASCADE;