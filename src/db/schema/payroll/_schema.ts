import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Payroll Schema - Financial realization of employment terms.
 * Handles compensation, earnings, deductions, payslips, and payments.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation)
 * - core.currencies (multi-currency support)
 * - hr.employees (employee reference)
 */
export const payrollSchema = pgSchema("payroll");
