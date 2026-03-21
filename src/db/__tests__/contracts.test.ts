import { describe, it, expect } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { tenants } from "../schema-platform/core/tenants";
import { regions } from "../schema-platform/core/regions";
import { organizations } from "../schema-platform/core/organizations";
import { locations } from "../schema-platform/core/locations";
import { users } from "../schema-platform/security/users";
import { employees } from "../schema-hrm/hr/fundamentals/employees";

describe("Database Contract Tests", () => {
  describe("contract: core.tenants schema", () => {
    const columns = getTableColumns(tenants);

    it("has required primary key", () => {
      expect(columns.tenantId).toBeDefined();
      expect(columns.tenantId.primary).toBe(true);
    });

    it("has required business columns", () => {
      expect(columns.tenantCode).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.status).toBeDefined();
    });

    it("has timestamp columns", () => {
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it("has soft delete column", () => {
      expect(columns.deletedAt).toBeDefined();
    });

    it("tenantCode is not null", () => {
      expect(columns.tenantCode.notNull).toBe(true);
    });
  });

  describe("contract: security.users schema", () => {
    const columns = getTableColumns(users);

    it("has required primary key", () => {
      expect(columns.userId).toBeDefined();
      expect(columns.userId.primary).toBe(true);
    });

    it("has tenant scope", () => {
      expect(columns.tenantId).toBeDefined();
      expect(columns.tenantId.notNull).toBe(true);
    });

    it("has required user columns", () => {
      expect(columns.email).toBeDefined();
      expect(columns.displayName).toBeDefined();
      expect(columns.status).toBeDefined();
    });

    it("has timestamp columns", () => {
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it("has audit columns", () => {
      expect(columns.createdBy).toBeDefined();
      expect(columns.updatedBy).toBeDefined();
    });

    it("has soft delete column", () => {
      expect(columns.deletedAt).toBeDefined();
    });
  });

  describe("contract: hr.employees schema", () => {
    const columns = getTableColumns(employees);

    it("has required primary key", () => {
      expect(columns.employeeId).toBeDefined();
      expect(columns.employeeId.primary).toBe(true);
    });

    it("has tenant scope", () => {
      expect(columns.tenantId).toBeDefined();
      expect(columns.tenantId.notNull).toBe(true);
    });

    it("has required employee columns", () => {
      expect(columns.employeeCode).toBeDefined();
      expect(columns.personId).toBeDefined();
      expect(columns.hireDate).toBeDefined();
    });

    it("has audit columns", () => {
      expect(columns.createdBy).toBeDefined();
      expect(columns.updatedBy).toBeDefined();
    });

    it("has soft delete column", () => {
      expect(columns.deletedAt).toBeDefined();
    });
  });

  describe("contract: core.regions schema", () => {
    const columns = getTableColumns(regions);

    it("has required primary key", () => {
      expect(columns.regionId).toBeDefined();
      expect(columns.regionId.primary).toBe(true);
    });

    it("has regionCode and hierarchy column", () => {
      expect(columns.regionCode).toBeDefined();
      expect(columns.parentRegionId).toBeDefined();
    });
  });

  describe("contract: core.organizations schema", () => {
    const columns = getTableColumns(organizations);

    it("has required primary key", () => {
      expect(columns.organizationId).toBeDefined();
      expect(columns.organizationId.primary).toBe(true);
    });

    it("has tenant scope and hierarchy", () => {
      expect(columns.tenantId).toBeDefined();
      expect(columns.tenantId.notNull).toBe(true);
      expect(columns.parentOrganizationId).toBeDefined();
    });

    it("has audit columns", () => {
      expect(columns.createdBy).toBeDefined();
      expect(columns.updatedBy).toBeDefined();
    });
  });

  describe("contract: core.locations schema", () => {
    const columns = getTableColumns(locations);

    it("has required primary key", () => {
      expect(columns.locationId).toBeDefined();
      expect(columns.locationId.primary).toBe(true);
    });

    it("has tenant scope and optional region", () => {
      expect(columns.tenantId).toBeDefined();
      expect(columns.tenantId.notNull).toBe(true);
      expect(columns.regionId).toBeDefined();
    });
  });

  describe("contract: tenant-scoped tables have tenantId", () => {
    const tenantScopedTables = [
      { table: users, name: "security.users" },
      { table: employees, name: "hr.employees" },
      { table: organizations, name: "core.organizations" },
      { table: locations, name: "core.locations" },
    ];

    tenantScopedTables.forEach(({ table, name }) => {
      it(`${name} has tenantId column`, () => {
        const columns = getTableColumns(table);
        expect(columns.tenantId).toBeDefined();
        expect(columns.tenantId.notNull).toBe(true);
      });
    });
  });

  describe("contract: all tables have timestamp columns", () => {
    const allTables = [
      { table: tenants, name: "core.tenants" },
      { table: regions, name: "core.regions" },
      { table: organizations, name: "core.organizations" },
      { table: locations, name: "core.locations" },
      { table: users, name: "security.users" },
      { table: employees, name: "hr.employees" },
    ];

    allTables.forEach(({ table, name }) => {
      it(`${name} has createdAt and updatedAt`, () => {
        const columns = getTableColumns(table);
        expect(columns.createdAt).toBeDefined();
        expect(columns.updatedAt).toBeDefined();
      });
    });
  });

  describe("contract: naming conventions", () => {
    it("tenants table follows naming convention", () => {
      const name = getTableName(tenants);
      expect(name).toBe("tenants");
    });

    it("users table follows naming convention", () => {
      const name = getTableName(users);
      expect(name).toBe("users");
    });

    it("employees table follows naming convention", () => {
      const name = getTableName(employees);
      expect(name).toBe("employees");
    });

    it("regions table follows naming convention", () => {
      expect(getTableName(regions)).toBe("regions");
    });

    it("organizations table follows naming convention", () => {
      expect(getTableName(organizations)).toBe("organizations");
    });

    it("locations table follows naming convention", () => {
      expect(getTableName(locations)).toBe("locations");
    });
  });
});
