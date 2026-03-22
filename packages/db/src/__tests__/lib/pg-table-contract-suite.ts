import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../../db";

/** Collapse whitespace so `information_schema.columns.column_default` matches are stable across PG versions. */
export function normalizeColumnDefault(expr: string): string {
  return expr.replace(/\s+/g, " ").trim();
}

/**
 * `"schema.routineName"` for `pg_proc` (use unique routine names; overloads require a dedicated helper).
 */
export function parseQualifiedRoutine(qualified: string): { schema: string; name: string } {
  const idx = qualified.lastIndexOf(".");
  if (idx <= 0 || idx === qualified.length - 1) {
    throw new Error(`Qualified routine must be "schema.functionName", got: ${qualified}`);
  }
  return { schema: qualified.slice(0, idx), name: qualified.slice(idx + 1) };
}

/** Normalize `pg_get_function_identity_arguments` for stable comparison across PG versions. */
export function normalizeIdentityArgs(expr: string | null | undefined): string {
  if (expr == null) return "";
  return expr.replace(/\s+/g, " ").trim();
}

export type PgTableContract = {
  columns: string[];
  indexes: string[];
  legacyColumns?: string[];
  /** Assert Postgres enum / composite type for specific columns (information_schema). */
  columnUdts?: Record<string, { udtSchema: string; udtName: string }>;
  /** Expected CHECK constraint names on this table (pg_constraint.contype = 'c'). */
  checkConstraints?: string[];
  /** Expected FOREIGN KEY constraint names (pg_constraint.contype = 'f'). */
  foreignKeys?: string[];
  /** CHECK / FK names that must not exist (e.g. after a migration cleanup). */
  legacyConstraints?: string[];
  /**
   * Assert CHECK body via `pg_get_constraintdef` (whitespace/parens may vary by PG version).
   * Key = constraint name, value = pattern tested with `expect(def).toMatch(pattern)`.
   */
  checkConstraintDefinitions?: Record<string, RegExp>;
  /**
   * Assert FK definition text (parent table + columns, action clauses).
   */
  foreignKeyDefinitions?: Record<string, RegExp>;
  /**
   * Assert `information_schema.columns.column_default` (non-null) after whitespace normalization.
   */
  columnDefaults?: Record<string, RegExp>;
  /**
   * Tenant + soft-delete + audit columns this table must expose in DB and in `columns` manifest.
   */
  auditColumns?: string[];
  /**
   * Enum typname -> labels in **`pg_enum` order** (must match Drizzle `enum(..., [...])` order / migrations).
   */
  enumTypeLabels?: Record<string, string[]>;
  /**
   * Namespace where `enumTypeLabels` typnames live (default: same as the table schema).
   */
  enumTypesSchema?: string;
  /**
   * User-visible triggers on this table (`pg_trigger` with `NOT tgisinternal`): tgname -> pattern
   * matched against `pg_get_triggerdef(oid, true)` (timing, event, function name, etc.).
   */
  triggers?: Record<string, RegExp>;
  /** Trigger tgname values that must not exist (e.g. removed after a data migration). */
  legacyTriggers?: string[];
  /**
   * `schema.functionName` -> pattern against `pg_get_functiondef(p.oid)` for the routine invoked by a trigger.
   */
  triggerFunctions?: Record<string, RegExp>;
  /**
   * Same keys as `triggerFunctions` (or a subset): expected `pg_get_function_identity_arguments(p.oid)`
   * after whitespace normalization. Use `""` for zero-argument routines (e.g. `() -> trigger`).
   */
  triggerFunctionIdentityArgs?: Record<string, string>;
  /**
   * Expected `pg_type.typname` for `pg_proc.prorettype` (e.g. `trigger` for trigger functions).
   */
  triggerFunctionReturnTypes?: Record<string, string>;
  /**
   * Expected `pg_proc.provolatile`: `i` = IMMUTABLE, `s` = STABLE, `v` = VOLATILE.
   */
  triggerFunctionVolatile?: Record<string, "i" | "s" | "v">;
  /**
   * Expected `pg_proc.prosecdef` (SECURITY DEFINER).
   */
  triggerFunctionSecurityDefiner?: Record<string, boolean>;
  /** Qualified `schema.functionName` values that must not exist in `pg_proc` (e.g. dropped after cleanup). */
  legacyTriggerFunctions?: string[];
};

export type RegisterPgTableContractSuiteOptions = {
  /** Postgres schema for table objects (`information_schema.table_schema`, `pg_class` namespace). */
  tableSchema: string;
  /** Top-level `describe` title (include "contract" if this suite must run under `test:db:contracts`). */
  describeTitle: string;
  contracts: Record<string, PgTableContract>;
  /**
   * Used in audit-column manifest error text (e.g. `talentContracts`).
   */
  contractsManifestKey?: string;
};

/**
 * Registers DB shape contract tests for every table manifest in `contracts`.
 */
export function registerPgTableContractSuite(options: RegisterPgTableContractSuiteOptions): void {
  const { tableSchema, describeTitle, contracts } = options;
  const manifestKey = options.contractsManifestKey ?? "contracts";

  describe(describeTitle, () => {
    for (const [table, spec] of Object.entries(contracts)) {
      describe(`contract: ${tableSchema}.${table}`, () => {
        it("has expected columns and no legacy columns", async () => {
          const result = await db.execute(sql`
            SELECT column_name AS "columnName"
            FROM information_schema.columns
            WHERE table_schema = ${tableSchema}
              AND table_name = ${table}
          `);

          const actual = (result.rows as Array<{ columnName: string }>).map((r) => r.columnName);

          for (const col of spec.columns) {
            expect(actual).toContain(col);
          }
          if (spec.legacyColumns) {
            for (const legacy of spec.legacyColumns) {
              expect(actual).not.toContain(legacy);
            }
          }
        });

        it("has required indexes", async () => {
          const result = await db.execute(sql`
            SELECT indexname AS "indexName"
            FROM pg_indexes
            WHERE schemaname = ${tableSchema}
              AND tablename = ${table}
          `);

          const actual = (result.rows as Array<{ indexName: string }>).map((r) => r.indexName);
          for (const idx of spec.indexes) {
            expect(actual).toContain(idx);
          }
        });

        if (spec.auditColumns?.length) {
          it("has full audit footprint (manifest + DB)", async () => {
            const auditCols = spec.auditColumns!;

            for (const col of auditCols) {
              expect(
                spec.columns,
                `${manifestKey}["${table}"].columns must include audit column "${col}"`
              ).toContain(col);
            }

            const result = await db.execute(sql`
              SELECT column_name AS "columnName"
              FROM information_schema.columns
              WHERE table_schema = ${tableSchema}
                AND table_name = ${table}
            `);

            const actual = (result.rows as Array<{ columnName: string }>).map((r) => r.columnName);
            for (const col of auditCols) {
              expect(actual, `${tableSchema}.${table} missing audit column ${col}`).toContain(col);
            }
          });
        }

        if (spec.columnUdts) {
          it("has expected column UDTs", async () => {
            for (const [columnName, expected] of Object.entries(spec.columnUdts!)) {
              const result = await db.execute(sql`
                SELECT
                  udt_schema AS "udtSchema",
                  udt_name AS "udtName"
                FROM information_schema.columns
                WHERE table_schema = ${tableSchema}
                  AND table_name = ${table}
                  AND column_name = ${columnName}
              `);

              const row = (result.rows as Array<{ udtSchema: string; udtName: string }>)[0];
              expect(row).toBeDefined();
              expect(row!.udtSchema).toBe(expected.udtSchema);
              expect(row!.udtName).toBe(expected.udtName);
            }
          });
        }

        if (spec.enumTypeLabels && Object.keys(spec.enumTypeLabels).length > 0) {
          it("enum types have expected labels (pg_enum order)", async () => {
            const enumNsp = spec.enumTypesSchema ?? tableSchema;
            for (const [typName, expectedLabels] of Object.entries(spec.enumTypeLabels!)) {
              const result = await db.execute(sql`
                SELECT e.enumlabel AS "label"
                FROM pg_type t
                INNER JOIN pg_namespace n ON n.oid = t.typnamespace
                INNER JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE n.nspname = ${enumNsp}
                  AND t.typname = ${typName}
                ORDER BY e.enumsortorder
              `);

              const actual = (result.rows as Array<{ label: string }>).map((r) => r.label);
              expect(actual, `${enumNsp}.${typName} labels for contract table "${table}"`).toEqual(
                expectedLabels
              );
            }
          });
        }

        if (
          (spec.triggers && Object.keys(spec.triggers).length > 0) ||
          (spec.legacyTriggers?.length ?? 0) > 0
        ) {
          it("has expected user triggers and no legacy triggers", async () => {
            const result = await db.execute(sql`
              SELECT t.tgname AS "tgName"
              FROM pg_trigger t
              INNER JOIN pg_class c ON c.oid = t.tgrelid
              INNER JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = ${tableSchema}
                AND c.relname = ${table}
                AND NOT t.tgisinternal
            `);

            const names = (result.rows as Array<{ tgName: string }>).map((r) => r.tgName);
            const nameSet = new Set(names);

            for (const tgName of Object.keys(spec.triggers ?? {})) {
              expect(
                nameSet.has(tgName),
                `missing trigger "${tgName}" on ${tableSchema}.${table}`
              ).toBe(true);
            }
            for (const legacy of spec.legacyTriggers ?? []) {
              expect(
                nameSet.has(legacy),
                `unexpected legacy trigger "${legacy}" on ${tableSchema}.${table}`
              ).toBe(false);
            }
          });
        }

        if (spec.triggers && Object.keys(spec.triggers).length > 0) {
          it("trigger definitions match expected semantics (pg_get_triggerdef)", async () => {
            const result = await db.execute(sql`
              SELECT
                t.tgname AS "tgName",
                pg_get_triggerdef(t.oid, true) AS "def"
              FROM pg_trigger t
              INNER JOIN pg_class c ON c.oid = t.tgrelid
              INNER JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = ${tableSchema}
                AND c.relname = ${table}
                AND NOT t.tgisinternal
            `);

            const byName = new Map(
              (result.rows as Array<{ tgName: string; def: string }>).map((r) => [r.tgName, r])
            );

            for (const [tgName, pattern] of Object.entries(spec.triggers!)) {
              const row = byName.get(tgName);
              expect(
                row,
                `missing trigger "${tgName}" for definition check on ${tableSchema}.${table}`
              ).toBeDefined();
              expect(row!.def, `trigger "${tgName}" on ${tableSchema}.${table}`).toMatch(pattern);
            }
          });
        }

        const triggerRoutineSpecKeys =
          (spec.triggerFunctions && Object.keys(spec.triggerFunctions).length > 0) ||
          (spec.triggerFunctionIdentityArgs &&
            Object.keys(spec.triggerFunctionIdentityArgs).length > 0) ||
          (spec.triggerFunctionReturnTypes &&
            Object.keys(spec.triggerFunctionReturnTypes).length > 0) ||
          (spec.triggerFunctionVolatile && Object.keys(spec.triggerFunctionVolatile).length > 0) ||
          (spec.triggerFunctionSecurityDefiner &&
            Object.keys(spec.triggerFunctionSecurityDefiner).length > 0);

        if (triggerRoutineSpecKeys) {
          it("trigger routines match pg_proc (def, identity args, rettype, volatility, security)", async () => {
            const qualifiedKeys = new Set([
              ...Object.keys(spec.triggerFunctions ?? {}),
              ...Object.keys(spec.triggerFunctionIdentityArgs ?? {}),
              ...Object.keys(spec.triggerFunctionReturnTypes ?? {}),
              ...Object.keys(spec.triggerFunctionVolatile ?? {}),
              ...Object.keys(spec.triggerFunctionSecurityDefiner ?? {}),
            ]);

            for (const qualified of qualifiedKeys) {
              const { schema, name } = parseQualifiedRoutine(qualified);
              const result = await db.execute(sql`
                SELECT
                  pg_get_functiondef(p.oid) AS "def",
                  pg_get_function_identity_arguments(p.oid) AS "identityArgs",
                  rt.typname AS "returnType",
                  p.provolatile AS "provolatile",
                  p.prosecdef AS "prosecdef"
                FROM pg_proc p
                INNER JOIN pg_namespace n ON n.oid = p.pronamespace
                LEFT JOIN pg_type rt ON rt.oid = p.prorettype
                WHERE n.nspname = ${schema}
                  AND p.proname = ${name}
              `);

              const rows = result.rows as Array<{
                def: string;
                identityArgs: string | null;
                returnType: string | null;
                provolatile: string;
                prosecdef: boolean;
              }>;
              expect(
                rows.length,
                `expected exactly one pg_proc row for ${qualified} (table contract ${tableSchema}.${table}, found ${rows.length})`
              ).toBe(1);

              const row = rows[0]!;

              const pattern = spec.triggerFunctions?.[qualified];
              if (pattern) {
                expect(row.def, `function ${qualified} body for ${tableSchema}.${table}`).toMatch(
                  pattern
                );
              }

              const expectedArgs = spec.triggerFunctionIdentityArgs?.[qualified];
              if (expectedArgs !== undefined) {
                expect(
                  normalizeIdentityArgs(row.identityArgs),
                  `function ${qualified} identity args for ${tableSchema}.${table}`
                ).toBe(normalizeIdentityArgs(expectedArgs));
              }

              const expectedReturn = spec.triggerFunctionReturnTypes?.[qualified];
              if (expectedReturn !== undefined) {
                expect(
                  row.returnType,
                  `function ${qualified} return type (pg_type.typname via prorettype) for ${tableSchema}.${table}`
                ).toBe(expectedReturn);
              }

              const expectedVolatile = spec.triggerFunctionVolatile?.[qualified];
              if (expectedVolatile !== undefined) {
                expect(
                  row.provolatile,
                  `function ${qualified} provolatile for ${tableSchema}.${table}`
                ).toBe(expectedVolatile);
              }

              const expectedSecDef = spec.triggerFunctionSecurityDefiner?.[qualified];
              if (expectedSecDef !== undefined) {
                expect(
                  row.prosecdef,
                  `function ${qualified} prosecdef (SECURITY DEFINER) for ${tableSchema}.${table}`
                ).toBe(expectedSecDef);
              }
            }
          });
        }

        if (spec.legacyTriggerFunctions?.length) {
          it("legacy trigger functions are absent (pg_proc)", async () => {
            for (const qualified of spec.legacyTriggerFunctions!) {
              const { schema, name } = parseQualifiedRoutine(qualified);
              const result = await db.execute(sql`
                SELECT 1 AS "one"
                FROM pg_proc p
                INNER JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = ${schema}
                  AND p.proname = ${name}
                LIMIT 1
              `);

              const rows = result.rows as Array<{ one: number }>;
              expect(
                rows.length,
                `legacy function ${qualified} must not exist (${tableSchema} contract table "${table}")`
              ).toBe(0);
            }
          });
        }

        if (
          spec.checkConstraints?.length ||
          spec.foreignKeys?.length ||
          spec.legacyConstraints?.length
        ) {
          it("has expected CHECK and FOREIGN KEY constraints", async () => {
            const result = await db.execute(sql`
              SELECT c.conname AS "conName", c.contype AS "conType"
              FROM pg_constraint c
              JOIN pg_class rel ON rel.oid = c.conrelid
              JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
              WHERE nsp.nspname = ${tableSchema}
                AND rel.relname = ${table}
            `);

            const rows = result.rows as Array<{ conName: string; conType: string }>;
            const checkNames = new Set(rows.filter((r) => r.conType === "c").map((r) => r.conName));
            const fkNames = new Set(rows.filter((r) => r.conType === "f").map((r) => r.conName));
            const allNames = new Set(rows.map((r) => r.conName));

            for (const name of spec.checkConstraints ?? []) {
              expect(checkNames.has(name), `missing CHECK ${name}`).toBe(true);
            }
            for (const name of spec.foreignKeys ?? []) {
              expect(fkNames.has(name), `missing FK ${name}`).toBe(true);
            }
            for (const legacy of spec.legacyConstraints ?? []) {
              expect(allNames.has(legacy), `unexpected legacy constraint ${legacy}`).toBe(false);
            }
          });
        }

        if (spec.checkConstraints?.length) {
          it("CHECK constraints are validated (not NOT VALID)", async () => {
            const result = await db.execute(sql`
              SELECT c.conname conname, c.convalidated convalidated
              FROM pg_constraint c
              JOIN pg_class rel ON rel.oid = c.conrelid
              JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
              WHERE nsp.nspname = ${tableSchema}
                AND rel.relname = ${table}
                AND c.contype = 'c'
            `);

            const rows = result.rows as Array<{ conname: string; convalidated: boolean }>;
            const byName = new Map(rows.map((r) => [r.conname, r]));

            for (const name of spec.checkConstraints!) {
              const row = byName.get(name);
              expect(row, `CHECK ${name} on ${tableSchema}.${table}`).toBeDefined();
              expect(
                row!.convalidated,
                `CHECK ${name} must be validated (run VALIDATE CONSTRAINT or avoid NOT VALID)`
              ).toBe(true);
            }
          });
        }

        if (Object.keys(spec.columnDefaults ?? {}).length) {
          it("has expected column defaults (information_schema.column_default)", async () => {
            for (const [columnName, pattern] of Object.entries(spec.columnDefaults!)) {
              const result = await db.execute(sql`
                SELECT column_default AS "columnDefault"
                FROM information_schema.columns
                WHERE table_schema = ${tableSchema}
                  AND table_name = ${table}
                  AND column_name = ${columnName}
              `);

              const row = (result.rows as Array<{ columnDefault: string | null }>)[0];
              expect(row, `column ${table}.${columnName}`).toBeDefined();
              expect(
                row!.columnDefault,
                `expected non-null default for ${table}.${columnName}`
              ).toBeTruthy();

              const normalized = normalizeColumnDefault(row!.columnDefault!);
              expect(normalized, `${table}.${columnName} default`).toMatch(pattern);
            }
          });
        }

        if (
          Object.keys(spec.checkConstraintDefinitions ?? {}).length ||
          Object.keys(spec.foreignKeyDefinitions ?? {}).length
        ) {
          it("CHECK and FK definitions match expected semantics (pg_get_constraintdef)", async () => {
            const result = await db.execute(sql`
              SELECT
                c.conname AS "conName",
                c.contype AS "conType",
                pg_get_constraintdef(c.oid) AS "def"
              FROM pg_constraint c
              JOIN pg_class rel ON rel.oid = c.conrelid
              JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
              WHERE nsp.nspname = ${tableSchema}
                AND rel.relname = ${table}
                AND c.contype IN ('c', 'f')
            `);

            const byName = new Map(
              (result.rows as Array<{ conName: string; conType: string; def: string }>).map((r) => [
                r.conName,
                r,
              ])
            );

            for (const [name, pattern] of Object.entries(spec.checkConstraintDefinitions ?? {})) {
              const row = byName.get(name);
              expect(row, `missing constraint ${name} for definition check`).toBeDefined();
              expect(row!.conType).toBe("c");
              expect(row!.def, `CHECK ${name} definition`).toMatch(pattern);
            }

            for (const [name, pattern] of Object.entries(spec.foreignKeyDefinitions ?? {})) {
              const row = byName.get(name);
              expect(row, `missing constraint ${name} for definition check`).toBeDefined();
              expect(row!.conType).toBe("f");
              expect(row!.def, `FK ${name} definition`).toMatch(pattern);
            }
          });
        }
      });
    }
  });
}
