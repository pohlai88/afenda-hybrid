import { defineRelations } from "drizzle-orm";
import { employeeTransfers } from "./employment/employeeTransfers";
import { employmentContracts } from "./employment/employmentContracts";
import { employmentStatusHistory } from "./employment/employmentStatusHistory";
import { jobFamilies } from "./employment/jobFamilies";
import { jobGrades } from "./employment/jobGrades";
import { jobRoles } from "./employment/jobRoles";
import { noticePeriodRecords } from "./employment/noticePeriodRecords";
import { positionAssignments } from "./employment/positionAssignments";
import { probationRecords } from "./employment/probationRecords";
import { reportingLines } from "./employment/reportingLines";
import { secondments } from "./employment/secondments";
import { departments } from "./fundamentals/departments";
import { employees } from "./fundamentals/employees";
import { positions } from "./fundamentals/positions";
import { attendanceLogs } from "./operations/attendanceLogs";
import { attendanceRequests } from "./operations/attendanceRequests";
import { compensatoryLeaveRequests } from "./operations/compensatoryLeaveRequests";
import { dailyWorkSummaries } from "./operations/dailyWorkSummaries";
import { leaveRequests } from "./operations/leaveRequests";
import { addresses } from "./people/addresses";
import { contactMethods } from "./people/contactMethods";
import { dependents } from "./people/dependents";
import { emergencyContacts } from "./people/emergencyContacts";
import { nationalIdentifiers } from "./people/nationalIdentifiers";
import { personDocuments } from "./people/personDocuments";
import { personNames } from "./people/personNames";
import { persons } from "./people/persons";
import { assetAssignments } from "./selfservice/assetAssignments";
import { documentRequests } from "./selfservice/documentRequests";
import { employeeDeclarations } from "./selfservice/employeeDeclarations";
import { serviceRequests } from "./selfservice/serviceRequests";
import { absenceRecords } from "./time/absenceRecords";
import { holidayCalendarEntries } from "./time/holidayCalendarEntries";
import { holidayCalendars } from "./time/holidayCalendars";
import { leaveBalances } from "./time/leaveBalances";
import { leaveTypes } from "./time/leaveTypes";
import { overtimeRecords } from "./time/overtimeRecords";
import { shiftAssignments } from "./time/shiftAssignments";
import { shiftSwaps } from "./time/shiftSwaps";
import { timesheets } from "./time/timesheets";
import { workSchedules } from "./time/workSchedules";
import { costCenters } from "../../schema-platform/core/costCenters";
import { currencies } from "../../schema-platform/core/currencies";
import { legalEntities } from "../../schema-platform/core/legalEntities";
import { locations } from "../../schema-platform/core/locations";
import { organizations } from "../../schema-platform/core/organizations";
import { regions } from "../../schema-platform/core/regions";
import { tenants } from "../../schema-platform/core/tenants";

export const hrRelations = defineRelations(
  {
    absenceRecords,
    addresses,
    assetAssignments,
    attendanceLogs,
    attendanceRequests,
    compensatoryLeaveRequests,
    contactMethods,
    dailyWorkSummaries,
    departments,
    dependents,
    documentRequests,
    emergencyContacts,
    employeeDeclarations,
    employeeTransfers,
    employees,
    employmentContracts,
    employmentStatusHistory,
    holidayCalendarEntries,
    holidayCalendars,
    jobFamilies,
    jobGrades,
    jobRoles,
    leaveBalances,
    leaveRequests,
    leaveTypes,
    nationalIdentifiers,
    noticePeriodRecords,
    overtimeRecords,
    personDocuments,
    personNames,
    persons,
    positionAssignments,
    positions,
    probationRecords,
    reportingLines,
    secondments,
    serviceRequests,
    shiftAssignments,
    shiftSwaps,
    timesheets,
    workSchedules,
    costCenters,
    currencies,
    legalEntities,
    locations,
    organizations,
    regions,
    tenants,
  },
  (r) => ({
    absenceRecords: {
      tenant: r.one.tenants({
        from: r.absenceRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.absenceRecords.employeeId,
        to: r.employees.employeeId,
      }),
      recorder: r.one.employees({
        from: r.absenceRecords.recordedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "absence_records_recorded",
      }),
    },

    addresses: {
      tenant: r.one.tenants({
        from: r.addresses.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.addresses.personId,
        to: r.persons.personId,
      }),
    },

    assetAssignments: {
      tenant: r.one.tenants({
        from: r.assetAssignments.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.assetAssignments.employeeId,
        to: r.employees.employeeId,
        alias: "asset_assignments_employee",
      }),
      issuer: r.one.employees({
        from: r.assetAssignments.issuedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
    },

    attendanceLogs: {
      tenant: r.one.tenants({
        from: r.attendanceLogs.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.attendanceLogs.employeeId,
        to: r.employees.employeeId,
      }),
      shiftAssignment: r.one.shiftAssignments({
        from: r.attendanceLogs.shiftAssignmentId,
        to: r.shiftAssignments.shiftAssignmentId,
        optional: true,
      }),
      timesheet: r.one.timesheets({
        from: r.attendanceLogs.timesheetId,
        to: r.timesheets.timesheetId,
        optional: true,
      }),
    },

    attendanceRequests: {
      tenant: r.one.tenants({
        from: r.attendanceRequests.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.attendanceRequests.employeeId,
        to: r.employees.employeeId,
      }),
    },

    compensatoryLeaveRequests: {
      tenant: r.one.tenants({
        from: r.compensatoryLeaveRequests.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.compensatoryLeaveRequests.employeeId,
        to: r.employees.employeeId,
      }),
      leaveType: r.one.leaveTypes({
        from: r.compensatoryLeaveRequests.leaveTypeId,
        to: r.leaveTypes.leaveTypeId,
      }),
    },

    contactMethods: {
      tenant: r.one.tenants({
        from: r.contactMethods.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.contactMethods.personId,
        to: r.persons.personId,
      }),
    },

    dailyWorkSummaries: {
      tenant: r.one.tenants({
        from: r.dailyWorkSummaries.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.dailyWorkSummaries.employeeId,
        to: r.employees.employeeId,
      }),
    },

    departments: {
      tenant: r.one.tenants({
        from: r.departments.tenantId,
        to: r.tenants.tenantId,
      }),
      costCenter: r.one.costCenters({
        from: r.departments.costCenterId,
        to: r.costCenters.costCenterId,
        optional: true,
      }),
      headEmployee: r.one.employees({
        from: r.departments.headEmployeeId,
        to: r.employees.employeeId,
        optional: true,
      }),
      legalEntity: r.one.legalEntities({
        from: r.departments.legalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      organization: r.one.organizations({
        from: r.departments.organizationId,
        to: r.organizations.organizationId,
        optional: true,
      }),
      parent: r.one.departments({
        from: r.departments.parentDepartmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      departments: r.many.departments({
        from: r.departments.departmentId,
        to: r.departments.parentDepartmentId,
      }),
      employees: r.many.employees({
        from: r.departments.departmentId,
        to: r.employees.departmentId,
      }),
      fromDepartmentEmployeeTransfers: r.many.employeeTransfers({
        from: r.departments.departmentId,
        to: r.employeeTransfers.fromDepartmentId,
        alias: "departments_from_department",
      }),
      positions: r.many.positions({
        from: r.departments.departmentId,
        to: r.positions.departmentId,
      }),
      secondments: r.many.secondments({
        from: r.departments.departmentId,
        to: r.secondments.hostDepartmentId,
      }),
      toDepartmentEmployeeTransfers: r.many.employeeTransfers({
        from: r.departments.departmentId,
        to: r.employeeTransfers.toDepartmentId,
        alias: "departments_to_department",
      }),
    },

    dependents: {
      tenant: r.one.tenants({
        from: r.dependents.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.dependents.personId,
        to: r.persons.personId,
      }),
    },

    documentRequests: {
      tenant: r.one.tenants({
        from: r.documentRequests.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.documentRequests.employeeId,
        to: r.employees.employeeId,
      }),
      processor: r.one.employees({
        from: r.documentRequests.processedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "document_requests_processor",
      }),
    },

    emergencyContacts: {
      tenant: r.one.tenants({
        from: r.emergencyContacts.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.emergencyContacts.personId,
        to: r.persons.personId,
      }),
    },

    employeeDeclarations: {
      tenant: r.one.tenants({
        from: r.employeeDeclarations.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.employeeDeclarations.employeeId,
        to: r.employees.employeeId,
      }),
      verifier: r.one.employees({
        from: r.employeeDeclarations.verifiedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "employee_declarations_verifier",
      }),
    },

    employeeTransfers: {
      tenant: r.one.tenants({
        from: r.employeeTransfers.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.employeeTransfers.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "employee_transfers_approver",
      }),
      employee: r.one.employees({
        from: r.employeeTransfers.employeeId,
        to: r.employees.employeeId,
      }),
      fromDepartment: r.one.departments({
        from: r.employeeTransfers.fromDepartmentId,
        to: r.departments.departmentId,
        optional: true,
        alias: "employee_transfers_from_department",
      }),
      fromLocation: r.one.locations({
        from: r.employeeTransfers.fromLocationId,
        to: r.locations.locationId,
        optional: true,
        alias: "employee_transfers_from_location",
      }),
      fromPosition: r.one.positions({
        from: r.employeeTransfers.fromPositionId,
        to: r.positions.positionId,
        optional: true,
        alias: "employee_transfers_from_position",
      }),
      toDepartment: r.one.departments({
        from: r.employeeTransfers.toDepartmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      toLocation: r.one.locations({
        from: r.employeeTransfers.toLocationId,
        to: r.locations.locationId,
        optional: true,
      }),
      toPosition: r.one.positions({
        from: r.employeeTransfers.toPositionId,
        to: r.positions.positionId,
        optional: true,
      }),
    },

    employees: {
      tenant: r.one.tenants({
        from: r.employees.tenantId,
        to: r.tenants.tenantId,
      }),
      department: r.one.departments({
        from: r.employees.departmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      location: r.one.locations({
        from: r.employees.locationId,
        to: r.locations.locationId,
        optional: true,
      }),
      manager: r.one.employees({
        from: r.employees.managerId,
        to: r.employees.employeeId,
        optional: true,
      }),
      payrollLegalEntity: r.one.legalEntities({
        from: r.employees.payrollLegalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      person: r.one.persons({
        from: r.employees.personId,
        to: r.persons.personId,
      }),
      position: r.one.positions({
        from: r.employees.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
      approvedByEmployeeTransfers: r.many.employeeTransfers({
        from: r.employees.employeeId,
        to: r.employeeTransfers.approvedBy,
        alias: "employees_approver",
      }),
      approvedByLeaveRequests: r.many.leaveRequests({
        from: r.employees.employeeId,
        to: r.leaveRequests.approvedBy,
        alias: "employees_approver",
      }),
      approvedByNoticePeriodRecords: r.many.noticePeriodRecords({
        from: r.employees.employeeId,
        to: r.noticePeriodRecords.approvedBy,
        alias: "employees_approver",
      }),
      approvedByOvertimeRecords: r.many.overtimeRecords({
        from: r.employees.employeeId,
        to: r.overtimeRecords.approvedBy,
        alias: "employees_approver",
      }),
      approvedBySecondments: r.many.secondments({
        from: r.employees.employeeId,
        to: r.secondments.approvedBy,
        alias: "employees_approver",
      }),
      approvedByShiftSwaps: r.many.shiftSwaps({
        from: r.employees.employeeId,
        to: r.shiftSwaps.approvedBy,
        alias: "employees_approver",
      }),
      approvedByTimesheets: r.many.timesheets({
        from: r.employees.employeeId,
        to: r.timesheets.approvedBy,
        alias: "employees_approver",
      }),
      attendanceLogs: r.many.attendanceLogs({
        from: r.employees.employeeId,
        to: r.attendanceLogs.employeeId,
      }),
      attendanceRequests: r.many.attendanceRequests({
        from: r.employees.employeeId,
        to: r.attendanceRequests.employeeId,
      }),
      changedByEmploymentStatusHistory: r.many.employmentStatusHistory({
        from: r.employees.employeeId,
        to: r.employmentStatusHistory.changedBy,
        alias: "employees_changed",
      }),
      compensatoryLeaveRequests: r.many.compensatoryLeaveRequests({
        from: r.employees.employeeId,
        to: r.compensatoryLeaveRequests.employeeId,
      }),
      dailyWorkSummaries: r.many.dailyWorkSummaries({
        from: r.employees.employeeId,
        to: r.dailyWorkSummaries.employeeId,
      }),
      departments: r.many.departments({
        from: r.employees.employeeId,
        to: r.departments.headEmployeeId,
      }),
      employeeAbsenceRecords: r.many.absenceRecords({
        from: r.employees.employeeId,
        to: r.absenceRecords.employeeId,
        alias: "employees_employee",
      }),
      employeeAssetAssignments: r.many.assetAssignments({
        from: r.employees.employeeId,
        to: r.assetAssignments.employeeId,
        alias: "employees_employee",
      }),
      employeeDocumentRequests: r.many.documentRequests({
        from: r.employees.employeeId,
        to: r.documentRequests.employeeId,
        alias: "employees_employee",
      }),
      employeeEmployeeDeclarations: r.many.employeeDeclarations({
        from: r.employees.employeeId,
        to: r.employeeDeclarations.employeeId,
        alias: "employees_employee",
      }),
      employeeEmployeeTransfers: r.many.employeeTransfers({
        from: r.employees.employeeId,
        to: r.employeeTransfers.employeeId,
        alias: "employees_employee",
      }),
      employeeEmploymentStatusHistory: r.many.employmentStatusHistory({
        from: r.employees.employeeId,
        to: r.employmentStatusHistory.employeeId,
        alias: "employees_employee",
      }),
      employeeLeaveRequests: r.many.leaveRequests({
        from: r.employees.employeeId,
        to: r.leaveRequests.employeeId,
        alias: "employees_employee",
      }),
      employeeNoticePeriodRecords: r.many.noticePeriodRecords({
        from: r.employees.employeeId,
        to: r.noticePeriodRecords.employeeId,
        alias: "employees_employee",
      }),
      employeeOvertimeRecords: r.many.overtimeRecords({
        from: r.employees.employeeId,
        to: r.overtimeRecords.employeeId,
        alias: "employees_employee",
      }),
      employeeProbationRecords: r.many.probationRecords({
        from: r.employees.employeeId,
        to: r.probationRecords.employeeId,
        alias: "employees_employee",
      }),
      employeeReportingLines: r.many.reportingLines({
        from: r.employees.employeeId,
        to: r.reportingLines.employeeId,
        alias: "employees_employee",
      }),
      employeeSecondments: r.many.secondments({
        from: r.employees.employeeId,
        to: r.secondments.employeeId,
        alias: "employees_employee",
      }),
      employeeTimesheets: r.many.timesheets({
        from: r.employees.employeeId,
        to: r.timesheets.employeeId,
        alias: "employees_employee",
      }),
      employees: r.many.employees({
        from: r.employees.employeeId,
        to: r.employees.managerId,
      }),
      employmentContracts: r.many.employmentContracts({
        from: r.employees.employeeId,
        to: r.employmentContracts.employeeId,
      }),
      issuedByAssetAssignments: r.many.assetAssignments({
        from: r.employees.employeeId,
        to: r.assetAssignments.issuedBy,
        alias: "employees_issuer",
      }),
      leaveBalances: r.many.leaveBalances({
        from: r.employees.employeeId,
        to: r.leaveBalances.employeeId,
      }),
      managerReportingLines: r.many.reportingLines({
        from: r.employees.employeeId,
        to: r.reportingLines.managerId,
        alias: "employees_manager",
      }),
      positionAssignments: r.many.positionAssignments({
        from: r.employees.employeeId,
        to: r.positionAssignments.employeeId,
      }),
      processedByDocumentRequests: r.many.documentRequests({
        from: r.employees.employeeId,
        to: r.documentRequests.processedBy,
        alias: "employees_processor",
      }),
      recordedByAbsenceRecords: r.many.absenceRecords({
        from: r.employees.employeeId,
        to: r.absenceRecords.recordedBy,
        alias: "employees_recorded",
      }),
      requestingEmployeeShiftSwaps: r.many.shiftSwaps({
        from: r.employees.employeeId,
        to: r.shiftSwaps.requestingEmployeeId,
        alias: "employees_requesting_employee",
      }),
      reviewedByProbationRecords: r.many.probationRecords({
        from: r.employees.employeeId,
        to: r.probationRecords.reviewedBy,
        alias: "employees_reviewer",
      }),
      serviceRequests: r.many.serviceRequests({
        from: r.employees.employeeId,
        to: r.serviceRequests.employeeId,
      }),
      shiftAssignments: r.many.shiftAssignments({
        from: r.employees.employeeId,
        to: r.shiftAssignments.employeeId,
      }),
      targetEmployeeShiftSwaps: r.many.shiftSwaps({
        from: r.employees.employeeId,
        to: r.shiftSwaps.targetEmployeeId,
        alias: "employees_target_employee",
      }),
      verifiedByEmployeeDeclarations: r.many.employeeDeclarations({
        from: r.employees.employeeId,
        to: r.employeeDeclarations.verifiedBy,
        alias: "employees_verifier",
      }),
    },

    employmentContracts: {
      tenant: r.one.tenants({
        from: r.employmentContracts.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.employmentContracts.employeeId,
        to: r.employees.employeeId,
      }),
    },

    employmentStatusHistory: {
      tenant: r.one.tenants({
        from: r.employmentStatusHistory.tenantId,
        to: r.tenants.tenantId,
      }),
      changer: r.one.employees({
        from: r.employmentStatusHistory.changedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "employment_status_history_changed",
      }),
      employee: r.one.employees({
        from: r.employmentStatusHistory.employeeId,
        to: r.employees.employeeId,
      }),
    },

    holidayCalendarEntries: {
      tenant: r.one.tenants({
        from: r.holidayCalendarEntries.tenantId,
        to: r.tenants.tenantId,
      }),
      calendar: r.one.holidayCalendars({
        from: r.holidayCalendarEntries.calendarId,
        to: r.holidayCalendars.calendarId,
      }),
    },

    holidayCalendars: {
      tenant: r.one.tenants({
        from: r.holidayCalendars.tenantId,
        to: r.tenants.tenantId,
      }),
      region: r.one.regions({
        from: r.holidayCalendars.regionId,
        to: r.regions.regionId,
        optional: true,
      }),
      holidayCalendarEntries: r.many.holidayCalendarEntries({
        from: r.holidayCalendars.calendarId,
        to: r.holidayCalendarEntries.calendarId,
      }),
    },

    jobFamilies: {
      tenant: r.one.tenants({
        from: r.jobFamilies.tenantId,
        to: r.tenants.tenantId,
      }),
      jobRoles: r.many.jobRoles({
        from: r.jobFamilies.jobFamilyId,
        to: r.jobRoles.jobFamilyId,
      }),
    },

    jobGrades: {
      tenant: r.one.tenants({
        from: r.jobGrades.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.jobGrades.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      positions: r.many.positions({
        from: r.jobGrades.jobGradeId,
        to: r.positions.jobGradeId,
      }),
    },

    jobRoles: {
      tenant: r.one.tenants({
        from: r.jobRoles.tenantId,
        to: r.tenants.tenantId,
      }),
      jobFamily: r.one.jobFamilies({
        from: r.jobRoles.jobFamilyId,
        to: r.jobFamilies.jobFamilyId,
        optional: true,
      }),
      positions: r.many.positions({
        from: r.jobRoles.jobRoleId,
        to: r.positions.jobRoleId,
      }),
    },

    leaveBalances: {
      tenant: r.one.tenants({
        from: r.leaveBalances.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.leaveBalances.employeeId,
        to: r.employees.employeeId,
      }),
      leaveType: r.one.leaveTypes({
        from: r.leaveBalances.leaveTypeId,
        to: r.leaveTypes.leaveTypeId,
      }),
      leaveRequests: r.many.leaveRequests({
        from: r.leaveBalances.leaveBalanceId,
        to: r.leaveRequests.leaveBalanceId,
      }),
    },

    leaveRequests: {
      tenant: r.one.tenants({
        from: r.leaveRequests.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.leaveRequests.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "leave_requests_approver",
      }),
      employee: r.one.employees({
        from: r.leaveRequests.employeeId,
        to: r.employees.employeeId,
      }),
      leaveBalance: r.one.leaveBalances({
        from: r.leaveRequests.leaveBalanceId,
        to: r.leaveBalances.leaveBalanceId,
        optional: true,
      }),
      leaveType: r.one.leaveTypes({
        from: r.leaveRequests.leaveTypeId,
        to: r.leaveTypes.leaveTypeId,
      }),
    },

    leaveTypes: {
      tenant: r.one.tenants({
        from: r.leaveTypes.tenantId,
        to: r.tenants.tenantId,
      }),
      compensatoryLeaveRequests: r.many.compensatoryLeaveRequests({
        from: r.leaveTypes.leaveTypeId,
        to: r.compensatoryLeaveRequests.leaveTypeId,
      }),
      leaveBalances: r.many.leaveBalances({
        from: r.leaveTypes.leaveTypeId,
        to: r.leaveBalances.leaveTypeId,
      }),
      leaveRequests: r.many.leaveRequests({
        from: r.leaveTypes.leaveTypeId,
        to: r.leaveRequests.leaveTypeId,
      }),
    },

    nationalIdentifiers: {
      tenant: r.one.tenants({
        from: r.nationalIdentifiers.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.nationalIdentifiers.personId,
        to: r.persons.personId,
      }),
    },

    noticePeriodRecords: {
      tenant: r.one.tenants({
        from: r.noticePeriodRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.noticePeriodRecords.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "notice_period_records_approver",
      }),
      employee: r.one.employees({
        from: r.noticePeriodRecords.employeeId,
        to: r.employees.employeeId,
      }),
    },

    overtimeRecords: {
      tenant: r.one.tenants({
        from: r.overtimeRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.overtimeRecords.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      employee: r.one.employees({
        from: r.overtimeRecords.employeeId,
        to: r.employees.employeeId,
        alias: "overtime_records_employee",
      }),
    },

    personDocuments: {
      tenant: r.one.tenants({
        from: r.personDocuments.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.personDocuments.personId,
        to: r.persons.personId,
      }),
    },

    personNames: {
      tenant: r.one.tenants({
        from: r.personNames.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.personNames.personId,
        to: r.persons.personId,
      }),
    },

    persons: {
      tenant: r.one.tenants({
        from: r.persons.tenantId,
        to: r.tenants.tenantId,
      }),
      addresses: r.many.addresses({
        from: r.persons.personId,
        to: r.addresses.personId,
      }),
      contactMethods: r.many.contactMethods({
        from: r.persons.personId,
        to: r.contactMethods.personId,
      }),
      dependents: r.many.dependents({
        from: r.persons.personId,
        to: r.dependents.personId,
      }),
      emergencyContacts: r.many.emergencyContacts({
        from: r.persons.personId,
        to: r.emergencyContacts.personId,
      }),
      employees: r.many.employees({
        from: r.persons.personId,
        to: r.employees.personId,
      }),
      nationalIdentifiers: r.many.nationalIdentifiers({
        from: r.persons.personId,
        to: r.nationalIdentifiers.personId,
      }),
      personDocuments: r.many.personDocuments({
        from: r.persons.personId,
        to: r.personDocuments.personId,
      }),
      personNames: r.many.personNames({
        from: r.persons.personId,
        to: r.personNames.personId,
      }),
    },

    positionAssignments: {
      tenant: r.one.tenants({
        from: r.positionAssignments.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.positionAssignments.employeeId,
        to: r.employees.employeeId,
      }),
      position: r.one.positions({
        from: r.positionAssignments.positionId,
        to: r.positions.positionId,
      }),
    },

    positions: {
      tenant: r.one.tenants({
        from: r.positions.tenantId,
        to: r.tenants.tenantId,
      }),
      department: r.one.departments({
        from: r.positions.departmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      jobGrade: r.one.jobGrades({
        from: r.positions.jobGradeId,
        to: r.jobGrades.jobGradeId,
        optional: true,
      }),
      jobRole: r.one.jobRoles({
        from: r.positions.jobRoleId,
        to: r.jobRoles.jobRoleId,
        optional: true,
      }),
      employees: r.many.employees({
        from: r.positions.positionId,
        to: r.employees.positionId,
      }),
      fromPositionEmployeeTransfers: r.many.employeeTransfers({
        from: r.positions.positionId,
        to: r.employeeTransfers.fromPositionId,
        alias: "positions_from_position",
      }),
      positionAssignments: r.many.positionAssignments({
        from: r.positions.positionId,
        to: r.positionAssignments.positionId,
      }),
      toPositionEmployeeTransfers: r.many.employeeTransfers({
        from: r.positions.positionId,
        to: r.employeeTransfers.toPositionId,
        alias: "positions_to_position",
      }),
    },

    probationRecords: {
      tenant: r.one.tenants({
        from: r.probationRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.probationRecords.employeeId,
        to: r.employees.employeeId,
        alias: "probation_records_employee",
      }),
      reviewer: r.one.employees({
        from: r.probationRecords.reviewedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
    },

    reportingLines: {
      tenant: r.one.tenants({
        from: r.reportingLines.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.reportingLines.employeeId,
        to: r.employees.employeeId,
      }),
      manager: r.one.employees({
        from: r.reportingLines.managerId,
        to: r.employees.employeeId,
        alias: "reporting_lines_manager",
      }),
    },

    secondments: {
      tenant: r.one.tenants({
        from: r.secondments.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.secondments.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      employee: r.one.employees({
        from: r.secondments.employeeId,
        to: r.employees.employeeId,
        alias: "secondments_employee",
      }),
      hostDepartment: r.one.departments({
        from: r.secondments.hostDepartmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      hostLegalEntity: r.one.legalEntities({
        from: r.secondments.hostLegalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      hostLocation: r.one.locations({
        from: r.secondments.hostLocationId,
        to: r.locations.locationId,
        optional: true,
      }),
    },

    serviceRequests: {
      tenant: r.one.tenants({
        from: r.serviceRequests.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.serviceRequests.employeeId,
        to: r.employees.employeeId,
      }),
    },

    shiftAssignments: {
      tenant: r.one.tenants({
        from: r.shiftAssignments.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.shiftAssignments.employeeId,
        to: r.employees.employeeId,
      }),
      schedule: r.one.workSchedules({
        from: r.shiftAssignments.scheduleId,
        to: r.workSchedules.scheduleId,
      }),
      attendanceLogs: r.many.attendanceLogs({
        from: r.shiftAssignments.shiftAssignmentId,
        to: r.attendanceLogs.shiftAssignmentId,
      }),
    },

    shiftSwaps: {
      tenant: r.one.tenants({
        from: r.shiftSwaps.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.shiftSwaps.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      requestingEmployee: r.one.employees({
        from: r.shiftSwaps.requestingEmployeeId,
        to: r.employees.employeeId,
        alias: "shift_swaps_requesting_employee",
      }),
      targetEmployee: r.one.employees({
        from: r.shiftSwaps.targetEmployeeId,
        to: r.employees.employeeId,
        alias: "shift_swaps_target_employee",
      }),
    },

    timesheets: {
      tenant: r.one.tenants({
        from: r.timesheets.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.timesheets.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "timesheets_approver",
      }),
      employee: r.one.employees({
        from: r.timesheets.employeeId,
        to: r.employees.employeeId,
      }),
      attendanceLogs: r.many.attendanceLogs({
        from: r.timesheets.timesheetId,
        to: r.attendanceLogs.timesheetId,
      }),
    },

    workSchedules: {
      tenant: r.one.tenants({
        from: r.workSchedules.tenantId,
        to: r.tenants.tenantId,
      }),
      shiftAssignments: r.many.shiftAssignments({
        from: r.workSchedules.scheduleId,
        to: r.shiftAssignments.scheduleId,
      }),
    },
  })
);
