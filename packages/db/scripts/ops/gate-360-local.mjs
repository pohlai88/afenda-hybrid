/**
 * Cross-platform local runner: Docker test DB (optional) → migrate → gate:360.
 * Handles default DATABASE_URL and accidental CI_STRICT_WARNINGS=1 (unless --strict).
 *
 * Usage (from repo root): pnpm gate:360:local [--verbose] [--skip-docker] [--strict]
 * @see CONTRIBUTING.md
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
// packages/db/scripts/ops → monorepo root
const repoRoot = join(scriptDir, "../../../..");

function parseArgs(argv) {
  let verbose = false;
  let skipDocker = false;
  let strict = false;
  for (const a of argv) {
    if (a === "--verbose" || a === "-v") verbose = true;
    else if (a === "--skip-docker") skipDocker = true;
    else if (a === "--strict") strict = true;
  }
  return { verbose, skipDocker, strict };
}

function log(verbose, msg) {
  if (verbose) console.error(`\n[gate-360-local] ${msg}\n`);
}

function fail(phase, code) {
  const c = code ?? 1;
  console.error(`\ngate-360-local: FAILED at "${phase}" (exit ${c})\n`);
  process.exit(c);
}

function runPnpm(phase, pnpmArgs, verbose) {
  log(verbose, `→ pnpm ${pnpmArgs.join(" ")}`);
  const result = spawnSync("pnpm", pnpmArgs, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  const code = result.status ?? 1;
  if (code !== 0) fail(phase, code);
}

const { verbose, skipDocker, strict } = parseArgs(process.argv.slice(2));

if (verbose) {
  console.error(`[gate-360-local] repo root: ${repoRoot}`);
}

if (!strict && process.env.CI_STRICT_WARNINGS === "1") {
  console.warn(
    "[gate-360-local] CI_STRICT_WARNINGS=1 is set — clearing for this run so warning-only checks do not fail gate:360. Use --strict to keep it; see CONTRIBUTING.md."
  );
  delete process.env.CI_STRICT_WARNINGS;
}

const defaultDb = "postgresql://postgres:postgres@localhost:5433/afenda_test";
if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    "[gate-360-local] DATABASE_URL not set — using default Docker test DB URL.\n  " + defaultDb
  );
  process.env.DATABASE_URL = defaultDb;
}

if (!skipDocker) {
  runPnpm("docker:test:start", ["docker:test:start"], verbose);
} else {
  log(verbose, "Skipping docker:test:start (--skip-docker)");
}

runPnpm("db:migrate", ["db:migrate"], verbose);
runPnpm("gate:360", ["gate:360"], verbose);

if (verbose) console.error("\n[gate-360-local] gate:360 completed successfully.\n");
