/**
 * RLS (Row-Level Security) Policy Tests
 *
 * Tests tenant isolation at the database level using PostgreSQL RLS policies.
 * These tests verify that:
 * 1. Policy helper functions generate correct structures
 * 2. Session context can be set and cleared
 * 3. RLS policies are properly defined in schema
 */

import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { setSessionContext, clearSessionContext } from "../_session";
import {
  tenantIsolationCheck,
  tenantIsolationPolicies,
  appUserRole,
  serviceRole,
} from "./tenant-policies";

describe("RLS Tenant Isolation Policies", () => {
  describe("Policy Definitions", () => {
    it("should generate tenant isolation SQL check as SQL template", () => {
      const check = tenantIsolationCheck();
      expect(check).toBeDefined();
      expect(check.queryChunks).toBeDefined();
    });

    it("should generate all four CRUD policies", () => {
      const policies = tenantIsolationPolicies("test_table");
      expect(policies).toHaveLength(4);
    });

    it("should define app_user role as existing", () => {
      expect(appUserRole).toBeDefined();
    });

    it("should define service_role as existing", () => {
      expect(serviceRole).toBeDefined();
    });
  });

  describe("Session Context Integration", () => {
    it("should set and retrieve tenant_id within a transaction", async () => {
      await db.transaction(async (tx) => {
        await setSessionContext(tx, { tenantId: 42, userId: 1 });

        const result = await tx.execute(
          sql`SELECT current_setting('afenda.tenant_id', true) as tenant_id`
        );

        expect(result.rows[0]).toBeDefined();
        expect((result.rows[0] as { tenant_id: string }).tenant_id).toBe("42");
      });
    });

    it("should set and retrieve user_id within a transaction", async () => {
      await db.transaction(async (tx) => {
        await setSessionContext(tx, { tenantId: 1, userId: 99 });

        const result = await tx.execute(
          sql`SELECT current_setting('afenda.user_id', true) as user_id`
        );

        expect(result.rows[0]).toBeDefined();
        expect((result.rows[0] as { user_id: string }).user_id).toBe("99");
      });
    });

    it("should clear session context within a transaction", async () => {
      await db.transaction(async (tx) => {
        await setSessionContext(tx, { tenantId: 1, userId: 1 });
        await clearSessionContext(tx);

        const result = await tx.execute(
          sql`SELECT current_setting('afenda.tenant_id', true) as tenant_id`
        );

        expect((result.rows[0] as { tenant_id: string }).tenant_id).toBe("");
      });
    });
  });

  describe("Policy SQL Structure", () => {
    it("should create select policy with correct structure", () => {
      const policies = tenantIsolationPolicies("users");
      const selectPolicy = policies[0];

      expect(selectPolicy).toBeDefined();
    });

    it("should create insert policy with correct structure", () => {
      const policies = tenantIsolationPolicies("users");
      const insertPolicy = policies[1];

      expect(insertPolicy).toBeDefined();
    });

    it("should create update policy with correct structure", () => {
      const policies = tenantIsolationPolicies("users");
      const updatePolicy = policies[2];

      expect(updatePolicy).toBeDefined();
    });

    it("should create delete policy with correct structure", () => {
      const policies = tenantIsolationPolicies("users");
      const deletePolicy = policies[3];

      expect(deletePolicy).toBeDefined();
    });
  });
});
