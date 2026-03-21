import { describe, it, expect } from "vitest";
import {
  tenantStatusZodEnum,
  tenantSettingsSchema,
} from "../schema-platform/core/tenants";
import {
  regionTypeZodEnum,
  regionStatusZodEnum,
} from "../schema-platform/core/regions";
import {
  organizationTypeZodEnum,
  organizationStatusZodEnum,
} from "../schema-platform/core/organizations";
import { locationStatusZodEnum } from "../schema-platform/core/locations";

describe("Enum Validation Tests", () => {
  describe("tenant status enum", () => {
    it("accepts valid tenant statuses", () => {
      expect(tenantStatusZodEnum.parse("ACTIVE")).toBe("ACTIVE");
      expect(tenantStatusZodEnum.parse("SUSPENDED")).toBe("SUSPENDED");
      expect(tenantStatusZodEnum.parse("CLOSED")).toBe("CLOSED");
    });

    it("rejects invalid tenant status", () => {
      expect(() => tenantStatusZodEnum.parse("INVALID")).toThrow();
      expect(() => tenantStatusZodEnum.parse("active")).toThrow(); // case-sensitive
    });
  });

  describe("region type enum", () => {
    it("accepts valid region types", () => {
      expect(regionTypeZodEnum.parse("CONTINENT")).toBe("CONTINENT");
      expect(regionTypeZodEnum.parse("COUNTRY")).toBe("COUNTRY");
      expect(regionTypeZodEnum.parse("STATE")).toBe("STATE");
      expect(regionTypeZodEnum.parse("CITY")).toBe("CITY");
    });

    it("rejects invalid region type", () => {
      expect(() => regionTypeZodEnum.parse("INVALID")).toThrow();
    });
  });

  describe("region status enum", () => {
    it("accepts valid region statuses", () => {
      expect(regionStatusZodEnum.parse("ACTIVE")).toBe("ACTIVE");
      expect(regionStatusZodEnum.parse("INACTIVE")).toBe("INACTIVE");
    });

    it("rejects invalid region status", () => {
      expect(() => regionStatusZodEnum.parse("DELETED")).toThrow();
    });
  });

  describe("organization type enum", () => {
    it("accepts valid organization types", () => {
      expect(organizationTypeZodEnum.parse("COMPANY")).toBe("COMPANY");
      expect(organizationTypeZodEnum.parse("DIVISION")).toBe("DIVISION");
      expect(organizationTypeZodEnum.parse("DEPARTMENT")).toBe("DEPARTMENT");
      expect(organizationTypeZodEnum.parse("UNIT")).toBe("UNIT");
      expect(organizationTypeZodEnum.parse("TEAM")).toBe("TEAM");
    });

    it("rejects invalid organization type", () => {
      expect(() => organizationTypeZodEnum.parse("INVALID")).toThrow();
    });
  });

  describe("organization status enum", () => {
    it("accepts valid organization statuses", () => {
      expect(organizationStatusZodEnum.parse("ACTIVE")).toBe("ACTIVE");
      expect(organizationStatusZodEnum.parse("INACTIVE")).toBe("INACTIVE");
      expect(organizationStatusZodEnum.parse("ARCHIVED")).toBe("ARCHIVED");
    });

    it("rejects invalid organization status", () => {
      expect(() => organizationStatusZodEnum.parse("DELETED")).toThrow();
    });
  });

  describe("location status enum", () => {
    it("accepts valid location statuses", () => {
      expect(locationStatusZodEnum.parse("ACTIVE")).toBe("ACTIVE");
      expect(locationStatusZodEnum.parse("INACTIVE")).toBe("INACTIVE");
      expect(locationStatusZodEnum.parse("CLOSED")).toBe("CLOSED");
    });

    it("rejects invalid location status", () => {
      expect(() => locationStatusZodEnum.parse("DELETED")).toThrow();
    });
  });

  describe("tenant settings validation", () => {
    it("accepts valid tenant settings", () => {
      const valid = {
        theme: "dark",
        locale: "en-US",
        timezone: "America/New_York",
        features: { darkMode: true, analytics: false },
      };
      expect(tenantSettingsSchema.parse(valid)).toEqual(valid);
    });

    it("accepts partial settings", () => {
      expect(tenantSettingsSchema.parse({ theme: "light" })).toEqual({
        theme: "light",
      });
      expect(tenantSettingsSchema.parse({})).toEqual({});
    });

    it("rejects invalid locale format", () => {
      expect(() =>
        tenantSettingsSchema.parse({ locale: "x" })
      ).toThrow(); // too short
    });

    it("rejects unknown properties (strict mode)", () => {
      expect(() =>
        tenantSettingsSchema.parse({ unknown: "value" })
      ).toThrow();
    });

    it("validates features as boolean record", () => {
      const valid = { features: { feature1: true, feature2: false } };
      expect(tenantSettingsSchema.parse(valid)).toEqual(valid);

      expect(() =>
        tenantSettingsSchema.parse({ features: { invalid: "not-boolean" } })
      ).toThrow();
    });
  });
});
