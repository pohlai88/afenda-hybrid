/**
 * Detects schema drift: schema files modified without generating migration.
 * 
 * Uses drizzle-kit check to detect drift between schema and migrations.
 * Also checks for uncommitted schema changes via git.
 */

import * as path from "path";
import { execSync } from "child_process";

const SCHEMA_DIR = path.join(process.cwd(), "src/db/schema-platform");

const allowDrift = process.argv.includes("--allow-drift");

interface DriftDetectionResult {
  hasDrift: boolean;
  uncommittedChanges: string[];
  drizzleKitOutput: string;
  recommendation: string;
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
        // Parse git status output: " M src/db/schema-platform/core/tenants.ts"
        const match = line.match(/^\s*\S+\s+(.+)$/);
        return match ? match[1] : line;
      });
  } catch {
    // Git not available or not a git repo - return empty
    return [];
  }
}

function runDrizzleKitCheck(): { hasDrift: boolean; output: string } {
  try {
    // Run drizzle-kit check - it exits 0 if no drift, non-zero if drift detected
    const output = execSync("pnpm drizzle-kit check", {
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: "pipe",
    });
    
    return {
      hasDrift: false,
      output: output.trim(),
    };
  } catch (error) {
    // drizzle-kit check exits non-zero when drift is detected
    const output = error instanceof Error && "stdout" in error 
      ? String(error.stdout) 
      : String(error);
    
    return {
      hasDrift: true,
      output: output.trim(),
    };
  }
}

function generateDriftRecommendation(
  uncommittedChanges: string[]
): string {
  if (uncommittedChanges.length > 0) {
    return `Schema drift detected in uncommitted files:\n${uncommittedChanges.map(f => `  - ${f}`).join("\n")}\n\nRun: pnpm db:generate`;
  }
  
  return "Schema drift detected. Run: pnpm db:generate";
}

async function detectSchemaDrift(): Promise<DriftDetectionResult> {
  // 1. Run drizzle-kit check to detect drift
  const drizzleCheck = runDrizzleKitCheck();
  
  // 2. Check for uncommitted changes
  const uncommittedChanges = getUncommittedSchemaChanges(SCHEMA_DIR);
  
  if (!drizzleCheck.hasDrift) {
    return {
      hasDrift: false,
      uncommittedChanges: [],
      drizzleKitOutput: drizzleCheck.output,
      recommendation: "No drift detected",
    };
  }
  
  // 3. Generate recommendation
  const recommendation = generateDriftRecommendation(uncommittedChanges);
  
  return {
    hasDrift: true,
    uncommittedChanges,
    drizzleKitOutput: drizzleCheck.output,
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
        console.log();
        if (result.drizzleKitOutput) {
          console.log("Drizzle Kit output:");
          console.log(result.drizzleKitOutput);
        }
        process.exit(0);
      }
      
      console.log("❌ Schema drift detected!\n");
      console.log(result.recommendation);
      console.log();
      
      if (result.drizzleKitOutput) {
        console.log("Drizzle Kit output:");
        console.log(result.drizzleKitOutput);
        console.log();
      }
      
      if (result.uncommittedChanges.length > 0) {
        console.log("Uncommitted schema changes:");
        for (const file of result.uncommittedChanges) {
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
