import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // Isolation & Cleanup
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Performance (Vitest 4 - poolOptions moved to top-level)
    pool: "threads",
    maxWorkers: 4,
    minWorkers: 1,
    fileParallelism: true,
    maxConcurrency: 5,

    // Reporting
    reporters: process.env.CI ? ["json", "junit", "github-actions"] : ["verbose"],
    outputFile: process.env.CI
      ? {
          json: "./test-results/results.json",
          junit: "./test-results/junit.xml",
        }
      : undefined,

    // CI optimization
    bail: process.env.CI ? 1 : 0,

    // Test sequencing
    sequence: {
      shuffle: process.env.CI ? true : false,
      seed: Date.now(),
      hooks: "stack",
    },

    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["node_modules/", "src/__tests__/", "**/*.d.ts", "**/*.config.*", "**/index.ts"],
      all: true,
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 60,
        statements: 70,
        perFile: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    target: "es2022",
  },
});
