import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

const MIGRATIONS_ROOT = join(process.cwd(), "src/db/migrations");

type LocalMigration = { name: string; hash: string };

function listLocalMigrations(): LocalMigration[] {
  if (!existsSync(MIGRATIONS_ROOT)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_ROOT}`);
  }
  const out: LocalMigration[] = [];
  for (const entry of readdirSync(MIGRATIONS_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sqlPath = join(MIGRATIONS_ROOT, entry.name, "migration.sql");
    if (!existsSync(sqlPath)) continue;
    const content = readFileSync(sqlPath, "utf8");
    const hash = createHash("sha256").update(content).digest("hex");
    out.push({ name: entry.name, hash });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

describe("Database contract: migration journal", () => {
  it("drizzle.__drizzle_migrations matches src/db/migrations (names + sha256 of migration.sql)", async () => {
    const local = listLocalMigrations();
    const localByName = new Map(local.map((m) => [m.name, m.hash]));

    const result = await db.execute(sql`
      SELECT id, name, hash
      FROM drizzle.__drizzle_migrations
      ORDER BY id
    `);

    const rows = result.rows as Array<{ id: number; name: string | null; hash: string }>;

    const nullNames = rows.filter((r) => r.name == null);
    expect(
      nullNames,
      "All applied migrations should have a folder name recorded (null legacy rows break coverage checks)",
    ).toEqual([]);

    const dbByName = new Map(rows.map((r) => [r.name as string, r.hash]));

    for (const { name, hash } of local) {
      expect(dbByName.has(name), `Migration "${name}" exists locally but was not applied (missing journal row)`).toBe(
        true,
      );
      expect(
        dbByName.get(name),
        `Migration "${name}" hash mismatch — re-run migrations on a clean DB or fix migration.sql vs applied hash`,
      ).toBe(hash);
    }

    for (const name of dbByName.keys()) {
      expect(
        localByName.has(name),
        `Journal contains applied migration "${name}" but no src/db/migrations/<name>/migration.sql — orphan DB row`,
      ).toBe(true);
    }

    expect(rows.length, "row count vs local migrations").toBe(local.length);
  });
});
