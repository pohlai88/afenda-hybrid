import { describe, it, expect } from "vitest";
import { tenantInsertSchema, tenantUpdateSchema } from "../schema-platform/core/tenants";
import { regionInsertSchema, regionUpdateSchema } from "../schema-platform/core/regions";
import {
  organizationInsertSchema,
  organizationUpdateSchema,
} from "../schema-platform/core/organizations";
import { locationInsertSchema, locationUpdateSchema } from "../schema-platform/core/locations";

describe("Schema Validation Tests", () => {
  describe("tenant insert schema", () => {
    it("accepts valid tenant data", () => {
      const valid = {
        tenantCode: "ACME-001",
        name: "Acme Corporation",
        status: "ACTIVE" as const,
      };
      expect(() => tenantInsertSchema.parse(valid)).not.toThrow();
    });

    it("validates tenantCode format", () => {
      // Valid formats
      expect(() =>
        tenantInsertSchema.parse({
          tenantCode: "ABC123",
          name: "Test",
          status: "ACTIVE" as const,
        })
      ).not.toThrow();
      expect(() =>
        tenantInsertSchema.parse({
          tenantCode: "test-123_ABC",
          name: "Test",
          status: "ACTIVE" as const,
        })
      ).not.toThrow();

      // Invalid: too short
      expect(() =>
        tenantInsertSchema.parse({
          tenantCode: "A",
          name: "Test",
          status: "ACTIVE" as const,
        })
      ).toThrow();

      // Invalid: special characters
      expect(() =>
        tenantInsertSchema.parse({
          tenantCode: "test@123",
          name: "Test",
          status: "ACTIVE" as const,
        })
      ).toThrow();
    });

    it("validates name is not empty", () => {
      expect(() =>
        tenantInsertSchema.parse({
          tenantCode: "TEST",
          name: "",
          status: "ACTIVE" as const,
        })
      ).toThrow();
    });

    it("validates settings if provided", () => {
      const valid = {
        tenantCode: "TEST",
        name: "Test",
        status: "ACTIVE" as const,
        settings: {
          theme: "dark",
          locale: "en-US",
        },
      };
      expect(() => tenantInsertSchema.parse(valid)).not.toThrow();

      // Invalid settings
      expect(() =>
        tenantInsertSchema.parse({
          tenantCode: "TEST",
          name: "Test",
          status: "ACTIVE" as const,
          settings: { unknown: "field" },
        })
      ).toThrow();
    });
  });

  describe("region insert schema", () => {
    it("accepts valid region data", () => {
      const valid = {
        regionCode: "US-NY",
        name: "New York",
        regionType: "STATE" as const,
        status: "ACTIVE" as const,
      };
      expect(() => regionInsertSchema.parse(valid)).not.toThrow();
    });

    it("validates regionCode format", () => {
      expect(() =>
        regionInsertSchema.parse({
          regionCode: "A",
          name: "Test",
          regionType: "COUNTRY" as const,
          status: "ACTIVE" as const,
        })
      ).toThrow(); // too short
    });
  });

  describe("organization insert schema", () => {
    it("accepts valid organization data", () => {
      const valid = {
        tenantId: 1,
        orgCode: "ENG-001",
        name: "Engineering",
        orgType: "DEPARTMENT" as const,
        status: "ACTIVE" as const,
        createdBy: 1,
        updatedBy: 1,
      };
      expect(() => organizationInsertSchema.parse(valid)).not.toThrow();
    });

    it("validates orgCode format", () => {
      expect(() =>
        organizationInsertSchema.parse({
          tenantId: 1,
          orgCode: "test@invalid",
          name: "Test",
          orgType: "DEPARTMENT" as const,
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).toThrow();
    });
  });

  describe("location insert schema", () => {
    it("accepts valid location data", () => {
      const valid = {
        tenantId: 1,
        locationCode: "NYC-HQ",
        name: "New York Headquarters",
        city: "New York",
        status: "ACTIVE" as const,
        createdBy: 1,
        updatedBy: 1,
      };
      expect(() => locationInsertSchema.parse(valid)).not.toThrow();
    });

    it("validates latitude range", () => {
      // Valid
      expect(() =>
        locationInsertSchema.parse({
          tenantId: 1,
          locationCode: "TEST",
          name: "Test",
          city: "New York",
          latitude: 40.7128,
          longitude: -74.006,
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).not.toThrow();

      // Invalid: out of range
      expect(() =>
        locationInsertSchema.parse({
          tenantId: 1,
          locationCode: "TEST",
          name: "Test",
          city: "Test City",
          latitude: 91,
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).toThrow();

      expect(() =>
        locationInsertSchema.parse({
          tenantId: 1,
          locationCode: "TEST",
          name: "Test",
          city: "Test City",
          latitude: -91,
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).toThrow();
    });

    it("requires city field", () => {
      expect(() =>
        locationInsertSchema.parse({
          tenantId: 1,
          locationCode: "TEST",
          name: "Test Location",
          // Missing required city field
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).toThrow();
    });

    it("validates longitude range", () => {
      // Valid
      expect(() =>
        locationInsertSchema.parse({
          tenantId: 1,
          locationCode: "TEST",
          name: "Test",
          city: "New York",
          longitude: -74.006,
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).not.toThrow();

      // Invalid: out of range
      expect(() =>
        locationInsertSchema.parse({
          tenantId: 1,
          locationCode: "TEST",
          name: "Test",
          city: "Test City",
          longitude: 181,
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).toThrow();

      expect(() =>
        locationInsertSchema.parse({
          tenantId: 1,
          locationCode: "TEST",
          name: "Test",
          city: "Test City",
          longitude: -181,
          status: "ACTIVE" as const,
          createdBy: 1,
          updatedBy: 1,
        })
      ).toThrow();
    });
  });

  describe("update schemas", () => {
    it("tenant update schema makes fields optional", () => {
      expect(() => tenantUpdateSchema.parse({ name: "New Name" })).not.toThrow();
      expect(() => tenantUpdateSchema.parse({})).not.toThrow();
    });

    it("region update schema makes fields optional", () => {
      expect(() => regionUpdateSchema.parse({ name: "New Name" })).not.toThrow();
      expect(() => regionUpdateSchema.parse({})).not.toThrow();
    });

    it("organization update schema makes fields optional", () => {
      expect(() => organizationUpdateSchema.parse({ name: "New Name" })).not.toThrow();
      expect(() => organizationUpdateSchema.parse({})).not.toThrow();
    });

    it("location update schema makes fields optional", () => {
      expect(() => locationUpdateSchema.parse({ name: "New Name" })).not.toThrow();
      expect(() => locationUpdateSchema.parse({})).not.toThrow();
    });
  });
});
