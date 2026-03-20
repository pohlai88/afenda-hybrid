import { defineRelations } from "drizzle-orm";
import { employees } from "./fundamentals/employees";
import { departments } from "./fundamentals/departments";
import { positions } from "./fundamentals/positions";
import { attendanceLogs } from "./operations/attendanceLogs";
import { leaveRequests } from "./operations/leaveRequests";
import { persons } from "./people/persons";
import { personNames } from "./people/personNames";
import { contactMethods } from "./people/contactMethods";
import { addresses } from "./people/addresses";
import { nationalIdentifiers } from "./people/nationalIdentifiers";
import { emergencyContacts } from "./people/emergencyContacts";
import { dependents } from "./people/dependents";
import { personDocuments } from "./people/personDocuments";
import { workSchedules } from "./time/workSchedules";
import { shiftAssignments } from "./time/shiftAssignments";
import { timesheets } from "./time/timesheets";
import { leaveTypes } from "./time/leaveTypes";
import { leaveBalances } from "./time/leaveBalances";
import { tenants } from "../core/tenants";
import { organizations } from "../core/organizations";
import { locations } from "../core/locations";

export const hrRelations = defineRelations(
  {
    persons,
    personNames,
    contactMethods,
    addresses,
    nationalIdentifiers,
    emergencyContacts,
    dependents,
    personDocuments,
    employees,
    departments,
    positions,
    workSchedules,
    shiftAssignments,
    timesheets,
    leaveTypes,
    leaveBalances,
    attendanceLogs,
    leaveRequests,
    tenants,
    organizations,
    locations,
  },
  (r) => ({
    persons: {
      tenant: r.one.tenants({
        from: r.persons.tenantId,
        to: r.tenants.tenantId,
      }),
      names: r.many.personNames({
        from: r.persons.personId,
        to: r.personNames.personId,
      }),
      contactMethods: r.many.contactMethods({
        from: r.persons.personId,
        to: r.contactMethods.personId,
      }),
      addresses: r.many.addresses({
        from: r.persons.personId,
        to: r.addresses.personId,
      }),
      nationalIdentifiers: r.many.nationalIdentifiers({
        from: r.persons.personId,
        to: r.nationalIdentifiers.personId,
      }),
      emergencyContacts: r.many.emergencyContacts({
        from: r.persons.personId,
        to: r.emergencyContacts.personId,
      }),
      dependents: r.many.dependents({
        from: r.persons.personId,
        to: r.dependents.personId,
      }),
      documents: r.many.personDocuments({
        from: r.persons.personId,
        to: r.personDocuments.personId,
      }),
      employees: r.many.employees({
        from: r.persons.personId,
        to: r.employees.personId,
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
    employees: {
      tenant: r.one.tenants({
        from: r.employees.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.employees.personId,
        to: r.persons.personId,
      }),
      department: r.one.departments({
        from: r.employees.departmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      position: r.one.positions({
        from: r.employees.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
      manager: r.one.employees({
        from: r.employees.managerId,
        to: r.employees.employeeId,
        optional: true,
        alias: "employee_manager",
      }),
      subordinates: r.many.employees({
        from: r.employees.employeeId,
        to: r.employees.managerId,
      }),
      location: r.one.locations({
        from: r.employees.locationId,
        to: r.locations.locationId,
        optional: true,
      }),
      attendanceLogs: r.many.attendanceLogs({
        from: r.employees.employeeId,
        to: r.attendanceLogs.employeeId,
      }),
      leaveRequests: r.many.leaveRequests({
        from: r.employees.employeeId,
        to: r.leaveRequests.employeeId,
      }),
      approvedLeaveRequests: r.many.leaveRequests({
        from: r.employees.employeeId,
        to: r.leaveRequests.approvedBy,
        alias: "leave_requests_approved_by",
      }),
      shiftAssignments: r.many.shiftAssignments({
        from: r.employees.employeeId,
        to: r.shiftAssignments.employeeId,
      }),
      timesheets: r.many.timesheets({
        from: r.employees.employeeId,
        to: r.timesheets.employeeId,
      }),
      leaveBalances: r.many.leaveBalances({
        from: r.employees.employeeId,
        to: r.leaveBalances.employeeId,
      }),
    },
    departments: {
      tenant: r.one.tenants({
        from: r.departments.tenantId,
        to: r.tenants.tenantId,
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
        alias: "department_parent",
      }),
      children: r.many.departments({
        from: r.departments.departmentId,
        to: r.departments.parentDepartmentId,
      }),
      headEmployee: r.one.employees({
        from: r.departments.headEmployeeId,
        to: r.employees.employeeId,
        optional: true,
      }),
      employees: r.many.employees({
        from: r.departments.departmentId,
        to: r.employees.departmentId,
      }),
      positions: r.many.positions({
        from: r.departments.departmentId,
        to: r.positions.departmentId,
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
      employees: r.many.employees({
        from: r.positions.positionId,
        to: r.employees.positionId,
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
    timesheets: {
      tenant: r.one.tenants({
        from: r.timesheets.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.timesheets.employeeId,
        to: r.employees.employeeId,
      }),
      approver: r.one.employees({
        from: r.timesheets.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "timesheet_approver",
      }),
      attendanceLogs: r.many.attendanceLogs({
        from: r.timesheets.timesheetId,
        to: r.attendanceLogs.timesheetId,
      }),
    },
    leaveTypes: {
      tenant: r.one.tenants({
        from: r.leaveTypes.tenantId,
        to: r.tenants.tenantId,
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
    leaveRequests: {
      tenant: r.one.tenants({
        from: r.leaveRequests.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.leaveRequests.employeeId,
        to: r.employees.employeeId,
      }),
      leaveType: r.one.leaveTypes({
        from: r.leaveRequests.leaveTypeId,
        to: r.leaveTypes.leaveTypeId,
      }),
      leaveBalance: r.one.leaveBalances({
        from: r.leaveRequests.leaveBalanceId,
        to: r.leaveBalances.leaveBalanceId,
        optional: true,
      }),
      approver: r.one.employees({
        from: r.leaveRequests.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "leave_request_approver",
      }),
    },
  })
);
