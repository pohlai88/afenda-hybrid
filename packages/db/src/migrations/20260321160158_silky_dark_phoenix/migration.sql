CREATE TYPE "core"."dashboard_widget_type" AS ENUM('CHART', 'TABLE', 'METRIC', 'LIST', 'CALENDAR');--> statement-breakpoint
CREATE TYPE "security"."user_theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "core"."app_modules" (
	"appModuleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."app_modules_appModuleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"basePath" text NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."attachments" (
	"attachmentId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."attachments_attachmentId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"refSchema" text NOT NULL,
	"refTable" text NOT NULL,
	"refId" integer NOT NULL,
	"fileName" text NOT NULL,
	"fileSize" bigint NOT NULL,
	"mimeType" text NOT NULL,
	"storageKey" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_attachments_file_size" CHECK ("fileSize" > 0)
);
--> statement-breakpoint
CREATE TABLE "core"."dashboard_widgets" (
	"widgetId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."dashboard_widgets_widgetId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"appModuleId" integer,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"widgetType" "core"."dashboard_widget_type" NOT NULL,
	"dataQuery" text NOT NULL,
	"config" jsonb,
	"defaultWidth" integer DEFAULT 4 NOT NULL,
	"defaultHeight" integer DEFAULT 3 NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_dashboard_widgets_width" CHECK ("defaultWidth" >= 1 AND "defaultWidth" <= 12),
	CONSTRAINT "chk_dashboard_widgets_height" CHECK ("defaultHeight" >= 1 AND "defaultHeight" <= 12)
);
--> statement-breakpoint
CREATE TABLE "core"."menu_items" (
	"menuItemId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."menu_items_menuItemId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"appModuleId" integer NOT NULL,
	"parentId" integer,
	"label" text NOT NULL,
	"icon" text,
	"path" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"requiredPermissions" jsonb,
	"badgeQuery" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_menu_items_sort_order" CHECK ("sortOrder" >= 0)
);
--> statement-breakpoint
CREATE TABLE "security"."user_preferences" (
	"userPreferenceId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."user_preferences_userPreferenceId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"userId" integer NOT NULL,
	"locale" text,
	"timezone" text,
	"theme" "security"."user_theme" DEFAULT 'system'::"security"."user_theme" NOT NULL,
	"sidebarCollapsed" boolean DEFAULT false NOT NULL,
	"defaultFilters" jsonb,
	"dashboardLayout" jsonb,
	"recentResources" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security"."user_sessions" (
	"sessionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."user_sessions_sessionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"userId" integer NOT NULL,
	"sessionToken" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"expiresAt" timestamp with time zone NOT NULL,
	"lastActivityAt" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security"."users" ADD COLUMN "avatarUrl" text;--> statement-breakpoint
ALTER TABLE "security"."users" ADD COLUMN "lastLoginAt" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_app_modules_tenant" ON "core"."app_modules" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_app_modules_enabled" ON "core"."app_modules" ("tenantId","isEnabled","sortOrder");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_app_modules_code" ON "core"."app_modules" ("tenantId",lower("code")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_attachments_tenant" ON "core"."attachments" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_attachments_reference" ON "core"."attachments" ("tenantId","refSchema","refTable","refId");--> statement-breakpoint
CREATE INDEX "idx_attachments_created_at" ON "core"."attachments" ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_dashboard_widgets_tenant" ON "core"."dashboard_widgets" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_dashboard_widgets_module" ON "core"."dashboard_widgets" ("tenantId","appModuleId");--> statement-breakpoint
CREATE INDEX "idx_dashboard_widgets_type" ON "core"."dashboard_widgets" ("tenantId","widgetType");--> statement-breakpoint
CREATE INDEX "idx_dashboard_widgets_enabled" ON "core"."dashboard_widgets" ("tenantId","isEnabled");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_dashboard_widgets_code" ON "core"."dashboard_widgets" ("tenantId",lower("code")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_menu_items_tenant" ON "core"."menu_items" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_menu_items_module" ON "core"."menu_items" ("tenantId","appModuleId");--> statement-breakpoint
CREATE INDEX "idx_menu_items_parent" ON "core"."menu_items" ("tenantId","parentId");--> statement-breakpoint
CREATE INDEX "idx_menu_items_enabled_sort" ON "core"."menu_items" ("tenantId","isEnabled","sortOrder");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_tenant" ON "security"."user_preferences" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_user" ON "security"."user_preferences" ("tenantId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_preferences_user" ON "security"."user_preferences" ("tenantId","userId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_user_sessions_tenant" ON "security"."user_sessions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user" ON "security"."user_sessions" ("tenantId","userId");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_token" ON "security"."user_sessions" ("sessionToken");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_expires" ON "security"."user_sessions" ("expiresAt");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_last_activity" ON "security"."user_sessions" ("lastActivityAt");--> statement-breakpoint
ALTER TABLE "core"."app_modules" ADD CONSTRAINT "fk_app_modules_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."attachments" ADD CONSTRAINT "fk_attachments_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."dashboard_widgets" ADD CONSTRAINT "fk_dashboard_widgets_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."dashboard_widgets" ADD CONSTRAINT "fk_dashboard_widgets_module" FOREIGN KEY ("appModuleId") REFERENCES "core"."app_modules"("appModuleId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."menu_items" ADD CONSTRAINT "fk_menu_items_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."menu_items" ADD CONSTRAINT "fk_menu_items_module" FOREIGN KEY ("appModuleId") REFERENCES "core"."app_modules"("appModuleId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."menu_items" ADD CONSTRAINT "fk_menu_items_parent" FOREIGN KEY ("parentId") REFERENCES "core"."menu_items"("menuItemId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_preferences" ADD CONSTRAINT "fk_user_preferences_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_preferences" ADD CONSTRAINT "fk_user_preferences_user" FOREIGN KEY ("userId") REFERENCES "security"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_sessions" ADD CONSTRAINT "fk_user_sessions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_sessions" ADD CONSTRAINT "fk_user_sessions_user" FOREIGN KEY ("userId") REFERENCES "security"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;