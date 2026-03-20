import { pgSchema } from "drizzle-orm/pg-core";

/**
 * HR Schema - Human Resources domain
 *
 * Centralized schema declaration for all HR tables, enums, and sequences.
 * Imported by all HR table definitions to avoid circular dependencies.
 *
 * Structure:
 * - fundamentals/: Master data (employees, departments, positions)
 * - operations/: Transactional data (attendanceLogs, leaveRequests)
 *
 * @see docs/architecture/01-db-first-guideline.md Section 3.2
 */
export const hrSchema = pgSchema("hr");
