import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Recruitment Schema - Hiring lifecycle management.
 * Handles job requisitions, candidates, applications, interviews, offers, and onboarding.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation)
 * - hr.persons (candidate conversion to person)
 * - hr.employees (candidate conversion to employee)
 * - hr.positions (requisition positions)
 * - hr.departments (requisition departments)
 */
export const recruitmentSchema = pgSchema("recruitment");
