import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { organizations } from "../schema-platform/core/organizations";
import { regions } from "../schema-platform/core/regions";
import { locations } from "../schema-platform/core/locations";
import { sql, inArray } from "drizzle-orm";
import { matchesPgError } from "./pg-error";

/**
 * Integration tests for core schema integrity constraints:
 * - Cross-tenant parent prevention trigger
 * - Case-insensitive code uniqueness
 * - Coordinate CHECK constraints
 * 
 * These tests require a live database connection.
 * Set DATABASE_URL in .env or skip with: pnpm test:db -- --testNamePattern="^(?!.*integrity)"
 */

const TEST_TENANT_1_CODE = `TEST_T1_${Date.now()}`;
const TEST_TENANT_2_CODE = `TEST_T2_${Date.now()}`;
const TEST_REGION_CODE = `TEST_R_${Date.now()}`;

describe.skipIf(!process.env.DATABASE_URL)("Core Schema Integrity Tests", () => {
  let tenant1Id: number;
  let tenant2Id: number;
  let regionId: number;

  beforeAll(async () => {
    // Create two test tenants
    const [t1] = await db
      .insert(tenants)
      .values({
        tenantCode: TEST_TENANT_1_CODE,
        name: "Test Tenant 1",
        status: "ACTIVE",
      })
      .returning();
    tenant1Id = t1.tenantId;

    const [t2] = await db
      .insert(tenants)
      .values({
        tenantCode: TEST_TENANT_2_CODE,
        name: "Test Tenant 2",
        status: "ACTIVE",
      })
      .returning();
    tenant2Id = t2.tenantId;

    // Create a test region
    const [r] = await db
      .insert(regions)
      .values({
        regionCode: TEST_REGION_CODE,
        name: "Test Region",
        regionType: "COUNTRY",
        status: "ACTIVE",
      })
      .returning();
    regionId = r.regionId;
  });

  afterAll(async () => {
    // Cleanup (use inArray — sql`IN (${a}, ${b})` does not expand to valid SQL in Drizzle)
    await db.delete(locations).where(inArray(locations.tenantId, [tenant1Id, tenant2Id]));
    await db.delete(organizations).where(inArray(organizations.tenantId, [tenant1Id, tenant2Id]));
    await db.delete(regions).where(sql`${regions.regionId} = ${regionId}`);
    await db.delete(tenants).where(inArray(tenants.tenantId, [tenant1Id, tenant2Id]));
  });

  describe("cross-tenant parent prevention trigger", () => {
    it("allows same-tenant parent assignment", async () => {
      // Create parent org in tenant 1
      const [parent] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: "PARENT-001",
          name: "Parent Org",
          orgType: "COMPANY",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      // Create child org in same tenant
      const [child] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: "CHILD-001",
          name: "Child Org",
          parentOrganizationId: parent.organizationId,
          orgType: "DIVISION",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      expect(child.parentOrganizationId).toBe(parent.organizationId);
      expect(child.tenantId).toBe(tenant1Id);
    });

    it("rejects cross-tenant parent assignment on INSERT", async () => {
      // Create parent org in tenant 1
      const [parent] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: "PARENT-002",
          name: "Parent Org T1",
          orgType: "COMPANY",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      // Attempt to create child org in tenant 2 with parent from tenant 1
      await expect(
        db.insert(organizations).values({
          tenantId: tenant2Id,
          orgCode: "CHILD-002",
          name: "Child Org T2",
          parentOrganizationId: parent.organizationId,
          orgType: "DIVISION",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
      ).rejects.toSatisfy(matchesPgError(/cross-tenant parent assignment rejected/i));
    });

    it("rejects cross-tenant parent assignment on UPDATE", async () => {
      // Create parent in tenant 1
      const [parent] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: "PARENT-003",
          name: "Parent Org",
          orgType: "COMPANY",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      // Create child in tenant 2 (no parent initially)
      const [child] = await db
        .insert(organizations)
        .values({
          tenantId: tenant2Id,
          orgCode: "CHILD-003",
          name: "Child Org",
          orgType: "DIVISION",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      // Attempt to update child to have cross-tenant parent
      await expect(
        db
          .update(organizations)
          .set({ parentOrganizationId: parent.organizationId })
          .where(sql`${organizations.organizationId} = ${child.organizationId}`)
      ).rejects.toSatisfy(matchesPgError(/cross-tenant parent assignment rejected/i));
    });

    it("allows null parent (root organization)", async () => {
      const [org] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: "ROOT-001",
          name: "Root Org",
          parentOrganizationId: null,
          orgType: "COMPANY",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      expect(org.parentOrganizationId).toBeNull();
    });
  });

  describe("case-insensitive code uniqueness", () => {
    it("prevents duplicate tenant codes with different cases", async () => {
      const code = `CASE_TEST_${Date.now()}`;

      // Insert with uppercase
      await db.insert(tenants).values({
        tenantCode: code.toUpperCase(),
        name: "Test Uppercase",
        status: "ACTIVE",
      });

      // Attempt to insert with lowercase - should fail
      await expect(
        db.insert(tenants).values({
          tenantCode: code.toLowerCase(),
          name: "Test Lowercase",
          status: "ACTIVE",
        })
      ).rejects.toSatisfy(matchesPgError(/duplicate key value violates unique constraint/i));
    });

    it("prevents duplicate region codes with different cases", async () => {
      const code = `REG_CASE_${Date.now()}`;

      await db.insert(regions).values({
        regionCode: code.toUpperCase(),
        name: "Test Region Upper",
        regionType: "COUNTRY",
        status: "ACTIVE",
      });

      await expect(
        db.insert(regions).values({
          regionCode: code.toLowerCase(),
          name: "Test Region Lower",
          regionType: "COUNTRY",
          status: "ACTIVE",
        })
      ).rejects.toSatisfy(matchesPgError(/duplicate key value violates unique constraint/i));
    });

    it("prevents duplicate organization codes within tenant with different cases", async () => {
      const code = `ORG_CASE_${Date.now()}`;

      await db.insert(organizations).values({
        tenantId: tenant1Id,
        orgCode: code.toUpperCase(),
        name: "Test Org Upper",
        orgType: "DEPARTMENT",
        status: "ACTIVE",
        createdBy: 1,
        updatedBy: 1,
      });

      await expect(
        db.insert(organizations).values({
          tenantId: tenant1Id,
          orgCode: code.toLowerCase(),
          name: "Test Org Lower",
          orgType: "DEPARTMENT",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
      ).rejects.toSatisfy(matchesPgError(/duplicate key value violates unique constraint/i));
    });

    it("allows same code in different tenants", async () => {
      const code = `SHARED_CODE_${Date.now()}`;

      const [org1] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: code,
          name: "Org in Tenant 1",
          orgType: "DEPARTMENT",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      const [org2] = await db
        .insert(organizations)
        .values({
          tenantId: tenant2Id,
          orgCode: code,
          name: "Org in Tenant 2",
          orgType: "DEPARTMENT",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      expect(org1.orgCode).toBe(code);
      expect(org2.orgCode).toBe(code);
      expect(org1.tenantId).not.toBe(org2.tenantId);
    });
  });

  describe("soft-delete uniqueness behavior", () => {
    it("allows reusing tenant code after soft delete", async () => {
      const code = `REUSE_${Date.now()}`;

      // Create and soft-delete
      const [original] = await db
        .insert(tenants)
        .values({
          tenantCode: code,
          name: "Original Tenant",
          status: "ACTIVE",
        })
        .returning();

      await db
        .update(tenants)
        .set({ deletedAt: new Date() })
        .where(sql`${tenants.tenantId} = ${original.tenantId}`);

      // Should be able to reuse the code
      const [reused] = await db
        .insert(tenants)
        .values({
          tenantCode: code,
          name: "Reused Tenant",
          status: "ACTIVE",
        })
        .returning();

      expect(reused.tenantCode).toBe(code);
      expect(reused.tenantId).not.toBe(original.tenantId);
    });

    it("allows reusing organization code within tenant after soft delete", async () => {
      const code = `ORG_REUSE_${Date.now()}`;

      // Create and soft-delete
      const [original] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: code,
          name: "Original Org",
          orgType: "DEPARTMENT",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      await db
        .update(organizations)
        .set({ deletedAt: new Date() })
        .where(sql`${organizations.organizationId} = ${original.organizationId}`);

      // Should be able to reuse the code in same tenant
      const [reused] = await db
        .insert(organizations)
        .values({
          tenantId: tenant1Id,
          orgCode: code,
          name: "Reused Org",
          orgType: "DEPARTMENT",
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      expect(reused.orgCode).toBe(code);
      expect(reused.organizationId).not.toBe(original.organizationId);
    });
  });

  describe("coordinate CHECK constraints", () => {
    it("accepts valid latitude values", async () => {
      const [loc] = await db
        .insert(locations)
        .values({
          tenantId: tenant1Id,
          locationCode: `LAT_VALID_${Date.now()}`,
          name: "Valid Latitude",
          city: "New York",
          latitude: 40.7128,
          longitude: -74.006,
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      expect(loc.latitude).toBe(40.7128);
    });

    it("rejects latitude > 90", async () => {
      await expect(
        db.insert(locations).values({
          tenantId: tenant1Id,
          locationCode: `LAT_INVALID_${Date.now()}`,
          name: "Invalid Latitude",
          city: "Test City",
          latitude: 91,
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
      ).rejects.toSatisfy(matchesPgError(/violates check constraint "chk_locations_latitude"/i));
    });

    it("rejects latitude < -90", async () => {
      await expect(
        db.insert(locations).values({
          tenantId: tenant1Id,
          locationCode: `LAT_INVALID2_${Date.now()}`,
          name: "Invalid Latitude",
          city: "Test City",
          latitude: -91,
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
      ).rejects.toSatisfy(matchesPgError(/violates check constraint "chk_locations_latitude"/i));
    });

    it("rejects longitude > 180", async () => {
      await expect(
        db.insert(locations).values({
          tenantId: tenant1Id,
          locationCode: `LON_INVALID_${Date.now()}`,
          name: "Invalid Longitude",
          city: "Test City",
          longitude: 181,
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
      ).rejects.toSatisfy(matchesPgError(/violates check constraint "chk_locations_longitude"/i));
    });

    it("rejects longitude < -180", async () => {
      await expect(
        db.insert(locations).values({
          tenantId: tenant1Id,
          locationCode: `LON_INVALID2_${Date.now()}`,
          name: "Invalid Longitude",
          city: "Test City",
          longitude: -181,
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
      ).rejects.toSatisfy(matchesPgError(/violates check constraint "chk_locations_longitude"/i));
    });

    it("accepts null coordinates", async () => {
      const [loc] = await db
        .insert(locations)
        .values({
          tenantId: tenant1Id,
          locationCode: `NULL_COORDS_${Date.now()}`,
          name: "No Coordinates",
          city: "Unknown City",
          latitude: null,
          longitude: null,
          status: "ACTIVE",
          createdBy: 1,
          updatedBy: 1,
        })
        .returning();

      expect(loc.latitude).toBeNull();
      expect(loc.longitude).toBeNull();
    });
  });
});
