import { db } from "../db";
import { appModules } from "../schema-platform";
import { sql, eq } from "drizzle-orm";

/**
 * Seed: Dashboard Widgets (starter templates)
 *
 * Idempotent: Uses ON CONFLICT DO UPDATE to ensure widgets exist.
 * Creates common widgets for each module (employee count, pending approvals, etc.).
 */
export async function seedDashboardWidgets(tenantId: number, systemUserId: number) {
  const modules = await db
    .select({ appModuleId: appModules.appModuleId, code: appModules.code })
    .from(appModules)
    .where(eq(appModules.tenantId, tenantId));

  const moduleMap = new Map(modules.map((m) => [m.code, m.appModuleId]));

  const widgets = [
    {
      module: "hr",
      code: "hr_employee_count",
      name: "Employee Count",
      description: "Total active employees",
      widgetType: "METRIC",
      dataQuery: `SELECT COUNT(*) as value FROM hr.employees WHERE "tenantId" = $1 AND status = 'ACTIVE' AND "deletedAt" IS NULL`,
      config: { icon: "Users", color: "#10b981" },
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      module: "hr",
      code: "hr_pending_leaves",
      name: "Pending Leave Requests",
      description: "Leave requests awaiting approval",
      widgetType: "METRIC",
      dataQuery: `SELECT COUNT(*) as value FROM hr.leave_requests WHERE "tenantId" = $1 AND status = 'PENDING' AND "deletedAt" IS NULL`,
      config: { icon: "Clock", color: "#f59e0b" },
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      module: "payroll",
      code: "payroll_current_run",
      name: "Current Payroll Run",
      description: "Active payroll run status",
      widgetType: "TABLE",
      dataQuery: `SELECT "payrollRunId", "runCode", status, "periodStart", "periodEnd" FROM payroll.payroll_runs WHERE "tenantId" = $1 AND status IN ('DRAFT', 'PROCESSING') ORDER BY "createdAt" DESC LIMIT 5`,
      config: { columns: ["runCode", "status", "periodStart", "periodEnd"] },
      defaultWidth: 6,
      defaultHeight: 3,
    },
    {
      module: "benefits",
      code: "benefits_pending_claims",
      name: "Pending Claims",
      description: "Claims awaiting review",
      widgetType: "METRIC",
      dataQuery: `SELECT COUNT(*) as value FROM benefits.claims_records WHERE "tenantId" = $1 AND status = 'SUBMITTED' AND "deletedAt" IS NULL`,
      config: { icon: "FileText", color: "#ec4899" },
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      module: "talent",
      code: "talent_active_appraisals",
      name: "Active Appraisals",
      description: "Appraisals in progress",
      widgetType: "METRIC",
      dataQuery: `SELECT COUNT(*) as value FROM talent.appraisals WHERE "tenantId" = $1 AND status IN ('SELF_REVIEW', 'MANAGER_REVIEW') AND "deletedAt" IS NULL`,
      config: { icon: "Target", color: "#06b6d4" },
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      module: "recruitment",
      code: "recruitment_open_positions",
      name: "Open Positions",
      description: "Active job requisitions",
      widgetType: "METRIC",
      dataQuery: `SELECT COUNT(*) as value FROM recruitment.job_requisitions WHERE "tenantId" = $1 AND status = 'OPEN' AND "deletedAt" IS NULL`,
      config: { icon: "Briefcase", color: "#f97316" },
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      module: "core",
      code: "core_recent_notifications",
      name: "Recent Notifications",
      description: "Latest system notifications",
      widgetType: "LIST",
      dataQuery: `SELECT "notificationId", title, "createdAt" FROM core.notifications WHERE "tenantId" = $1 AND status = 'SENT' ORDER BY "createdAt" DESC LIMIT 10`,
      config: { displayField: "title", timestampField: "createdAt" },
      defaultWidth: 6,
      defaultHeight: 4,
    },
  ];

  for (const widget of widgets) {
    const appModuleId = widget.module ? moduleMap.get(widget.module) : null;

    await db.execute(sql`
      INSERT INTO core.dashboard_widgets (
        "tenantId", "appModuleId", code, name, description, "widgetType",
        "dataQuery", config, "defaultWidth", "defaultHeight", "isEnabled",
        "createdAt", "updatedAt", "createdBy", "updatedBy"
      )
      VALUES (
        ${tenantId}, ${appModuleId}, ${widget.code}, ${widget.name}, ${widget.description},
        ${widget.widgetType}::"core"."dashboard_widget_type", ${widget.dataQuery},
        ${JSON.stringify(widget.config)}::jsonb, ${widget.defaultWidth}, ${widget.defaultHeight},
        true, now(), now(), ${systemUserId}, ${systemUserId}
      )
      ON CONFLICT ("tenantId", lower(code))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        "widgetType" = EXCLUDED."widgetType",
        "dataQuery" = EXCLUDED."dataQuery",
        config = EXCLUDED.config,
        "defaultWidth" = EXCLUDED."defaultWidth",
        "defaultHeight" = EXCLUDED."defaultHeight",
        "updatedAt" = now(),
        "updatedBy" = ${systemUserId}
    `);
  }

  console.log(`✓ Seeded ${widgets.length} dashboard widgets for tenant ${tenantId}`);
}
