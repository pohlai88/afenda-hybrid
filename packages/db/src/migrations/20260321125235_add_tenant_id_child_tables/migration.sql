ALTER TABLE "hr"."holiday_calendar_entries" ADD COLUMN "tenantId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "learning"."course_modules" ADD COLUMN "tenantId" integer NOT NULL;--> statement-breakpoint
DROP INDEX "hr"."idx_holiday_calendar_entries_calendar";--> statement-breakpoint
CREATE INDEX "idx_holiday_calendar_entries_calendar" ON "hr"."holiday_calendar_entries" ("tenantId","calendarId");--> statement-breakpoint
DROP INDEX "hr"."idx_holiday_calendar_entries_date";--> statement-breakpoint
CREATE INDEX "idx_holiday_calendar_entries_date" ON "hr"."holiday_calendar_entries" ("tenantId","calendarId","holidayDate");--> statement-breakpoint
DROP INDEX "hr"."uq_holiday_calendar_entries_date";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_holiday_calendar_entries_date" ON "hr"."holiday_calendar_entries" ("tenantId","calendarId","holidayDate") WHERE "deletedAt" IS NULL;--> statement-breakpoint
DROP INDEX "learning"."idx_course_modules_course";--> statement-breakpoint
CREATE INDEX "idx_course_modules_course" ON "learning"."course_modules" ("tenantId","courseId");--> statement-breakpoint
DROP INDEX "learning"."idx_course_modules_sequence";--> statement-breakpoint
CREATE INDEX "idx_course_modules_sequence" ON "learning"."course_modules" ("tenantId","courseId","sequenceNumber");--> statement-breakpoint
DROP INDEX "learning"."idx_course_modules_status";--> statement-breakpoint
CREATE INDEX "idx_course_modules_status" ON "learning"."course_modules" ("tenantId","status");--> statement-breakpoint
DROP INDEX "learning"."uq_course_modules_code";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_course_modules_code" ON "learning"."course_modules" ("tenantId","courseId",lower("moduleCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
DROP INDEX "learning"."uq_course_modules_sequence";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_course_modules_sequence" ON "learning"."course_modules" ("tenantId","courseId","sequenceNumber") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_holiday_calendar_entries_tenant" ON "hr"."holiday_calendar_entries" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_course_modules_tenant" ON "learning"."course_modules" ("tenantId");--> statement-breakpoint
ALTER TABLE "hr"."holiday_calendar_entries" ADD CONSTRAINT "fk_holiday_calendar_entries_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "learning"."course_modules" ADD CONSTRAINT "fk_course_modules_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;