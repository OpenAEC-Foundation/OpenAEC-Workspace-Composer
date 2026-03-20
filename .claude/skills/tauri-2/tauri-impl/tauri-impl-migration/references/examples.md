# tauri-impl-migration: Before/After Migration Examples

All examples show Tauri v1 code alongside the Tauri v2 equivalent.
Sources: https://v2.tauri.app/start/migrate/from-tauri-1/, vooronderzoek-tauri.md Section 8

---

## Example 1: Configuration File Migration

**v1 (tauri.conf.json):**

```json
{
  "package": {
    "productName": "My App",
    "version": "1.0.0"
  },
  "build": {
    "distDir": "../dist",
    "devPath": "http://localhost:5173",
    "withGlobalTauri": false
  },
  "tauri": {
    "windows": [
      {
        "title": "My App",
        "width": 800,
        "height": 600,
        "fileDropEnabled": true
      }
    ],
    "allowlist": {
      "fs": { "readFile": true, "scope": ["$APPDATA/*"] },
      "dialog": { "open": true, "save": true },
      "shell": { "open": true }
    },
    "bundle": {
      "active": true,
      "icon": ["icons/icon.ico", "icons/icon.icns"]
    },
    "systemTray": {
      "iconPath": "icons/tray.png"
    },
    "updater": {
      "active": true,
      "pubkey": "...",
      "endpoints": ["https://releases.example.com/update"]
    }
  }
}
```

**v2 (tauri.conf.json):**

```json
{
  "productName": "My App",
  "version": "1.0.0",
  "identifier": "com.example.myapp",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "withGlobalTauri": false,
    "windows": [
      {
        "title": "My App",
        "width": 800,
        "height": 600,
        "dragDropEnabled": true
      }
    ],
    "trayIcon": {
      "iconPath": "icons/tray.png"
    },
    "security": {
      "csp": "default-src 'self'; script-src 'self'"
    }
  },
  "bundle": {
    "active": true,
    "icon": ["icons/icon.ico", "icons/icon.icns"]
  },
  "plugins": {
    "updater": {
      "pubkey": "...",
      "endpoints": ["https://releases.example.com/update"]
    }
  }
}
```

**v2 capability file** (`src-tauri/capabilities/default.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "fs:allow-read-file",
    "dialog:allow-open",
    "dialog:allow-save",
    "opener:default",
    "updater:default",
    "process:allow-restart"
  ]
}
```

---

## Example 2: Rust Entry Point Restructuring

**v1 (main.rs only):**

```rust
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

**v2 (lib.rs + main.rs for mobile support):**

```rust
// src-tauri/src/lib.rs
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```rust
// src-tauri/src/main.rs
fn main() {
    app_lib::run();
}
```

```toml
# Cargo.toml addition for mobile
[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

---

## Example 3: Window API Migration

**v1 Rust:**

```rust
use tauri::{Window, WindowBuilder, WindowUrl, Manager};

fn create_window(app: &tauri::AppHandle) {
    let window = WindowBuilder::new(
        app,
        "settings",
        WindowUrl::App("settings.html".into()),
    )
    .title("Settings")
    .build()
    .unwrap();

    // Get existing window
    let main = app.get_window("main").unwrap();
}
```

**v2 Rust:**

```rust
use tauri::{WebviewUrl, Manager};
use tauri::webview::WebviewWindowBuilder;

fn create_window(app: &tauri::AppHandle) {
    let window = WebviewWindowBuilder::new(
        app,
        "settings",
        WebviewUrl::App("settings.html".into()),
    )
    .title("Settings")
    .build()
    .unwrap();

    // Get existing window
    let main = app.get_webview_window("main").unwrap();
}
```

---

## Example 4: Event System Migration

**v1 Rust:**

```rust
// Emit to all windows
app.emit_all("data-updated", payload)?;

// Listen globally
app.listen_global("user-action", |event| {
    println!("{:?}", event.payload());
});
```

**v2 Rust:**

```rust
use tauri::Emitter;
use tauri::Listener;

// emit() now broadcasts to all (same as v1 emit_all)
app.emit("data-updated", payload)?;

// Targeted emit (new in v2)
app.emit_to("main", "notification", payload)?;

// listen_global renamed to listen_any
app.listen_any("user-action", |event| {
    println!("{:?}", event.payload());
});
```

**v1 JavaScript:**

```typescript
import { emit, listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

// Listen on specific window
appWindow.listen('update', handler);
```

**v2 JavaScript:**

```typescript
import { emit, emitTo, listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

// emit() now broadcasts globally
await emit('data-updated', payload);

// Targeted emit (new)
await emitTo('main', 'notification', payload);

// Window listen only receives window-specific events
const win = getCurrentWindow();
await win.listen('update', handler);
```

---

## Example 5: Menu System Migration

**v1 Rust:**

```rust
use tauri::{Menu, CustomMenuItem, Submenu, MenuItem};

let file_menu = Submenu::new("File", Menu::new()
    .add_item(CustomMenuItem::new("open", "Open"))
    .add_item(CustomMenuItem::new("save", "Save"))
    .add_native_item(MenuItem::Separator)
    .add_native_item(MenuItem::Quit)
);

let menu = Menu::new().add_submenu(file_menu);

tauri::Builder::default()
    .menu(menu)
    .on_menu_event(|event| {
        match event.menu_item_id() {
            "open" => println!("Open clicked"),
            _ => {}
        }
    })
```

**v2 Rust:**

```rust
use tauri::menu::{MenuBuilder, SubmenuBuilder, PredefinedMenuItem};

tauri::Builder::default()
    .menu(|app| {
        let file_menu = SubmenuBuilder::new(app, "File")
            .text("open", "Open")
            .text("save", "Save")
            .separator()
            .quit()
            .build()?;

        MenuBuilder::new(app)
            .item(&file_menu)
            .build()
    })
    .on_menu_event(|app, event| {
        match event.id().as_ref() {
            "open" => println!("Open clicked"),
            _ => {}
        }
    })
```

---

## Example 6: System Tray Migration

**v1 Rust:**

```rust
use tauri::{SystemTray, SystemTrayMenu, CustomMenuItem};

let tray_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("show", "Show"))
    .add_item(CustomMenuItem::new("quit", "Quit"));

let tray = SystemTray::new().with_menu(tray_menu);

tauri::Builder::default()
    .system_tray(tray)
    .on_system_tray_event(|app, event| {
        // handle events
    })
```

**v2 Rust:**

```rust
use tauri::tray::TrayIconBuilder;
use tauri::menu::MenuBuilder;

tauri::Builder::default()
    .setup(|app| {
        let menu = MenuBuilder::new(app)
            .text("show", "Show")
            .text("quit", "Quit")
            .build()?;

        TrayIconBuilder::new()
            .menu(&menu)
            .on_menu_event(|app, event| {
                match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            w.show().unwrap();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                }
            })
            .build(app)?;
        Ok(())
    })
```

---

## Example 7: JavaScript Import Path Migration

**v1:**

```typescript
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile } from '@tauri-apps/api/fs';
import { fetch } from '@tauri-apps/api/http';
import { appWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/api/process';
```

**v2:**

```typescript
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';
```

---

## Example 8: Updater Migration

**v1 (automatic dialog):**

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "dialog": true,
      "pubkey": "...",
      "endpoints": ["https://releases.example.com/update"]
    }
  }
}
```

**v2 (manual implementation required):**

```json
{
  "plugins": {
    "updater": {
      "pubkey": "...",
      "endpoints": ["https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"]
    }
  },
  "bundle": {
    "createUpdaterArtifacts": true
  }
}
```

```typescript
// v2: you MUST implement the update check yourself
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update) {
  await update.downloadAndInstall();
  await relaunch();
}
```

---

## Example 9: Plugin Registration in v2

For each v1 API module that became a plugin, register in Rust:

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```
