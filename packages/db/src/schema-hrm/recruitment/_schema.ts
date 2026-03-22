import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Recruitment Schema - Hiring lifecycle management.
 * Handles job requisitions, candidates, applications, interviews, offers, onboarding, offboarding checklists, and departure exit interviews.
 * Other exit data (termination, final pay, benefits end) still spans hr/payroll/benefits — see docs/hcm/hr-lifecycle-onboarding-offboarding.md.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation; also `candidate_salary_backfill_issues.tenantId`)
 * - core.currencies (`candidates.expectedSalaryCurrencyId`, requisitions/offers as applicable)
 * - hr.persons (candidate conversion to person)
 * - hr.employees (candidate conversion to employee)
 * - hr.positions (requisition positions)
 * - hr.departments (requisition departments)
 *
 * Operational queue: `candidate_salary_backfill_issues` (legacy salary text parse failures) — FK to `candidates` + `tenants`.
 */
export const recruitmentSchema = pgSchema("recruitment");
