import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Learning & Development (L&D) schema (`learning`)
 *
 * Workforce education: catalog (courses, modules, paths), delivery (sessions),
 * enrollments (session-based and sessionless), path assignments with per-course progress,
 * assessments, certification awards, feedback, and training costs.
 *
 * Not the same domain as talent succession “development plans” (`talent.succession_plans.developmentPlan`);
 * keep boundaries clear unless product adds an explicit cross-schema relationship.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation)
 * - core.currencies, core.locations (where modeled)
 * - hr.employees (employee reference; FKs may be custom SQL or omitted to avoid cycles)
 * - talent.certifications (certification awards)
 */
export const learningSchema = pgSchema("learning");
