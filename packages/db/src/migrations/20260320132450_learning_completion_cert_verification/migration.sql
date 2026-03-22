-- learning.training_enrollments: completionDate iff status COMPLETED + reporting index.
-- talent.employee_certifications: verifiedBy/verificationDate pairing; none while PENDING_VERIFICATION.
-- Preflight: docs/preflight/preflight-learning-completion-cert-verification.sql | pnpm check:learning-cert-lifecycle-preflight
CREATE INDEX "idx_training_enrollments_completed_reporting" ON "learning"."training_enrollments" ("tenantId","completionDate") WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED'::"learning"."training_enrollment_status";--> statement-breakpoint
ALTER TABLE "learning"."training_enrollments" ADD CONSTRAINT "chk_training_enrollments_completion_consistency" CHECK (("completionDate" IS NULL OR "status"::text = 'COMPLETED') AND
          ("status"::text != 'COMPLETED' OR "completionDate" IS NOT NULL));--> statement-breakpoint
CREATE INDEX "idx_employee_certifications_verified_reporting" ON "talent"."employee_certifications" ("tenantId","verificationDate") WHERE "deletedAt" IS NULL AND "verifiedBy" IS NOT NULL AND "verificationDate" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "talent"."employee_certifications" ADD CONSTRAINT "chk_employee_certifications_verification_consistency" CHECK ((("verifiedBy" IS NULL) = ("verificationDate" IS NULL)) AND
          ("status"::text != 'PENDING_VERIFICATION' OR ("verifiedBy" IS NULL AND "verificationDate" IS NULL)));
