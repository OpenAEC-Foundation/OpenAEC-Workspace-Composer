# tauri-impl-project-setup: Anti-Patterns

These are confirmed error patterns when setting up Tauri 2 projects. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/start/create-project/
- https://v2.tauri.app/reference/config/
- vooronderzoek-tauri.md §1, §4.1, §10

---

## AP-001: All Logic in main.rs Without lib.rs

**WHY this is wrong**: Mobile platforms (iOS, Android) have no `main()` function. The `#[cfg_attr(mobile, tauri::mobile_entry_point)]` macro generates platform-specific entry points that expect a `pub fn run()` in `lib.rs`. Without this split, mobile builds fail to compile. Even desktop-only projects should use this pattern for future-proofing.

```rust
// WRONG -- all logic in main.rs
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error");
}
```

```rust
// CORRECT -- lib.rs contains logic, main.rs is a thin wrapper
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error");
}

// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    my_app_lib::run();
}
```

ALWAYS use the lib.rs + main.rs split pattern.

---

## AP-002: Not Committing Cargo.lock

**WHY this is wrong**: Without `Cargo.lock` in version control, different developers and CI environments may get different dependency versions, leading to "works on my machine" issues and non-deterministic builds.

```gitignore
# WRONG -- ignoring Cargo.lock
src-tauri/Cargo.lock
```

```gitignore
# CORRECT -- only ignore target directory
src-tauri/target/
```

ALWAYS commit `src-tauri/Cargo.lock` to your repository.

---

## AP-003: Missing or Generic App Identifier

**WHY this is wrong**: The `identifier` in `tauri.conf.json` is used as the system-level app ID. On macOS it becomes the bundle identifier, on Windows it determines app data paths and registry entries. A non-unique identifier causes conflicts with other apps and data corruption.

```json
// WRONG -- generic identifier
{
  "identifier": "tauri-app"
}

// ALSO WRONG -- no identifier
{
}
```

```json
// CORRECT -- unique reverse-domain identifier
{
  "identifier": "com.mycompany.my-specific-app"
}
```

ALWAYS use a unique reverse-domain identifier. NEVER leave the default or use generic names.

---

## AP-004: Missing beforeDevCommand / beforeBuildCommand

**WHY this is wrong**: Without `beforeDevCommand`, `tauri dev` will not start the frontend dev server, resulting in a blank window or connection refused. Without `beforeBuildCommand`, `tauri build` will bundle stale or missing frontend assets.

```json
// WRONG -- no build commands
{
  "build": {
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  }
}
```

```json
// CORRECT -- build commands configured
{
  "build": {
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  }
}
```

ALWAYS set `beforeDevCommand` and `beforeBuildCommand` when using a frontend build tool.

---

## AP-005: No Capability File / No Core Permissions

**WHY this is wrong**: Tauri 2 requires explicit permission grants for ALL IPC operations, including core features like window management and events. Without a capability file, or with one that lacks `core:default`, basic operations throw "command not allowed" errors at runtime.

```json
// WRONG -- empty or missing capability
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": []
}
```

```json
// CORRECT -- includes core permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:webview:default"
  ]
}
```

ALWAYS include `core:default` in your capability file at minimum.

---

## AP-006: Public Commands in lib.rs

**WHY this is wrong**: Commands defined directly in `src-tauri/src/lib.rs` must NOT be `pub` due to Tauri's glue code generation. The macro generates additional code that conflicts with the `pub` visibility modifier, causing compile errors.

```rust
// WRONG -- pub command in lib.rs
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

```rust
// CORRECT -- no pub in lib.rs
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// OR: move to a module where pub is fine
// src-tauri/src/commands.rs
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

NEVER use `pub` on command functions defined directly in `lib.rs`. Move commands to separate modules if they need to be public.

---

## AP-007: Missing crate-type in Cargo.toml

**WHY this is wrong**: Without the correct `crate-type` array, mobile builds fail. iOS requires `staticlib`, Android requires `cdylib`, and desktop requires `rlib`. The scaffolding tool sets this up correctly, but manual setups often miss it.

```toml
# WRONG -- no lib section
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"
```

```toml
# CORRECT -- all three crate types
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[lib]
name = "my_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

ALWAYS include the `[lib]` section with all three crate types.

---

## AP-008: Missing windows_subsystem Attribute

**WHY this is wrong**: Without `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` in `main.rs`, release builds on Windows show a console window behind the app window. This is confusing for end users.

```rust
// WRONG -- no subsystem attribute
fn main() {
    my_app_lib::run();
}
```

```rust
// CORRECT -- suppress console window in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    my_app_lib::run();
}
```

ALWAYS add the `windows_subsystem` attribute to `main.rs`.

---

## AP-009: Using devUrl Without a Dev Server

**WHY this is wrong**: When `devUrl` is set but no dev server is running (because `beforeDevCommand` is empty or the command does not start a server), `tauri dev` connects to nothing and shows a blank window or error page.

```json
// WRONG -- devUrl set but no server starts
{
  "build": {
    "devUrl": "http://localhost:5173"
  }
}
```

```json
// CORRECT option A -- with dev server
{
  "build": {
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev"
  }
}

// CORRECT option B -- serve files directly (no dev server)
{
  "build": {
    "frontendDist": "../src"
  }
}
```

ALWAYS pair `devUrl` with `beforeDevCommand`, or omit both for static file serving.

---

## AP-010: Installing Plugin Without Adding Permissions

**WHY this is wrong**: Installing a Tauri plugin (via `tauri plugin add` or manual Cargo.toml/package.json edits) does NOT automatically grant the frontend permission to use it. All plugin APIs throw "command not allowed" errors until their permissions are added to a capability file.

```bash
# Step 1 done: plugin installed
npm run tauri plugin add fs

# Step 2 FORGOTTEN: no permissions added
# Result: all fs operations throw errors at runtime
```

```json
// CORRECT -- add permissions after installing plugin
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default"
  ]
}
```

ALWAYS add plugin permissions to a capability file after installing a plugin.
