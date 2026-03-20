import { defineConfig } from "vitest/config";

/**
 * Default Vitest config for `pnpm vitest` / `pnpm test`.
 * Ensures DATABASE_URL and DB setup match integration-test expectations.
 *
 * Focused DB runs still work via: `vitest --config vitest.db.config.ts`
 */
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/afenda_test";

export default defineConfig({
  /** Avoid clearing the terminal in watch mode (better on narrow / Windows consoles). */
  clearScreen: false,
  test: {
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/db/__tests__/setup.ts"],
    /** Linear output: default watch UI redraws poorly in narrow / Windows terminals (line-wrap spam). */
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
