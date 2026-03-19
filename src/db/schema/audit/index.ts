/**
 * Audit Schema Barrel Export
 *
 * Exports all audit-related tables, views, enums, and types.
 *
 * @see CUSTOM_SQL.md for PostgreSQL-specific extensions (partitioning, triggers, etc.)
 */

// Core audit trail with 7W1H methodology
export * from "./auditTrail";

// Retention policy configuration
export * from "./retentionPolicy";

// Materialized views for reporting
export * from "./auditSummary";

// Relations
export * from "./_relations";
