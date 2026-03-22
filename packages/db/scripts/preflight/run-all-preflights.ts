/**
 * Runs all DB preflight gates in **migration timestamp order** (same order as typical apply).
 *
 *   DATABASE_URL=... pnpm check:preflight
 *
 * **SKIP_ALL_PREFLIGHTS=1** — exit 0 without connecting (CI jobs with no DB).
 * Per-check skips still work (e.g. SKIP_CSQL014_PREFLIGHT=1); this runner does not set them.
 *
 * @see docs/preflight/README.md
 */

import { execSync } from "node:child_process";
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const envTestPath = resolve(process.cwd(), ".env.test");
if (existsSync(envTestPath)) {
  config({ path: envTestPath });
}
config();

/** Ordered by migration folder timestamp (approximate apply order). */
const STEPS = [
  "check:csql014-preflight",
  "check:reviews-lifecycle-preflight",
  "check:promotion-records-preflight",
  "check:grievance-resolution-preflight",
  "check:learning-cert-lifecycle-preflight",
  "check:succession-plans-preflight",
] as const;

function main(): void {
  if (process.env.SKIP_ALL_PREFLIGHTS === "1") {
    console.log("check:preflight: SKIP_ALL_PREFLIGHTS=1 — skipping entire suite.");
    process.exit(0);
  }

  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "check:preflight: DATABASE_URL is not set. Set it, or use SKIP_ALL_PREFLIGHTS=1, or run individual checks with their SKIP_* vars."
    );
    process.exit(1);
  }

  for (const step of STEPS) {
    console.log(`\n=== ${step} ===\n`);
    execSync(`pnpm run ${step}`, {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });
  }

  console.log("\ncheck:preflight: all steps passed.\n");
}

main();
