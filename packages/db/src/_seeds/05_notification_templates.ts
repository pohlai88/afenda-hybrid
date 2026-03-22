import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Seed: Notification Templates (common system events)
 *
 * Idempotent: Uses ON CONFLICT DO UPDATE to ensure templates exist.
 */
export async function seedNotificationTemplates(tenantId: number, systemUserId: number) {
  const templates = [
    {
      templateCode: "LEAVE_REQUEST_SUBMITTED",
      name: "Leave Request Submitted",
      subject: "Leave Request Submitted",
      bodyTemplate:
        "Your leave request for {{leaveType}} from {{startDate}} to {{endDate}} has been submitted.",
      channel: "IN_APP",
    },
    {
      templateCode: "LEAVE_REQUEST_APPROVED",
      name: "Leave Request Approved",
      subject: "Leave Request Approved",
      bodyTemplate:
        "Your leave request for {{leaveType}} from {{startDate}} to {{endDate}} has been approved.",
      channel: "EMAIL",
    },
    {
      templateCode: "LEAVE_REQUEST_REJECTED",
      name: "Leave Request Rejected",
      subject: "Leave Request Rejected",
      bodyTemplate:
        "Your leave request for {{leaveType}} from {{startDate}} to {{endDate}} has been rejected. Reason: {{reason}}",
      channel: "EMAIL",
    },
    {
      templateCode: "PAYROLL_RUN_COMPLETED",
      name: "Payroll Run Completed",
      subject: "Payroll Processed",
      bodyTemplate:
        "Payroll for period {{periodStart}} to {{periodEnd}} has been processed. Net pay: {{netPay}}",
      channel: "EMAIL",
    },
    {
      templateCode: "BENEFIT_CLAIM_SUBMITTED",
      name: "Benefit Claim Submitted",
      subject: "Benefit Claim Submitted",
      bodyTemplate: "Your benefit claim for {{claimType}} (amount: {{amount}}) has been submitted.",
      channel: "IN_APP",
    },
    {
      templateCode: "BENEFIT_CLAIM_APPROVED",
      name: "Benefit Claim Approved",
      subject: "Benefit Claim Approved",
      bodyTemplate: "Your benefit claim for {{claimType}} (amount: {{amount}}) has been approved.",
      channel: "EMAIL",
    },
    {
      templateCode: "APPRAISAL_DUE",
      name: "Appraisal Due",
      subject: "Performance Appraisal Due",
      bodyTemplate: "Your performance appraisal for cycle {{cycleName}} is due by {{dueDate}}.",
      channel: "IN_APP",
    },
    {
      templateCode: "APPRAISAL_COMPLETED",
      name: "Appraisal Completed",
      subject: "Performance Appraisal Completed",
      bodyTemplate:
        "Your performance appraisal for cycle {{cycleName}} has been completed. Final score: {{finalScore}}",
      channel: "EMAIL",
    },
    {
      templateCode: "INTERVIEW_SCHEDULED",
      name: "Interview Scheduled",
      subject: "Interview Scheduled",
      bodyTemplate:
        "An interview has been scheduled for {{candidateName}} on {{scheduledAt}} at {{location}}.",
      channel: "EMAIL",
    },
    {
      templateCode: "WORKFLOW_STATE_CHANGED",
      name: "Workflow State Changed",
      subject: "Workflow Status Update",
      bodyTemplate:
        "Workflow {{workflowName}} for {{recordType}} #{{recordId}} moved from {{fromState}} to {{toState}}.",
      channel: "IN_APP",
    },
  ];

  for (const template of templates) {
    await db.execute(sql`
      INSERT INTO core.notification_templates (
        "tenantId", "templateCode", name, subject, "bodyTemplate", channel,
        "createdAt", "updatedAt", "createdBy", "updatedBy"
      )
      VALUES (
        ${tenantId}, ${template.templateCode}, ${template.name}, ${template.subject},
        ${template.bodyTemplate}, ${template.channel}::"core"."notification_channel",
        now(), now(), ${systemUserId}, ${systemUserId}
      )
      ON CONFLICT ("tenantId", lower("templateCode"))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        subject = EXCLUDED.subject,
        "bodyTemplate" = EXCLUDED."bodyTemplate",
        channel = EXCLUDED.channel,
        "updatedAt" = now(),
        "updatedBy" = ${systemUserId}
    `);
  }

  console.log(`✓ Seeded ${templates.length} notification templates for tenant ${tenantId}`);
}
