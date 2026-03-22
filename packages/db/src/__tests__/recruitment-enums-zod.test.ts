/**
 * Invalid enum strings on recruitment insert/update schemas (aligned with `z.enum` + const arrays).
 * Run: pnpm test:db -- src/__tests__/recruitment-enums-zod.test.ts
 */
import { describe, it } from "vitest";
import {
  applicationInsertSchema,
  applicationUpdateSchema,
} from "../schema-hrm/recruitment/operations/applications";
import {
  interviewInsertSchema,
  interviewUpdateSchema,
} from "../schema-hrm/recruitment/operations/interviews";
import {
  jobRequisitionInsertSchema,
  jobRequisitionUpdateSchema,
} from "../schema-hrm/recruitment/operations/jobRequisitions";
import {
  backgroundCheckInsertSchema,
  backgroundCheckUpdateSchema,
} from "../schema-hrm/recruitment/operations/backgroundChecks";
import {
  exitInterviewInsertSchema,
  exitInterviewUpdateSchema,
} from "../schema-hrm/recruitment/operations/exitInterviews";
import {
  candidateInsertSchema,
  candidateUpdateSchema,
} from "../schema-hrm/recruitment/fundamentals/candidates";
import { expectInvalidEnumField, expectZodIssueAtPath } from "./lib/expect-zod-issue";

const applicationBase = {
  tenantId: 1,
  candidateId: 1,
  requisitionId: 1,
  applicationDate: "2026-01-15",
  createdBy: 1,
  updatedBy: 1,
};

const interviewBase = {
  tenantId: 1,
  applicationId: 1,
  interviewType: "VIDEO" as const,
  interviewerId: 1,
  scheduledDate: "2026-02-01",
  createdBy: 1,
  updatedBy: 1,
};

const jobReqBase = {
  tenantId: 1,
  requisitionCode: "REQ-001",
  title: "Engineer",
  headcount: 1,
  createdBy: 1,
  updatedBy: 1,
};

const bgBase = {
  tenantId: 1,
  candidateId: 1,
  checkType: "CRIMINAL" as const,
  requestedDate: "2026-03-01",
  createdBy: 1,
  updatedBy: 1,
};

const exitBase = {
  tenantId: 1,
  employeeId: 1,
  linkedOffboardingChecklistId: 1,
  createdBy: 1,
  updatedBy: 1,
};

const candidateBase = {
  tenantId: 1,
  candidateCode: "CAND01",
  firstName: "A",
  lastName: "B",
  email: "a@example.com",
  createdBy: 1,
  updatedBy: 1,
};

describe("recruitment enum enforcement (Zod)", () => {
  it("applications: invalid status on insert/update", () => {
    expectInvalidEnumField(applicationInsertSchema, applicationBase, "status", "FAKE");
    expectZodIssueAtPath(applicationUpdateSchema, { status: "FAKE" }, "status");
  });

  it("interviews: invalid type/status/result", () => {
    expectInvalidEnumField(interviewInsertSchema, interviewBase, "interviewType", "ZOOM");
    expectInvalidEnumField(interviewInsertSchema, interviewBase, "status", "DONE");
    expectInvalidEnumField(interviewInsertSchema, interviewBase, "result", "OK");
    expectZodIssueAtPath(interviewUpdateSchema, { status: "DONE" }, "status");
  });

  it("job requisitions: invalid type/status", () => {
    expectInvalidEnumField(jobRequisitionInsertSchema, jobReqBase, "requisitionType", "OTHER_TYPE");
    expectInvalidEnumField(jobRequisitionInsertSchema, jobReqBase, "status", "LIVE");
    expectZodIssueAtPath(jobRequisitionUpdateSchema, { status: "LIVE" }, "status");
  });

  it("background checks: invalid type/status/result", () => {
    expectInvalidEnumField(backgroundCheckInsertSchema, bgBase, "checkType", "DNA");
    expectInvalidEnumField(backgroundCheckInsertSchema, bgBase, "status", "DONE");
    expectInvalidEnumField(backgroundCheckInsertSchema, bgBase, "result", "OK");
    expectZodIssueAtPath(backgroundCheckUpdateSchema, { result: "OK" }, "result");
  });

  it("exit interviews: invalid format/status", () => {
    expectInvalidEnumField(exitInterviewInsertSchema, exitBase, "format", "EMAIL");
    expectInvalidEnumField(exitInterviewInsertSchema, exitBase, "status", "DONE");
    expectZodIssueAtPath(exitInterviewUpdateSchema, { status: "DONE" }, "status");
  });

  it("candidates: invalid source/status/expectedSalaryPeriod", () => {
    expectInvalidEnumField(candidateInsertSchema, candidateBase, "source", "UNKNOWN");
    expectInvalidEnumField(candidateInsertSchema, candidateBase, "status", "ALIVE");
    expectInvalidEnumField(
      candidateInsertSchema,
      { ...candidateBase, expectedSalaryAmount: "50000", expectedSalaryCurrencyId: 1 },
      "expectedSalaryPeriod",
      "HOURLY"
    );
    expectZodIssueAtPath(candidateUpdateSchema, { status: "ALIVE" }, "status");
  });
});
