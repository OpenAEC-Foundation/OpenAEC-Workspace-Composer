# tauri-errors-build: Build Anti-Patterns

These are confirmed build configuration mistakes. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources: vooronderzoek-tauri.md sections 6, 7, 10.1, 10.4, 10.6

---

## BAP-001: Installing webkit2gtk 4.0 Instead of 4.1

**WHY this is wrong**: Tauri 2 requires `webkit2gtk-4.1`. The 4.0 version is for Tauri v1. Installing the wrong version causes "package not found" errors that appear to be unresolved even after installation.

```bash
# WRONG -- Tauri v1 dependency
sudo apt-get install libwebkit2gtk-4.0-dev

# CORRECT -- Tauri v2 dependency
sudo apt-get install libwebkit2gtk-4.1-dev
```

ALWAYS install `libwebkit2gtk-4.1-dev` for Tauri 2 projects. NEVER use the 4.0 variant.

---

## BAP-002: Not Committing Cargo.lock

**WHY this is wrong**: Without `Cargo.lock`, different build environments may resolve different dependency versions, causing non-deterministic builds and phantom failures.

```gitignore
# WRONG -- in .gitignore
Cargo.lock

# CORRECT -- Cargo.lock should NOT be in .gitignore for applications
# Only ignore target/
src-tauri/target/
```

ALWAYS commit `src-tauri/Cargo.lock`. NEVER add it to `.gitignore`.

---

## BAP-003: Missing beforeBuildCommand

**WHY this is wrong**: Without `beforeBuildCommand`, the frontend assets are not compiled before Tauri bundles. The bundler packages stale or missing files.

```json
// WRONG -- no frontend build step
{
  "build": {
    "frontendDist": "../dist"
  }
}

// CORRECT
{
  "build": {
    "frontendDist": "../dist",
    "beforeBuildCommand": "npm run build"
  }
}
```

ALWAYS set `beforeBuildCommand` to your frontend build script.

---

## BAP-004: Using devUrl Without beforeDevCommand

**WHY this is wrong**: The dev server does not start automatically. `tauri dev` connects to `devUrl` but finds nothing running, causing a blank window or connection errors.

```json
// WRONG
{
  "build": {
    "devUrl": "http://localhost:5173"
  }
}

// CORRECT
{
  "build": {
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev"
  }
}
```

ALWAYS pair `devUrl` with `beforeDevCommand`.

---

## BAP-005: Non-Unique Application Identifier

**WHY this is wrong**: The `identifier` is used for file paths, registry keys, and system integration. A generic or duplicate identifier causes conflicts with other apps.

```json
// WRONG
{
  "identifier": "tauri-app"
}

// WRONG
{
  "identifier": "com.example.app"
}

// CORRECT -- unique reverse domain
{
  "identifier": "com.yourcompany.yourapp"
}
```

ALWAYS use a unique reverse-domain identifier with your actual domain.

---

## BAP-006: Setting createUpdaterArtifacts Without Signing Key

**WHY this is wrong**: The build process requires `TAURI_SIGNING_PRIVATE_KEY` to create signed update artifacts. Without it, the build fails.

```json
// WRONG -- if TAURI_SIGNING_PRIVATE_KEY is not set
{
  "bundle": {
    "createUpdaterArtifacts": true
  }
}
```

ALWAYS ensure `TAURI_SIGNING_PRIVATE_KEY` is set when `createUpdaterArtifacts` is `true`. In development, set it to `false`.

---

## BAP-007: Using v1Compatible for New Projects

**WHY this is wrong**: The `"v1Compatible"` option generates legacy-format update artifacts. It is only needed when migrating from Tauri v1 and existing users need backward-compatible updates.

```json
// WRONG -- for new projects
{
  "bundle": {
    "createUpdaterArtifacts": "v1Compatible"
  }
}

// CORRECT -- for new projects
{
  "bundle": {
    "createUpdaterArtifacts": true
  }
}
```

NEVER use `"v1Compatible"` for new Tauri 2 projects.

---

## BAP-008: Not Signing macOS Builds for Distribution

**WHY this is wrong**: Unsigned macOS apps are quarantined by Gatekeeper. Users cannot open them without manual right-click > Open override, and even that may not work on newer macOS versions.

```json
// WRONG -- no signing for distributed app
{
  "bundle": {
    "macOS": {}
  }
}

// CORRECT -- minimum for testing
{
  "bundle": {
    "macOS": {
      "signingIdentity": "-"
    }
  }
}

// CORRECT -- for distribution
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Name (TEAMID)",
      "hardenedRuntime": true
    }
  }
}
```

ALWAYS sign macOS builds. Use ad-hoc (`"-"`) for testing, Developer ID for distribution.

---

## BAP-009: Losing the Updater Private Key

**WHY this is wrong**: Once the updater private key is lost, you cannot sign new updates that existing installations will accept. All deployed copies become unable to update.

ALWAYS back up the updater private key securely. Store it in a secrets manager or encrypted vault, not in the repository.

---

## BAP-010: Missing GitHub Token Permissions in CI

**WHY this is wrong**: `tauri-apps/tauri-action` needs write access to create releases. Without it, the build succeeds but the release step fails with a 403 error.

```yaml
# WRONG -- no permissions block
jobs:
  release:
    runs-on: ubuntu-latest

# CORRECT
permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
```

ALWAYS set `permissions: contents: write` at the workflow or job level.

---

## BAP-011: Skipping Linux Dependencies in CI

**WHY this is wrong**: CI runners do not have Tauri's build dependencies pre-installed. The build fails with cryptic linker errors or missing package errors.

```yaml
# WRONG -- no dependency installation
- name: Build
  uses: tauri-apps/tauri-action@v0

# CORRECT
- name: Install Linux dependencies
  if: runner.os == 'Linux'
  run: |
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev

- name: Build
  uses: tauri-apps/tauri-action@v0
```

ALWAYS install system dependencies before the build step on Linux CI runners.

---

## BAP-012: Not Using Rust Cache in CI

**WHY this is wrong**: Rust compilation is slow. Without caching, every CI run compiles all dependencies from scratch, taking 10-20+ minutes.

```yaml
# CORRECT -- add after Rust toolchain setup
- name: Rust cache
  uses: swatinem/rust-cache@v2
  with:
    workspaces: './src-tauri -> target'
```

ALWAYS use `swatinem/rust-cache` with the correct workspace path in CI.
