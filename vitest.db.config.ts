import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for database integration tests
 * 
 * Requires DATABASE_URL environment variable:
 * - Default: postgresql://postgres:postgres@localhost:5433/afenda_test
 * - Uses port 5433 to avoid conflicts with local PostgreSQL (default 5432)
 * - Set via .env.test or environment variable
 */
export default defineConfig({
  test: {
    include: ["src/db/__tests__/**/*.test.ts"],
    setupFiles: ["./src/db/__tests__/setup.ts"],
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
