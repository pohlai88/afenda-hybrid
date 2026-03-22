/**
 * Architecture Documentation Layout Checker
 *
 * Enforces docs/architecture/ structure:
 * - Required files exist (00-overview.md, 01-db-first-guideline.md, adr/README.md)
 * - Only .md files and adr/ subdirectory under docs/architecture/
 * - Every ADR file is referenced in adr/README.md
 *
 * Exits with code 1 if any violations found.
 *
 * @see docs/CI_GATES.md
 * @see CONTRIBUTING.md
 */

import * as fs from "fs";
import * as path from "path";

function repoRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        "pnpm-workspace.yaml not found. Run this script from packages/db or repo root."
      );
    }
    dir = parent;
  }
}

const ARCH = "docs/architecture";
const ADR = "docs/architecture/adr";

const REQUIRED = [
  `${ARCH}/00-overview.md`,
  `${ARCH}/01-db-first-guideline.md`,
  `${ADR}/README.md`,
] as const;

function main(): void {
  console.log("🔍 Checking architecture documentation layout...\n");

  const root = repoRoot();
  const errors: string[] = [];

  for (const rel of REQUIRED) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      errors.push(`❌ Missing required file: ${rel}`);
    }
  }

  const archAbs = path.join(root, ARCH);
  if (!fs.existsSync(archAbs)) {
    errors.push(`❌ Missing directory: ${ARCH}`);
  } else {
    for (const name of fs.readdirSync(archAbs, { withFileTypes: true })) {
      if (name.name === "adr") continue;

      if (name.isDirectory()) {
        errors.push(
          `❌ Disallowed directory under ${ARCH}/: ${name.name}\n` +
            `   (Add to allowlist in check-architecture-docs.ts if intentional)`
        );
      } else if (name.isFile() && !name.name.endsWith(".md")) {
        errors.push(`❌ Non-markdown file under ${ARCH}/: ${name.name}`);
      }
    }
  }

  const adrAbs = path.join(root, ADR);
  if (!fs.existsSync(adrAbs)) {
    errors.push(`❌ Missing directory: ${ADR}`);
  } else {
    const adrReadmePath = path.join(adrAbs, "README.md");
    if (!fs.existsSync(adrReadmePath)) {
      errors.push(`❌ Missing ${ADR}/README.md`);
    } else {
      const adrReadme = fs.readFileSync(adrReadmePath, "utf-8");

      for (const name of fs.readdirSync(adrAbs)) {
        if (name === "README.md" || !name.endsWith(".md")) continue;

        if (!adrReadme.includes(name)) {
          errors.push(
            `❌ ADR ${name} not referenced in ${ADR}/README.md\n` +
              `   Add a link or mention in the index table`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("❌ Architecture documentation violations:\n");
    console.error(errors.join("\n"));
    console.error(`\n💡 See CONTRIBUTING.md for architecture docs rules\n`);
    process.exit(1);
  }

  console.log("✅ Architecture documentation layout OK\n");
}

main();
