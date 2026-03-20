#!/usr/bin/env node
/**
 * Prerequisites checker for OpenAEC Workspace Composer development.
 * Verifies required tools are installed and in PATH.
 * Also attempts to fix PATH issues automatically.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

const quiet = process.argv.includes("--quiet");
const isWin = platform() === "win32";
const home = homedir();

const checks = [
  {
    name: "Node.js",
    cmd: "node --version",
    required: true,
    fix: null,
  },
  {
    name: "Rust (cargo)",
    cmd: "cargo --version",
    required: true,
    pathFix: join(home, ".cargo", "bin"),
    installHint: "Install Rust: https://rustup.rs",
  },
  {
    name: "Git",
    cmd: "git --version",
    required: true,
    installHint: "Install Git: https://git-scm.com",
  },
];

let allOk = true;
let pathFixed = false;

for (const check of checks) {
  try {
    const version = execSync(check.cmd, { encoding: "utf-8", timeout: 10000 }).trim();
    if (!quiet) console.log(`  ✓ ${check.name}: ${version}`);
  } catch {
    // Try PATH fix before failing
    if (check.pathFix && existsSync(check.pathFix)) {
      const sep = isWin ? ";" : ":";
      process.env.PATH = check.pathFix + sep + process.env.PATH;
      try {
        const version = execSync(check.cmd, { encoding: "utf-8", timeout: 10000 }).trim();
        if (!quiet) console.log(`  ✓ ${check.name}: ${version} (PATH auto-fixed)`);
        pathFixed = true;
        continue;
      } catch {
        // Still failed after PATH fix
      }
    }

    if (check.required) {
      console.error(`  ✗ ${check.name}: NOT FOUND`);
      if (check.installHint) console.error(`    → ${check.installHint}`);
      if (check.pathFix) {
        console.error(`    → Expected at: ${check.pathFix}`);
        if (isWin) {
          console.error(`    → Fix: add to PATH in PowerShell:`);
          console.error(`      $env:Path += ";${check.pathFix}"`);
        }
      }
      allOk = false;
    }
  }
}

if (pathFixed && isWin) {
  // Propagate the fixed PATH to child processes (like tauri CLI)
  // This makes `npm run tauri dev` work even if cargo isn't in system PATH
}

if (!allOk) {
  console.error("\nPrerequisites check failed. Install missing tools and try again.");
  process.exit(1);
}

if (!quiet) console.log("\nAll prerequisites OK.");
