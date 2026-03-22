import { sql } from "drizzle-orm";
import { integer, text, boolean, jsonb, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, timestampColumns } from "../../_shared";
import { coreSchema } from "./tenants";
import { tenants } from "./tenants";
import { dashboardWidgets } from "./dashboardWidgets";
import { users } from "../security/users";

/**
 * Per-user dashboard widget placements (plan §2f style).
 *
 * Tenant-scoped **catalog** definitions stay on `dashboard_widgets`. This table stores each
 * user's layout instances: `widgetType`, `title`, `config`, `gridPosition`, optional link to a
 * catalog row via `templateWidgetId`.
 */
export const userDashboardWidgets = coreSchema.table(
  "user_dashboard_widgets",
  {
    userDashboardWidgetId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    userId: integer().notNull(),
    templateWidgetId: integer(),
    widgetType: text().notNull(),
    title: text().notNull(),
    config: jsonb(),
    gridPosition: jsonb(),
    sortOrder: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_user_dashboard_widgets_tenant").on(t.tenantId),
    index("idx_user_dashboard_widgets_user").on(t.tenantId, t.userId),
    index("idx_user_dashboard_widgets_user_sort").on(t.tenantId, t.userId, t.sortOrder),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_user_dashboard_widgets_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.userId],
      name: "fk_user_dashboard_widgets_user",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.templateWidgetId],
      foreignColumns: [dashboardWidgets.widgetId],
      name: "fk_user_dashboard_widgets_template",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.createdBy],
      foreignColumns: [users.userId],
      name: "fk_user_dashboard_widgets_created_by",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.updatedBy],
      foreignColumns: [users.userId],
      name: "fk_user_dashboard_widgets_updated_by",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_user_dashboard_widgets_sort_order", sql`${t.sortOrder} >= 0`),
  ]
);

export const UserDashboardWidgetIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"UserDashboardWidgetId">();
export type UserDashboardWidgetId = z.infer<typeof UserDashboardWidgetIdSchema>;

export const DashboardGridPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

export const userDashboardWidgetSelectSchema = createSelectSchema(userDashboardWidgets);

export const userDashboardWidgetInsertSchema = createInsertSchema(userDashboardWidgets, {
  tenantId: z.number().int().positive(),
  userId: z.number().int().positive(),
  templateWidgetId: z.number().int().positive().optional(),
  widgetType: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  config: z.record(z.string(), z.unknown()).optional(),
  gridPosition: DashboardGridPositionSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const userDashboardWidgetUpdateSchema = createUpdateSchema(userDashboardWidgets, {
  templateWidgetId: z.number().int().positive().optional().nullable(),
  widgetType: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  gridPosition: DashboardGridPositionSchema.optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
});

export type UserDashboardWidget = typeof userDashboardWidgets.$inferSelect;
export type NewUserDashboardWidget = typeof userDashboardWidgets.$inferInsert;
