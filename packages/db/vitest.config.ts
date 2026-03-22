import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest configuration for @afenda/db package
 *
 * Runs all database integration tests with Docker test database:
 * - Default: postgresql://postgres:postgres@localhost:5433/afenda_test
 * - Uses port 5433 to avoid conflicts with local PostgreSQL (default 5432)
 *
 * If migrations fail with "relation already exists", recreate the test DB:
 *   pnpm test:db:recreate
 */
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/afenda_test";

export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/__tests__/**/*.test.ts"],
    setupFiles: ["./src/__tests__/setup.ts"],
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
      DATABASE_URL,
    },
  },
});
