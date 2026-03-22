import { db } from "@afenda/db/src/db";
import { eq, and, isNull, asc } from "drizzle-orm";
import type { AppModule, MenuItem } from "@afenda/ui";

const DEFAULT_MODULES: AppModule[] = [
  {
    appModuleId: 1,
    code: "core",
    name: "Core",
    icon: "Building2",
    color: "#6366f1",
    basePath: "/core",
    sortOrder: 1,
    menuItems: [
      {
        menuItemId: 1,
        code: "organizations",
        label: "Organizations",
        icon: "Building2",
        routePath: "/core/organizations",
        sortOrder: 1,
        children: [],
      },
    ],
  },
  {
    appModuleId: 2,
    code: "hr",
    name: "HR",
    icon: "Users",
    color: "#10b981",
    basePath: "/hr",
    sortOrder: 2,
    menuItems: [
      {
        menuItemId: 2,
        code: "employees",
        label: "Employees",
        icon: "Users",
        routePath: "/hr/employees",
        sortOrder: 1,
        children: [],
      },
    ],
  },
  {
    appModuleId: 3,
    code: "recruitment",
    name: "Recruitment",
    icon: "UserPlus",
    color: "#f97316",
    basePath: "/recruitment",
    sortOrder: 3,
    menuItems: [
      {
        menuItemId: 3,
        code: "requisitions",
        label: "Job Requisitions",
        icon: "Briefcase",
        routePath: "/recruitment/requisitions",
        sortOrder: 1,
        children: [],
      },
    ],
  },
];

export async function getAppModulesWithMenu(
  tenantId: number,
  userPermissions: Set<string>
): Promise<AppModule[]> {
  try {
    const { appModules } = await import("@afenda/db/src/schema-platform/core/appModules");
    const { menuItems } = await import("@afenda/db/src/schema-platform/core/menuItems");

    const modulesList = await db
      .select()
      .from(appModules)
      .where(and(eq(appModules.tenantId, tenantId), eq(appModules.isEnabled, true)))
      .orderBy(asc(appModules.sortOrder));

    if (modulesList.length === 0) {
      console.warn("[navigation] No app modules found in database, using defaults");
      return DEFAULT_MODULES;
    }

    const menuItemsList = await db
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

    const result = modulesList
      .map((module) => {
        const moduleMenuItems = menuItemsList
          .filter((item) => item.appModuleId === module.appModuleId)
          .filter((item) => item.routePath !== null)
          .filter((item) => {
            if (!item.requiredPermission) return true;
            return userPermissions.has(item.requiredPermission) || userPermissions.has("*");
          })
          .map((item) => ({
            menuItemId: item.menuItemId,
            code: item.code,
            label: item.label,
            icon: item.icon || undefined,
            routePath: item.routePath!,
            parentMenuItemId: item.parentMenuItemId,
            sortOrder: item.sortOrder,
            children: [],
          }));

        const menuTree = buildMenuTree(moduleMenuItems);

        return {
          appModuleId: module.appModuleId,
          code: module.code,
          name: module.name,
          icon: module.icon || "",
          color: module.color || "#6366f1",
          basePath: module.basePath,
          sortOrder: module.sortOrder,
          menuItems: menuTree,
        };
      })
      .filter((module) => module.menuItems.length > 0);

    return result.length > 0 ? result : DEFAULT_MODULES;
  } catch (error) {
    console.error("[navigation] Failed to load navigation from database:", error);
    return DEFAULT_MODULES;
  }
}

function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<number, MenuItem>();
  const roots: MenuItem[] = [];

  items.forEach((item) => {
    itemMap.set(item.menuItemId, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = itemMap.get(item.menuItemId)!;
    if (item.parentMenuItemId) {
      const parent = itemMap.get(item.parentMenuItemId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => a.sortOrder - b.sortOrder);
}
