import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Benefits Schema - Employee welfare programs and insurance.
 * Handles providers, plans, enrollments, dependent coverage, and claims.
 *
 * Cross-schema dependencies:
 * - `core.tenants` — tenant isolation on all operational tables
 * - `core.currencies` — plan and claim currency (FK where applicable)
 * - `hr.employees` — enrollments and claims (`employeeId`, optional `reviewedBy`); FKs often via custom SQL
 * - `hr.dependents` — dependent coverages (`dependentId`); FK via custom SQL
 *
 * See `README.md` in this folder for layout, Zod conventions, and test map.
 */
export const benefitsSchema = pgSchema("benefits");
