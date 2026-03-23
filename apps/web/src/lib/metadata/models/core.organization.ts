import type { ModelDef } from "@afenda/view-engine";

/** Static ModelDef for `core.organization` (list route demo). */
export const organizationModel: ModelDef = {
  version: 1,
  name: "core.organization",
  label: "Organization",
  fields: {
    organizationId: { name: "organizationId", label: "ID", type: "integer", readonly: true },
    orgCode: { name: "orgCode", label: "Code", type: "text", required: true },
    name: { name: "name", label: "Name", type: "text", required: true },
    orgType: {
      name: "orgType",
      label: "Type",
      type: "selection",
      options: [
        { value: "COMPANY", label: "Company" },
        { value: "DIVISION", label: "Division" },
        { value: "DEPARTMENT", label: "Department" },
        { value: "UNIT", label: "Unit" },
        { value: "TEAM", label: "Team" },
      ],
    },
    status: {
      name: "status",
      label: "Status",
      type: "selection",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "ARCHIVED", label: "Archived" },
      ],
    },
  },
};
