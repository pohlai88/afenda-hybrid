import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Benefits Schema - Employee welfare programs and insurance.
 * Handles benefit plans, enrollments, dependent coverage, and claims.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation)
 * - hr.employees (employee reference)
 * - hr.dependents (dependent coverage)
 */
export const benefitsSchema = pgSchema("benefits");
