UPDATE "learning"."course_modules" SET "durationMinutes" = 600 WHERE "durationMinutes" IS NOT NULL AND "durationMinutes" > 600;--> statement-breakpoint
ALTER TABLE "learning"."course_modules" DROP CONSTRAINT "chk_course_modules_duration", ADD CONSTRAINT "chk_course_modules_duration" CHECK ("durationMinutes" IS NULL OR ("durationMinutes" >= 1 AND "durationMinutes" <= 600));--> statement-breakpoint
