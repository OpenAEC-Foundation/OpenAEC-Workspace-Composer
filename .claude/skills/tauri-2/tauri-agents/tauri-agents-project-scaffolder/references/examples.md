# tauri-agents-project-scaffolder: Complete Scaffolded Examples

All examples verified against Tauri 2.x documentation.
Sources: v2.tauri.app/start/, v2.tauri.app/develop/, vooronderzoek-tauri.md

---

## Example 1: Basic Note-Taking App (fs + dialog + store)

### Cargo.toml

```toml
[package]
name = "notes-app"
version = "0.1.0"
edition = "2021"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
tauri-plugin-store = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"
tokio = { version = "1", features = ["full"] }
```

### lib.rs

```rust
mod commands;
mod error;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::init())
        .invoke_handler(tauri::generate_handler![
            commands::save_note,
            commands::load_note,
            commands::list_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### capabilities/default.json

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:app:default",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-read-dir",
    "fs:allow-mkdir",
    "fs:allow-exists",
    "dialog:default",
    "store:default",
    "opener:default",
    "allow-save-note",
    "allow-load-note",
    "allow-list-notes"
  ]
}
```

### permissions/commands.toml

```toml
[[permission]]
identifier = "allow-save-note"
description = "Allow saving a note"
commands.allow = ["save_note"]

[[permission]]
identifier = "allow-load-note"
description = "Allow loading a note"
commands.allow = ["load_note"]

[[permission]]
identifier = "allow-list-notes"
description = "Allow listing notes"
commands.allow = ["list_notes"]
```

### Frontend: src/lib/tauri.ts

```typescript
import { invoke } from '@tauri-apps/api/core';

export interface Note {
    title: string;
    content: string;
    updatedAt: string;
}

export async function saveNote(title: string, content: string): Promise<void> {
    return invoke('save_note', { title, content });
}

export async function loadNote(title: string): Promise<Note> {
    return invoke<Note>('load_note', { title });
}

export async function listNotes(): Promise<string[]> {
    return invoke<string[]>('list_notes');
}
```

---

## Example 2: Dashboard App with Live Data (events + channels)

### lib.rs

```rust
mod commands;
mod error;

use std::sync::Mutex;
use tauri::Manager;

#[derive(Default)]
struct AppState {
    monitoring: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::start_monitoring,
            commands::stop_monitoring,
            commands::get_system_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### commands.rs (with Channel for streaming)

```rust
use crate::error::AppResult;
use tauri::ipc::Channel;
use std::sync::Mutex;

#[derive(Clone, serde::Serialize)]
pub struct SystemStats {
    cpu_usage: f64,
    memory_used: u64,
    timestamp: u64,
}

#[tauri::command]
pub async fn start_monitoring(
    state: tauri::State<'_, Mutex<super::AppState>>,
    on_stats: Channel<SystemStats>,
) -> AppResult<()> {
    {
        let mut app_state = state.lock().unwrap();
        app_state.monitoring = true;
    }

    // Stream data via channel
    for i in 0..100 {
        let stats = SystemStats {
            cpu_usage: 45.0 + (i as f64 * 0.5),
            memory_used: 4_000_000_000 + (i * 1000),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        on_stats.send(stats).unwrap();
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    }

    Ok(())
}

#[tauri::command]
pub fn stop_monitoring(
    state: tauri::State<'_, Mutex<super::AppState>>,
) {
    let mut app_state = state.lock().unwrap();
    app_state.monitoring = false;
}

#[tauri::command]
pub async fn get_system_stats() -> AppResult<SystemStats> {
    Ok(SystemStats {
        cpu_usage: 42.0,
        memory_used: 4_000_000_000,
        timestamp: 0,
    })
}
```

---

## Example 3: Tray App with Hide-to-Tray

### lib.rs

```rust
mod commands;
mod error;

use tauri::Manager;
use tauri::tray::TrayIconBuilder;
use tauri::menu::MenuBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
        ])
        .setup(|app| {
            let menu = MenuBuilder::new(app)
                .text("show", "Show Window")
                .text("hide", "Hide Window")
                .separator()
                .text("quit", "Quit")
                .build()?;

            let _tray = TrayIconBuilder::new()
                .tooltip("My Tray App")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Hide instead of close
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### tauri.conf.json (tray section)

```json
{
  "app": {
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    }
  }
}
```

---

## Example 4: package.json

```json
{
  "name": "my-tauri-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-opener": "^2",
    "@tauri-apps/plugin-fs": "^2",
    "@tauri-apps/plugin-dialog": "^2",
    "@tauri-apps/plugin-store": "^2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "typescript": "^5",
    "vite": "^6"
  }
}
```

---

## Example 5: Complete .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/
src-tauri/target/
src-tauri/gen/

# Environment and secrets
.env
.env.*
*.key
*.pem
*.p12
*.pfx

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
Desktop.ini

# Logs
*.log
npm-debug.log*

# Note: Cargo.lock is NOT ignored -- deterministic builds require it
```
