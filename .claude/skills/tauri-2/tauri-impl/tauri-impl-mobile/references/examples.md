# tauri-impl-mobile: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/start/prerequisites/
- https://v2.tauri.app/develop/mobile/
- vooronderzoek-tauri.md Section 7

---

## Example 1: Basic Mobile-Ready Project

```toml
# src-tauri/Cargo.toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

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
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
```

---

## Example 2: Platform-Specific Setup

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

#[cfg(desktop)]
fn setup_desktop(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::tray::TrayIconBuilder;
    use tauri::menu::MenuBuilder;

    // System tray (desktop only)
    let menu = MenuBuilder::new(app)
        .text("show", "Show Window")
        .text("quit", "Quit")
        .build()?;

    TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(w) = app.get_webview_window("main") {
                        w.show().unwrap();
                        w.set_focus().unwrap();
                    }
                }
                "quit" => app.exit(0),
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg(mobile)]
fn setup_mobile(_app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Mobile-specific initialization
    // e.g., register mobile plugin hooks, request permissions
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            setup_desktop(app)?;

            #[cfg(mobile)]
            setup_mobile(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_platform_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_platform_info() -> String {
    #[cfg(target_os = "android")]
    return "Android".into();

    #[cfg(target_os = "ios")]
    return "iOS".into();

    #[cfg(target_os = "windows")]
    return "Windows".into();

    #[cfg(target_os = "macos")]
    return "macOS".into();

    #[cfg(target_os = "linux")]
    return "Linux".into();
}
```

---

## Example 3: Platform-Specific Commands

```rust
// src-tauri/src/lib.rs

// Desktop-only: window management
#[cfg(desktop)]
mod desktop_commands {
    #[tauri::command]
    pub fn set_always_on_top(window: tauri::WebviewWindow, on_top: bool) -> Result<(), String> {
        window.set_always_on_top(on_top).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn enter_fullscreen(window: tauri::WebviewWindow) -> Result<(), String> {
        window.set_fullscreen(true).map_err(|e| e.to_string())
    }
}

// Mobile-only: device features
#[cfg(mobile)]
mod mobile_commands {
    #[tauri::command]
    pub fn get_device_orientation() -> Result<String, String> {
        // Platform-specific implementation
        Ok("portrait".into())
    }
}

// Shared commands (all platforms)
#[tauri::command]
fn save_data(data: String) -> Result<(), String> {
    // Works on all platforms
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_data,
            #[cfg(desktop)]
            desktop_commands::set_always_on_top,
            #[cfg(desktop)]
            desktop_commands::enter_fullscreen,
            #[cfg(mobile)]
            mobile_commands::get_device_orientation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Example 4: Mobile Bundle Configuration

```json
// tauri.conf.json
{
  "productName": "My App",
  "version": "1.0.0",
  "identifier": "com.example.myapp",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "My App",
        "width": 1024,
        "height": 768
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
    ],
    "iOS": {
      "minimumSystemVersion": "14.0"
    },
    "android": {
      "minSdkVersion": 24,
      "versionCode": 1
    }
  }
}
```

---

## Example 5: Frontend with Platform Detection

```typescript
// src/main.ts
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@tauri-apps/api/core';

async function init() {
    if (!isTauri()) {
        console.log('Running in browser -- Tauri APIs not available');
        return;
    }

    const platform = await invoke<string>('get_platform_info');
    console.log(`Running on: ${platform}`);

    // Adjust UI based on platform
    if (platform === 'Android' || platform === 'iOS') {
        document.body.classList.add('mobile');
        // Hide desktop-only UI elements
        document.querySelectorAll('.desktop-only').forEach(el => {
            (el as HTMLElement).style.display = 'none';
        });
    } else {
        document.body.classList.add('desktop');
        // Hide mobile-only UI elements
        document.querySelectorAll('.mobile-only').forEach(el => {
            (el as HTMLElement).style.display = 'none';
        });
    }
}

init();
```

---

## Example 6: Migration from Desktop-Only to Mobile Support

Step-by-step migration of an existing desktop project:

**Step 1: Update Cargo.toml**

```toml
# Add the [lib] section
[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

**Step 2: Move main.rs logic to lib.rs**

```rust
// src-tauri/src/lib.rs (new file -- move all logic here)
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::save_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 3: Replace main.rs with minimal stub**

```rust
// src-tauri/src/main.rs (replace contents)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
```

**Step 4: Initialize mobile targets**

```bash
# Add Rust targets
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Generate platform project files
tauri android init
tauri ios init
```

**Step 5: Test**

```bash
# Test desktop still works
tauri dev

# Test Android
tauri android dev

# Test iOS (macOS only)
tauri ios dev
```

---

## Example 7: Conditional Plugin Registration

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Desktop-only plugins
    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_global_shortcut::init())
            .plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                None,
            ))
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                if let Some(w) = app.get_webview_window("main") {
                    w.set_focus().unwrap();
                }
            }));
    }

    // Mobile-only plugins
    #[cfg(mobile)]
    {
        builder = builder
            .plugin(tauri_plugin_biometric::init())
            .plugin(tauri_plugin_haptics::init());
    }

    // Shared plugins (all platforms)
    builder = builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init());

    builder
        .invoke_handler(tauri::generate_handler![/* commands */])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
