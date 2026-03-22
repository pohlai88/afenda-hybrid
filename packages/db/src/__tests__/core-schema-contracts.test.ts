import { registerPgTableContractSuite, type PgTableContract } from "./lib/pg-table-contract-suite";

const DEFAULT_CORE_AUDIT_COLUMNS = [
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly string[];

/**
 * Anchor contracts for `core.*` (expand as you add triggers / stricter guarantees).
 */
const coreContracts: Record<string, PgTableContract> = {
  tenants: {
    columns: [
      "tenantId",
      "tenantCode",
      "name",
      "status",
      "settings",
      "createdAt",
      "updatedAt",
      "deletedAt",
    ],
    indexes: ["uq_tenants_code", "idx_tenants_status", "idx_tenants_code"],
    columnUdts: {
      status: { udtSchema: "core", udtName: "tenant_status" },
    },
    columnDefaults: {
      status: /ACTIVE/i,
      createdAt: /now\s*\(/i,
      updatedAt: /now\s*\(/i,
    },
    auditColumns: [...DEFAULT_CORE_AUDIT_COLUMNS],
    enumTypeLabels: {
      tenant_status: ["ACTIVE", "SUSPENDED", "CLOSED"],
    },
  },
};

registerPgTableContractSuite({
  tableSchema: "core",
  describeTitle: "Database contract tests (core schema)",
  contracts: coreContracts,
  contractsManifestKey: "coreContracts",
});
