import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Talent Schema - Workforce capability lifecycle management.
 * Handles skills, certifications, performance, goals, and succession planning.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation)
 * - hr.employees (employee reference)
 * - hr.positions (position reference for competency frameworks)
 */
export const talentSchema = pgSchema("talent");
