import { db } from "../db";
import { appModules, menuItems } from "../schema-platform";
import { and, eq, sql } from "drizzle-orm";

/**
 * Derive stable menu `code` from a Next.js route (must match migration backfill logic).
 * Example: `/core/organizations` → `core_organizations`
 */
export function menuCodeFromRoute(routePath: string): string {
  const trimmed = routePath.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return "root";
  return trimmed
    .split("/")
    .map((seg) =>
      seg
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase()
    )
    .filter(Boolean)
    .join("_");
}

/**
 * Seed: Menu Items (hierarchical navigation)
 *
 * Idempotent: upserts by (`tenantId`, `code`) among non-deleted rows (matches `uq_menu_items_tenant_code`).
 */
async function upsertMenuItem(args: {
  tenantId: number;
  appModuleId: number;
  parentMenuItemId: number | null;
  code: string;
  label: string;
  icon: string | null;
  routePath: string | null;
  sortOrder: number;
  systemUserId: number;
}): Promise<number> {
  const existing = await db
    .select({ menuItemId: menuItems.menuItemId })
    .from(menuItems)
    .where(
      and(
        eq(menuItems.tenantId, args.tenantId),
        sql`lower(${menuItems.code}) = ${args.code.toLowerCase()}`,
        sql`${menuItems.deletedAt} IS NULL`
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(menuItems)
      .set({
        appModuleId: args.appModuleId,
        parentMenuItemId: args.parentMenuItemId,
        label: args.label,
        icon: args.icon,
        routePath: args.routePath,
        sortOrder: args.sortOrder,
        isVisible: true,
        updatedAt: sql`now()`,
        updatedBy: args.systemUserId,
      })
      .where(eq(menuItems.menuItemId, existing[0].menuItemId));
    return existing[0].menuItemId;
  }

  const inserted = await db
    .insert(menuItems)
    .values({
      tenantId: args.tenantId,
      appModuleId: args.appModuleId,
      parentMenuItemId: args.parentMenuItemId,
      code: args.code,
      label: args.label,
      icon: args.icon ?? undefined,
      routePath: args.routePath ?? undefined,
      sortOrder: args.sortOrder,
      isVisible: true,
      createdBy: args.systemUserId,
      updatedBy: args.systemUserId,
    })
    .returning({ menuItemId: menuItems.menuItemId });

  return inserted[0]!.menuItemId;
}

export async function seedMenuItems(tenantId: number, systemUserId: number) {
  const modules = await db
    .select({ appModuleId: appModules.appModuleId, code: appModules.code })
    .from(appModules)
    .where(eq(appModules.tenantId, tenantId));

  const moduleMap = new Map(modules.map((m) => [m.code, m.appModuleId]));

  const menuStructure = [
    {
      module: "core",
      label: "Core",
      icon: "Building2",
      routePath: "/core",
      children: [
        { label: "Organizations", icon: "Building", routePath: "/core/organizations" },
        { label: "Locations", icon: "MapPin", routePath: "/core/locations" },
        { label: "Workflows", icon: "GitBranch", routePath: "/core/workflows" },
        { label: "Notifications", icon: "Bell", routePath: "/core/notifications" },
      ],
    },
    {
      module: "security",
      label: "Security",
      icon: "Shield",
      routePath: "/security",
      children: [
        { label: "Users", icon: "Users", routePath: "/security/users" },
        { label: "Roles", icon: "UserCog", routePath: "/security/roles" },
        { label: "Permissions", icon: "Lock", routePath: "/security/permissions" },
      ],
    },
    {
      module: "hr",
      label: "HR",
      icon: "Users",
      routePath: "/hr",
      children: [
        { label: "Employees", icon: "User", routePath: "/hr/employees" },
        { label: "Attendance", icon: "Calendar", routePath: "/hr/attendance" },
        { label: "Leaves", icon: "Plane", routePath: "/hr/leaves" },
        { label: "Departments", icon: "Building", routePath: "/hr/departments" },
      ],
    },
    {
      module: "payroll",
      label: "Payroll",
      icon: "DollarSign",
      routePath: "/payroll",
      children: [
        { label: "Payroll Runs", icon: "PlayCircle", routePath: "/payroll/runs" },
        { label: "Salary Structures", icon: "Layers", routePath: "/payroll/structures" },
        { label: "Tax Slabs", icon: "Calculator", routePath: "/payroll/tax-slabs" },
      ],
    },
    {
      module: "benefits",
      label: "Benefits",
      icon: "Heart",
      routePath: "/benefits",
      children: [
        { label: "Benefit Plans", icon: "Package", routePath: "/benefits/plans" },
        { label: "Enrollments", icon: "UserCheck", routePath: "/benefits/enrollments" },
        { label: "Claims", icon: "FileText", routePath: "/benefits/claims" },
      ],
    },
    {
      module: "talent",
      label: "Talent",
      icon: "Award",
      routePath: "/talent",
      children: [
        { label: "Appraisals", icon: "Target", routePath: "/talent/appraisals" },
        { label: "Skills", icon: "Zap", routePath: "/talent/skills" },
        { label: "Succession Plans", icon: "TrendingUp", routePath: "/talent/succession" },
      ],
    },
    {
      module: "learning",
      label: "Learning",
      icon: "GraduationCap",
      routePath: "/learning",
      children: [
        { label: "Courses", icon: "BookOpen", routePath: "/learning/courses" },
        { label: "Certifications", icon: "Award", routePath: "/learning/certifications" },
      ],
    },
    {
      module: "recruitment",
      label: "Recruitment",
      icon: "Briefcase",
      routePath: "/recruitment",
      children: [
        { label: "Job Requisitions", icon: "FileText", routePath: "/recruitment/requisitions" },
        { label: "Applications", icon: "Users", routePath: "/recruitment/applications" },
        { label: "Interviews", icon: "Video", routePath: "/recruitment/interviews" },
      ],
    },
  ];

  for (const section of menuStructure) {
    const appModuleId = moduleMap.get(section.module);
    if (!appModuleId) {
      console.warn(`⚠ Module '${section.module}' not found, skipping menu items`);
      continue;
    }

    const sectionCode = menuCodeFromRoute(section.routePath);

    const parentMenuItemId = await upsertMenuItem({
      tenantId,
      appModuleId,
      parentMenuItemId: null,
      code: sectionCode,
      label: section.label,
      icon: section.icon,
      routePath: section.routePath,
      sortOrder: 0,
      systemUserId,
    });

    for (let i = 0; i < section.children.length; i++) {
      const child = section.children[i];
      await upsertMenuItem({
        tenantId,
        appModuleId,
        parentMenuItemId,
        code: menuCodeFromRoute(child.routePath),
        label: child.label,
        icon: child.icon,
        routePath: child.routePath,
        sortOrder: i + 1,
        systemUserId,
      });
    }
  }

  console.log(`✓ Seeded menu items for ${menuStructure.length} modules`);
}
