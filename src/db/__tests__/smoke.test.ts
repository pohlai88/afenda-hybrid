import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../db";
import { tenants } from "../schema/core/tenants";
import { sql } from "drizzle-orm";

describe("Database Smoke Tests", () => {
  beforeAll(async () => {
    await db.execute(sql`SELECT 1`);
  });

  it("smoke: can connect to database", async () => {
    const result = await db.execute(sql`SELECT current_database()`);
    expect(result.rows).toBeDefined();
  });

  it("smoke: can query core.tenants", async () => {
    const result = await db.select().from(tenants).limit(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it("smoke: can insert and select tenant", async () => {
    const testCode = `TEST_${Date.now()}`;
    
    const [inserted] = await db
      .insert(tenants)
      .values({ 
        tenantCode: testCode, 
        name: "Test Tenant" 
      })
      .returning();

    expect(inserted.tenantId).toBeDefined();
    expect(inserted.tenantCode).toBe(testCode);
    expect(inserted.status).toBe("ACTIVE");

    const [selected] = await db
      .select()
      .from(tenants)
      .where(sql`${tenants.tenantId} = ${inserted.tenantId}`);

    expect(selected.tenantCode).toBe(testCode);
    expect(selected.createdAt).toBeDefined();

    await db.delete(tenants).where(sql`${tenants.tenantId} = ${inserted.tenantId}`);
  });

  it("smoke: session context can be set", async () => {
    await db.execute(sql`SET LOCAL afenda.tenant_id = '1'`);
    const result = await db.execute(
      sql`SELECT current_setting('afenda.tenant_id', true) as tenant_id`
    );
    expect(result.rows[0]).toHaveProperty("tenant_id", "1");
  });

  it("smoke: required extensions are installed", async () => {
    const extensions = await db.execute(sql`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('btree_gist', 'pgcrypto')
    `);
    const extNames = (extensions.rows as Array<{ extname: string }>).map((r) => r.extname);
    expect(extNames).toContain("btree_gist");
    expect(extNames).toContain("pgcrypto");
  });

  it("smoke: core schema exists", async () => {
    const schemas = await db.execute(sql`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name = 'core'
    `);
    expect(schemas.rows.length).toBe(1);
  });

  it("smoke: timestamp columns have correct defaults", async () => {
    const testCode = `TIMESTAMP_TEST_${Date.now()}`;
    
    const [inserted] = await db
      .insert(tenants)
      .values({ tenantCode: testCode, name: "Timestamp Test" })
      .returning();

    expect(inserted.createdAt).toBeInstanceOf(Date);
    expect(inserted.updatedAt).toBeInstanceOf(Date);
    expect(inserted.deletedAt).toBeNull();

    await db.delete(tenants).where(sql`${tenants.tenantId} = ${inserted.tenantId}`);
  });
});
