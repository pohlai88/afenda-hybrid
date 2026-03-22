/**
 * Payroll domain barrel: `payroll` Postgres schema, table modules, and RQB graph (`payrollRelations`).
 * Import from `@db/schema-platform/payroll` or a relative path for domain-wide access.
 */
export * from "./_schema";
export * from "./fundamentals";
export * from "./operations";
export * from "./_relations";
