import type { AppModule, MenuItem } from "@afenda/erp-view-pack";
import type { NavItemTree, NavModuleTree } from "@/lib/metadata/nav-service";

function mapTreeToMenuItem(n: NavItemTree): MenuItem {
  return {
    menuItemId: n.menuItemId,
    code: n.code,
    label: n.label,
    icon: n.icon ?? undefined,
    routePath: n.routePath,
    sortOrder: n.sortOrder,
    children: n.children.map(mapTreeToMenuItem),
  };
}

export function mapNavModulesToSidebar(modules: NavModuleTree[]): AppModule[] {
  return modules.map((m) => ({
    appModuleId: m.appModuleId,
    code: m.code,
    name: m.name,
    icon: m.icon || "LayoutGrid",
    color: m.color || "#6366f1",
    basePath: m.basePath,
    sortOrder: m.sortOrder,
    menuItems: m.items.map(mapTreeToMenuItem),
  }));
}
