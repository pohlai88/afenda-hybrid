import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Talent Schema - Workforce capability lifecycle management.
 * Handles skills, certifications, performance, goals, succession, ER, and case linking.
 *
 * Cross-schema dependencies:
 * - core.tenants (tenant isolation)
 * - hr.employees (employee reference)
 * - hr.positions (position reference for competency frameworks)
 *
 * Docs: docs/hcm/talent-schema-inventory.md · docs/hcm/talent-domain-boundaries.md · docs/hcm/talent-management-roadmap.md
 */
export const talentSchema = pgSchema("talent");
