import { unstable_cache } from "next/cache";
import { and, asc, eq, isNull } from "drizzle-orm";
import { withTenantContext } from "@afenda/db/session";
import { appModules, menuItems } from "@afenda/db/schema";
import { METADATA_TAGS } from "./cache-tags";
import { eligibilityForModel, loadPermissionKeys } from "./permission-service";
import type { Database } from "@afenda/db";

/** Tree node for menu resolution (server). */
export interface NavItemTree {
  menuItemId: number;
  code: string;
  label: string;
  icon: string | null;
  routePath: string;
  sortOrder: number;
  children: NavItemTree[];
}

export interface NavModuleTree {
  appModuleId: number;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  basePath: string;
  sortOrder: number;
  items: NavItemTree[];
}

function buildMenuTree(
  flat: (typeof menuItems.$inferSelect)[],
  parentId: number | null = null
): NavItemTree[] {
  return flat
    .filter((i) =>
      parentId === null ? i.parentMenuItemId == null : i.parentMenuItemId === parentId
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({
      menuItemId: i.menuItemId,
      code: i.code,
      label: i.label,
      icon: i.icon,
      routePath: i.routePath ?? "#",
      sortOrder: i.sortOrder,
      children: buildMenuTree(flat, i.menuItemId),
    }));
}

function pruneNavItems(nodes: NavItemTree[]): NavItemTree[] {
  const out: NavItemTree[] = [];
  for (const n of nodes) {
    const children = pruneNavItems(n.children);
    const hasRoute = Boolean(n.routePath && n.routePath !== "#");
    if (children.length > 0 || hasRoute) {
      out.push({ ...n, children });
    }
  }
  return out;
}

function itemAllowedByPermission(
  row: typeof menuItems.$inferSelect,
  keys: ReadonlySet<string>
): boolean {
  const req = row.requiredPermission?.trim();
  if (!req) return true;
  return keys.has(req);
}

function fallbackItemAllowed(routePath: string, keys: ReadonlySet<string>): boolean {
  if (routePath.startsWith("/hr/employees")) {
    return eligibilityForModel(keys, "hr.employee").canRead;
  }
  if (routePath.startsWith("/core/organizations")) {
    return eligibilityForModel(keys, "core.organization").canRead;
  }
  return true;
}

/** Fallback when DB is unavailable or empty (dev / CI without migrate). */
export function getFallbackNavigation(keys: ReadonlySet<string>): NavModuleTree[] {
  const all: NavModuleTree[] = [
    {
      appModuleId: 0,
      code: "hr",
      name: "Human Resources",
      icon: "Users",
      color: "hsl(var(--primary))",
      basePath: "/hr",
      sortOrder: 0,
      items: [
        {
          menuItemId: 0,
          code: "employees",
          label: "Employees",
          icon: "Users",
          routePath: "/hr/employees",
          sortOrder: 0,
          children: [],
        },
      ],
    },
    {
      appModuleId: 1,
      code: "core",
      name: "Core",
      icon: "Building2",
      color: "hsl(var(--muted-foreground))",
      basePath: "/core",
      sortOrder: 1,
      items: [
        {
          menuItemId: 1,
          code: "organizations",
          label: "Organizations",
          icon: "Building",
          routePath: "/core/organizations",
          sortOrder: 0,
          children: [],
        },
      ],
    },
  ];
  return all
    .map((mod) => ({
      ...mod,
      items: pruneNavItems(mod.items.filter((i) => fallbackItemAllowed(i.routePath, keys))),
    }))
    .filter((mod) => mod.items.length > 0);
}

async function loadNavigationFromDb(tenantId: number, userId: number): Promise<NavModuleTree[]> {
  const keys = await loadPermissionKeys(tenantId, userId);
  try {
    return await withTenantContext({ tenantId, userId }, async (tx) => {
      const dbx = tx as unknown as Database;

      const modules = await dbx
        .select()
        .from(appModules)
        .where(
          and(
            eq(appModules.tenantId, tenantId),
            eq(appModules.isEnabled, true),
            isNull(appModules.deletedAt)
          )
        )
        .orderBy(asc(appModules.sortOrder));

      const rawItems = await dbx
        .select()
        .from(menuItems)
        .where(
          and(
            eq(menuItems.tenantId, tenantId),
            eq(menuItems.isVisible, true),
            isNull(menuItems.deletedAt)
          )
        )
        .orderBy(asc(menuItems.sortOrder));

      if (modules.length === 0) return getFallbackNavigation(keys);

      const items = rawItems.filter((i) => itemAllowedByPermission(i, keys));

      const trees = modules
        .map((mod) => ({
          appModuleId: mod.appModuleId,
          code: mod.code,
          name: mod.name,
          icon: mod.icon,
          color: mod.color,
          basePath: mod.basePath,
          sortOrder: mod.sortOrder,
          items: pruneNavItems(
            buildMenuTree(items.filter((i) => i.appModuleId === mod.appModuleId))
          ),
        }))
        .filter((mod) => mod.items.length > 0);

      return trees.length > 0 ? trees : getFallbackNavigation(keys);
    });
  } catch {
    return getFallbackNavigation(keys);
  }
}

/**
 * Tier: navigation — tag-based revalidation (plan §4g).
 * Menu rows with `requiredPermission` are hidden unless the user holds that key.
 */
export async function loadNavigation(tenantId: number, userId: number): Promise<NavModuleTree[]> {
  return unstable_cache(
    async () => loadNavigationFromDb(tenantId, userId),
    ["metadata", "navigation", String(tenantId), String(userId)],
    {
      revalidate: 3600,
      tags: [METADATA_TAGS.navigation, METADATA_TAGS.navigationTenant(tenantId)],
    }
  )();
}
