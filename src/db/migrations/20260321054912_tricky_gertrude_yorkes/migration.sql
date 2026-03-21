UPDATE "learning"."courses" SET "durationHours" = 1000 WHERE "durationHours" IS NOT NULL AND "durationHours" > 1000;--> statement-breakpoint
UPDATE "learning"."courses" SET "maxParticipants" = 1000 WHERE "maxParticipants" IS NOT NULL AND "maxParticipants" > 1000;--> statement-breakpoint
UPDATE "learning"."courses" SET "currencyId" = (SELECT "currencyId" FROM "core"."currencies" WHERE "deletedAt" IS NULL ORDER BY "currencyId" ASC LIMIT 1) WHERE "cost" IS NOT NULL AND "currencyId" IS NULL;--> statement-breakpoint
UPDATE "learning"."courses" SET "cost" = 99999999.99 WHERE "cost" IS NOT NULL AND "cost" > 99999999.99;--> statement-breakpoint
ALTER TABLE "learning"."courses" DROP CONSTRAINT "chk_courses_duration", ADD CONSTRAINT "chk_courses_duration" CHECK ("durationHours" IS NULL OR ("durationHours" >= 1 AND "durationHours" <= 1000));--> statement-breakpoint
ALTER TABLE "learning"."courses" DROP CONSTRAINT "chk_courses_max_participants", ADD CONSTRAINT "chk_courses_max_participants" CHECK ("maxParticipants" IS NULL OR ("maxParticipants" >= 1 AND "maxParticipants" <= 1000));--> statement-breakpoint
ALTER TABLE "learning"."courses" DROP CONSTRAINT "chk_courses_cost", ADD CONSTRAINT "chk_courses_cost" CHECK ("cost" IS NULL OR ("cost" >= 0 AND "cost" <= 99999999.99 AND "currencyId" IS NOT NULL));
