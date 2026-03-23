---
name: vitest
description: >-
  Vitest (Vite-powered) testing — Jest-compatible API, vi mocks, coverage, environments,
  projects/workspaces. Use when writing or fixing tests, vitest.config.ts, coverage, or
  monorepo test commands in AFENDA-HYBRID (@afenda/db, @afenda/ui-core, view-engine, erp-view-pack).
  Prefer https://vitest.dev for Vitest 4.x when reference snippets disagree.
metadata:
  author: Anthony Fu
  version: "2026.1.28"
  source: Generated from https://github.com/vitest-dev/vitest, scripts located at https://github.com/antfu/skills
  official_docs: https://vitest.dev
---

Vitest is a next-generation testing framework powered by Vite. It provides a Jest-compatible API with native ESM, TypeScript, and JSX support out of the box. Vitest shares the same config, transformers, resolvers, and plugins with your Vite app.

**Key Features:**

- Vite-native: Uses Vite's transformation pipeline for fast HMR-like test updates
- Jest-compatible: Drop-in replacement for most Jest test suites
- Smart watch mode: Only reruns affected tests based on module graph
- Native ESM, TypeScript, JSX support without configuration
- Multi-threaded workers for parallel test execution
- Built-in coverage via V8 or Istanbul
- Snapshot testing, mocking, and spy utilities

> Reference material was generated from Vitest docs (see [GENERATION.md](GENERATION.md)); wording may reflect an older minor series.

**Version alignment (this repo):** `pnpm-workspace.yaml` catalogs **Vitest ^4.1.0**. For new options, breaking changes, or browser mode, confirm against the [official Vitest guide](https://vitest.dev/guide/) and [config reference](https://vitest.dev/config/).

## Core

| Topic         | Description                                                     | Reference                                    |
| ------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Configuration | Vitest and Vite config integration, defineConfig usage          | [core-config](references/core-config.md)     |
| CLI           | Command line interface, commands and options                    | [core-cli](references/core-cli.md)           |
| Test API      | test/it function, modifiers like skip, only, concurrent         | [core-test-api](references/core-test-api.md) |
| Describe API  | describe/suite for grouping tests and nested suites             | [core-describe](references/core-describe.md) |
| Expect API    | Assertions with toBe, toEqual, matchers and asymmetric matchers | [core-expect](references/core-expect.md)     |
| Hooks         | beforeEach, afterEach, beforeAll, afterAll, aroundEach          | [core-hooks](references/core-hooks.md)       |

## Features

| Topic        | Description                                                    | Reference                                                  |
| ------------ | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Mocking      | Mock functions, modules, timers, dates with vi utilities       | [features-mocking](references/features-mocking.md)         |
| Snapshots    | Snapshot testing with toMatchSnapshot and inline snapshots     | [features-snapshots](references/features-snapshots.md)     |
| Coverage     | Code coverage with V8 or Istanbul providers                    | [features-coverage](references/features-coverage.md)       |
| Test Context | Test fixtures, context.expect, test.extend for custom fixtures | [features-context](references/features-context.md)         |
| Concurrency  | Concurrent tests, parallel execution, sharding                 | [features-concurrency](references/features-concurrency.md) |
| Filtering    | Filter tests by name, file patterns, tags                      | [features-filtering](references/features-filtering.md)     |

## Advanced

| Topic        | Description                                             | Reference                                                    |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| Vi Utilities | vi helper: mock, spyOn, fake timers, hoisted, waitFor   | [advanced-vi](references/advanced-vi.md)                     |
| Environments | Test environments: node, jsdom, happy-dom, custom       | [advanced-environments](references/advanced-environments.md) |
| Type Testing | Type-level testing with expectTypeOf and assertType     | [advanced-type-testing](references/advanced-type-testing.md) |
| Projects     | Multi-project workspaces, different configs per project | [advanced-projects](references/advanced-projects.md)         |

## AFENDA-HYBRID monorepo

Run tests **from the repo root** with pnpm filters or the root `package.json` scripts that delegate to `@afenda/db`.

| Package                 | Role                                                                                        | Typical command                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@afenda/db`            | PostgreSQL integration tests (Docker test DB, `node` env, `pool: "forks"`, `maxWorkers: 1`) | `pnpm test:db` or `pnpm --filter @afenda/db test:db` |
| `@afenda/ui-core`       | Primitives/patterns (no Vitest script in package; typecheck only)                           | —                                                    |
| `@afenda/view-engine`   | React + `jsdom`, `@vitejs/plugin-react`                                                     | `pnpm --filter @afenda/view-engine test`             |
| `@afenda/erp-view-pack` | Same stack                                                                                  | `pnpm --filter @afenda/erp-view-pack test`           |

**Conventions:** Vitest is declared as `"vitest": "catalog:"` in workspace packages so versions stay aligned. Config files live next to each package as `vitest.config.ts`. Database tests expect `DATABASE_URL` (default `postgresql://postgres:postgres@localhost:5433/afenda_test`); use root scripts like `docker:test:start` / `test:db:recreate` when the test DB is missing or stale.

**Improving tests:** Match each package’s existing `include`/`setupFiles` patterns; keep DB tests serial where migrations or shared DB state apply; use `VITEST_MINIMAL=1` in `@afenda/db` for quieter CI output (see that package’s `vitest.config.ts`).
