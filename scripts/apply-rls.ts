/**
 * Idempotent RLS Re-application Script
 * 
 * Drops ALL existing tenant_isolation policies and re-creates them for every
 * tenant-scoped table. Safe to run on any environment, any time.
 * 
 * Usage:
 *   pnpm tsx scripts/apply-rls.ts
 *   pnpm tsx scripts/apply-rls.ts --dry-run
 * 
 * @see docs/architecture/01-db-first-guideline.md
 */

import { config } from "dotenv";
import { Client } from "pg";

config({ override: true });

const dryRun = process.argv.includes("--dry-run");

interface TableConfig {
  schema: string;
  table: string;
  tenantIdColumn: string;
  policyName: string;
}

const TENANT_SCOPED_TABLES: TableConfig[] = [
  // Core schema
  { schema: "core", table: "organizations", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "core", table: "legal_entities", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "core", table: "cost_centers", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "core", table: "locations", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // Security schema
  { schema: "security", table: "users", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "security", table: "roles", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "security", table: "user_roles", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "security", table: "service_principals", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "security", table: "permissions", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "security", table: "role_permissions", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "security", table: "user_permissions", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "security", table: "policies", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // Audit schema
  { schema: "audit", table: "audit_trail", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "audit", table: "retention_policies", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // HR schema
  { schema: "hr", table: "employees", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "departments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "positions", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "persons", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "person_names", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "contact_methods", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "addresses", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "dependents", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "emergency_contacts", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "national_identifiers", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "person_documents", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "employment_contracts", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "employment_status_history", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "job_families", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "job_roles", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "job_grades", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "position_assignments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "probation_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "notice_period_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "secondments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "employee_transfers", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "reporting_lines", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "attendance_logs", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "leave_requests", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "leave_balances", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "leave_types", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "timesheets", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "shift_assignments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "shift_swaps", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "work_schedules", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "overtime_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "absence_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "holiday_calendars", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "holiday_calendar_entries", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "asset_assignments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "employee_declarations", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "service_requests", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "hr", table: "document_requests", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // Payroll schema
  { schema: "payroll", table: "pay_components", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "pay_grade_structures", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "earnings_types", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "deduction_types", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "expense_types", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "bank_accounts", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "tax_profiles", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "social_insurance_profiles", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "compensation_packages", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "payroll_periods", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "payroll_runs", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "payroll_entries", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "payslips", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "payment_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "expense_claims", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "loan_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "payroll", table: "final_settlements", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // Benefits schema
  { schema: "benefits", table: "benefit_plans", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "benefits", table: "benefits_providers", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "benefits", table: "benefit_enrollments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "benefits", table: "claims_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "benefits", table: "dependent_coverages", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // Talent schema
  { schema: "talent", table: "skills", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "certifications", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "competency_frameworks", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "competency_skills", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "talent_pools", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "talent_pool_memberships", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "performance_goals", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "goal_tracking", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "performance_reviews", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "performance_review_goals", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "employee_certifications", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "succession_plans", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "grievance_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "disciplinary_actions", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "promotion_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "case_links", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "talent", table: "employee_skills", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // Learning schema
  { schema: "learning", table: "courses", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "course_modules", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "learning_paths", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "learning_path_courses", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "learning_path_assignments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "learning_path_course_progress", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "trainers", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "training_sessions", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "training_enrollments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "training_feedback", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "course_enrollments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "assessments", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "certification_awards", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "learning", table: "training_cost_records", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },

  // Recruitment schema
  { schema: "recruitment", table: "candidates", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "job_requisitions", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "applications", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "interviews", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "offer_letters", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "background_checks", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "onboarding_checklists", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "offboarding_checklists", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "probation_evaluations", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "exit_interviews", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
  { schema: "recruitment", table: "candidate_salary_backfill_issues", tenantIdColumn: "tenantId", policyName: "tenant_isolation" },
];

function generateDropPolicySQL(config: TableConfig): string {
  return `DROP POLICY IF EXISTS ${config.policyName} ON "${config.schema}"."${config.table}";`;
}

function generateEnableRLSSQL(config: TableConfig): string {
  return `
ALTER TABLE "${config.schema}"."${config.table}" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "${config.schema}"."${config.table}" FORCE ROW LEVEL SECURITY;
  `.trim();
}

function generateCreatePolicySQL(config: TableConfig): string {
  return `
CREATE POLICY ${config.policyName} ON "${config.schema}"."${config.table}"
  FOR ALL
  USING ("${config.tenantIdColumn}" = current_setting('afenda.tenant_id', true)::int)
  WITH CHECK ("${config.tenantIdColumn}" = current_setting('afenda.tenant_id', true)::int);
  `.trim();
}

async function main(): Promise<void> {
  console.log("🔐 RLS Re-application Script\n");
  
  if (dryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  const connectionString = process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL_ADMIN or DATABASE_URL must be set");
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Phase 1: Drop all existing policies
    console.log("📋 Phase 1: Dropping existing policies...\n");
    for (const config of TENANT_SCOPED_TABLES) {
      const dropSQL = generateDropPolicySQL(config);
      if (dryRun) {
        console.log(`  [DRY] ${dropSQL}`);
      } else {
        await client.query(dropSQL);
        console.log(`  ✓ Dropped policy on ${config.schema}.${config.table}`);
      }
    }

    // Phase 2: Enable RLS and create policies
    console.log("\n📋 Phase 2: Enabling RLS and creating policies...\n");
    for (const config of TENANT_SCOPED_TABLES) {
      const enableSQL = generateEnableRLSSQL(config);
      const createSQL = generateCreatePolicySQL(config);

      if (dryRun) {
        console.log(`  [DRY] ${enableSQL}`);
        console.log(`  [DRY] ${createSQL}`);
      } else {
        await client.query(enableSQL);
        await client.query(createSQL);
        console.log(`  ✓ RLS enabled on ${config.schema}.${config.table}`);
      }
    }

    console.log(`\n✅ RLS re-application complete! (${TENANT_SCOPED_TABLES.length} tables)`);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
