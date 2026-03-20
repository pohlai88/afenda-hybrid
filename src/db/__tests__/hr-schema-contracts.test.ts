import { registerPgTableContractSuite, type PgTableContract } from "./lib/pg-table-contract-suite";

const DEFAULT_HR_AUDIT_COLUMNS = [
  "tenantId",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "createdBy",
  "updatedBy",
] as const satisfies readonly string[];

/**
 * Anchor contracts for `hr.*` (extend with audit trigger functions when introduced).
 */
const hrContracts: Record<string, PgTableContract> = {
  employees: {
    columns: [
      "employeeId",
      "tenantId",
      "personId",
      "employeeCode",
      "hireDate",
      "terminationDate",
      "departmentId",
      "positionId",
      "managerId",
      "locationId",
      "payrollLegalEntityId",
      "status",
      "notes",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "createdBy",
      "updatedBy",
    ],
    indexes: [
      "idx_employees_tenant",
      "idx_employees_person",
      "idx_employees_status",
      "idx_employees_department",
      "idx_employees_position",
      "idx_employees_manager",
      "idx_employees_location",
      "idx_employees_payroll_legal_entity",
      "idx_employees_hire_date",
      "uq_employees_code",
    ],
    checkConstraints: [
      "chk_employees_hire_date",
      "chk_employees_termination_after_hire",
      "chk_employees_terminated_status",
    ],
    foreignKeys: [
      "fk_employees_tenant",
      "fk_employees_manager",
      "fk_employees_location",
      "fk_employees_payroll_legal_entity",
    ],
    checkConstraintDefinitions: {
      chk_employees_hire_date: /"hireDate"\s*>=\s*'1900-01-01'/i,
      chk_employees_termination_after_hire:
        /"terminationDate"\s+IS\s+NULL[\s\S]*"terminationDate"\s*>=\s*"hireDate"/i,
      chk_employees_terminated_status:
        /status\s*<>\s*'TERMINATED'[\s\S]*terminationDate[\s\S]*IS\s+NOT\s+NULL/i,
    },
    foreignKeyDefinitions: {
      fk_employees_tenant:
        /FOREIGN\s+KEY\s*\(\s*"tenantId"\s*\)[\s\S]*REFERENCES[\s\S]*tenants\s*\(\s*"tenantId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
      fk_employees_manager:
        /FOREIGN\s+KEY\s*\(\s*"managerId"\s*\)[\s\S]*REFERENCES[\s\S]*employees\s*\(\s*"employeeId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
      fk_employees_location:
        /FOREIGN\s+KEY\s*\(\s*"locationId"\s*\)[\s\S]*REFERENCES[\s\S]*locations\s*\(\s*"locationId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
      fk_employees_payroll_legal_entity:
        /FOREIGN\s+KEY\s*\(\s*"payrollLegalEntityId"\s*\)[\s\S]*REFERENCES[\s\S]*legal_entities\s*\(\s*"legalEntityId"\s*\)[\s\S]*ON\s+DELETE\s+RESTRICT/i,
    },
    columnUdts: {
      status: { udtSchema: "hr", udtName: "employee_status" },
    },
    columnDefaults: {
      status: /PENDING/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_HR_AUDIT_COLUMNS],
    enumTypeLabels: {
      employee_status: ["ACTIVE", "ON_LEAVE", "TERMINATED", "SUSPENDED", "PENDING", "PROBATION"],
    },
  },
};

registerPgTableContractSuite({
  tableSchema: "hr",
  describeTitle: "Database contract tests (hr schema)",
  contracts: hrContracts,
  contractsManifestKey: "hrContracts",
});
