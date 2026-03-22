/** Load `.env` before `../db` resolves `DATABASE_URL` (same as drizzle-kit). */
import "dotenv/config";

import { runSeeds, runFullBootstrap } from "./index";
import { db } from "../db";
import { tenants, users } from "../schema-platform";
import { eq } from "drizzle-orm";

/**
 * CLI runner for seed scripts.
 *
 * Usage:
 *   pnpm db:seed              # Seed existing tenant (first found or specified)
 *   pnpm db:seed [tenantId]   # Seed specific tenant
 *   pnpm db:bootstrap         # Full bootstrap (create tenant, user, currencies, then seed)
 *
 * The bootstrap command creates everything from scratch and is safe to re-run.
 */
async function main() {
  const command = process.argv[2];

  // Check if this is a bootstrap command
  if (command === "bootstrap" || command === "--bootstrap") {
    console.log("\n🚀 Running full bootstrap...\n");
    const { tenantId, systemUserId } = await runFullBootstrap();
    console.log(`\n🎉 Bootstrap complete!`);
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   System User ID: ${systemUserId}\n`);
    process.exit(0);
  }

  // Otherwise, seed an existing tenant
  let tenantId: number;
  let systemUserId: number;

  if (command && !isNaN(parseInt(command, 10))) {
    tenantId = parseInt(command, 10);
  } else {
    const firstTenant = await db.select({ tenantId: tenants.tenantId }).from(tenants).limit(1);
    if (firstTenant.length === 0) {
      console.error("❌ No tenants found. Run 'pnpm db:bootstrap' to create one first.");
      process.exit(1);
    }
    tenantId = firstTenant[0].tenantId;
    console.log(`ℹ No tenantId provided, using first tenant: ${tenantId}`);
  }

  const systemUser = await db
    .select({ userId: users.userId })
    .from(users)
    .where(eq(users.email, "system@afenda.com"))
    .limit(1);

  if (systemUser.length === 0) {
    console.error("❌ System user (system@afenda.com) not found. Run 'pnpm db:bootstrap' first.");
    process.exit(1);
  }

  systemUserId = systemUser[0].userId;

  await runSeeds(tenantId, systemUserId);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
