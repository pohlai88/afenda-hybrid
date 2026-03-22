import { db } from "../db";
import { workflowDefinitions, workflowStates, workflowTransitions } from "../schema-platform";
import { and, eq, sql } from "drizzle-orm";

/**
 * Seed: Workflow Definitions (starter workflows)
 *
 * Idempotent: Upsert by natural keys (no reliance on missing partial unique indexes).
 */
export async function seedWorkflowDefinitions(tenantId: number, systemUserId: number) {
  const workflows = [
    {
      workflowCode: "LEAVE_APPROVAL",
      name: "Leave Request Approval",
      description: "Standard leave request approval workflow",
      targetSchema: "hr",
      targetTable: "leave_requests",
      states: [
        {
          stateCode: "PENDING",
          name: "Pending",
          isInitial: true,
          isFinal: false,
          sequenceNumber: 1,
        },
        {
          stateCode: "APPROVED",
          name: "Approved",
          isInitial: false,
          isFinal: true,
          sequenceNumber: 2,
        },
        {
          stateCode: "REJECTED",
          name: "Rejected",
          isInitial: false,
          isFinal: true,
          sequenceNumber: 3,
        },
      ],
      transitions: [
        { fromStateCode: "PENDING", toStateCode: "APPROVED", action: "Approve" },
        { fromStateCode: "PENDING", toStateCode: "REJECTED", action: "Reject" },
      ],
    },
    {
      workflowCode: "CLAIM_APPROVAL",
      name: "Benefit Claim Approval",
      description: "Standard benefit claim approval workflow",
      targetSchema: "benefits",
      targetTable: "claims_records",
      states: [
        {
          stateCode: "SUBMITTED",
          name: "Submitted",
          isInitial: true,
          isFinal: false,
          sequenceNumber: 1,
        },
        {
          stateCode: "UNDER_REVIEW",
          name: "Under Review",
          isInitial: false,
          isFinal: false,
          sequenceNumber: 2,
        },
        {
          stateCode: "APPROVED",
          name: "Approved",
          isInitial: false,
          isFinal: false,
          sequenceNumber: 3,
        },
        { stateCode: "PAID", name: "Paid", isInitial: false, isFinal: true, sequenceNumber: 4 },
        {
          stateCode: "REJECTED",
          name: "Rejected",
          isInitial: false,
          isFinal: true,
          sequenceNumber: 5,
        },
      ],
      transitions: [
        { fromStateCode: "SUBMITTED", toStateCode: "UNDER_REVIEW", action: "Start Review" },
        { fromStateCode: "UNDER_REVIEW", toStateCode: "APPROVED", action: "Approve" },
        { fromStateCode: "UNDER_REVIEW", toStateCode: "REJECTED", action: "Reject" },
        { fromStateCode: "APPROVED", toStateCode: "PAID", action: "Mark Paid" },
      ],
    },
    {
      workflowCode: "PAYROLL_CORRECTION_APPROVAL",
      name: "Payroll Correction Approval",
      description: "Standard payroll correction approval workflow",
      targetSchema: "payroll",
      targetTable: "payroll_corrections",
      states: [
        { stateCode: "DRAFT", name: "Draft", isInitial: true, isFinal: false, sequenceNumber: 1 },
        {
          stateCode: "SUBMITTED",
          name: "Submitted",
          isInitial: false,
          isFinal: false,
          sequenceNumber: 2,
        },
        {
          stateCode: "APPROVED",
          name: "Approved",
          isInitial: false,
          isFinal: false,
          sequenceNumber: 3,
        },
        {
          stateCode: "APPLIED",
          name: "Applied",
          isInitial: false,
          isFinal: true,
          sequenceNumber: 4,
        },
        {
          stateCode: "REJECTED",
          name: "Rejected",
          isInitial: false,
          isFinal: true,
          sequenceNumber: 5,
        },
      ],
      transitions: [
        { fromStateCode: "DRAFT", toStateCode: "SUBMITTED", action: "Submit" },
        { fromStateCode: "SUBMITTED", toStateCode: "APPROVED", action: "Approve" },
        { fromStateCode: "SUBMITTED", toStateCode: "REJECTED", action: "Reject" },
        { fromStateCode: "APPROVED", toStateCode: "APPLIED", action: "Apply" },
      ],
    },
  ];

  for (const workflow of workflows) {
    const existingWf = await db
      .select({ workflowId: workflowDefinitions.workflowId })
      .from(workflowDefinitions)
      .where(
        and(
          eq(workflowDefinitions.tenantId, tenantId),
          eq(workflowDefinitions.workflowCode, workflow.workflowCode),
          sql`${workflowDefinitions.deletedAt} IS NULL`
        )
      )
      .limit(1);

    let workflowId: number;

    if (existingWf[0]) {
      workflowId = existingWf[0].workflowId;
      await db
        .update(workflowDefinitions)
        .set({
          name: workflow.name,
          description: workflow.description,
          targetSchema: workflow.targetSchema,
          targetTable: workflow.targetTable,
          status: "ACTIVE",
          updatedAt: sql`now()`,
          updatedBy: systemUserId,
        })
        .where(eq(workflowDefinitions.workflowId, workflowId));
    } else {
      const inserted = await db
        .insert(workflowDefinitions)
        .values({
          tenantId,
          workflowCode: workflow.workflowCode,
          name: workflow.name,
          description: workflow.description,
          targetSchema: workflow.targetSchema,
          targetTable: workflow.targetTable,
          status: "ACTIVE",
          createdBy: systemUserId,
          updatedBy: systemUserId,
        })
        .returning({ workflowId: workflowDefinitions.workflowId });
      workflowId = inserted[0]!.workflowId;
    }

    const stateIdMap = new Map<string, number>();

    for (const state of workflow.states) {
      const existingSt = await db
        .select({ stateId: workflowStates.stateId })
        .from(workflowStates)
        .where(
          and(
            eq(workflowStates.workflowId, workflowId),
            eq(workflowStates.stateCode, state.stateCode)
          )
        )
        .limit(1);

      if (existingSt[0]) {
        await db
          .update(workflowStates)
          .set({
            name: state.name,
            isInitial: state.isInitial,
            isFinal: state.isFinal,
            sequenceNumber: state.sequenceNumber,
            updatedAt: sql`now()`,
            updatedBy: systemUserId,
          })
          .where(eq(workflowStates.stateId, existingSt[0].stateId));
        stateIdMap.set(state.stateCode, existingSt[0].stateId);
      } else {
        const inserted = await db
          .insert(workflowStates)
          .values({
            workflowId,
            stateCode: state.stateCode,
            name: state.name,
            isInitial: state.isInitial,
            isFinal: state.isFinal,
            sequenceNumber: state.sequenceNumber,
            createdBy: systemUserId,
            updatedBy: systemUserId,
          })
          .returning({ stateId: workflowStates.stateId });
        stateIdMap.set(state.stateCode, inserted[0]!.stateId);
      }
    }

    for (const transition of workflow.transitions) {
      const fromStateId = stateIdMap.get(transition.fromStateCode);
      const toStateId = stateIdMap.get(transition.toStateCode);

      if (!fromStateId || !toStateId) {
        console.warn(
          `⚠ Missing state IDs for transition ${transition.fromStateCode} -> ${transition.toStateCode}`
        );
        continue;
      }

      const existingTr = await db
        .select({ transitionId: workflowTransitions.transitionId })
        .from(workflowTransitions)
        .where(
          and(
            eq(workflowTransitions.workflowId, workflowId),
            eq(workflowTransitions.fromStateId, fromStateId),
            eq(workflowTransitions.toStateId, toStateId)
          )
        )
        .limit(1);

      if (existingTr[0]) {
        await db
          .update(workflowTransitions)
          .set({
            action: transition.action,
            updatedAt: sql`now()`,
            updatedBy: systemUserId,
          })
          .where(eq(workflowTransitions.transitionId, existingTr[0].transitionId));
      } else {
        await db.insert(workflowTransitions).values({
          workflowId,
          fromStateId,
          toStateId,
          action: transition.action,
          createdBy: systemUserId,
          updatedBy: systemUserId,
        });
      }
    }
  }

  console.log(`✓ Seeded ${workflows.length} workflow definitions for tenant ${tenantId}`);
}
