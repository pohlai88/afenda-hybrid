import type { ModelDef } from "@afenda/view-engine";

/** Static ModelDef for `hr.employee` (Phase 1 — TypeScript registry). */
export const employeeModel: ModelDef = {
  version: 1,
  name: "hr.employee",
  label: "Employee",
  fields: {
    employeeId: { name: "employeeId", label: "ID", type: "integer", readonly: true },
    employeeCode: {
      name: "employeeCode",
      label: "Code",
      type: "text",
      required: true,
      maxLength: 20,
    },
    status: {
      name: "status",
      label: "Status",
      type: "selection",
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "PROBATION", label: "Probation" },
        { value: "ACTIVE", label: "Active" },
        { value: "ON_LEAVE", label: "On Leave" },
        { value: "SUSPENDED", label: "Suspended" },
        { value: "TERMINATED", label: "Terminated" },
      ],
      widget: "statusbar",
    },
    hireDate: { name: "hireDate", label: "Hire Date", type: "date", required: true },
    personId: { name: "personId", label: "Person", type: "integer", readonly: true },
    departmentId: { name: "departmentId", label: "Department", type: "integer" },
    positionId: { name: "positionId", label: "Position", type: "integer" },
  },
  states: {
    field: "status",
    states: [
      { value: "PENDING", label: "Pending", transitions: ["PROBATION", "ACTIVE"] },
      { value: "PROBATION", label: "Probation", transitions: ["ACTIVE", "TERMINATED"] },
      { value: "ACTIVE", label: "Active", transitions: ["ON_LEAVE", "SUSPENDED", "TERMINATED"] },
      { value: "ON_LEAVE", label: "On Leave", transitions: ["ACTIVE", "TERMINATED"] },
      { value: "SUSPENDED", label: "Suspended", transitions: ["ACTIVE", "TERMINATED"] },
      { value: "TERMINATED", label: "Terminated" },
    ],
  },
};
