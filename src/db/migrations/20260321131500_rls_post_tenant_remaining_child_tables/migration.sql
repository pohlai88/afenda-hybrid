--> statement-breakpoint

-- CUSTOM: RLS for tables that receive tenantId in 20260321131425_add_tenant_id_remaining_child_tables (CSQL-RLS-003)
-- Must run after tenantId column + FK exist on these relations.

ALTER TABLE "talent"."goal_tracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."goal_tracking" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."goal_tracking";
CREATE POLICY tenant_isolation ON "talent"."goal_tracking"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."learning_path_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."learning_path_courses" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."learning_path_courses";
CREATE POLICY tenant_isolation ON "learning"."learning_path_courses"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."learning_path_course_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."learning_path_course_progress" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."learning_path_course_progress";
CREATE POLICY tenant_isolation ON "learning"."learning_path_course_progress"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."training_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."training_feedback" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."training_feedback";
CREATE POLICY tenant_isolation ON "learning"."training_feedback"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);
