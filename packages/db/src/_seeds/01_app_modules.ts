import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Seed: App Modules (9 domains)
 *
 * Idempotent: Uses ON CONFLICT DO UPDATE to ensure modules exist with latest metadata.
 */
export async function seedAppModules(tenantId: number, systemUserId: number) {
  const modules = [
    {
      code: "core",
      name: "Core",
      description: "Organizations, locations, workflows, notifications, and system-wide utilities",
      icon: "Building2",
      color: "#6366f1",
      basePath: "/core",
      sortOrder: 1,
    },
    {
      code: "security",
      name: "Security",
      description: "Users, roles, permissions, and access control",
      icon: "Shield",
      color: "#8b5cf6",
      basePath: "/security",
      sortOrder: 2,
    },
    {
      code: "audit",
      name: "Audit",
      description: "Change logs, data retention, and compliance tracking",
      icon: "FileSearch",
      color: "#64748b",
      basePath: "/audit",
      sortOrder: 3,
    },
    {
      code: "hr",
      name: "Human Resources",
      description: "Employees, attendance, leaves, and core HR operations",
      icon: "Users",
      color: "#10b981",
      basePath: "/hr",
      sortOrder: 4,
    },
    {
      code: "payroll",
      name: "Payroll",
      description: "Salary processing, tax, deductions, and payroll runs",
      icon: "DollarSign",
      color: "#f59e0b",
      basePath: "/payroll",
      sortOrder: 5,
    },
    {
      code: "benefits",
      name: "Benefits",
      description: "Health insurance, claims, enrollments, and benefit plans",
      icon: "Heart",
      color: "#ec4899",
      basePath: "/benefits",
      sortOrder: 6,
    },
    {
      code: "talent",
      name: "Talent",
      description: "Performance appraisals, skills, succession planning",
      icon: "Award",
      color: "#06b6d4",
      basePath: "/talent",
      sortOrder: 7,
    },
    {
      code: "learning",
      name: "Learning",
      description: "Training courses, certifications, and employee development",
      icon: "GraduationCap",
      color: "#14b8a6",
      basePath: "/learning",
      sortOrder: 8,
    },
    {
      code: "recruitment",
      name: "Recruitment",
      description: "Job requisitions, applications, interviews, and hiring",
      icon: "Briefcase",
      color: "#f97316",
      basePath: "/recruitment",
      sortOrder: 9,
    },
  ];

  for (const mod of modules) {
    await db.execute(sql`
      INSERT INTO core.app_modules (
        "tenantId", code, name, description, icon, color, "basePath", "sortOrder",
        "isEnabled", "createdAt", "updatedAt", "createdBy", "updatedBy"
      )
      VALUES (
        ${tenantId}, ${mod.code}, ${mod.name}, ${mod.description}, ${mod.icon},
        ${mod.color}, ${mod.basePath}, ${mod.sortOrder}, true, now(), now(),
        ${systemUserId}, ${systemUserId}
      )
      ON CONFLICT ("tenantId", lower(code))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        "basePath" = EXCLUDED."basePath",
        "sortOrder" = EXCLUDED."sortOrder",
        "updatedAt" = now(),
        "updatedBy" = ${systemUserId}
    `);
  }

  console.log(`✓ Seeded ${modules.length} app modules for tenant ${tenantId}`);
}
