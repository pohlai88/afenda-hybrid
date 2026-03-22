import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Seed: Letter Templates (official HR letters)
 *
 * Idempotent: Uses ON CONFLICT DO UPDATE to ensure templates exist.
 */
export async function seedLetterTemplates(tenantId: number, systemUserId: number) {
  const templates = [
    {
      templateCode: "APPOINTMENT_LETTER",
      name: "Appointment Letter",
      letterType: "APPOINTMENT",
      bodyTemplate: `
Dear {{employeeName}},

We are pleased to offer you the position of {{positionTitle}} at {{organizationName}}, effective {{joiningDate}}.

Your compensation package includes:
- Base Salary: {{baseSalary}}
- Benefits: {{benefits}}

Please report to {{locationName}} on {{joiningDate}} at 9:00 AM.

Sincerely,
{{signatoryName}}
{{signatoryTitle}}
      `,
    },
    {
      templateCode: "CONFIRMATION_LETTER",
      name: "Confirmation Letter",
      letterType: "CONFIRMATION",
      bodyTemplate: `
Dear {{employeeName}},

We are pleased to confirm your employment as {{positionTitle}} at {{organizationName}}, effective {{confirmationDate}}.

Your probation period has been successfully completed.

Sincerely,
{{signatoryName}}
{{signatoryTitle}}
      `,
    },
    {
      templateCode: "PROMOTION_LETTER",
      name: "Promotion Letter",
      letterType: "PROMOTION",
      bodyTemplate: `
Dear {{employeeName}},

Congratulations! We are pleased to inform you of your promotion to {{newPositionTitle}}, effective {{effectiveDate}}.

Your new compensation:
- Base Salary: {{newBaseSalary}}

We look forward to your continued contributions.

Sincerely,
{{signatoryName}}
{{signatoryTitle}}
      `,
    },
    {
      templateCode: "EXPERIENCE_LETTER",
      name: "Experience Letter",
      letterType: "EXPERIENCE",
      bodyTemplate: `
TO WHOM IT MAY CONCERN

This is to certify that {{employeeName}} was employed with {{organizationName}} from {{joiningDate}} to {{relievingDate}}.

During this period, {{employeeName}} held the position of {{positionTitle}} in the {{departmentName}} department.

We wish {{employeeName}} all the best in future endeavors.

Sincerely,
{{signatoryName}}
{{signatoryTitle}}
      `,
    },
    {
      templateCode: "SALARY_REVISION_LETTER",
      name: "Salary Revision Letter",
      letterType: "SALARY_REVISION",
      bodyTemplate: `
Dear {{employeeName}},

We are pleased to inform you that your salary has been revised, effective {{effectiveDate}}.

Your new compensation:
- Previous Salary: {{oldSalary}}
- New Salary: {{newSalary}}
- Increase: {{increasePercent}}%

Congratulations on your continued performance.

Sincerely,
{{signatoryName}}
{{signatoryTitle}}
      `,
    },
  ];

  for (const template of templates) {
    await db.execute(sql`
      INSERT INTO core.letter_templates (
        "tenantId", "templateCode", name, "letterType", "bodyTemplate",
        "createdAt", "updatedAt", "createdBy", "updatedBy"
      )
      VALUES (
        ${tenantId}, ${template.templateCode}, ${template.name},
        ${template.letterType}::"core"."letter_type", ${template.bodyTemplate},
        now(), now(), ${systemUserId}, ${systemUserId}
      )
      ON CONFLICT ("tenantId", lower("templateCode"))
      WHERE "deletedAt" IS NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        "letterType" = EXCLUDED."letterType",
        "bodyTemplate" = EXCLUDED."bodyTemplate",
        "updatedAt" = now(),
        "updatedBy" = ${systemUserId}
    `);
  }

  console.log(`✓ Seeded ${templates.length} letter templates for tenant ${tenantId}`);
}
