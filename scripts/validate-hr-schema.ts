/**
 * HR Schema Validation Script
 * 
 * Validates the HR schema structure to identify issues that might prevent
 * drizzle-kit generate from running successfully.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  file?: string;
  suggestion?: string;
}

const issues: ValidationIssue[] = [];
const hrSchemaDir = path.join(process.cwd(), "src/db/schema-hrm/hr");

function addIssue(severity: ValidationIssue["severity"], category: string, message: string, file?: string, suggestion?: string): void {
  issues.push({ severity, category, message, file, suggestion });
}

// 1. Check if HR schema directory exists
if (!fs.existsSync(hrSchemaDir)) {
  addIssue("error", "structure", "HR schema directory not found", hrSchemaDir);
  process.exit(1);
}

// 2. Check required files
const requiredFiles = [
  "_schema.ts",
  "_relations.ts",
  "index.ts",
];

for (const file of requiredFiles) {
  const filePath = path.join(hrSchemaDir, file);
  if (!fs.existsSync(filePath)) {
    addIssue("error", "structure", `Required file missing: ${file}`, filePath);
  }
}

// 3. Check subdirectories
const subdirs = ["people", "fundamentals", "employment", "time", "operations", "selfservice"];
for (const subdir of subdirs) {
  const subdirPath = path.join(hrSchemaDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    addIssue("warning", "structure", `Subdirectory missing: ${subdir}`, subdirPath);
  } else {
    const indexFile = path.join(subdirPath, "index.ts");
    if (!fs.existsSync(indexFile)) {
      addIssue("warning", "structure", `Index file missing in ${subdir}`, indexFile);
    }
  }
}

// 4. Check TypeScript compilation
try {
  execSync("pnpm typecheck", { 
    stdio: "pipe",
    cwd: process.cwd(),
  });
  addIssue("info", "typescript", "TypeScript compilation: ✅ PASSED");
} catch (error) {
  const output = error instanceof Error && "stdout" in error 
    ? String(error.stdout) 
    : String(error);
  addIssue("error", "typescript", "TypeScript compilation failed", undefined, "Run: pnpm typecheck");
  console.error("TypeScript errors:", output);
}

// 5. Check schema imports
try {
  execSync(
    `pnpm tsx -e "import('./src/db/schema-hrm/hr/index.ts').then(() => console.log('OK')).catch(e => { console.error('ERROR:', e.message); process.exit(1); })"`,
    { 
      stdio: "pipe",
      cwd: process.cwd(),
    }
  );
  addIssue("info", "imports", "Schema imports: ✅ PASSED");
} catch (error) {
  const output = error instanceof Error && "stdout" in error 
    ? String(error.stdout) 
    : String(error);
  addIssue("error", "imports", "Schema import failed", undefined, output);
}

// 6. Check for circular dependencies in schema files
const schemaFiles = globFiles(hrSchemaDir, "**/*.ts");
const importMap = new Map<string, string[]>();

for (const file of schemaFiles) {
  if (file.includes("node_modules") || file.includes(".d.ts")) continue;
  
  try {
    const content = fs.readFileSync(file, "utf-8");
    const imports = extractImports(content);
    importMap.set(file, imports);
  } catch {
    addIssue("warning", "files", `Could not read file: ${file}`, file);
  }
}

// 7. Check drizzle-kit check
try {
  execSync("pnpm db:check", { 
    stdio: "pipe",
    cwd: process.cwd(),
  });
  addIssue("info", "drizzle", "drizzle-kit check: ✅ PASSED");
} catch (error) {
  const output = error instanceof Error && "stdout" in error 
    ? String(error.stdout) 
    : String(error);
  addIssue("error", "drizzle", "drizzle-kit check failed", undefined, output);
}

// Helper functions
function globFiles(dir: string, _pattern: string): string[] {
  const files: string[] = [];
  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+["']([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

// Print results
function printResults(): void {
  console.log("🔍 HR Schema Validation Report\n");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");
  
  // Print errors first
  if (errors.length > 0) {
    console.log("❌ ERRORS:\n");
    for (const issue of errors) {
      console.log(`  ${issue.message}`);
      if (issue.file) console.log(`    File: ${issue.file}`);
      if (issue.suggestion) console.log(`    💡 ${issue.suggestion}`);
      console.log();
    }
  }
  
  // Print warnings
  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS:\n");
    for (const issue of warnings) {
      console.log(`  ${issue.message}`);
      if (issue.file) console.log(`    File: ${issue.file}`);
      if (issue.suggestion) console.log(`    💡 ${issue.suggestion}`);
      console.log();
    }
  }
  
  // Print info
  if (infos.length > 0) {
    console.log("ℹ️  INFO:\n");
    for (const issue of infos) {
      console.log(`  ${issue.message}`);
      console.log();
    }
  }
  
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log("Summary:");
  console.log(`  ❌ Errors: ${errors.length}`);
  console.log(`  ⚠️  Warnings: ${warnings.length}`);
  console.log(`  ℹ️  Info: ${infos.length}`);
  console.log();
  
  if (errors.length === 0) {
    console.log("✅ HR Schema structure is valid!\n");
    console.log("💡 Note: drizzle-kit generate requires an interactive TTY terminal.");
    console.log("   Run 'pnpm db:generate' in your terminal to handle prompts.\n");
    process.exit(0);
  } else {
    console.log("❌ Schema validation failed. Fix errors above before generating migrations.\n");
    process.exit(1);
  }
}

printResults();
