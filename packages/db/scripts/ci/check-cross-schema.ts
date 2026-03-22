/**
 * Cross-Schema Dependency Checker
 *
 * Validates that cross-schema foreign key references:
 * - Follow the schema dependency hierarchy (Tier 1 -> Tier 2 -> Tier 3)
 * - Are properly documented
 * - Don't create circular dependencies
 * - Reference stable tables only
 *
 * Schema Tiers:
 * - Tier 1 (Foundation): core, security
 * - Tier 2 (Operational): audit, observability
 * - Tier 3 (Domain): hr, finance, projects, etc.
 *
 * @see docs/CI_GATES.md
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSchema, SchemaInfo, TableInfo } from "../lib/schema-analyzer";

const SCHEMA_DIR = path.join(process.cwd(), "src/schema-platform");
const EXCEPTIONS_PATH = path.join(process.cwd(), "scripts/config/cross-schema-exceptions.json");
const strictWarnings =
  process.argv.includes("--strict-warnings") || process.env.CI_STRICT_WARNINGS === "1";

interface CrossSchemaException {
  sourceSchema: string;
  sourceTable: string;
  targetSchema: string;
  targetTable: string;
  rule: string;
  reason: string;
  owner?: string;
  date?: string;
}

interface CrossSchemaExceptionsConfig {
  exceptions: CrossSchemaException[];
}

function loadExceptions(): CrossSchemaException[] {
  if (!fs.existsSync(EXCEPTIONS_PATH)) {
    return [];
  }
  try {
    const content = fs.readFileSync(EXCEPTIONS_PATH, "utf-8");
    const config = JSON.parse(content) as CrossSchemaExceptionsConfig;
    return config.exceptions || [];
  } catch {
    return [];
  }
}

function isExcepted(
  exceptions: CrossSchemaException[],
  ref: CrossSchemaRef,
  rule: string
): boolean {
  return exceptions.some(
    (e) =>
      e.sourceSchema === ref.sourceSchema &&
      e.sourceTable === ref.sourceTable &&
      e.targetSchema === ref.targetSchema &&
      e.targetTable === ref.targetTable &&
      e.rule === rule
  );
}

const exceptions = loadExceptions();

// Schema tier definitions
const SCHEMA_TIERS: Record<string, number> = {
  core: 1,
  security: 1,
  audit: 2,
  observability: 2,
  hr: 3,
  finance: 3,
  projects: 3,
  inventory: 3,
  sales: 3,
};

interface CrossSchemaIssue {
  file: string;
  line: number;
  sourceSchema: string;
  sourceTable: string;
  targetSchema: string;
  targetTable: string;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
}

interface CrossSchemaRef {
  sourceSchema: string;
  sourceTable: string;
  targetSchema: string;
  targetTable: string;
  column: string;
  file: string;
  line: number;
}

const issues: CrossSchemaIssue[] = [];
const crossSchemaRefs: CrossSchemaRef[] = [];

function extractCrossSchemaRefs(table: TableInfo, schema: SchemaInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");

  // Find imports from other schemas
  const importRegex = /from\s+["']\.\.\/(\w+)\/(\w+)["']/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const targetSchema = match[1];

    if (targetSchema !== schema.name && targetSchema !== "_shared") {
      // Find which table is being referenced
      const lineNum = content.substring(0, match.index).split("\n").length;

      // Look for references to this import in the table definition
      const tableDefStart = content.indexOf(".table(");
      if (tableDefStart > -1) {
        const tableDefEnd = content.indexOf("});", tableDefStart);
        const tableDef = content.substring(tableDefStart, tableDefEnd);

        // Check for FK references
        const refRegex = new RegExp(`\\.references\\(\\s*\\(\\)\\s*=>\\s*(\\w+)\\.(\\w+)`, "g");
        let refMatch;

        while ((refMatch = refRegex.exec(tableDef)) !== null) {
          const refTable = refMatch[1];
          const refColumn = refMatch[2];

          // Check if this reference is to the imported schema
          if (
            content.includes(`import { ${refTable}`) &&
            content.includes(`from "../${targetSchema}/`)
          ) {
            crossSchemaRefs.push({
              sourceSchema: schema.name,
              sourceTable: table.name,
              targetSchema,
              targetTable: refTable,
              column: refColumn,
              file: table.relativePath,
              line: lineNum,
            });
          }
        }

        // Check for foreignKey() definitions
        const fkRegex = /foreignKey\(\{[^}]*foreignColumns:\s*\[([^\]]+)\]/g;
        while ((refMatch = fkRegex.exec(tableDef)) !== null) {
          const foreignCols = refMatch[1];

          // Extract table name from foreign column reference
          const tableMatch = foreignCols.match(/(\w+)\.(\w+)/);
          if (tableMatch) {
            const refTable = tableMatch[1];

            if (
              content.includes(`import { ${refTable}`) &&
              content.includes(`from "../${targetSchema}/`)
            ) {
              crossSchemaRefs.push({
                sourceSchema: schema.name,
                sourceTable: table.name,
                targetSchema,
                targetTable: refTable,
                column: tableMatch[2],
                file: table.relativePath,
                line: content.substring(0, refMatch.index).split("\n").length,
              });
            }
          }
        }
      }
    }
  }
}

function checkTierHierarchy(): void {
  for (const ref of crossSchemaRefs) {
    const sourceTier = SCHEMA_TIERS[ref.sourceSchema] || 3;
    const targetTier = SCHEMA_TIERS[ref.targetSchema] || 3;

    // Higher tier should not reference lower tier (except for audit which can reference anything)
    if (sourceTier < targetTier && ref.sourceSchema !== "audit") {
      issues.push({
        file: ref.file,
        line: ref.line,
        sourceSchema: ref.sourceSchema,
        sourceTable: ref.sourceTable,
        targetSchema: ref.targetSchema,
        targetTable: ref.targetTable,
        rule: "tier-hierarchy",
        message: `Tier ${sourceTier} schema "${ref.sourceSchema}" references Tier ${targetTier} schema "${ref.targetSchema}"`,
        severity: "error",
        suggestion:
          "Lower tier schemas should not depend on higher tier schemas. Consider moving the referenced table to a lower tier or restructuring the relationship.",
      });
    }

    // Same tier cross-references should be documented (unless excepted)
    if (sourceTier === targetTier && ref.sourceSchema !== ref.targetSchema) {
      if (!isExcepted(exceptions, ref, "same-tier-reference")) {
        issues.push({
          file: ref.file,
          line: ref.line,
          sourceSchema: ref.sourceSchema,
          sourceTable: ref.sourceTable,
          targetSchema: ref.targetSchema,
          targetTable: ref.targetTable,
          rule: "same-tier-reference",
          message: `Same-tier cross-schema reference from "${ref.sourceSchema}.${ref.sourceTable}" to "${ref.targetSchema}.${ref.targetTable}"`,
          severity: "info",
          suggestion: "Document this cross-schema dependency in the schema README or _relations.ts",
        });
      }
    }
  }
}

function checkCircularDependencies(): void {
  // Build dependency graph
  const graph: Map<string, Set<string>> = new Map();

  for (const ref of crossSchemaRefs) {
    const source = ref.sourceSchema;
    const target = ref.targetSchema;

    if (!graph.has(source)) {
      graph.set(source, new Set());
    }
    graph.get(source)!.add(target);
  }

  // DFS to find cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cyclePath: string[] = [];

  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    cyclePath.push(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        cyclePath.push(neighbor);
        return true;
      }
    }

    recursionStack.delete(node);
    cyclePath.pop();
    return false;
  }

  for (const node of graph.keys()) {
    visited.clear();
    recursionStack.clear();
    cyclePath.length = 0;

    if (hasCycle(node)) {
      const cycleStart = cyclePath.indexOf(cyclePath[cyclePath.length - 1]);
      const cycle = cyclePath.slice(cycleStart);

      // Check if this circular dependency is excepted
      const isCircularExcepted = exceptions.some(
        (e) =>
          e.rule === "circular-dependency" &&
          e.sourceSchema === cycle[0] &&
          e.targetSchema === cycle[cycle.length - 1]
      );

      if (!isCircularExcepted) {
        issues.push({
          file: "src/schema-platform/",
          line: 1,
          sourceSchema: cycle[0],
          sourceTable: "",
          targetSchema: cycle[cycle.length - 1],
          targetTable: "",
          rule: "circular-dependency",
          message: `Circular schema dependency detected: ${cycle.join(" -> ")}`,
          severity: "error",
          suggestion:
            "Break the circular dependency by moving shared types to a common schema or using a different relationship pattern",
        });
      }
      break;
    }
  }
}

function checkStableReferences(): void {
  // Tables that are considered stable and safe to reference
  const stableTables = new Set([
    "tenants",
    "users",
    "roles",
    "regions",
    "organizations",
    "locations",
  ]);

  for (const ref of crossSchemaRefs) {
    // Only check references from domain schemas to core/security
    const sourceTier = SCHEMA_TIERS[ref.sourceSchema] || 3;
    const targetTier = SCHEMA_TIERS[ref.targetSchema] || 3;

    if (sourceTier > 1 && targetTier <= 1) {
      if (!stableTables.has(ref.targetTable)) {
        issues.push({
          file: ref.file,
          line: ref.line,
          sourceSchema: ref.sourceSchema,
          sourceTable: ref.sourceTable,
          targetSchema: ref.targetSchema,
          targetTable: ref.targetTable,
          rule: "unstable-reference",
          message: `Reference to potentially unstable table "${ref.targetSchema}.${ref.targetTable}"`,
          severity: "warning",
          suggestion: `Consider if "${ref.targetTable}" is stable enough for cross-schema references. Add to stable tables list if intentional.`,
        });
      }
    }
  }
}

function checkReferenceDocumentation(): void {
  for (const ref of crossSchemaRefs) {
    const content = fs.readFileSync(path.join(process.cwd(), ref.file), "utf-8");

    // Check for comment explaining the cross-schema reference
    const lines = content.split("\n");
    const refLine = ref.line - 1;

    let hasComment = false;

    // Check the same line first (inline comment)
    const currentLine = lines[refLine]?.trim() || "";
    if (
      currentLine.includes("//") &&
      (currentLine.includes("cross-schema") ||
        currentLine.includes("FK to") ||
        currentLine.includes("references"))
    ) {
      hasComment = true;
    }

    // Check lines before the reference (up to 5 lines)
    if (!hasComment) {
      for (let i = refLine - 1; i >= 0 && i >= refLine - 5; i--) {
        const line = lines[i].trim();
        if (
          line.includes("//") &&
          (line.includes("cross-schema") || line.includes("FK to") || line.includes("references"))
        ) {
          hasComment = true;
          break;
        }
        if (line.startsWith("/**") || line.includes("*/")) {
          hasComment = true;
          break;
        }
      }
    }

    if (!hasComment && ref.sourceSchema !== ref.targetSchema) {
      if (!isExcepted(exceptions, ref, "undocumented-cross-ref")) {
        issues.push({
          file: ref.file,
          line: ref.line,
          sourceSchema: ref.sourceSchema,
          sourceTable: ref.sourceTable,
          targetSchema: ref.targetSchema,
          targetTable: ref.targetTable,
          rule: "undocumented-cross-ref",
          message: `Cross-schema reference to "${ref.targetSchema}.${ref.targetTable}" is not documented`,
          severity: "info",
          suggestion: `Add comment: // FK to ${ref.targetSchema}.${ref.targetTable} - <reason>`,
        });
      }
    }
  }
}

function printDependencyGraph(): void {
  console.log("\n📊 Schema Dependency Graph:\n");

  // Group refs by source schema
  const bySource: Map<string, Map<string, string[]>> = new Map();

  for (const ref of crossSchemaRefs) {
    if (!bySource.has(ref.sourceSchema)) {
      bySource.set(ref.sourceSchema, new Map());
    }
    const targets = bySource.get(ref.sourceSchema)!;
    if (!targets.has(ref.targetSchema)) {
      targets.set(ref.targetSchema, []);
    }
    targets.get(ref.targetSchema)!.push(`${ref.sourceTable}.${ref.column} -> ${ref.targetTable}`);
  }

  for (const [source, targets] of bySource) {
    const tier = SCHEMA_TIERS[source] || 3;
    console.log(`${source} (Tier ${tier}):`);
    for (const [target, refs] of targets) {
      const targetTier = SCHEMA_TIERS[target] || 3;
      console.log(`  -> ${target} (Tier ${targetTier})`);
      for (const ref of refs) {
        console.log(`     - ${ref}`);
      }
    }
    console.log();
  }
}

function main(): void {
  console.log("🔍 Cross-Schema Dependency Check\n");

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.log("No schema directory found");
    process.exit(0);
  }

  const schemas = analyzeSchema(SCHEMA_DIR);

  // Extract cross-schema references
  for (const schema of schemas) {
    for (const table of schema.tables) {
      extractCrossSchemaRefs(table, schema);
    }
  }

  console.log(`Found ${crossSchemaRefs.length} cross-schema reference(s)\n`);

  if (crossSchemaRefs.length > 0) {
    printDependencyGraph();
  }

  // Run checks
  checkTierHierarchy();
  checkCircularDependencies();
  checkStableReferences();
  checkReferenceDocumentation();

  // Report results
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  if (issues.length === 0) {
    console.log("✅ All cross-schema dependency checks passed!\n");
    process.exit(0);
  }

  // Group by rule
  const byRule = issues.reduce(
    (acc, issue) => {
      if (!acc[issue.rule]) acc[issue.rule] = [];
      acc[issue.rule].push(issue);
      return acc;
    },
    {} as Record<string, CrossSchemaIssue[]>
  );

  console.log("Issues found:\n");

  for (const [rule, ruleIssues] of Object.entries(byRule)) {
    console.log(`=== ${rule} ===\n`);

    for (const issue of ruleIssues) {
      const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`${icon} ${issue.file}:${issue.line}`);
      console.log(
        `   ${issue.sourceSchema}.${issue.sourceTable} -> ${issue.targetSchema}.${issue.targetTable}`
      );
      console.log(`   ${issue.message}`);
      console.log(`   💡 ${issue.suggestion}`);
      console.log();
    }
  }

  console.log("─".repeat(60));
  console.log(
    `\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info(s)\n`
  );

  if (errors.length > 0 || (strictWarnings && warnings.length > 0)) {
    if (strictWarnings && warnings.length > 0 && errors.length === 0) {
      console.log("\n❌ Strict mode: warnings are treated as failures");
    }
    process.exit(1);
  }
}

main();
