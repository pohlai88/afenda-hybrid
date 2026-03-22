--> statement-breakpoint

-- CUSTOM: Enable Row-Level Security with tenant isolation policies (CSQL-RLS-002)
-- All tenant-scoped tables get RLS enabled with a standard policy that:
-- 1. Uses afenda.tenant_id session variable (set by setSessionContext())
-- 2. Filters rows where tenant_id = current_setting('afenda.tenant_id', true)::int
-- 3. Forces RLS for all roles except superusers
--
-- Global tables (tenants, currencies, regions, statutory_schemes, etc.) are NOT included.
-- The app_write and app_read roles are subject to these policies.

-- ============================================================================
-- CORE SCHEMA (4 tables)
-- ============================================================================

ALTER TABLE "core"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."organizations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."organizations";
CREATE POLICY tenant_isolation ON "core"."organizations"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."legal_entities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."legal_entities" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."legal_entities";
CREATE POLICY tenant_isolation ON "core"."legal_entities"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."cost_centers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."cost_centers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."cost_centers";
CREATE POLICY tenant_isolation ON "core"."cost_centers"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "core"."locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."locations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "core"."locations";
CREATE POLICY tenant_isolation ON "core"."locations"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- SECURITY SCHEMA (8 tables)
-- ============================================================================

ALTER TABLE "security"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."users" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."users";
CREATE POLICY tenant_isolation ON "security"."users"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."roles";
CREATE POLICY tenant_isolation ON "security"."roles"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."user_roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."user_roles";
CREATE POLICY tenant_isolation ON "security"."user_roles"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."service_principals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."service_principals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."service_principals";
CREATE POLICY tenant_isolation ON "security"."service_principals"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."permissions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."permissions";
CREATE POLICY tenant_isolation ON "security"."permissions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."role_permissions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."role_permissions";
CREATE POLICY tenant_isolation ON "security"."role_permissions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."user_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."user_permissions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."user_permissions";
CREATE POLICY tenant_isolation ON "security"."user_permissions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "security"."policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "security"."policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "security"."policies";
CREATE POLICY tenant_isolation ON "security"."policies"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- AUDIT SCHEMA (2 tables)
-- Note: retention_policies has nullable tenantId for global policies
-- ============================================================================

ALTER TABLE "audit"."audit_trail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit"."audit_trail" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "audit"."audit_trail";
CREATE POLICY tenant_isolation ON "audit"."audit_trail"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "audit"."retention_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit"."retention_policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "audit"."retention_policies";
CREATE POLICY tenant_isolation ON "audit"."retention_policies"
  FOR ALL
  USING ("tenantId" IS NULL OR "tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" IS NULL OR "tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- HR SCHEMA (38 tables)
-- ============================================================================

ALTER TABLE "hr"."employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."employees" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."employees";
CREATE POLICY tenant_isolation ON "hr"."employees"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."departments";
CREATE POLICY tenant_isolation ON "hr"."departments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."positions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."positions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."positions";
CREATE POLICY tenant_isolation ON "hr"."positions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."persons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."persons" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."persons";
CREATE POLICY tenant_isolation ON "hr"."persons"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."person_names" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."person_names" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."person_names";
CREATE POLICY tenant_isolation ON "hr"."person_names"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."contact_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."contact_methods" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."contact_methods";
CREATE POLICY tenant_isolation ON "hr"."contact_methods"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."addresses" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."addresses";
CREATE POLICY tenant_isolation ON "hr"."addresses"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."dependents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."dependents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."dependents";
CREATE POLICY tenant_isolation ON "hr"."dependents"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."emergency_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."emergency_contacts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."emergency_contacts";
CREATE POLICY tenant_isolation ON "hr"."emergency_contacts"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."national_identifiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."national_identifiers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."national_identifiers";
CREATE POLICY tenant_isolation ON "hr"."national_identifiers"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."person_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."person_documents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."person_documents";
CREATE POLICY tenant_isolation ON "hr"."person_documents"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."employment_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."employment_contracts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."employment_contracts";
CREATE POLICY tenant_isolation ON "hr"."employment_contracts"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."employment_status_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."employment_status_history" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."employment_status_history";
CREATE POLICY tenant_isolation ON "hr"."employment_status_history"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."job_families" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."job_families" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."job_families";
CREATE POLICY tenant_isolation ON "hr"."job_families"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."job_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."job_roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."job_roles";
CREATE POLICY tenant_isolation ON "hr"."job_roles"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."job_grades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."job_grades" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."job_grades";
CREATE POLICY tenant_isolation ON "hr"."job_grades"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."position_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."position_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."position_assignments";
CREATE POLICY tenant_isolation ON "hr"."position_assignments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."probation_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."probation_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."probation_records";
CREATE POLICY tenant_isolation ON "hr"."probation_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."notice_period_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."notice_period_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."notice_period_records";
CREATE POLICY tenant_isolation ON "hr"."notice_period_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."secondments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."secondments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."secondments";
CREATE POLICY tenant_isolation ON "hr"."secondments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."employee_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."employee_transfers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."employee_transfers";
CREATE POLICY tenant_isolation ON "hr"."employee_transfers"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."reporting_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."reporting_lines" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."reporting_lines";
CREATE POLICY tenant_isolation ON "hr"."reporting_lines"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."attendance_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."attendance_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."attendance_logs";
CREATE POLICY tenant_isolation ON "hr"."attendance_logs"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."leave_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."leave_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."leave_requests";
CREATE POLICY tenant_isolation ON "hr"."leave_requests"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."leave_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."leave_balances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."leave_balances";
CREATE POLICY tenant_isolation ON "hr"."leave_balances"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."leave_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."leave_types" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."leave_types";
CREATE POLICY tenant_isolation ON "hr"."leave_types"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."timesheets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."timesheets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."timesheets";
CREATE POLICY tenant_isolation ON "hr"."timesheets"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."shift_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."shift_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."shift_assignments";
CREATE POLICY tenant_isolation ON "hr"."shift_assignments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."shift_swaps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."shift_swaps" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."shift_swaps";
CREATE POLICY tenant_isolation ON "hr"."shift_swaps"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."work_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."work_schedules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."work_schedules";
CREATE POLICY tenant_isolation ON "hr"."work_schedules"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."overtime_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."overtime_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."overtime_records";
CREATE POLICY tenant_isolation ON "hr"."overtime_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."absence_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."absence_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."absence_records";
CREATE POLICY tenant_isolation ON "hr"."absence_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."holiday_calendars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."holiday_calendars" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."holiday_calendars";
CREATE POLICY tenant_isolation ON "hr"."holiday_calendars"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."holiday_calendar_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."holiday_calendar_entries" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."holiday_calendar_entries";
CREATE POLICY tenant_isolation ON "hr"."holiday_calendar_entries"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."asset_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."asset_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."asset_assignments";
CREATE POLICY tenant_isolation ON "hr"."asset_assignments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."employee_declarations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."employee_declarations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."employee_declarations";
CREATE POLICY tenant_isolation ON "hr"."employee_declarations"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."service_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."service_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."service_requests";
CREATE POLICY tenant_isolation ON "hr"."service_requests"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "hr"."document_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hr"."document_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "hr"."document_requests";
CREATE POLICY tenant_isolation ON "hr"."document_requests"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- PAYROLL SCHEMA (17 tables)
-- ============================================================================

ALTER TABLE "payroll"."pay_components" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."pay_components" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."pay_components";
CREATE POLICY tenant_isolation ON "payroll"."pay_components"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."pay_grade_structures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."pay_grade_structures" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."pay_grade_structures";
CREATE POLICY tenant_isolation ON "payroll"."pay_grade_structures"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."earnings_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."earnings_types" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."earnings_types";
CREATE POLICY tenant_isolation ON "payroll"."earnings_types"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."deduction_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."deduction_types" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."deduction_types";
CREATE POLICY tenant_isolation ON "payroll"."deduction_types"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."expense_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."expense_types" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."expense_types";
CREATE POLICY tenant_isolation ON "payroll"."expense_types"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."bank_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."bank_accounts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."bank_accounts";
CREATE POLICY tenant_isolation ON "payroll"."bank_accounts"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."tax_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."tax_profiles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."tax_profiles";
CREATE POLICY tenant_isolation ON "payroll"."tax_profiles"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."social_insurance_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."social_insurance_profiles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."social_insurance_profiles";
CREATE POLICY tenant_isolation ON "payroll"."social_insurance_profiles"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."compensation_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."compensation_packages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."compensation_packages";
CREATE POLICY tenant_isolation ON "payroll"."compensation_packages"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."payroll_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."payroll_periods" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."payroll_periods";
CREATE POLICY tenant_isolation ON "payroll"."payroll_periods"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."payroll_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."payroll_runs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."payroll_runs";
CREATE POLICY tenant_isolation ON "payroll"."payroll_runs"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."payroll_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."payroll_entries" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."payroll_entries";
CREATE POLICY tenant_isolation ON "payroll"."payroll_entries"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."payslips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."payslips" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."payslips";
CREATE POLICY tenant_isolation ON "payroll"."payslips"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."payment_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."payment_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."payment_records";
CREATE POLICY tenant_isolation ON "payroll"."payment_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."expense_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."expense_claims" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."expense_claims";
CREATE POLICY tenant_isolation ON "payroll"."expense_claims"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."loan_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."loan_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."loan_records";
CREATE POLICY tenant_isolation ON "payroll"."loan_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "payroll"."final_settlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll"."final_settlements" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "payroll"."final_settlements";
CREATE POLICY tenant_isolation ON "payroll"."final_settlements"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- BENEFITS SCHEMA (5 tables)
-- ============================================================================

ALTER TABLE "benefits"."benefit_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefits"."benefit_plans" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "benefits"."benefit_plans";
CREATE POLICY tenant_isolation ON "benefits"."benefit_plans"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "benefits"."benefits_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefits"."benefits_providers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "benefits"."benefits_providers";
CREATE POLICY tenant_isolation ON "benefits"."benefits_providers"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "benefits"."benefit_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefits"."benefit_enrollments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "benefits"."benefit_enrollments";
CREATE POLICY tenant_isolation ON "benefits"."benefit_enrollments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "benefits"."claims_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefits"."claims_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "benefits"."claims_records";
CREATE POLICY tenant_isolation ON "benefits"."claims_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "benefits"."dependent_coverages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefits"."dependent_coverages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "benefits"."dependent_coverages";
CREATE POLICY tenant_isolation ON "benefits"."dependent_coverages"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- TALENT SCHEMA (16 tables)
-- ============================================================================

ALTER TABLE "talent"."skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."skills" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."skills";
CREATE POLICY tenant_isolation ON "talent"."skills"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."certifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."certifications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."certifications";
CREATE POLICY tenant_isolation ON "talent"."certifications"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."competency_frameworks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."competency_frameworks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."competency_frameworks";
CREATE POLICY tenant_isolation ON "talent"."competency_frameworks"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."competency_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."competency_skills" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."competency_skills";
CREATE POLICY tenant_isolation ON "talent"."competency_skills"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."talent_pools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."talent_pools" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."talent_pools";
CREATE POLICY tenant_isolation ON "talent"."talent_pools"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."talent_pool_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."talent_pool_memberships" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."talent_pool_memberships";
CREATE POLICY tenant_isolation ON "talent"."talent_pool_memberships"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."performance_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."performance_goals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."performance_goals";
CREATE POLICY tenant_isolation ON "talent"."performance_goals"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."performance_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."performance_reviews" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."performance_reviews";
CREATE POLICY tenant_isolation ON "talent"."performance_reviews"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."performance_review_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."performance_review_goals" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."performance_review_goals";
CREATE POLICY tenant_isolation ON "talent"."performance_review_goals"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."employee_certifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."employee_certifications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."employee_certifications";
CREATE POLICY tenant_isolation ON "talent"."employee_certifications"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."succession_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."succession_plans" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."succession_plans";
CREATE POLICY tenant_isolation ON "talent"."succession_plans"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."grievance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."grievance_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."grievance_records";
CREATE POLICY tenant_isolation ON "talent"."grievance_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."disciplinary_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."disciplinary_actions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."disciplinary_actions";
CREATE POLICY tenant_isolation ON "talent"."disciplinary_actions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."promotion_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."promotion_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."promotion_records";
CREATE POLICY tenant_isolation ON "talent"."promotion_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."case_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."case_links" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."case_links";
CREATE POLICY tenant_isolation ON "talent"."case_links"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "talent"."employee_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "talent"."employee_skills" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "talent"."employee_skills";
CREATE POLICY tenant_isolation ON "talent"."employee_skills"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- LEARNING SCHEMA (11 tables)
-- ============================================================================

ALTER TABLE "learning"."courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."courses" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."courses";
CREATE POLICY tenant_isolation ON "learning"."courses"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."course_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."course_modules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."course_modules";
CREATE POLICY tenant_isolation ON "learning"."course_modules"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."learning_paths" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."learning_paths" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."learning_paths";
CREATE POLICY tenant_isolation ON "learning"."learning_paths"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."learning_path_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."learning_path_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."learning_path_assignments";
CREATE POLICY tenant_isolation ON "learning"."learning_path_assignments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."trainers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."trainers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."trainers";
CREATE POLICY tenant_isolation ON "learning"."trainers"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."training_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."training_sessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."training_sessions";
CREATE POLICY tenant_isolation ON "learning"."training_sessions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."training_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."training_enrollments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."training_enrollments";
CREATE POLICY tenant_isolation ON "learning"."training_enrollments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."course_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."course_enrollments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."course_enrollments";
CREATE POLICY tenant_isolation ON "learning"."course_enrollments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."assessments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."assessments";
CREATE POLICY tenant_isolation ON "learning"."assessments"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."certification_awards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."certification_awards" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."certification_awards";
CREATE POLICY tenant_isolation ON "learning"."certification_awards"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "learning"."training_cost_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning"."training_cost_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "learning"."training_cost_records";
CREATE POLICY tenant_isolation ON "learning"."training_cost_records"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- ============================================================================
-- RECRUITMENT SCHEMA (11 tables)
-- ============================================================================

ALTER TABLE "recruitment"."candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."candidates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."candidates";
CREATE POLICY tenant_isolation ON "recruitment"."candidates"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."job_requisitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."job_requisitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."job_requisitions";
CREATE POLICY tenant_isolation ON "recruitment"."job_requisitions"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."applications" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."applications";
CREATE POLICY tenant_isolation ON "recruitment"."applications"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."interviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."interviews" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."interviews";
CREATE POLICY tenant_isolation ON "recruitment"."interviews"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."offer_letters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."offer_letters" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."offer_letters";
CREATE POLICY tenant_isolation ON "recruitment"."offer_letters"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."background_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."background_checks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."background_checks";
CREATE POLICY tenant_isolation ON "recruitment"."background_checks"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."onboarding_checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."onboarding_checklists" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."onboarding_checklists";
CREATE POLICY tenant_isolation ON "recruitment"."onboarding_checklists"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."offboarding_checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."offboarding_checklists" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."offboarding_checklists";
CREATE POLICY tenant_isolation ON "recruitment"."offboarding_checklists"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."probation_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."probation_evaluations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."probation_evaluations";
CREATE POLICY tenant_isolation ON "recruitment"."probation_evaluations"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."exit_interviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."exit_interviews" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."exit_interviews";
CREATE POLICY tenant_isolation ON "recruitment"."exit_interviews"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

ALTER TABLE "recruitment"."candidate_salary_backfill_issues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment"."candidate_salary_backfill_issues" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "recruitment"."candidate_salary_backfill_issues";
CREATE POLICY tenant_isolation ON "recruitment"."candidate_salary_backfill_issues"
  FOR ALL
  USING ("tenantId" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("tenantId" = current_setting('afenda.tenant_id', true)::int);

-- RLS for talent.goal_tracking and learning.* child tables moved to
-- 20260321131500_rls_post_tenant_remaining_child_tables (after tenantId columns are added).
