import { db } from "../db";
import { appraisalTemplates, appraisalTemplateGoals } from "../schema-hrm/talent";
import { and, eq, sql } from "drizzle-orm";

/**
 * Seed: Appraisal Templates (starter performance review templates)
 *
 * Idempotent: Upsert templates by (tenantId, templateCode); goals by (templateId, sequenceNumber).
 */
export async function seedAppraisalTemplates(tenantId: number, systemUserId: number) {
  const templates = [
    {
      templateCode: "ANNUAL_REVIEW",
      name: "Annual Performance Review",
      description: "Standard annual performance review template",
      status: "ACTIVE" as const,
      goals: [
        { description: "Job Knowledge & Skills", weight: 20, sequenceNumber: 1 },
        { description: "Quality of Work", weight: 20, sequenceNumber: 2 },
        { description: "Productivity & Efficiency", weight: 15, sequenceNumber: 3 },
        { description: "Communication & Collaboration", weight: 15, sequenceNumber: 4 },
        { description: "Initiative & Problem Solving", weight: 15, sequenceNumber: 5 },
        { description: "Leadership & Mentoring", weight: 15, sequenceNumber: 6 },
      ],
    },
    {
      templateCode: "PROBATION_REVIEW",
      name: "Probation Review",
      description: "End-of-probation performance review",
      status: "ACTIVE" as const,
      goals: [
        { description: "Adaptability & Learning", weight: 30, sequenceNumber: 1 },
        { description: "Job Performance", weight: 30, sequenceNumber: 2 },
        { description: "Team Integration", weight: 20, sequenceNumber: 3 },
        { description: "Attendance & Punctuality", weight: 20, sequenceNumber: 4 },
      ],
    },
  ];

  for (const template of templates) {
    const existingTpl = await db
      .select({ templateId: appraisalTemplates.templateId })
      .from(appraisalTemplates)
      .where(
        and(
          eq(appraisalTemplates.tenantId, tenantId),
          eq(appraisalTemplates.templateCode, template.templateCode),
          sql`${appraisalTemplates.deletedAt} IS NULL`
        )
      )
      .limit(1);

    let templateId: number;

    if (existingTpl[0]) {
      templateId = existingTpl[0].templateId;
      await db
        .update(appraisalTemplates)
        .set({
          name: template.name,
          description: template.description,
          status: template.status,
          updatedAt: sql`now()`,
          updatedBy: systemUserId,
        })
        .where(eq(appraisalTemplates.templateId, templateId));
    } else {
      const inserted = await db
        .insert(appraisalTemplates)
        .values({
          tenantId,
          templateCode: template.templateCode,
          name: template.name,
          description: template.description,
          status: template.status,
          createdBy: systemUserId,
          updatedBy: systemUserId,
        })
        .returning({ templateId: appraisalTemplates.templateId });
      templateId = inserted[0]!.templateId;
    }

    for (const goal of template.goals) {
      const weightStr = String(goal.weight);
      const existingGoal = await db
        .select({ goalId: appraisalTemplateGoals.goalId })
        .from(appraisalTemplateGoals)
        .where(
          and(
            eq(appraisalTemplateGoals.templateId, templateId),
            eq(appraisalTemplateGoals.sequenceNumber, goal.sequenceNumber)
          )
        )
        .limit(1);

      if (existingGoal[0]) {
        await db
          .update(appraisalTemplateGoals)
          .set({
            description: goal.description,
            weight: weightStr,
            updatedAt: sql`now()`,
            updatedBy: systemUserId,
          })
          .where(eq(appraisalTemplateGoals.goalId, existingGoal[0].goalId));
      } else {
        await db.insert(appraisalTemplateGoals).values({
          templateId,
          description: goal.description,
          weight: weightStr,
          sequenceNumber: goal.sequenceNumber,
          createdBy: systemUserId,
          updatedBy: systemUserId,
        });
      }
    }
  }

  console.log(`✓ Seeded ${templates.length} appraisal templates for tenant ${tenantId}`);
}
