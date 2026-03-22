import { sql } from "drizzle-orm";
import {
  integer,
  text,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { coreSchema } from "./tenants";
import { tenants } from "./tenants";
import { appModules } from "./appModules";

export const widgetTypes = ["CHART", "TABLE", "METRIC", "LIST", "CALENDAR"] as const;
export const widgetTypeEnum = coreSchema.enum("dashboard_widget_type", [...widgetTypes]);
export const WidgetTypeSchema = z.enum(widgetTypes);
export type WidgetType = z.infer<typeof WidgetTypeSchema>;

/**
 * Dashboard Widgets - Configurable dashboard components.
 *
 * Defines reusable widget templates (charts, metrics, tables) that users can
 * add to their dashboards. Similar to Odoo's `board.board` but with explicit
 * widget types and data source queries.
 *
 * SECURITY: `dataQuery` is server-executed SQL - must be validated/sanitized
 * before storage. Consider using a safe query builder or pre-approved templates.
 */
export const dashboardWidgets = coreSchema.table(
  "dashboard_widgets",
  {
    widgetId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    appModuleId: integer(),
    // code: widget template key, unique per tenant (with soft-delete filter)
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    widgetType: widgetTypeEnum().notNull(),
    dataQuery: text().notNull(),
    config: jsonb(),
    defaultWidth: integer().notNull().default(4),
    defaultHeight: integer().notNull().default(3),
    isEnabled: boolean().notNull().default(true),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_dashboard_widgets_tenant").on(t.tenantId),
    index("idx_dashboard_widgets_module").on(t.tenantId, t.appModuleId),
    index("idx_dashboard_widgets_type").on(t.tenantId, t.widgetType),
    index("idx_dashboard_widgets_enabled").on(t.tenantId, t.isEnabled),
    uniqueIndex("uq_dashboard_widgets_code")
      .on(t.tenantId, sql`lower(${t.code})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_dashboard_widgets_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.appModuleId],
      foreignColumns: [appModules.appModuleId],
      name: "fk_dashboard_widgets_module",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check("chk_dashboard_widgets_width", sql`${t.defaultWidth} >= 1 AND ${t.defaultWidth} <= 12`),
    check(
      "chk_dashboard_widgets_height",
      sql`${t.defaultHeight} >= 1 AND ${t.defaultHeight} <= 12`
    ),
  ]
);

export const WidgetIdSchema = z.number().int().positive().brand<"WidgetId">();
export type WidgetId = z.infer<typeof WidgetIdSchema>;

export const WidgetConfigSchema = z.record(z.string(), z.any()).optional();

export const dashboardWidgetSelectSchema = createSelectSchema(dashboardWidgets);

export const dashboardWidgetInsertSchema = createInsertSchema(dashboardWidgets, {
  tenantId: z.number().int().positive(),
  appModuleId: z.number().int().positive().optional(),
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  widgetType: WidgetTypeSchema,
  dataQuery: z.string().min(1).max(5000),
  config: WidgetConfigSchema,
  defaultWidth: z.number().int().min(1).max(12).optional(),
  defaultHeight: z.number().int().min(1).max(12).optional(),
  isEnabled: z.boolean().optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const dashboardWidgetUpdateSchema = createUpdateSchema(dashboardWidgets, {
  appModuleId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  widgetType: WidgetTypeSchema.optional(),
  dataQuery: z.string().min(1).max(5000).optional(),
  config: WidgetConfigSchema.nullable(),
  defaultWidth: z.number().int().min(1).max(12).optional(),
  defaultHeight: z.number().int().min(1).max(12).optional(),
  isEnabled: z.boolean().optional(),
});

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type NewDashboardWidget = typeof dashboardWidgets.$inferInsert;
