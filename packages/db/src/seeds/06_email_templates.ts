import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Seed: Email Templates (transactional emails)
 *
 * Idempotent: Uses ON CONFLICT DO UPDATE to ensure templates exist.
 */
export async function seedEmailTemplates(tenantId: number, systemUserId: number) {
  const templates = [
    {
      templateCode: "WELCOME_EMAIL",
      name: "Welcome Email",
      subject: "Welcome to AFENDA HRM",
      bodyHtml: `
        <h1>Welcome, {{displayName}}!</h1>
        <p>Your account has been created successfully.</p>
        <p>Email: {{email}}</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="{{verificationLink}}">Verify Email</a>
      `,
      bodyText:
        "Welcome, {{displayName}}! Your account has been created. Email: {{email}}. Verify: {{verificationLink}}",
    },
    {
      templateCode: "PASSWORD_RESET",
      name: "Password Reset",
      subject: "Password Reset Request",
      bodyHtml: `
        <h1>Password Reset</h1>
        <p>Hi {{displayName}},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="{{resetLink}}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
      bodyText: "Hi {{displayName}}, reset your password: {{resetLink}}. Expires in 1 hour.",
    },
    {
      templateCode: "LEAVE_APPROVED_EMAIL",
      name: "Leave Approved Email",
      subject: "Leave Request Approved",
      bodyHtml: `
        <h1>Leave Request Approved</h1>
        <p>Hi {{employeeName}},</p>
        <p>Your leave request has been approved:</p>
        <ul>
          <li>Type: {{leaveType}}</li>
          <li>From: {{startDate}}</li>
          <li>To: {{endDate}}</li>
          <li>Days: {{daysCount}}</li>
        </ul>
      `,
      bodyText:
        "Hi {{employeeName}}, your leave request ({{leaveType}}, {{startDate}} to {{endDate}}) has been approved.",
    },
    {
      templateCode: "PAYSLIP_READY",
      name: "Payslip Ready",
      subject: "Your Payslip is Ready",
      bodyHtml: `
        <h1>Payslip Ready</h1>
        <p>Hi {{employeeName}},</p>
        <p>Your payslip for {{periodStart}} to {{periodEnd}} is now available.</p>
        <p>Net Pay: {{netPay}}</p>
        <a href="{{payslipLink}}">View Payslip</a>
      `,
      bodyText:
        "Hi {{employeeName}}, your payslip for {{periodStart}} to {{periodEnd}} is ready. Net Pay: {{netPay}}. View: {{payslipLink}}",
    },
    {
      templateCode: "APPRAISAL_REMINDER",
      name: "Appraisal Reminder",
      subject: "Performance Appraisal Reminder",
      bodyHtml: `
        <h1>Appraisal Reminder</h1>
        <p>Hi {{employeeName}},</p>
        <p>Your performance appraisal for cycle {{cycleName}} is due by {{dueDate}}.</p>
        <p>Please complete your self-review at your earliest convenience.</p>
        <a href="{{appraisalLink}}">Complete Appraisal</a>
      `,
      bodyText:
        "Hi {{employeeName}}, your appraisal for {{cycleName}} is due by {{dueDate}}. Complete: {{appraisalLink}}",
    },
  ];

  for (const template of templates) {
    await db.execute(sql`
      INSERT INTO core.email_templates (
        "tenantId", "templateCode", name, subject, "bodyHtml", "bodyText",
        "createdAt", "updatedAt", "createdBy", "updatedBy"
      )
      VALUES (
        ${tenantId}, ${template.templateCode}, ${template.name}, ${template.subject},
        ${template.bodyHtml}, ${template.bodyText}, now(), now(), ${systemUserId}, ${systemUserId}
      )
      ON CONFLICT ("tenantId", lower("templateCode"))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        subject = EXCLUDED.subject,
        "bodyHtml" = EXCLUDED."bodyHtml",
        "bodyText" = EXCLUDED."bodyText",
        "updatedAt" = now(),
        "updatedBy" = ${systemUserId}
    `);
  }

  console.log(`✓ Seeded ${templates.length} email templates for tenant ${tenantId}`);
}
