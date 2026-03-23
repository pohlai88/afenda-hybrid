import type { ViewDef } from "@afenda/view-engine";

export const viewDefinitions: ViewDef[] = [
  // hr.employee views
  {
    version: 1,
    id: "hr_employee_list",
    name: "Employees",
    kind: "list",
    model: "hr.employee",
    fields: ["employeeCode", "status", "hireDate"],
    searchFields: ["employeeCode"],
    defaultOrder: [["employeeCode", "asc"]],
  },
  {
    version: 1,
    id: "hr_employee_form",
    name: "Employee",
    kind: "form",
    model: "hr.employee",
    layout: [
      {
        kind: "group",
        direction: "horizontal",
        columns: 2,
        children: [
          { kind: "field", name: "employeeCode" },
          { kind: "field", name: "status" },
        ],
      },
      {
        kind: "group",
        direction: "horizontal",
        columns: 2,
        children: [{ kind: "field", name: "hireDate" }],
      },
    ],
  },
  {
    version: 1,
    id: "hr_employee_kanban",
    name: "Employees — Kanban",
    kind: "kanban",
    model: "hr.employee",
    fields: ["employeeCode", "status", "hireDate"],
  },

  // core.organization views
  {
    version: 1,
    id: "core_organization_list",
    name: "Organizations",
    kind: "list",
    model: "core.organization",
    fields: ["orgCode", "name", "orgType", "status"],
    searchFields: ["orgCode", "name"],
    defaultOrder: [["orgCode", "asc"]],
  },
  {
    version: 1,
    id: "core_organization_form",
    name: "Organization",
    kind: "form",
    model: "core.organization",
    layout: [
      {
        kind: "group",
        direction: "horizontal",
        columns: 2,
        children: [
          { kind: "field", name: "orgCode" },
          { kind: "field", name: "name" },
        ],
      },
      {
        kind: "group",
        direction: "horizontal",
        columns: 2,
        children: [
          { kind: "field", name: "orgType" },
          { kind: "field", name: "status" },
        ],
      },
    ],
  },
  {
    version: 1,
    id: "core_organization_kanban",
    name: "Organizations — Kanban",
    kind: "kanban",
    model: "core.organization",
    fields: ["orgCode", "name", "orgType", "status"],
  },
];

export function buildViewRegistry(): Map<string, ViewDef> {
  const m = new Map<string, ViewDef>();
  for (const v of viewDefinitions) {
    m.set(`${v.model}:${v.kind}`, v);
  }
  return m;
}
