#!/usr/bin/env node
/**
 * Ensures cargo is in PATH, then runs: tauri <args>
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

const isWin = platform() === "win32";
const home = homedir();
const cargoDir = join(home, ".cargo", "bin");
const sep = isWin ? ";" : ":";

// Auto-fix PATH if needed
try {
  execSync("cargo --version", { stdio: "ignore", timeout: 5000 });
} catch {
  if (existsSync(join(cargoDir, isWin ? "cargo.exe" : "cargo"))) {
    process.env.PATH = cargoDir + sep + process.env.PATH;
    console.log(`[ensure-path] Added ${cargoDir} to PATH`);
  } else {
    console.error("cargo not found! Install Rust: https://rustup.rs");
    process.exit(1);
  }
}

// Run tauri via execSync so shell handles everything
const args = process.argv.slice(2).join(" ");
try {
  execSync(`npx tauri ${args}`, { stdio: "inherit", env: process.env });
} catch (e) {
  process.exit(e.status ?? 1);
}
