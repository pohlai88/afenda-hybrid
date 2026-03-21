import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest configuration for database integration tests
 *
 * Contract-focused runs (subset of tests whose names/descriptions include "contract"):
 *   pnpm test:db:contracts
 *   # equivalent: vitest run --config vitest.db.config.ts --testNamePattern=contract
 *
 * Requires DATABASE_URL environment variable:
 * - Default: postgresql://postgres:postgres@localhost:5433/afenda_test
 * - Uses port 5433 to avoid conflicts with local PostgreSQL (default 5432)
 * - Set via .env.test or environment variable
 *
 * If migrations fail with "relation already exists", recreate the test DB:
 *   pnpm test:db:recreate
 *   # or full contract run on a fresh catalog:
 *   pnpm test:db:contracts:clean
 */
export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "src/db"),
    },
  },
  test: {
    include: ["src/db/__tests__/**/*.test.ts"],
    setupFiles: ["./src/db/__tests__/setup.ts"],
    reporters: process.env.VITEST_MINIMAL === "1" ? "dot" : "verbose",
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globals: true,
    env: {
      // Default to Docker test database if DATABASE_URL not set
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/afenda_test",
    },
  },
});
