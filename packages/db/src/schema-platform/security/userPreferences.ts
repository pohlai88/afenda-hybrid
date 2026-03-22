import { sql } from "drizzle-orm";
import { integer, text, boolean, jsonb, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../_shared";
import { tenants } from "../core/tenants";
import { securitySchema } from "./users";
import { users } from "./users";

export const userThemes = ["light", "dark", "system"] as const;
export const userThemeEnum = securitySchema.enum("user_theme", [...userThemes]);
export const UserThemeSchema = z.enum(userThemes);
export type UserTheme = z.infer<typeof UserThemeSchema>;

/**
 * User Preferences - Per-user UI/UX settings and personalization.
 *
 * Stores locale, timezone, theme, sidebar state, saved filters, dashboard layout,
 * and recently accessed resources for quick navigation.
 *
 * Locale and timezone here override tenant defaults. Full preferences (filters,
 * dashboard layout) are stored here to avoid bloating the users table.
 */
export const userPreferences = securitySchema.table(
  "user_preferences",
  {
    userPreferenceId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    userId: integer().notNull(),
    locale: text(),
    timezone: text(),
    theme: userThemeEnum().notNull().default("system"),
    sidebarCollapsed: boolean().notNull().default(false),
    defaultFilters: jsonb(),
    dashboardLayout: jsonb(),
    recentResources: jsonb(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_user_preferences_tenant").on(t.tenantId),
    index("idx_user_preferences_user").on(t.tenantId, t.userId),
    uniqueIndex("uq_user_preferences_user")
      .on(t.tenantId, t.userId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_user_preferences_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.userId],
      name: "fk_user_preferences_user",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const UserPreferenceIdSchema = z.number().int().positive().brand<"UserPreferenceId">();
export type UserPreferenceId = z.infer<typeof UserPreferenceIdSchema>;

export const LocaleSchema = z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, "Format: en-US, ar-SA");
export const TimezoneSchema = z.string().min(1).max(50);

export const DefaultFiltersSchema = z.record(z.string(), z.any()).optional();
export const DashboardLayoutSchema = z
  .object({
    widgets: z.array(
      z.object({
        id: z.string(),
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        w: z.number().int().min(1),
        h: z.number().int().min(1),
      })
    ),
  })
  .optional();

export const RecentResourcesSchema = z
  .array(
    z.object({
      schema: z.string(),
      table: z.string(),
      id: z.number().int(),
      label: z.string(),
      accessedAt: z.string().datetime(),
    })
  )
  .max(20)
  .optional();

export const userPreferenceSelectSchema = createSelectSchema(userPreferences);

export const userPreferenceInsertSchema = createInsertSchema(userPreferences, {
  tenantId: z.number().int().positive(),
  userId: z.number().int().positive(),
  locale: LocaleSchema.optional(),
  timezone: TimezoneSchema.optional(),
  theme: UserThemeSchema.optional(),
  sidebarCollapsed: z.boolean().optional(),
  defaultFilters: DefaultFiltersSchema,
  dashboardLayout: DashboardLayoutSchema,
  recentResources: RecentResourcesSchema,
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const userPreferenceUpdateSchema = createUpdateSchema(userPreferences, {
  locale: LocaleSchema.optional().nullable(),
  timezone: TimezoneSchema.optional().nullable(),
  theme: UserThemeSchema.optional(),
  sidebarCollapsed: z.boolean().optional(),
  defaultFilters: DefaultFiltersSchema.nullable(),
  dashboardLayout: DashboardLayoutSchema.nullable(),
  recentResources: RecentResourcesSchema.nullable(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
