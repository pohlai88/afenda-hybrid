import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Seed: Roles and Permissions
 *
 * Creates system roles and their associated permissions.
 * Idempotent: Uses ON CONFLICT DO UPDATE.
 *
 * Role hierarchy (conceptual):
 * - SUPER_ADMIN: Full system access
 * - ADMIN: Tenant administration
 * - HR_MANAGER: HR operations management
 * - PAYROLL_MANAGER: Payroll operations
 * - BENEFITS_ADMIN: Benefits administration
 * - TALENT_MANAGER: Performance & talent management
 * - LEARNING_ADMIN: L&D administration
 * - RECRUITMENT_MANAGER: Hiring operations
 * - MANAGER: Team management (reports, approvals)
 * - EMPLOYEE: Self-service access
 */

interface PermissionDef {
  resource: string;
  action: string;
  key: string;
  description: string;
}

interface RoleDef {
  roleCode: string;
  name: string;
  description: string;
  permissionKeys: string[];
}

const PERMISSIONS: PermissionDef[] = [
  // Core
  {
    resource: "tenant",
    action: "manage",
    key: "tenant.manage",
    description: "Manage tenant settings",
  },
  {
    resource: "organization",
    action: "view",
    key: "organization.view",
    description: "View organization structure",
  },
  {
    resource: "organization",
    action: "manage",
    key: "organization.manage",
    description: "Manage departments and locations",
  },
  {
    resource: "workflow",
    action: "view",
    key: "workflow.view",
    description: "View workflow definitions",
  },
  {
    resource: "workflow",
    action: "manage",
    key: "workflow.manage",
    description: "Manage workflow definitions",
  },
  {
    resource: "notification",
    action: "manage",
    key: "notification.manage",
    description: "Manage notification templates",
  },

  // Security
  { resource: "user", action: "view", key: "user.view", description: "View user accounts" },
  { resource: "user", action: "create", key: "user.create", description: "Create user accounts" },
  { resource: "user", action: "update", key: "user.update", description: "Update user accounts" },
  { resource: "user", action: "delete", key: "user.delete", description: "Delete user accounts" },
  { resource: "role", action: "view", key: "role.view", description: "View roles" },
  {
    resource: "role",
    action: "manage",
    key: "role.manage",
    description: "Manage roles and permissions",
  },

  // Audit
  { resource: "audit", action: "view", key: "audit.view", description: "View audit logs" },
  { resource: "audit", action: "export", key: "audit.export", description: "Export audit logs" },

  // HR
  {
    resource: "employee",
    action: "view",
    key: "employee.view",
    description: "View employee records",
  },
  {
    resource: "employee",
    action: "view_own",
    key: "employee.view_own",
    description: "View own employee record",
  },
  {
    resource: "employee",
    action: "create",
    key: "employee.create",
    description: "Create employee records",
  },
  {
    resource: "employee",
    action: "update",
    key: "employee.update",
    description: "Update employee records",
  },
  {
    resource: "employee",
    action: "update_own",
    key: "employee.update_own",
    description: "Update own employee record",
  },
  {
    resource: "employee",
    action: "delete",
    key: "employee.delete",
    description: "Delete employee records",
  },
  {
    resource: "attendance",
    action: "view",
    key: "attendance.view",
    description: "View attendance records",
  },
  {
    resource: "attendance",
    action: "view_own",
    key: "attendance.view_own",
    description: "View own attendance",
  },
  {
    resource: "attendance",
    action: "manage",
    key: "attendance.manage",
    description: "Manage attendance records",
  },
  { resource: "leave", action: "view", key: "leave.view", description: "View leave requests" },
  {
    resource: "leave",
    action: "view_own",
    key: "leave.view_own",
    description: "View own leave requests",
  },
  {
    resource: "leave",
    action: "request",
    key: "leave.request",
    description: "Submit leave requests",
  },
  {
    resource: "leave",
    action: "approve",
    key: "leave.approve",
    description: "Approve/reject leave requests",
  },
  {
    resource: "leave",
    action: "manage",
    key: "leave.manage",
    description: "Manage leave policies and balances",
  },

  // Payroll
  { resource: "payroll", action: "view", key: "payroll.view", description: "View payroll data" },
  {
    resource: "payroll",
    action: "view_own",
    key: "payroll.view_own",
    description: "View own payslips",
  },
  {
    resource: "payroll",
    action: "process",
    key: "payroll.process",
    description: "Process payroll runs",
  },
  {
    resource: "payroll",
    action: "approve",
    key: "payroll.approve",
    description: "Approve payroll runs",
  },
  {
    resource: "payroll",
    action: "manage",
    key: "payroll.manage",
    description: "Manage payroll settings",
  },
  {
    resource: "compensation",
    action: "view",
    key: "compensation.view",
    description: "View compensation data",
  },
  {
    resource: "compensation",
    action: "manage",
    key: "compensation.manage",
    description: "Manage compensation structures",
  },

  // Benefits
  { resource: "benefit", action: "view", key: "benefit.view", description: "View benefit plans" },
  {
    resource: "benefit",
    action: "view_own",
    key: "benefit.view_own",
    description: "View own benefits",
  },
  {
    resource: "benefit",
    action: "enroll",
    key: "benefit.enroll",
    description: "Enroll in benefits",
  },
  {
    resource: "benefit",
    action: "manage",
    key: "benefit.manage",
    description: "Manage benefit plans",
  },
  { resource: "claim", action: "view", key: "claim.view", description: "View benefit claims" },
  { resource: "claim", action: "view_own", key: "claim.view_own", description: "View own claims" },
  {
    resource: "claim",
    action: "submit",
    key: "claim.submit",
    description: "Submit benefit claims",
  },
  {
    resource: "claim",
    action: "approve",
    key: "claim.approve",
    description: "Approve/reject claims",
  },

  // Talent
  {
    resource: "performance",
    action: "view",
    key: "performance.view",
    description: "View performance reviews",
  },
  {
    resource: "performance",
    action: "view_own",
    key: "performance.view_own",
    description: "View own performance",
  },
  {
    resource: "performance",
    action: "review",
    key: "performance.review",
    description: "Conduct performance reviews",
  },
  {
    resource: "performance",
    action: "manage",
    key: "performance.manage",
    description: "Manage performance cycles",
  },
  { resource: "goal", action: "view", key: "goal.view", description: "View goals" },
  { resource: "goal", action: "view_own", key: "goal.view_own", description: "View own goals" },
  { resource: "goal", action: "create", key: "goal.create", description: "Create goals" },
  { resource: "goal", action: "manage", key: "goal.manage", description: "Manage goal frameworks" },
  { resource: "skill", action: "view", key: "skill.view", description: "View skills catalog" },
  {
    resource: "skill",
    action: "manage",
    key: "skill.manage",
    description: "Manage skills and competencies",
  },
  {
    resource: "succession",
    action: "view",
    key: "succession.view",
    description: "View succession plans",
  },
  {
    resource: "succession",
    action: "manage",
    key: "succession.manage",
    description: "Manage succession planning",
  },

  // Learning
  { resource: "course", action: "view", key: "course.view", description: "View courses" },
  { resource: "course", action: "enroll", key: "course.enroll", description: "Enroll in courses" },
  {
    resource: "course",
    action: "manage",
    key: "course.manage",
    description: "Manage course catalog",
  },
  {
    resource: "training",
    action: "view",
    key: "training.view",
    description: "View training sessions",
  },
  {
    resource: "training",
    action: "view_own",
    key: "training.view_own",
    description: "View own training",
  },
  {
    resource: "training",
    action: "manage",
    key: "training.manage",
    description: "Manage training programs",
  },
  {
    resource: "certification",
    action: "view",
    key: "certification.view",
    description: "View certifications",
  },
  {
    resource: "certification",
    action: "manage",
    key: "certification.manage",
    description: "Manage certifications",
  },

  // Recruitment
  {
    resource: "requisition",
    action: "view",
    key: "requisition.view",
    description: "View job requisitions",
  },
  {
    resource: "requisition",
    action: "create",
    key: "requisition.create",
    description: "Create job requisitions",
  },
  {
    resource: "requisition",
    action: "approve",
    key: "requisition.approve",
    description: "Approve job requisitions",
  },
  {
    resource: "requisition",
    action: "manage",
    key: "requisition.manage",
    description: "Manage all requisitions",
  },
  { resource: "candidate", action: "view", key: "candidate.view", description: "View candidates" },
  {
    resource: "candidate",
    action: "manage",
    key: "candidate.manage",
    description: "Manage candidate pipeline",
  },
  { resource: "interview", action: "view", key: "interview.view", description: "View interviews" },
  {
    resource: "interview",
    action: "conduct",
    key: "interview.conduct",
    description: "Conduct interviews",
  },
  {
    resource: "interview",
    action: "manage",
    key: "interview.manage",
    description: "Manage interview process",
  },
  { resource: "offer", action: "view", key: "offer.view", description: "View offer letters" },
  { resource: "offer", action: "create", key: "offer.create", description: "Create offer letters" },
  {
    resource: "offer",
    action: "approve",
    key: "offer.approve",
    description: "Approve offer letters",
  },

  // Reports
  { resource: "report", action: "view", key: "report.view", description: "View reports" },
  {
    resource: "report",
    action: "view_own",
    key: "report.view_own",
    description: "View own reports",
  },
  { resource: "report", action: "export", key: "report.export", description: "Export reports" },
  { resource: "dashboard", action: "view", key: "dashboard.view", description: "View dashboards" },
  {
    resource: "dashboard",
    action: "manage",
    key: "dashboard.manage",
    description: "Manage dashboard widgets",
  },
];

const ROLES: RoleDef[] = [
  {
    roleCode: "SUPER_ADMIN",
    name: "Super Administrator",
    description: "Full system access with all permissions",
    permissionKeys: PERMISSIONS.map((p) => p.key),
  },
  {
    roleCode: "ADMIN",
    name: "Administrator",
    description: "Tenant administration and user management",
    permissionKeys: [
      "tenant.manage",
      "organization.view",
      "organization.manage",
      "workflow.view",
      "workflow.manage",
      "notification.manage",
      "user.view",
      "user.create",
      "user.update",
      "user.delete",
      "role.view",
      "role.manage",
      "audit.view",
      "audit.export",
      "report.view",
      "report.export",
      "dashboard.view",
      "dashboard.manage",
    ],
  },
  {
    roleCode: "HR_MANAGER",
    name: "HR Manager",
    description: "Human resources operations management",
    permissionKeys: [
      "organization.view",
      "employee.view",
      "employee.create",
      "employee.update",
      "employee.delete",
      "attendance.view",
      "attendance.manage",
      "leave.view",
      "leave.approve",
      "leave.manage",
      "report.view",
      "report.export",
      "dashboard.view",
    ],
  },
  {
    roleCode: "PAYROLL_MANAGER",
    name: "Payroll Manager",
    description: "Payroll processing and compensation management",
    permissionKeys: [
      "employee.view",
      "payroll.view",
      "payroll.process",
      "payroll.approve",
      "payroll.manage",
      "compensation.view",
      "compensation.manage",
      "report.view",
      "report.export",
      "dashboard.view",
    ],
  },
  {
    roleCode: "BENEFITS_ADMIN",
    name: "Benefits Administrator",
    description: "Benefits plans and claims administration",
    permissionKeys: [
      "employee.view",
      "benefit.view",
      "benefit.manage",
      "claim.view",
      "claim.approve",
      "report.view",
      "dashboard.view",
    ],
  },
  {
    roleCode: "TALENT_MANAGER",
    name: "Talent Manager",
    description: "Performance and talent management",
    permissionKeys: [
      "employee.view",
      "performance.view",
      "performance.review",
      "performance.manage",
      "goal.view",
      "goal.create",
      "goal.manage",
      "skill.view",
      "skill.manage",
      "succession.view",
      "succession.manage",
      "report.view",
      "dashboard.view",
    ],
  },
  {
    roleCode: "LEARNING_ADMIN",
    name: "Learning Administrator",
    description: "Learning and development administration",
    permissionKeys: [
      "employee.view",
      "course.view",
      "course.manage",
      "training.view",
      "training.manage",
      "certification.view",
      "certification.manage",
      "report.view",
      "dashboard.view",
    ],
  },
  {
    roleCode: "RECRUITMENT_MANAGER",
    name: "Recruitment Manager",
    description: "Hiring and recruitment operations",
    permissionKeys: [
      "requisition.view",
      "requisition.create",
      "requisition.approve",
      "requisition.manage",
      "candidate.view",
      "candidate.manage",
      "interview.view",
      "interview.conduct",
      "interview.manage",
      "offer.view",
      "offer.create",
      "offer.approve",
      "report.view",
      "dashboard.view",
    ],
  },
  {
    roleCode: "MANAGER",
    name: "Manager",
    description: "Team management and approvals",
    permissionKeys: [
      "employee.view",
      "attendance.view",
      "leave.view",
      "leave.approve",
      "performance.view",
      "performance.review",
      "goal.view",
      "goal.create",
      "training.view",
      "requisition.view",
      "requisition.create",
      "interview.view",
      "interview.conduct",
      "report.view_own",
      "dashboard.view",
    ],
  },
  {
    roleCode: "EMPLOYEE",
    name: "Employee",
    description: "Self-service access for employees",
    permissionKeys: [
      "employee.view_own",
      "employee.update_own",
      "attendance.view_own",
      "leave.view_own",
      "leave.request",
      "payroll.view_own",
      "benefit.view_own",
      "benefit.enroll",
      "claim.view_own",
      "claim.submit",
      "performance.view_own",
      "goal.view_own",
      "training.view_own",
      "course.view",
      "course.enroll",
      "report.view_own",
      "dashboard.view",
    ],
  },
];

export async function seedRolesAndPermissions(tenantId: number, systemUserId: number) {
  console.log("Seeding roles and permissions...");

  // 1. Seed permissions
  const permissionIds: Record<string, number> = {};

  for (const perm of PERMISSIONS) {
    const result = await db.execute<{ permissionId: number }>(sql`
      INSERT INTO security.permissions (
        "tenantId", resource, action, key, description, "isSystemPermission",
        "createdAt", "updatedAt", "createdBy", "updatedBy"
      )
      VALUES (
        ${tenantId}, ${perm.resource}, ${perm.action}, ${perm.key}, ${perm.description}, true,
        now(), now(), ${systemUserId}, ${systemUserId}
      )
      ON CONFLICT ("tenantId", lower(key))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        resource = EXCLUDED.resource,
        action = EXCLUDED.action,
        description = EXCLUDED.description,
        "updatedAt" = now(),
        "updatedBy" = ${systemUserId}
      RETURNING "permissionId"
    `);
    permissionIds[perm.key] = result.rows[0].permissionId;
  }

  console.log(`  ✓ Seeded ${PERMISSIONS.length} permissions`);

  // 2. Seed roles
  const roleIds: Record<string, number> = {};

  for (const role of ROLES) {
    const result = await db.execute<{ roleId: number }>(sql`
      INSERT INTO security.roles (
        "tenantId", "roleCode", name, description, "isSystemRole",
        "createdAt", "updatedAt", "createdBy", "updatedBy"
      )
      VALUES (
        ${tenantId}, ${role.roleCode}, ${role.name}, ${role.description}, true,
        now(), now(), ${systemUserId}, ${systemUserId}
      )
      ON CONFLICT ("tenantId", lower("roleCode"))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        "updatedAt" = now(),
        "updatedBy" = ${systemUserId}
      RETURNING "roleId"
    `);
    roleIds[role.roleCode] = result.rows[0].roleId;
  }

  console.log(`  ✓ Seeded ${ROLES.length} roles`);

  // 3. Link roles to permissions
  let linkCount = 0;

  for (const role of ROLES) {
    const roleId = roleIds[role.roleCode];

    for (const permKey of role.permissionKeys) {
      const permissionId = permissionIds[permKey];
      if (!permissionId) {
        console.warn(`  ⚠ Permission "${permKey}" not found for role "${role.roleCode}"`);
        continue;
      }

      await db.execute(sql`
        INSERT INTO security.role_permissions (
          "tenantId", "roleId", "permissionId",
          "createdAt", "updatedAt", "createdBy", "updatedBy"
        )
        VALUES (
          ${tenantId}, ${roleId}, ${permissionId},
          now(), now(), ${systemUserId}, ${systemUserId}
        )
        ON CONFLICT ("tenantId", "roleId", "permissionId")
        DO NOTHING
      `);
      linkCount++;
    }
  }

  console.log(`  ✓ Created ${linkCount} role-permission links`);
  console.log(`✓ Seeded roles and permissions for tenant ${tenantId}`);
}
