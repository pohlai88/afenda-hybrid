-- Remove duplicate FK constraint on hr.employees created by tenantScopedColumns mixin
-- The explicit foreignKey() definition in the schema is sufficient

ALTER TABLE "hr"."employees" DROP CONSTRAINT IF EXISTS "employees_tenantId_tenants_tenantId_fkey";
