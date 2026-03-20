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
 * Docs: docs/talent-schema-inventory.md · docs/talent-domain-boundaries.md · docs/talent-management-roadmap.md
 */
export const talentSchema = pgSchema("talent");
