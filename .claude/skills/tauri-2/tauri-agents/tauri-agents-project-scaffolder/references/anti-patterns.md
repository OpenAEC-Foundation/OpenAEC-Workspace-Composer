# tauri-agents-project-scaffolder: Scaffolding Anti-Patterns

These are confirmed scaffolding mistakes. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources: vooronderzoek-tauri.md sections 4, 5, 10

---

## SAP-001: Installing Plugin Crate Without npm Package

**WHY this is wrong**: Tauri plugins have BOTH a Rust crate and an npm package. The Rust crate handles backend logic; the npm package provides the typed JavaScript API. Without the npm package, you cannot call plugin functions from the frontend.

```bash
# WRONG -- only Rust side
cargo add tauri-plugin-fs

# CORRECT -- both sides
cargo add tauri-plugin-fs
npm install @tauri-apps/plugin-fs
```

ALWAYS install both the Cargo crate AND the npm package for every plugin.

---

## SAP-002: Registering Plugin Without Permissions

**WHY this is wrong**: In Tauri 2, plugins have ZERO permissions by default. Registering a plugin in Rust but not adding permissions in capabilities means all plugin commands fail at runtime with "command not allowed."

```rust
// Rust side -- registered correctly
.plugin(tauri_plugin_fs::init())
```

```json
// WRONG -- no fs permissions in capabilities
{ "permissions": ["core:default"] }

// CORRECT
{ "permissions": ["core:default", "fs:default", "fs:allow-read-file"] }
```

ALWAYS add capability permissions for every registered plugin.

---

## SAP-003: Missing build.rs

**WHY this is wrong**: Tauri requires a build script that calls `tauri_build::build()`. Without it, the build process cannot generate the required glue code for commands and permissions.

```rust
// CORRECT -- src-tauri/build.rs must exist
fn main() {
    tauri_build::build();
}
```

ALWAYS create `build.rs` with `tauri_build::build()`.

---

## SAP-004: Forgetting Mobile Entry Point

**WHY this is wrong**: Without `#[cfg_attr(mobile, tauri::mobile_entry_point)]`, the app cannot compile for iOS or Android. Even if you only target desktop now, adding it from the start prevents future refactoring.

```rust
// WRONG
pub fn run() {
    tauri::Builder::default()...
}

// CORRECT
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()...
}
```

ALWAYS include the mobile entry point attribute, even for desktop-only projects.

---

## SAP-005: Putting Commands Directly in lib.rs

**WHY this is wrong**: While it works, it creates maintenance problems. Commands in lib.rs cannot be `pub` (due to glue code generation). Separate modules are cleaner and allow `pub` visibility for testing.

```rust
// WRONG -- commands mixed with app setup
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ...
}

#[tauri::command]
fn greet(name: String) -> String { ... }

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> { ... }
```

```rust
// CORRECT -- commands in separate module
// lib.rs
mod commands;

// commands.rs
#[tauri::command]
pub fn greet(name: String) -> String { ... }
```

ALWAYS put command implementations in a separate module (`commands.rs` or `commands/mod.rs`).

---

## SAP-006: Not Creating Error Type Module

**WHY this is wrong**: Without a dedicated error type, commands default to `Result<T, String>` which loses error type information. Starting with a proper error module from the beginning prevents future refactoring.

```rust
// WRONG -- string errors everywhere
#[tauri::command]
fn save(path: String) -> Result<(), String> {
    std::fs::write(&path, "data").map_err(|e| e.to_string())
}
```

```rust
// CORRECT -- error.rs module from the start
// error.rs
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Custom(String),
}

impl serde::Serialize for AppError { ... }

pub type AppResult<T> = Result<T, AppError>;
```

ALWAYS create an error.rs module with a proper error enum.

---

## SAP-007: Hardcoding Dev Server Port

**WHY this is wrong**: If the hardcoded port conflicts with another service, the dev server fails silently or runs on a different port, and Tauri cannot connect.

```json
// WRONG -- no strictPort, potential mismatch
{
  "build": {
    "devUrl": "http://localhost:5173"
  }
}
```

Ensure the Vite config enforces the same port:

```typescript
// vite.config.ts
export default defineConfig({
    server: {
        port: 5173,
        strictPort: true,  // Fail if port is taken, don't auto-increment
    },
});
```

ALWAYS use `strictPort: true` in Vite config to match `devUrl`.

---

## SAP-008: Using Generic Identifier

**WHY this is wrong**: The identifier is used for system paths, registry keys, and app isolation. A generic identifier conflicts with other apps and causes data corruption.

```json
// WRONG
{ "identifier": "tauri-app" }
{ "identifier": "com.example.app" }
{ "identifier": "my-app" }

// CORRECT
{ "identifier": "com.yourcompany.yourproduct" }
{ "identifier": "nl.impertio.my-notes" }
```

ALWAYS use a globally unique reverse-domain identifier.

---

## SAP-009: Not Including Core Permissions

**WHY this is wrong**: Even core Tauri features (window management, events, paths) require explicit permissions in v2. Forgetting them causes silent failures.

```json
// WRONG -- missing core permissions
{
  "permissions": ["fs:default", "dialog:default"]
}

// CORRECT
{
  "permissions": [
    "core:default",
    "core:window:default",
    "core:app:default",
    "fs:default",
    "dialog:default"
  ]
}
```

ALWAYS include `core:default` and relevant `core:*:default` permissions.

---

## SAP-010: Not Creating Frontend Invoke Wrappers

**WHY this is wrong**: Scattering raw `invoke()` calls throughout components makes refactoring difficult and introduces type inconsistencies. A centralized wrapper module provides type safety and single point of change.

```typescript
// WRONG -- raw invoke scattered in components
// ComponentA.tsx
const data = await invoke('get_data', { id: 1 });

// ComponentB.tsx
const data = await invoke('get_data', { id: 2 }); // hope types match...
```

```typescript
// CORRECT -- centralized wrappers
// lib/tauri.ts
export async function getData(id: number): Promise<DataType> {
    return invoke<DataType>('get_data', { id });
}

// ComponentA.tsx
const data = await getData(1);
```

ALWAYS create typed wrapper functions in a dedicated module.
