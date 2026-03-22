--> statement-breakpoint

-- CUSTOM: Tenant RLS for core/security platform tables not covered by 20260321131000_rls_tenant_isolation (CSQL-016)
-- Catalog, messaging, attachments, sessions, preferences; same tenant_isolation policy as CSQL-RLS-002.

-- CORE — announcements & app shell
ALTER TABLE "core"."announcement_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."announcement_posts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."announcement_posts";
CREATE POLICY tenant_isolation ON "core"."announcement_posts"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."app_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."app_modules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."app_modules";
CREATE POLICY tenant_isolation ON "core"."app_modules"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."attachments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."attachments";
CREATE POLICY tenant_isolation ON "core"."attachments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."dashboard_widgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."dashboard_widgets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."dashboard_widgets";
CREATE POLICY tenant_isolation ON "core"."dashboard_widgets"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."email_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."email_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."email_logs";
CREATE POLICY tenant_isolation ON "core"."email_logs"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."email_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."email_templates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."email_templates";
CREATE POLICY tenant_isolation ON "core"."email_templates"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."letter_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."letter_instances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."letter_instances";
CREATE POLICY tenant_isolation ON "core"."letter_instances"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."letter_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."letter_templates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."letter_templates";
CREATE POLICY tenant_isolation ON "core"."letter_templates"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."menu_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."menu_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."menu_items";
CREATE POLICY tenant_isolation ON "core"."menu_items"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."notification_channels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."notification_channels" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."notification_channels";
CREATE POLICY tenant_isolation ON "core"."notification_channels"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."notifications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."notifications";
CREATE POLICY tenant_isolation ON "core"."notifications"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."notification_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."notification_templates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."notification_templates";
CREATE POLICY tenant_isolation ON "core"."notification_templates"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."user_dashboard_widgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."user_dashboard_widgets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."user_dashboard_widgets";
CREATE POLICY tenant_isolation ON "core"."user_dashboard_widgets"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."workflow_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."workflow_definitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."workflow_definitions";
CREATE POLICY tenant_isolation ON "core"."workflow_definitions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."workflow_instances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."workflow_instances";
CREATE POLICY tenant_isolation ON "core"."workflow_instances"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- SECURITY
ALTER TABLE "security"."user_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."user_preferences" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."user_preferences";
CREATE POLICY tenant_isolation ON "security"."user_preferences"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."user_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."user_sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."user_sessions";
CREATE POLICY tenant_isolation ON "security"."user_sessions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);
