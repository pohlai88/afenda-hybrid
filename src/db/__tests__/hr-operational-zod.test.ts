/**
 * HR operational Zod: employees (hire/termination/TERMINATED), leave requests (dates, approval, totalDays),
 * attendance (check-out after check-in).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/hr-operational-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  employeeInsertSchema,
  employeeUpdateSchema,
} from "../schema-hrm/hr/fundamentals/employees";
import {
  attendanceLogInsertSchema,
  attendanceLogUpdateSchema,
} from "../schema-hrm/hr/operations/attendanceLogs";
import {
  leaveRequestInsertSchema,
  leaveRequestUpdateSchema,
} from "../schema-hrm/hr/operations/leaveRequests";
import {
  positionInsertSchema,
  positionUpdateSchema,
} from "../schema-hrm/hr/fundamentals/positions";
import {
  employmentContractInsertSchema,
  employmentContractUpdateSchema,
} from "../schema-hrm/hr/employment/employmentContracts";
import { jobGradeInsertSchema, jobGradeUpdateSchema } from "../schema-hrm/hr/employment/jobGrades";
import {
  secondmentInsertSchema,
  secondmentUpdateSchema,
} from "../schema-hrm/hr/employment/secondments";
import {
  employeeTransferInsertSchema,
} from "../schema-hrm/hr/employment/employeeTransfers";
import {
  noticePeriodRecordInsertSchema,
  noticePeriodRecordUpdateSchema,
} from "../schema-hrm/hr/employment/noticePeriodRecords";
import {
  probationRecordInsertSchema,
  probationRecordUpdateSchema,
} from "../schema-hrm/hr/employment/probationRecords";
import { shiftSwapInsertSchema, shiftSwapUpdateSchema } from "../schema-hrm/hr/time/shiftSwaps";
import { leaveTypeInsertSchema, leaveTypeUpdateSchema } from "../schema-hrm/hr/time/leaveTypes";
import {
  overtimeRecordInsertSchema,
  overtimeRecordUpdateSchema,
} from "../schema-hrm/hr/time/overtimeRecords";
import { absenceRecordInsertSchema, absenceRecordUpdateSchema } from "../schema-hrm/hr/time/absenceRecords";
import {
  nationalIdentifierInsertSchema,
  nationalIdentifierUpdateSchema,
} from "../schema-hrm/hr/people/nationalIdentifiers";
import { addressInsertSchema, addressUpdateSchema } from "../schema-hrm/hr/people/addresses";
import {
  assetAssignmentInsertSchema,
  assetAssignmentUpdateSchema,
} from "../schema-hrm/hr/selfservice/assetAssignments";
import { personDocumentUpdateSchema } from "../schema-hrm/hr/people/personDocuments";
import { isValidLeaveTotalDaysString } from "../schema-hrm/hr/_zodShared";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

const employeeInsertBase = {
  tenantId: 1,
  personId: 1,
  employeeCode: "E001",
  hireDate: "2020-06-01",
  createdBy: 1,
  updatedBy: 1,
};

const leaveInsertBase = {
  tenantId: 1,
  employeeId: 1,
  leaveTypeId: 1,
  startDate: "2025-01-10",
  endDate: "2025-01-12",
  totalDays: "2.5",
  createdBy: 1,
  updatedBy: 1,
};

describe("HR operational Zod", () => {
  describe("employees", () => {
    it("accepts valid insert", () => {
      expect(employeeInsertSchema.safeParse(employeeInsertBase).success).toBe(true);
    });

    it("rejects hireDate before 1900-01-01", () => {
      expectZodIssueAtPath(
        employeeInsertSchema,
        { ...employeeInsertBase, hireDate: "1899-12-31" },
        "hireDate",
      );
    });

    it("rejects TERMINATED without terminationDate on insert", () => {
      expectZodIssueAtPath(
        employeeInsertSchema,
        { ...employeeInsertBase, employeeCode: "E002", status: "TERMINATED" },
        "terminationDate",
      );
    });

    it("accepts TERMINATED with terminationDate on or after hireDate", () => {
      const r = employeeInsertSchema.safeParse({
        ...employeeInsertBase,
        employeeCode: "E003",
        status: "TERMINATED",
        terminationDate: "2024-01-01",
      });
      expect(r.success).toBe(true);
    });

    it("rejects terminationDate before hireDate", () => {
      expectZodIssueAtPath(
        employeeInsertSchema,
        {
          ...employeeInsertBase,
          employeeCode: "E004",
          hireDate: "2020-06-01",
          terminationDate: "2019-01-01",
        },
        "terminationDate",
      );
    });

    it("update rejects setting TERMINATED without terminationDate in same payload", () => {
      expectZodIssueAtPath(employeeUpdateSchema, { status: "TERMINATED" }, "terminationDate");
    });
  });

  describe("leave requests", () => {
    it("accepts valid insert", () => {
      expect(leaveRequestInsertSchema.safeParse(leaveInsertBase).success).toBe(true);
    });

    it("rejects endDate before startDate", () => {
      expectZodIssueAtPath(
        leaveRequestInsertSchema,
        { ...leaveInsertBase, startDate: "2025-01-12", endDate: "2025-01-10" },
        "endDate",
      );
    });

    it("rejects APPROVED without approvedBy and approvedAt", () => {
      expectZodIssueAtPath(
        leaveRequestInsertSchema,
        { ...leaveInsertBase, status: "APPROVED" },
        "approvedBy",
      );
      expectZodIssueAtPath(
        leaveRequestInsertSchema,
        {
          ...leaveInsertBase,
          status: "APPROVED",
          approvedBy: 9,
        },
        "approvedAt",
      );
    });

    it("accepts APPROVED with approver fields", () => {
      const r = leaveRequestInsertSchema.safeParse({
        ...leaveInsertBase,
        status: "APPROVED",
        approvedBy: 2,
        approvedAt: new Date("2025-01-01T12:00:00.000Z"),
      });
      expect(r.success).toBe(true);
    });

    it("rejects REJECTED without rejectionReason", () => {
      expectZodIssueAtPath(
        leaveRequestInsertSchema,
        { ...leaveInsertBase, status: "REJECTED" },
        "rejectionReason",
      );
    });

    it("update runs same cross-field refinements", () => {
      expectZodIssueAtPath(
        leaveRequestUpdateSchema,
        { startDate: "2025-02-10", endDate: "2025-02-01" },
        "endDate",
      );
    });

    it("isValidLeaveTotalDaysString enforces range and scale", () => {
      expect(isValidLeaveTotalDaysString("1")).toBe(true);
      expect(isValidLeaveTotalDaysString("1.5")).toBe(true);
      expect(isValidLeaveTotalDaysString("0")).toBe(false);
      expect(isValidLeaveTotalDaysString("1000")).toBe(false);
      expect(isValidLeaveTotalDaysString("1.55")).toBe(false);
    });
  });

  describe("attendance logs", () => {
    const attendanceInsertBase = {
      tenantId: 1,
      employeeId: 1,
      attendanceDate: "2025-01-15",
      createdBy: 1,
      updatedBy: 1,
    };

    it("accepts insert without clock times", () => {
      expect(attendanceLogInsertSchema.safeParse(attendanceInsertBase).success).toBe(true);
    });

    it("rejects checkOutAt not after checkInAt", () => {
      expectZodIssueAtPath(
        attendanceLogInsertSchema,
        {
          ...attendanceInsertBase,
          checkInAt: "2025-01-15T18:00:00.000Z",
          checkOutAt: "2025-01-15T09:00:00.000Z",
        },
        "checkOutAt",
      );
    });

    it("update applies checkout refinement when both timestamps present", () => {
      expectZodIssueAtPath(
        attendanceLogUpdateSchema,
        {
          checkInAt: "2025-01-15T18:00:00.000Z",
          checkOutAt: "2025-01-15T09:00:00.000Z",
        },
        "checkOutAt",
      );
    });

    it("rejects checkOutAt not after checkInAt when both are Date", () => {
      expectZodIssueAtPath(
        attendanceLogInsertSchema,
        {
          ...attendanceInsertBase,
          checkInAt: new Date("2025-01-15T18:00:00.000Z"),
          checkOutAt: new Date("2025-01-15T09:00:00.000Z"),
        },
        "checkOutAt",
      );
    });
  });

  describe("positions", () => {
    const positionInsertBase = {
      tenantId: 1,
      positionCode: "P-1",
      name: "Engineer",
      createdBy: 1,
      updatedBy: 1,
    };

    it("accepts valid insert", () => {
      expect(positionInsertSchema.safeParse(positionInsertBase).success).toBe(true);
    });

    it("rejects minSalary greater than maxSalary", () => {
      expectZodIssueAtPath(
        positionInsertSchema,
        {
          ...positionInsertBase,
          positionCode: "P-2",
          minSalary: "100000.00",
          maxSalary: "50000.00",
        },
        "maxSalary",
      );
    });

    it("update allows clearing minSalary with null", () => {
      const r = positionUpdateSchema.safeParse({ minSalary: null });
      expect(r.success).toBe(true);
    });
  });

  describe("employment contracts", () => {
    const contractInsertBase = {
      tenantId: 1,
      employeeId: 1,
      contractCode: "C-1",
      contractType: "PERMANENT" as const,
      startDate: "2024-01-01",
      createdBy: 1,
      updatedBy: 1,
    };

    it("accepts valid insert", () => {
      expect(employmentContractInsertSchema.safeParse(contractInsertBase).success).toBe(true);
    });

    it("rejects endDate before startDate", () => {
      expectZodIssueAtPath(
        employmentContractInsertSchema,
        {
          ...contractInsertBase,
          contractCode: "C-2",
          endDate: "2023-01-01",
        },
        "endDate",
      );
    });

    it("rejects probationEndDate before startDate", () => {
      expectZodIssueAtPath(
        employmentContractInsertSchema,
        {
          ...contractInsertBase,
          contractCode: "C-3",
          probationEndDate: "2023-06-01",
        },
        "probationEndDate",
      );
    });

    it("rejects workingHoursPerWeek out of range", () => {
      expectZodIssueAtPath(
        employmentContractInsertSchema,
        {
          ...contractInsertBase,
          contractCode: "C-4",
          workingHoursPerWeek: "200",
        },
        "workingHoursPerWeek",
      );
    });

    it("update allows clearing endDate with null", () => {
      const r = employmentContractUpdateSchema.safeParse({ endDate: null });
      expect(r.success).toBe(true);
    });
  });

  describe("job grades", () => {
    const base = {
      tenantId: 1,
      gradeCode: "G1",
      name: "Grade 1",
      level: 1,
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects midSalary below minSalary", () => {
      expectZodIssueAtPath(
        jobGradeInsertSchema,
        { ...base, gradeCode: "G2", minSalary: "10.00", midSalary: "5.00", maxSalary: "20.00" },
        "midSalary",
      );
    });

    it("update allows clearing minSalary with null", () => {
      const r = jobGradeUpdateSchema.safeParse({ minSalary: null });
      expect(r.success).toBe(true);
    });
  });

  describe("secondments", () => {
    const base = {
      tenantId: 1,
      employeeId: 1,
      hostDepartmentId: 1,
      startDate: "2025-01-01",
      originalEndDate: "2025-03-01",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects insert without any host dimension", () => {
      expectZodIssueAtPath(
        secondmentInsertSchema,
        {
          ...base,
          hostDepartmentId: undefined,
          hostLocationId: undefined,
          hostLegalEntityId: undefined,
        },
        "hostDepartmentId",
      );
    });

    it("rejects originalEndDate before startDate", () => {
      expectZodIssueAtPath(
        secondmentInsertSchema,
        { ...base, startDate: "2025-03-01", originalEndDate: "2025-01-01" },
        "originalEndDate",
      );
    });

    it("update rejects clearing all host ids to null in one patch", () => {
      expectZodIssueAtPath(secondmentUpdateSchema, {
        hostDepartmentId: null,
        hostLocationId: null,
        hostLegalEntityId: null,
      }, "hostDepartmentId");
    });
  });

  describe("employee transfers", () => {
    it("rejects insert when from/to pairs are identical", () => {
      expectZodIssueAtPath(
        employeeTransferInsertSchema,
        {
          tenantId: 1,
          employeeId: 1,
          transferType: "DEPARTMENT" as const,
          fromDepartmentId: 1,
          toDepartmentId: 1,
          effectiveDate: "2025-01-01",
          createdBy: 1,
          updatedBy: 1,
        },
        "toDepartmentId",
      );
    });
  });

  describe("notice period records", () => {
    const base = {
      tenantId: 1,
      employeeId: 1,
      initiatedBy: "EMPLOYEE" as const,
      noticeDate: "2025-01-01",
      requiredNoticeDays: 30,
      expectedLastDay: "2025-01-31",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects expectedLastDay before noticeDate", () => {
      expectZodIssueAtPath(
        noticePeriodRecordInsertSchema,
        { ...base, expectedLastDay: "2024-12-01" },
        "expectedLastDay",
      );
    });

    it("update applies same date ordering", () => {
      expectZodIssueAtPath(
        noticePeriodRecordUpdateSchema,
        { noticeDate: "2025-02-01", expectedLastDay: "2025-01-01" },
        "expectedLastDay",
      );
    });
  });

  describe("probation records", () => {
    const base = {
      tenantId: 1,
      employeeId: 1,
      startDate: "2025-01-01",
      originalEndDate: "2025-04-01",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects extendedEndDate before originalEndDate", () => {
      expectZodIssueAtPath(
        probationRecordInsertSchema,
        { ...base, extendedEndDate: "2024-12-01" },
        "extendedEndDate",
      );
    });

    it("update applies extended vs original ordering", () => {
      expectZodIssueAtPath(
        probationRecordUpdateSchema,
        { originalEndDate: "2025-06-01", extendedEndDate: "2025-05-01" },
        "extendedEndDate",
      );
    });
  });

  describe("shift swaps", () => {
    const base = {
      tenantId: 1,
      requestingEmployeeId: 1,
      targetEmployeeId: 2,
      originalDate: "2025-01-01",
      swapDate: "2025-01-02",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects same requesting and target employee", () => {
      expectZodIssueAtPath(
        shiftSwapInsertSchema,
        { ...base, targetEmployeeId: 1 },
        "targetEmployeeId",
      );
    });

    it("update applies different-employee refinement when both ids present", () => {
      expectZodIssueAtPath(
        shiftSwapUpdateSchema,
        { requestingEmployeeId: 5, targetEmployeeId: 5 },
        "targetEmployeeId",
      );
    });
  });

  describe("leave types", () => {
    const base = {
      tenantId: 1,
      leaveTypeCode: "VAC",
      name: "Vacation",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects negative maxCarryOverDays when carry-over enabled", () => {
      expectZodIssueAtPath(
        leaveTypeInsertSchema,
        { ...base, leaveTypeCode: "VAC2", allowCarryOver: true, maxCarryOverDays: -1 },
        "maxCarryOverDays",
      );
    });

    it("update applies carry-over rule when both fields present", () => {
      expectZodIssueAtPath(
        leaveTypeUpdateSchema,
        { allowCarryOver: true, maxCarryOverDays: -2 },
        "maxCarryOverDays",
      );
    });
  });

  describe("overtime records", () => {
    const base = {
      tenantId: 1,
      employeeId: 1,
      overtimeDate: "2025-01-10",
      hours: "2.5",
      multiplier: "1.5",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects hours above 24", () => {
      expectZodIssueAtPath(overtimeRecordInsertSchema, { ...base, hours: "25" }, "hours");
    });

    it("rejects multiplier below 1", () => {
      expectZodIssueAtPath(
        overtimeRecordInsertSchema,
        { ...base, overtimeDate: "2025-01-11", multiplier: "0.5" },
        "multiplier",
      );
    });

    it("update allows clearing approvedAt with null", () => {
      const r = overtimeRecordUpdateSchema.safeParse({ approvedAt: null });
      expect(r.success).toBe(true);
    });
  });

  describe("absence records", () => {
    const base = {
      tenantId: 1,
      employeeId: 1,
      absenceDate: "2020-01-15",
      absenceType: "OTHER" as const,
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects absenceDate in the future (UTC wire)", () => {
      expectZodIssueAtPath(
        absenceRecordInsertSchema,
        { ...base, absenceDate: "2099-12-31" },
        "absenceDate",
      );
    });

    it("update applies same absenceDate rule when present", () => {
      expectZodIssueAtPath(absenceRecordUpdateSchema, { absenceDate: "2099-01-01" }, "absenceDate");
    });
  });

  describe("national identifiers", () => {
    const base = {
      tenantId: 1,
      personId: 1,
      identifierType: "PASSPORT" as const,
      identifierValue: "AB123",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects expiryDate before issueDate", () => {
      expectZodIssueAtPath(
        nationalIdentifierInsertSchema,
        {
          ...base,
          identifierValue: "CD456",
          issueDate: "2025-06-01",
          expiryDate: "2024-01-01",
        },
        "expiryDate",
      );
    });

    it("update applies issue/expiry ordering", () => {
      expectZodIssueAtPath(
        nationalIdentifierUpdateSchema,
        { issueDate: "2025-01-01", expiryDate: "2024-01-01" },
        "expiryDate",
      );
    });
  });

  describe("addresses", () => {
    const base = {
      tenantId: 1,
      personId: 1,
      addressType: "RESIDENTIAL" as const,
      street1: "1 Main",
      city: "X",
      country: "US",
      effectiveFrom: "2025-01-01",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects effectiveTo before effectiveFrom", () => {
      expectZodIssueAtPath(
        addressInsertSchema,
        { ...base, effectiveTo: "2024-01-01" },
        "effectiveTo",
      );
    });

    it("update applies effective range refinement", () => {
      expectZodIssueAtPath(
        addressUpdateSchema,
        { effectiveFrom: "2025-06-01", effectiveTo: "2025-01-01" },
        "effectiveTo",
      );
    });
  });

  describe("asset assignments", () => {
    const base = {
      tenantId: 1,
      employeeId: 1,
      assetType: "LAPTOP" as const,
      assetTag: "T1",
      assetName: "Laptop",
      issuedDate: "2025-01-01",
      createdBy: 1,
      updatedBy: 1,
    };

    it("rejects actualReturnDate before issuedDate", () => {
      expectZodIssueAtPath(
        assetAssignmentInsertSchema,
        { ...base, assetTag: "T2", actualReturnDate: "2024-12-01" },
        "actualReturnDate",
      );
    });

    it("update applies return vs issued ordering", () => {
      expectZodIssueAtPath(
        assetAssignmentUpdateSchema,
        { issuedDate: "2025-03-01", actualReturnDate: "2025-01-01" },
        "actualReturnDate",
      );
    });
  });

  describe("person documents", () => {
    it("update allows clearing fileSize with null", () => {
      const r = personDocumentUpdateSchema.safeParse({ fileSize: null });
      expect(r.success).toBe(true);
    });
  });
});
