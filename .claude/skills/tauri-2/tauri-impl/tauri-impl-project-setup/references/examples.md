# tauri-impl-project-setup: Working Setup Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/start/create-project/
- https://v2.tauri.app/develop/

---

## Example 1: React + TypeScript Project (Vite)

```bash
# Scaffold
npm create tauri-app@latest my-react-app -- --template react-ts

# Navigate and install
cd my-react-app
npm install

# Start development
npm run tauri dev
```

Generated `tauri.conf.json`:

```json
{
  "$schema": "./gen/schemas/desktop-schema.json",
  "identifier": "com.example.my-react-app",
  "build": {
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "My React App",
        "width": 800,
        "height": 600
      }
    ]
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

---

## Example 2: Vue + TypeScript Project

```bash
npm create tauri-app@latest my-vue-app -- --template vue-ts

cd my-vue-app
npm install
npm run tauri dev
```

---

## Example 3: Svelte + TypeScript Project

```bash
npm create tauri-app@latest my-svelte-app -- --template svelte-ts

cd my-svelte-app
npm install
npm run tauri dev
```

---

## Example 4: Adding Tauri to an Existing Vite Project

```bash
# From your existing project root
npm install -D @tauri-apps/cli
npm install @tauri-apps/api

# Initialize Tauri (creates src-tauri/)
npx tauri init
```

During `tauri init`, you answer:
- App name
- Window title
- Frontend dev URL (typically `http://localhost:5173`)
- Frontend dist path (typically `../dist`)
- Dev command (`npm run dev`)
- Build command (`npm run build`)

Then update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "tauri": "tauri"
  }
}
```

---

## Example 5: Complete lib.rs with Commands and State

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;

#[derive(Default)]
struct AppState {
    counter: u32,
}

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
fn increment(state: tauri::State<'_, Mutex<AppState>>) -> u32 {
    let mut s = state.lock().unwrap();
    s.counter += 1;
    s.counter
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, increment])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    my_app_lib::run();
}
```

---

## Example 6: Complete Cargo.toml

```toml
[package]
name = "my-app"
version = "0.1.0"
description = "A Tauri 2 desktop application"
authors = ["Your Name"]
edition = "2021"

[lib]
name = "my_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[profile.release]
codegen-units = 1
lto = true
opt-level = "s"
panic = "abort"
strip = true
```

The `[profile.release]` section optimizes binary size for production builds.

---

## Example 7: Default Capability File

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:webview:default",
    "opener:default"
  ]
}
```

---

## Example 8: Multi-Window Configuration

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "My App",
        "url": "/",
        "width": 1024,
        "height": 768,
        "resizable": true
      },
      {
        "label": "settings",
        "title": "Settings",
        "url": "/settings",
        "width": 500,
        "height": 400,
        "resizable": false,
        "create": false
      }
    ]
  }
}
```

Setting `"create": false` means the settings window is defined but not opened at startup. Open it programmatically from Rust or TypeScript.

---

## Example 9: Adding the File System Plugin

```bash
# Step 1: Add the plugin
npm run tauri plugin add fs

# Step 2: Add permissions to src-tauri/capabilities/default.json
```

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    {
      "identifier": "fs:scope",
      "allow": [
        { "path": "$APPDATA/**" }
      ]
    }
  ]
}
```

```rust
// Step 3: Register plugin in lib.rs (usually done by the CLI)
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
// Step 4: Use in frontend
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const content = await readTextFile('config.json', {
  baseDir: BaseDirectory.AppData,
});
```

---

## Example 10: Production Build for All Platforms

```bash
# Build for the current platform
npm run tauri build

# Build specific bundle type (Windows)
npm run tauri build -- --bundles nsis

# Build with debug info
npm run tauri build -- --debug

# Build for a specific target
npm run tauri build -- --target x86_64-pc-windows-msvc
```

Build output is in `src-tauri/target/release/bundle/`.

---

## Example 11: .gitignore for Tauri Projects

```gitignore
# Dependencies
node_modules/

# Frontend build output
dist/

# Rust build artifacts
src-tauri/target/

# Generated files (regenerated on build)
src-tauri/gen/

# Environment files
.env
.env.local

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
```
