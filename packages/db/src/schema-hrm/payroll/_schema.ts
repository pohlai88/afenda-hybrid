import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Payroll Schema — financial realization of employment terms (compensation, statutory, runs, payslips, payments).
 *
 * Cross-schema dependencies:
 * - `core.tenants`, `core.currencies`, `core.legalEntities`
 * - `hr.employees`, `hr.job_grades` (via `jobGrades` in TS schema)
 */
export const payrollSchema = pgSchema("payroll");
