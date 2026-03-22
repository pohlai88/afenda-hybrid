export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { db } from "@afenda/db/src/db";
import {
  MetricCard,
  WidgetGrid,
  WidgetGridItem,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@afenda/ui";
import { redirect } from "next/navigation";

interface DashboardWidget {
  userDashboardWidgetId: number;
  tenantId: number;
  userId: number;
  templateWidgetId: number | null;
  widgetType: string;
  title: string | null;
  config: unknown;
  gridPosition: { x: number; y: number; w: number; h: number };
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    userDashboardWidgetId: 1,
    tenantId: 1,
    userId: 1,
    templateWidgetId: null,
    widgetType: "METRIC",
    title: "Total Employees",
    config: { icon: "Users", color: "#10b981" },
    gridPosition: { x: 0, y: 0, w: 3, h: 2 },
    sortOrder: 1,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    updatedBy: 1,
  },
  {
    userDashboardWidgetId: 2,
    tenantId: 1,
    userId: 1,
    templateWidgetId: null,
    widgetType: "METRIC",
    title: "Open Requisitions",
    config: { icon: "Briefcase", color: "#f97316" },
    gridPosition: { x: 3, y: 0, w: 3, h: 2 },
    sortOrder: 2,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    updatedBy: 1,
  },
  {
    userDashboardWidgetId: 3,
    tenantId: 1,
    userId: 1,
    templateWidgetId: null,
    widgetType: "METRIC",
    title: "Pending Approvals",
    config: { icon: "Clock", color: "#6366f1" },
    gridPosition: { x: 6, y: 0, w: 3, h: 2 },
    sortOrder: 3,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    updatedBy: 1,
  },
  {
    userDashboardWidgetId: 4,
    tenantId: 1,
    userId: 1,
    templateWidgetId: null,
    widgetType: "METRIC",
    title: "Active Departments",
    config: { icon: "Building2", color: "#8b5cf6" },
    gridPosition: { x: 9, y: 0, w: 3, h: 2 },
    sortOrder: 4,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    updatedBy: 1,
  },
];

async function loadWidgets(session: {
  tenantId: number;
  userId: number;
}): Promise<DashboardWidget[]> {
  try {
    const { userDashboardWidgets } =
      await import("@afenda/db/src/schema-platform/core/userDashboardWidgets");
    const { dashboardWidgets } =
      await import("@afenda/db/src/schema-platform/core/dashboardWidgets");
    const { eq, and, asc } = await import("drizzle-orm");

    const userWidgets = await db
      .select()
      .from(userDashboardWidgets)
      .where(
        and(
          eq(userDashboardWidgets.tenantId, session.tenantId),
          eq(userDashboardWidgets.userId, session.userId),
          eq(userDashboardWidgets.isVisible, true)
        )
      )
      .orderBy(asc(userDashboardWidgets.sortOrder));

    if (userWidgets.length > 0) {
      return userWidgets.map((w) => ({
        userDashboardWidgetId: w.userDashboardWidgetId,
        tenantId: w.tenantId,
        userId: w.userId,
        templateWidgetId: w.templateWidgetId,
        widgetType: w.widgetType,
        title: w.title,
        config: w.config,
        gridPosition: (w.gridPosition as { x: number; y: number; w: number; h: number }) || {
          x: 0,
          y: 0,
          w: 4,
          h: 2,
        },
        sortOrder: w.sortOrder,
        isVisible: w.isVisible,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        createdBy: w.createdBy,
        updatedBy: w.updatedBy,
      }));
    }

    const dashboardWidgetsList = await db
      .select()
      .from(dashboardWidgets)
      .where(
        and(eq(dashboardWidgets.tenantId, session.tenantId), eq(dashboardWidgets.isEnabled, true))
      );

    if (dashboardWidgetsList.length > 0) {
      return dashboardWidgetsList.slice(0, 4).map((widget, index) => ({
        userDashboardWidgetId: widget.widgetId,
        tenantId: widget.tenantId,
        userId: session.userId,
        templateWidgetId: widget.widgetId,
        widgetType: widget.widgetType,
        title: widget.name,
        config: widget.config,
        gridPosition: {
          x: (index % 4) * 3,
          y: Math.floor(index / 4) * 2,
          w: 3,
          h: 2,
        },
        sortOrder: index,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session.userId,
        updatedBy: session.userId,
      }));
    }

    return DEFAULT_WIDGETS;
  } catch (error) {
    console.error("[dashboard] Failed to load widgets from database:", error);
    return DEFAULT_WIDGETS;
  }
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const widgetsToRender = await loadWidgets(session);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.displayName}</p>
      </div>

      <WidgetGrid columns={12} gap={4}>
        {widgetsToRender.map((widget) => {
          const position =
            typeof widget.gridPosition === "object" && widget.gridPosition !== null
              ? (widget.gridPosition as { x: number; y: number; w: number; h: number })
              : { x: 0, y: 0, w: 4, h: 2 };

          if (widget.widgetType === "METRIC") {
            const config = typeof widget.config === "object" ? widget.config : {};
            return (
              <WidgetGridItem key={widget.userDashboardWidgetId} position={position}>
                <MetricCard
                  title={widget.title || "Metric"}
                  value={0}
                  icon={(config as { icon?: string }).icon}
                  color={(config as { color?: string }).color}
                  description="Loading..."
                />
              </WidgetGridItem>
            );
          }

          if (widget.widgetType === "TABLE") {
            return (
              <WidgetGridItem key={widget.userDashboardWidgetId} position={position}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{widget.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Table widget - data loading...</p>
                  </CardContent>
                </Card>
              </WidgetGridItem>
            );
          }

          if (widget.widgetType === "LIST") {
            return (
              <WidgetGridItem key={widget.userDashboardWidgetId} position={position}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{widget.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">List widget - data loading...</p>
                  </CardContent>
                </Card>
              </WidgetGridItem>
            );
          }

          return (
            <WidgetGridItem key={widget.userDashboardWidgetId} position={position}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{widget.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{widget.widgetType} widget</p>
                </CardContent>
              </Card>
            </WidgetGridItem>
          );
        })}
      </WidgetGrid>
    </div>
  );
}
