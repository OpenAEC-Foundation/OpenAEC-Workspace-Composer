# tauri-impl-migration: Anti-Patterns

These are confirmed migration mistakes when upgrading from Tauri v1 to v2. Each entry documents the WRONG pattern, the CORRECT pattern, and WHY.

Sources: https://v2.tauri.app/start/migrate/from-tauri-1/, vooronderzoek-tauri.md Section 8 and Section 10.7

---

## AP-001: Skipping the Migration CLI

**WHY this is wrong**: Manual migration is error-prone. The CLI handles config restructuring, dependency updates, and allowlist-to-capability conversion automatically. Skipping it leads to missed renames, incorrect paths, and broken permissions.

```bash
# WRONG: manually editing files without running migrate
vim src-tauri/tauri.conf.json  # Trying to restructure by hand
```

```bash
# CORRECT: run the migration CLI first
npx @tauri-apps/cli migrate
# Then review and refine the generated files
```

ALWAYS run `npx @tauri-apps/cli migrate` as the first step. Make manual adjustments afterward.

---

## AP-002: Forgetting the Update UI

**WHY this is wrong**: Tauri v2 removed the automatic update dialog that v1 provided. If you only migrate the updater configuration without implementing explicit update checking code, users will never receive updates.

```json
// WRONG: config migrated but no code to check for updates
{
  "plugins": {
    "updater": {
      "pubkey": "...",
      "endpoints": ["https://releases.example.com/update"]
    }
  }
}
// No JavaScript or Rust code calls check()
```

```typescript
// CORRECT: explicit update check implementation
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update) {
  await update.downloadAndInstall();
  await relaunch();
}
```

ALWAYS implement explicit update checking (in JS or Rust) when migrating the updater.

---

## AP-003: Using Old Import Paths

**WHY this is wrong**: The v1 import paths no longer exist in v2. Code will fail at build time or runtime with module-not-found errors.

```typescript
// WRONG: v1 import paths
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile } from '@tauri-apps/api/fs';
import { appWindow } from '@tauri-apps/api/window';
```

```typescript
// CORRECT: v2 import paths
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { getCurrentWindow } from '@tauri-apps/api/window';
```

ALWAYS update all import paths. Use find-and-replace across the codebase.

---

## AP-004: Not Adding Core Permissions

**WHY this is wrong**: In v1, core features (window management, events, paths) were implicitly available. In v2, they require explicit permission grants. Without them, core API calls fail at runtime with "command not allowed" errors.

```json
// WRONG: only plugin permissions, no core
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "fs:default",
    "dialog:default"
  ]
}
```

```json
// CORRECT: include core permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "core:path:default",
    "core:app:default",
    "fs:default",
    "dialog:default"
  ]
}
```

ALWAYS add `core:default` and relevant core sub-permissions to your capabilities.

---

## AP-005: Not Restructuring for Mobile

**WHY this is wrong**: If you plan to target mobile platforms, v2 requires the entry point to be in `lib.rs` with the `#[cfg_attr(mobile, tauri::mobile_entry_point)]` macro. Keeping the v1 `main.rs`-only structure prevents mobile builds.

```rust
// WRONG: v1 structure, cannot build for mobile
// src-tauri/src/main.rs (all code here)
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}
```

```rust
// CORRECT: v2 structure, supports desktop + mobile
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}

// src-tauri/src/main.rs
fn main() {
    app_lib::run();
}
```

ALWAYS restructure into `lib.rs` + `main.rs` if mobile support is needed.

---

## AP-006: Using v1 Window Type Names

**WHY this is wrong**: The `Window` type in v2 refers to the OS window container, not the webview. Using v1 type names causes compilation errors.

```rust
// WRONG: v1 type names
use tauri::{Window, WindowBuilder, WindowUrl};

let win = WindowBuilder::new(app, "settings", WindowUrl::App("settings.html".into()))
    .build()?;

let main = app.get_window("main").unwrap();
```

```rust
// CORRECT: v2 type names
use tauri::{WebviewUrl, Manager};
use tauri::webview::WebviewWindowBuilder;

let win = WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("settings.html".into()))
    .build()?;

let main = app.get_webview_window("main").unwrap();
```

ALWAYS use `WebviewWindow`, `WebviewWindowBuilder`, and `WebviewUrl` in v2.

---

## AP-007: Assuming emit() Targets a Single Window

**WHY this is wrong**: In v1, `emit()` sent events to a specific window. In v2, `emit()` broadcasts to ALL listeners. Using it as if it targets a single window leads to unexpected behavior in multi-window apps.

```rust
// WRONG: assuming v1 behavior where emit() targets one window
use tauri::Emitter;
app.emit("private-data", sensitive_payload)?;
// This now broadcasts to ALL windows, not just the intended one
```

```rust
// CORRECT: use emit_to() for targeted events
use tauri::Emitter;
app.emit_to("main", "private-data", sensitive_payload)?;
```

ALWAYS use `emit_to()` when you need to target a specific window. Use `emit()` only for broadcast.

---

## AP-008: Not Registering Plugins in Rust

**WHY this is wrong**: In v1, APIs like dialog, fs, and http were built into Tauri. In v2, they are separate plugins that must be explicitly registered. Installing the npm package without registering the Rust plugin causes runtime errors.

```rust
// WRONG: npm package installed but plugin not registered
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![])
    .run(tauri::generate_context!())
    .expect("error");
// Frontend call to dialog will fail
```

```rust
// CORRECT: register each plugin
tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![])
    .run(tauri::generate_context!())
    .expect("error");
```

ALWAYS register every plugin with `.plugin()` in the Tauri builder.

---

## AP-009: Using v1 Menu Event Handler Pattern

**WHY this is wrong**: In v1, `Builder::on_menu_event()` was a builder method. In v2, the builder pattern changed. The v1 pattern does not compile.

```rust
// WRONG: v1 pattern
tauri::Builder::default()
    .menu(menu)
    .on_menu_event(|event| {
        match event.menu_item_id() {  // method renamed
            "open" => {}
            _ => {}
        }
    })
```

```rust
// CORRECT: v2 pattern
tauri::Builder::default()
    .menu(|app| {
        MenuBuilder::new(app).build()
    })
    .on_menu_event(|app, event| {
        match event.id().as_ref() {  // .id() returns MenuId, use .as_ref()
            "open" => {}
            _ => {}
        }
    })
```

ALWAYS use the v2 menu builder pattern with `|app|` closure and `event.id().as_ref()`.

---

## AP-010: Using v1Compatible Updater for New Projects

**WHY this is wrong**: The `"v1Compatible"` setting generates updater artifacts in the v1 format. This is only needed when existing v1 installations need to receive their first v2 update. New projects have no v1 installations to support.

```json
// WRONG: unnecessary v1 compatibility
{
  "bundle": {
    "createUpdaterArtifacts": "v1Compatible"
  }
}
```

```json
// CORRECT: native v2 format
{
  "bundle": {
    "createUpdaterArtifacts": true
  }
}
```

ONLY use `"v1Compatible"` for the transitional release when migrating from v1. Switch to `true` afterward.
