import { describe, it, expect } from "vitest";
import {
  timestampColumns,
  softDeleteColumns,
  auditColumns,
  MANDATORY_SHARED_COLUMNS,
  RECOMMENDED_SHARED_COLUMNS,
  ALL_SHARED_FINGERPRINTS,
} from "../schema/_shared";

describe("Shared Column Mixins", () => {
  describe("timestampColumns", () => {
    it("exports createdAt and updatedAt columns", () => {
      expect(timestampColumns).toHaveProperty("createdAt");
      expect(timestampColumns).toHaveProperty("updatedAt");
    });

    it("columns are Drizzle column builders", () => {
      expect(typeof timestampColumns.createdAt).toBe("object");
      expect(typeof timestampColumns.updatedAt).toBe("object");
    });
  });

  describe("softDeleteColumns", () => {
    it("exports deletedAt column", () => {
      expect(softDeleteColumns).toHaveProperty("deletedAt");
    });

    it("deletedAt is a Drizzle column builder", () => {
      expect(typeof softDeleteColumns.deletedAt).toBe("object");
    });
  });

  describe("auditColumns", () => {
    it("exports createdBy and updatedBy columns", () => {
      expect(auditColumns).toHaveProperty("createdBy");
      expect(auditColumns).toHaveProperty("updatedBy");
    });

    it("columns are Drizzle column builders", () => {
      expect(typeof auditColumns.createdBy).toBe("object");
      expect(typeof auditColumns.updatedBy).toBe("object");
    });
  });

  describe("CI enforcement constants", () => {
    it("MANDATORY_SHARED_COLUMNS includes timestamp columns", () => {
      expect(MANDATORY_SHARED_COLUMNS).toContain("createdAt");
      expect(MANDATORY_SHARED_COLUMNS).toContain("updatedAt");
    });

    it("RECOMMENDED_SHARED_COLUMNS includes optional shared columns (not tenantId)", () => {
      expect(RECOMMENDED_SHARED_COLUMNS).toContain("deletedAt");
      expect(RECOMMENDED_SHARED_COLUMNS).toContain("createdBy");
      expect(RECOMMENDED_SHARED_COLUMNS).toContain("updatedBy");
      // tenantId is NOT in RECOMMENDED - it must be explicit with foreignKey()
      expect(RECOMMENDED_SHARED_COLUMNS).not.toContain("tenantId");
    });

    it("ALL_SHARED_FINGERPRINTS has entries for mixin columns", () => {
      expect(ALL_SHARED_FINGERPRINTS).toHaveProperty("createdAt");
      expect(ALL_SHARED_FINGERPRINTS).toHaveProperty("updatedAt");
      expect(ALL_SHARED_FINGERPRINTS).toHaveProperty("deletedAt");
      expect(ALL_SHARED_FINGERPRINTS).toHaveProperty("createdBy");
      expect(ALL_SHARED_FINGERPRINTS).toHaveProperty("updatedBy");
      // tenantId is NOT in fingerprints - it's explicit per table
      expect(ALL_SHARED_FINGERPRINTS).not.toHaveProperty("tenantId");
    });

    it("fingerprints have correct format", () => {
      expect(ALL_SHARED_FINGERPRINTS.createdAt).toContain("timestamp");
      expect(ALL_SHARED_FINGERPRINTS.createdAt).toContain("notNull");
    });
  });
});

describe("Shared Column Usage in Core Schema", () => {
  it("core tables use timestampColumns mixin", async () => {
    const { tenants } = await import("../schema/core/tenants");
    const { regions } = await import("../schema/core/regions");
    const { organizations } = await import("../schema/core/organizations");
    const { locations } = await import("../schema/core/locations");

    // All core tables should have timestamp columns
    for (const table of [tenants, regions, organizations, locations]) {
      expect(table).toHaveProperty("createdAt");
      expect(table).toHaveProperty("updatedAt");
    }
  });

  it("core tables use softDeleteColumns mixin", async () => {
    const { tenants } = await import("../schema/core/tenants");
    const { regions } = await import("../schema/core/regions");
    const { organizations } = await import("../schema/core/organizations");
    const { locations } = await import("../schema/core/locations");

    // All core tables should have soft delete column
    for (const table of [tenants, regions, organizations, locations]) {
      expect(table).toHaveProperty("deletedAt");
    }
  });

  it("tenant-scoped tables have tenantId column", async () => {
    const { organizations } = await import("../schema/core/organizations");
    const { locations } = await import("../schema/core/locations");

    expect(organizations).toHaveProperty("tenantId");
    expect(locations).toHaveProperty("tenantId");
  });

  it("audited tables have audit columns", async () => {
    const { organizations } = await import("../schema/core/organizations");
    const { locations } = await import("../schema/core/locations");

    expect(organizations).toHaveProperty("createdBy");
    expect(organizations).toHaveProperty("updatedBy");
    expect(locations).toHaveProperty("createdBy");
    expect(locations).toHaveProperty("updatedBy");
  });
});
