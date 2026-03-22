import { seedBootstrap, type BootstrapResult } from "./00_bootstrap";
import { seedRolesAndPermissions } from "./00_roles_permissions";
import { seedAppModules } from "./01_app_modules";
import { seedMenuItems } from "./02_menu_items";
import { seedDashboardWidgets } from "./03_dashboard_widgets";
import { seedNotificationChannels } from "./04_notification_channels";
import { seedNotificationTemplates } from "./05_notification_templates";
import { seedEmailTemplates } from "./06_email_templates";
import { seedLetterTemplates } from "./07_letter_templates";
import { seedWorkflowDefinitions } from "./08_workflow_definitions";
import { seedAppraisalTemplates } from "./09_appraisal_templates";

export { seedBootstrap, type BootstrapResult };

/**
 * Master seed runner for AFENDA platform tables.
 *
 * Runs all seed scripts in order. All seeds are idempotent and can be re-run safely.
 *
 * Maps to DB prerequisites plan (conceptual order):
 * - `00_bootstrap` → tenant + currencies + system user (plan: 01-tenants, 02-currencies)
 * - `00_roles_permissions` → roles + permissions (plan: 03-roles-permissions)
 * - `01_app_modules` … `02_menu_items` → navigation (plan: 04–05)
 * - `08_workflow_definitions` → workflows (plan: 06)
 * - `05_notification_templates` (+ channels/email/letter) → communications (plan: 07+)
 * - `03_dashboard_widgets`, `09_appraisal_templates` → extra starter data beyond the original 7 scripts
 *
 * Usage:
 *   import { runSeeds } from "./db/_seeds";
 *   await runSeeds(tenantId, systemUserId);
 */
export async function runSeeds(tenantId: number, systemUserId: number) {
  console.log(`\n🌱 Seeding platform data for tenant ${tenantId}...\n`);

  // Security & Access Control
  await seedRolesAndPermissions(tenantId, systemUserId);

  // Platform Configuration
  await seedAppModules(tenantId, systemUserId);
  await seedMenuItems(tenantId, systemUserId);
  await seedDashboardWidgets(tenantId, systemUserId);

  // Communication
  await seedNotificationChannels(tenantId, systemUserId);
  await seedNotificationTemplates(tenantId, systemUserId);
  await seedEmailTemplates(tenantId, systemUserId);
  await seedLetterTemplates(tenantId, systemUserId);

  // Workflows
  await seedWorkflowDefinitions(tenantId, systemUserId);

  // HR/Talent
  await seedAppraisalTemplates(tenantId, systemUserId);

  console.log(`\n✅ All seeds completed for tenant ${tenantId}\n`);
}

/**
 * Full bootstrap: creates tenant, system user, currencies, then runs all seeds.
 *
 * Usage:
 *   import { runFullBootstrap } from "./db/_seeds";
 *   const { tenantId, systemUserId } = await runFullBootstrap();
 */
export async function runFullBootstrap(): Promise<BootstrapResult> {
  const { tenantId, systemUserId } = await seedBootstrap();
  await runSeeds(tenantId, systemUserId);
  return { tenantId, systemUserId };
}
