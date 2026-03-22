/**
 * HR Domain Enums Barrel
 *
 * Re-exports all enums from the HR schema for easier discovery.
 * Import from here when you need enum values or Zod schemas.
 */

// Fundamentals
export {
  employeeStatuses,
  employeeStatusEnum,
  employeeStatusZodEnum,
} from "./fundamentals/employees";

export {
  departmentStatuses,
  departmentStatusEnum,
  departmentStatusZodEnum,
} from "./fundamentals/departments";

export {
  positionStatuses,
  positionStatusEnum,
  positionStatusZodEnum,
} from "./fundamentals/positions";

// People
export {
  genders,
  genderEnum,
  genderZodEnum,
  maritalStatuses,
  maritalStatusEnum,
  maritalStatusZodEnum,
  personStatuses,
  personStatusEnum,
  personStatusZodEnum,
} from "./people/persons";

// Time
export { timesheetStatuses, timesheetStatusEnum, timesheetStatusZodEnum } from "./time/timesheets";

export {
  leaveRequestStatuses,
  leaveRequestStatusEnum,
  leaveRequestStatusZodEnum,
} from "../hr/operations/leaveRequests";

export {
  attendanceTypes,
  attendanceTypeEnum,
  attendanceTypeZodEnum,
} from "./operations/attendanceLogs";

// Employment
export {
  contractTypes,
  contractTypeEnum,
  contractTypeZodEnum,
  contractStatuses,
  contractStatusEnum,
  contractStatusZodEnum,
} from "./employment/employmentContracts";

// Attendance Requests
export {
  attendanceRequestStatuses,
  attendanceRequestStatusEnum,
  AttendanceRequestStatusSchema,
  type AttendanceRequestStatus,
} from "./operations/attendanceRequests";

// Compensatory Leave Requests
export {
  compensatoryLeaveRequestStatuses,
  compensatoryLeaveRequestStatusEnum,
  CompensatoryLeaveRequestStatusSchema,
  type CompensatoryLeaveRequestStatus,
} from "./operations/compensatoryLeaveRequests";
