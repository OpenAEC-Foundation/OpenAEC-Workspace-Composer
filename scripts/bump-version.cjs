#!/usr/bin/env node
/**
 * Bump version across package.json, tauri.conf.json, and Cargo.toml
 * Usage: node scripts/bump-version.js [major|minor|patch|<version>]
 */

const fs = require("fs");
const path = require("path");

const arg = process.argv[2] || "patch";

// Read current version from package.json
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const current = pkg.version;

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
    default: return type; // explicit version string
  }
}

const next = bumpVersion(current, arg);
console.log(`Bumping version: ${current} -> ${next}`);

// 1. package.json
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("  Updated package.json");

// 2. tauri.conf.json
const tauriPath = path.join(__dirname, "..", "src-tauri", "tauri.conf.json");
const tauri = JSON.parse(fs.readFileSync(tauriPath, "utf8"));
tauri.version = next;
fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + "\n");
console.log("  Updated tauri.conf.json");

// 3. Cargo.toml
const cargoPath = path.join(__dirname, "..", "src-tauri", "Cargo.toml");
let cargo = fs.readFileSync(cargoPath, "utf8");
cargo = cargo.replace(/^version\s*=\s*"[^"]*"/m, `version = "${next}"`);
fs.writeFileSync(cargoPath, cargo);
console.log("  Updated Cargo.toml");

console.log(`\nVersion ${next} set. To release:\n  git tag v${next} && git push --tags`);
