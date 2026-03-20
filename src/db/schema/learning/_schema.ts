import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Learning Schema - Workforce education and training management.
 * Handles courses, training sessions, enrollments, assessments, and certifications.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation)
 * - core.currencies (training costs)
 * - hr.employees (employee reference)
 * - talent.certifications (certification awards)
 */
export const learningSchema = pgSchema("learning");
