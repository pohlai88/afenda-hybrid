-- Plan alignment: user_sessions (lifecycle + unique token), attachments (resource* + filePath + metadata),
-- core.user_dashboard_widgets (per-user placements; catalog remains in dashboard_widgets).

CREATE TYPE "security"."session_end_reason" AS ENUM ('LOGOUT', 'EXPIRED', 'REVOKED', 'REPLACED');
--> statement-breakpoint
ALTER TABLE "security"."user_sessions" ADD COLUMN "startedAt" timestamp with time zone;
--> statement-breakpoint
UPDATE "security"."user_sessions" SET "startedAt" = "createdAt" WHERE "startedAt" IS NULL;
--> statement-breakpoint
ALTER TABLE "security"."user_sessions" ALTER COLUMN "startedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "security"."user_sessions" ALTER COLUMN "startedAt" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "security"."user_sessions" ADD COLUMN "endedAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "security"."user_sessions" ADD COLUMN "endReason" "security"."session_end_reason";
--> statement-breakpoint
DELETE FROM "security"."user_sessions" a USING "security"."user_sessions" b
WHERE a."sessionId" < b."sessionId" AND a."sessionToken" = b."sessionToken";
--> statement-breakpoint
DROP INDEX IF EXISTS "security"."idx_user_sessions_token";
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_sessions_token" ON "security"."user_sessions" ("sessionToken");
--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user_activity" ON "security"."user_sessions" ("tenantId", "userId", "lastActivityAt" DESC);
--> statement-breakpoint
ALTER TABLE "core"."attachments" RENAME COLUMN "refSchema" TO "resourceSchema";
--> statement-breakpoint
ALTER TABLE "core"."attachments" RENAME COLUMN "refTable" TO "resourceTable";
--> statement-breakpoint
ALTER TABLE "core"."attachments" RENAME COLUMN "refId" TO "resourceId";
--> statement-breakpoint
ALTER TABLE "core"."attachments" RENAME COLUMN "storageKey" TO "filePath";
--> statement-breakpoint
ALTER TABLE "core"."attachments" ADD COLUMN "category" text;
--> statement-breakpoint
ALTER TABLE "core"."attachments" ADD COLUMN "description" text;
--> statement-breakpoint
ALTER TABLE "core"."attachments" ADD COLUMN "uploadedBy" integer;
--> statement-breakpoint
UPDATE "core"."attachments" SET "uploadedBy" = "createdBy" WHERE "uploadedBy" IS NULL;
--> statement-breakpoint
ALTER TABLE "core"."attachments" ALTER COLUMN "uploadedBy" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "core"."attachments" ADD CONSTRAINT "fk_attachments_uploaded_by" FOREIGN KEY ("uploadedBy") REFERENCES "security"."users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
DROP INDEX IF EXISTS "core"."idx_attachments_reference";
--> statement-breakpoint
CREATE INDEX "idx_attachments_reference" ON "core"."attachments" ("tenantId", "resourceSchema", "resourceTable", "resourceId");
--> statement-breakpoint
CREATE TABLE "core"."user_dashboard_widgets" (
	"userDashboardWidgetId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."user_dashboard_widgets_userDashboardWidgetId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"userId" integer NOT NULL,
	"templateWidgetId" integer,
	"widgetType" text NOT NULL,
	"title" text NOT NULL,
	"config" jsonb,
	"gridPosition" jsonb,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isVisible" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_user_dashboard_widgets_sort_order" CHECK ("sortOrder" >= 0)
);
--> statement-breakpoint
CREATE INDEX "idx_user_dashboard_widgets_tenant" ON "core"."user_dashboard_widgets" ("tenantId");
--> statement-breakpoint
CREATE INDEX "idx_user_dashboard_widgets_user" ON "core"."user_dashboard_widgets" ("tenantId", "userId");
--> statement-breakpoint
CREATE INDEX "idx_user_dashboard_widgets_user_sort" ON "core"."user_dashboard_widgets" ("tenantId", "userId", "sortOrder");
--> statement-breakpoint
ALTER TABLE "core"."user_dashboard_widgets" ADD CONSTRAINT "fk_user_dashboard_widgets_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "core"."user_dashboard_widgets" ADD CONSTRAINT "fk_user_dashboard_widgets_user" FOREIGN KEY ("userId") REFERENCES "security"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "core"."user_dashboard_widgets" ADD CONSTRAINT "fk_user_dashboard_widgets_template" FOREIGN KEY ("templateWidgetId") REFERENCES "core"."dashboard_widgets"("widgetId") ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "core"."user_dashboard_widgets" ADD CONSTRAINT "fk_user_dashboard_widgets_created_by" FOREIGN KEY ("createdBy") REFERENCES "security"."users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "core"."user_dashboard_widgets" ADD CONSTRAINT "fk_user_dashboard_widgets_updated_by" FOREIGN KEY ("updatedBy") REFERENCES "security"."users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
