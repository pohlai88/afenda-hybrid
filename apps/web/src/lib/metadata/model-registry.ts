/**
 * Centralized Model Registry — Single Source of Truth
 *
 * This module consolidates all model-related mappings that were previously
 * scattered across route-gate.ts, data-service.ts, permission-service.ts,
 * nav-service.ts, and model-paths.ts.
 *
 * Adding a new model requires updating only this file.
 */

export interface ModelRegistryEntry {
  /** Technical model name (e.g., "hr.employee") */
  technicalName: string;
  /** URL module segment (e.g., "hr") */
  moduleSlug: string;
  /** URL model segment (e.g., "employees") */
  modelSlug: string;
  /** Full list path for revalidation (e.g., "/hr/employees") */
  listPath: string;
  /** Permission keys for CRUD operations */
  permissions: {
    read: readonly string[];
    write: readonly string[];
    create: readonly string[];
    delete: readonly string[];
  };
  /** Primary key column name for record lookups */
  primaryKey: string;
}

/**
 * Central registry of all models in the application.
 * Add new models here — all other services derive from this.
 */
export const MODEL_REGISTRY: readonly ModelRegistryEntry[] = [
  {
    technicalName: "hr.employee",
    moduleSlug: "hr",
    modelSlug: "employees",
    listPath: "/hr/employees",
    permissions: {
      read: ["employee.view", "employee.view_own"],
      write: ["employee.update", "employee.update_own"],
      create: ["employee.create"],
      delete: ["employee.delete"],
    },
    primaryKey: "employeeId",
  },
  {
    technicalName: "core.organization",
    moduleSlug: "core",
    modelSlug: "organizations",
    listPath: "/core/organizations",
    permissions: {
      read: ["organization.view"],
      write: ["organization.manage"],
      create: ["organization.manage"],
      delete: ["organization.manage"],
    },
    primaryKey: "organizationId",
  },
] as const;

// Derived lookup maps for efficient access

/** Maps "module/model" URL path to technical model name */
export const ROUTE_TO_MODEL: ReadonlyMap<string, string> = new Map(
  MODEL_REGISTRY.map((e) => [`${e.moduleSlug}/${e.modelSlug}`, e.technicalName])
);

/** Maps technical model name to owning module slug */
export const MODEL_MODULE_OWNER: ReadonlyMap<string, string> = new Map(
  MODEL_REGISTRY.map((e) => [e.technicalName, e.moduleSlug])
);

/** Maps technical model name to list path for revalidation */
export const MODEL_LIST_PATHS: Record<string, string> = Object.fromEntries(
  MODEL_REGISTRY.map((e) => [e.technicalName, e.listPath])
);

/** Maps technical model name to permission rules */
export const MODEL_PERMISSION_RULES: ReadonlyMap<string, ModelRegistryEntry["permissions"]> =
  new Map(MODEL_REGISTRY.map((e) => [e.technicalName, e.permissions]));

/** List of all registered technical model names */
export function getRegisteredModelNames(): readonly string[] {
  return MODEL_REGISTRY.map((e) => e.technicalName);
}

/** Get full registry entry by technical name */
export function getModelEntry(technicalName: string): ModelRegistryEntry | undefined {
  return MODEL_REGISTRY.find((e) => e.technicalName === technicalName);
}

/** Resolve URL segments to technical model name */
export function resolveRouteToModelKey(moduleSlug: string, modelSlug: string): string | undefined {
  const path = `${moduleSlug.toLowerCase()}/${modelSlug.toLowerCase()}`;
  return ROUTE_TO_MODEL.get(path);
}

/** Verify that a module slug owns a model */
export function verifyModuleOwnership(moduleSlug: string, technicalName: string): boolean {
  const owner = MODEL_MODULE_OWNER.get(technicalName);
  return owner === moduleSlug.toLowerCase();
}
