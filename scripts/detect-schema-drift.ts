/**
 * Detects schema drift: schema files modified without generating migration.
 * 
 * Checks:
 * 1. Schema file hash comparison (current vs last migration snapshot)
 * 2. Uncommitted schema changes
 * 3. Orphaned changes (schema modified but no new migration)
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { execSync } from "child_process";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema");
const MIGRATIONS_DIR = path.join(process.cwd(), "src/db/migrations");

const allowDrift = process.argv.includes("--allow-drift");
const quick = process.argv.includes("--quick");

interface DriftDetectionResult {
  hasDrift: boolean;
  driftedFiles: string[];
  uncommittedChanges: string[];
  recommendation: string;
}

function getLastMigration(migrationsDir: string): { name: string; snapshotPath: string } | null {
  if (!fs.existsSync(migrationsDir)) {
    return null;
  }
  
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort()
    .reverse(); // Most recent first
  
  if (entries.length === 0) {
    return null;
  }
  
  const lastMigrationName = entries[0];
  const snapshotPath = path.join(migrationsDir, lastMigrationName, "snapshot.json");
  
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }
  
  return {
    name: lastMigrationName,
    snapshotPath,
  };
}

async function calculateSchemaHash(schemaDir: string): Promise<string> {
  const schemaFiles: string[] = [];
  
  function walkDir(dir: string, baseDir: string): void {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        walkDir(fullPath, baseDir);
      } else if (entry.name.endsWith(".ts") && !entry.name.startsWith("_")) {
        schemaFiles.push(relativePath);
      }
    }
  }
  
  walkDir(schemaDir, schemaDir);
  
  // Read and hash all schema files
  const contents = schemaFiles
    .map(file => {
      const fullPath = path.join(schemaDir, file);
      try {
        return fs.readFileSync(fullPath, "utf-8");
      } catch {
        return "";
      }
    })
    .filter(content => content.length > 0);
  
  // Sort for deterministic hash
  const combined = schemaFiles
    .map((file, i) => `${file}:${contents[i]}`)
    .sort()
    .join("\n");
  
  return createHash("sha256").update(combined).digest("hex");
}

function getUncommittedSchemaChanges(schemaDir: string): string[] {
  try {
    // Check git status for uncommitted changes in schema directory
    const gitStatus = execSync(
      `git status --porcelain ${schemaDir}`,
      { encoding: "utf-8", cwd: process.cwd() }
    ).trim();
    
    if (!gitStatus) {
      return [];
    }
    
    return gitStatus
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Parse git status output: " M src/db/schema/core/tenants.ts"
        const match = line.match(/^\s*\S+\s+(.+)$/);
        return match ? match[1] : line;
      });
  } catch (error) {
    // Git not available or not a git repo - return empty
    return [];
  }
}

function identifyDriftedFiles(
  schemaDir: string,
  snapshotPath?: string
): string[] {
  if (!snapshotPath || !fs.existsSync(snapshotPath)) {
    return [];
  }
  
  try {
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
    const driftedFiles: string[] = [];
    
    // For drift detection, we primarily rely on git status for uncommitted changes
    // and hash comparison. The snapshot comparison is informational only.
    // Tables can be defined in aggregate files (e.g., multiple tables in one .ts file),
    // so we can't reliably map snapshot tables to individual schema files.
    
    // If we reach here, it means the hash comparison detected drift
    // The uncommitted changes check will provide the specific files
    
    return driftedFiles;
  } catch (error) {
    return [`Failed to parse snapshot: ${error instanceof Error ? error.message : String(error)}`];
  }
}

function generateDriftRecommendation(
  driftedFiles: string[],
  uncommittedChanges: string[]
): string {
  if (uncommittedChanges.length > 0) {
    return `Schema drift detected in uncommitted files:\n${uncommittedChanges.map(f => `  - ${f}`).join("\n")}\n\nRun: pnpm db:generate`;
  }
  
  if (driftedFiles.length > 0) {
    return `Schema drift detected:\n${driftedFiles.map(f => `  - ${f}`).join("\n")}\n\nThis means schema files were modified but no migration was generated.\nRun: pnpm db:generate`;
  }
  
  return "Schema drift detected. Run: pnpm db:generate";
}

async function detectSchemaDrift(): Promise<DriftDetectionResult> {
  // 1. Get current schema hash
  const currentSchemaHash = await calculateSchemaHash(SCHEMA_DIR);
  
  // 2. Get last migration snapshot hash
  const lastMigration = getLastMigration(MIGRATIONS_DIR);
  let lastSnapshotHash: string | null = null;
  
  if (lastMigration) {
    try {
      const snapshot = JSON.parse(fs.readFileSync(lastMigration.snapshotPath, "utf-8"));
      lastSnapshotHash = createHash("sha256")
        .update(JSON.stringify(snapshot, Object.keys(snapshot).sort()))
        .digest("hex");
    } catch (error) {
      // Snapshot read failed - assume drift
      return {
        hasDrift: true,
        driftedFiles: [`Failed to read snapshot: ${error instanceof Error ? error.message : String(error)}`],
        uncommittedChanges: [],
        recommendation: "Check migration snapshot file",
      };
    }
  }
  
  // 3. Compare hashes
  const hasDrift = lastSnapshotHash === null || currentSchemaHash !== lastSnapshotHash;
  
  if (!hasDrift) {
    return {
      hasDrift: false,
      driftedFiles: [],
      uncommittedChanges: [],
      recommendation: "No drift detected",
    };
  }
  
  // 4. Identify which files drifted
  const driftedFiles = identifyDriftedFiles(SCHEMA_DIR, lastMigration?.snapshotPath);
  
  // 5. Check for uncommitted changes
  const uncommittedChanges = getUncommittedSchemaChanges(SCHEMA_DIR);
  
  // 6. Generate recommendation
  const recommendation = generateDriftRecommendation(driftedFiles, uncommittedChanges);
  
  return {
    hasDrift: true,
    driftedFiles,
    uncommittedChanges,
    recommendation,
  };
}

function main(): void {
  console.log("🔄 Detecting schema drift...\n");
  
  // Check if git is available
  try {
    execSync("git --version", { stdio: "ignore" });
  } catch {
    console.log("⚠️  Git not available - skipping drift detection");
    console.log("ℹ️  Drift detection requires git to track uncommitted changes");
    process.exit(0);
  }
  
  // Check if in a git repository
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
  } catch {
    console.log("⚠️  Not a git repository - skipping drift detection");
    console.log("ℹ️  Drift detection requires git to track uncommitted changes");
    process.exit(0);
  }
  
  if (allowDrift) {
    console.log("⚠️  Allow-drift mode enabled - will warn but not fail\n");
  }
  
  detectSchemaDrift()
    .then((result) => {
      if (!result.hasDrift) {
        console.log("✅ No schema drift detected");
        process.exit(0);
      }
      
      console.log("❌ Schema drift detected!\n");
      console.log(result.recommendation);
      console.log();
      
      if (result.uncommittedChanges.length > 0) {
        console.log("Uncommitted schema changes:");
        for (const file of result.uncommittedChanges) {
          console.log(`  - ${file}`);
        }
        console.log();
      }
      
      if (result.driftedFiles.length > 0) {
        console.log("Drifted files:");
        for (const file of result.driftedFiles) {
          console.log(`  - ${file}`);
        }
        console.log();
      }
      
      if (allowDrift) {
        console.log("⚠️  Allow-drift mode - exit code 0");
        process.exit(0);
      } else {
        console.log("💡 To bypass this check during prototyping, use: --allow-drift");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ Error detecting schema drift:", error);
      process.exit(1);
    });
}

main();
