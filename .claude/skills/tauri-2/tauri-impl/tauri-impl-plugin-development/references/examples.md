# tauri-impl-plugin-development: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/develop/plugins/
- https://docs.rs/tauri/latest/tauri/plugin/struct.Builder.html
- vooronderzoek-tauri.md Section 2.5

---

## Example 1: Minimal Plugin (In-App)

```rust
// src-tauri/src/plugins/greeter.rs
use tauri::plugin::{Builder, TauriPlugin};
use tauri::Runtime;

#[tauri::command]
async fn greet<R: Runtime>(
    _app: tauri::AppHandle<R>,
    name: String,
) -> Result<String, String> {
    Ok(format!("Hello from plugin, {}!", name))
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("greeter")
        .invoke_handler(tauri::generate_handler![greet])
        .build()
}
```

```rust
// src-tauri/src/lib.rs
mod plugins;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(plugins::greeter::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
// Frontend — invoke the plugin command
import { invoke } from '@tauri-apps/api/core';

const greeting = await invoke<string>('plugin:greeter|greet', { name: 'Alice' });
console.log(greeting); // "Hello from plugin, Alice!"
```

---

## Example 2: Plugin with Mutable State

```rust
// src-tauri/src/plugins/counter.rs
use std::sync::Mutex;
use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime};

struct CounterState {
    value: i64,
}

#[tauri::command]
async fn increment<R: Runtime>(
    app: tauri::AppHandle<R>,
    amount: i64,
) -> Result<i64, String> {
    let state = app.state::<Mutex<CounterState>>();
    let mut s = state.lock().unwrap();
    s.value += amount;
    Ok(s.value)
}

#[tauri::command]
async fn get_count<R: Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<i64, String> {
    let state = app.state::<Mutex<CounterState>>();
    let s = state.lock().unwrap();
    Ok(s.value)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("counter")
        .invoke_handler(tauri::generate_handler![increment, get_count])
        .setup(|app, _api| {
            app.manage(Mutex::new(CounterState { value: 0 }));
            Ok(())
        })
        .build()
}
```

```typescript
// Frontend
import { invoke } from '@tauri-apps/api/core';

await invoke('plugin:counter|increment', { amount: 5 });
const count = await invoke<number>('plugin:counter|get_count');
console.log(count); // 5
```

---

## Example 3: Plugin with Configuration

```rust
// src-tauri/src/plugins/api_client.rs
use serde::Deserialize;
use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime};

#[derive(Deserialize, Clone)]
struct ApiConfig {
    base_url: String,
    timeout_ms: u64,
}

#[tauri::command]
async fn fetch_data<R: Runtime>(
    app: tauri::AppHandle<R>,
    endpoint: String,
) -> Result<String, String> {
    let config = app.state::<ApiConfig>();
    let url = format!("{}/{}", config.base_url, endpoint);
    // Perform HTTP request using config.timeout_ms
    Ok(format!("Fetched from: {}", url))
}

pub fn init<R: Runtime>() -> TauriPlugin<R, ApiConfig> {
    Builder::<R, ApiConfig>::new("api-client")
        .invoke_handler(tauri::generate_handler![fetch_data])
        .setup(|app, api| {
            let config = api.config().clone();
            app.manage(config);
            Ok(())
        })
        .build()
}
```

```json
// tauri.conf.json
{
  "plugins": {
    "api-client": {
      "base_url": "https://api.example.com",
      "timeout_ms": 5000
    }
  }
}
```

---

## Example 4: Plugin with All Lifecycle Hooks

```rust
use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Emitter, Listener, Manager, RunEvent, Runtime};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("lifecycle")
        .setup(|app, _api| {
            println!("[lifecycle] Plugin initialized");
            app.manage(std::sync::Mutex::new(Vec::<String>::new()));
            Ok(())
        })
        .on_navigation(|window, url| {
            println!("[lifecycle] Navigation to {} in {}", url, window.label());
            // Block navigation to external URLs
            url.scheme() == "tauri" || url.scheme() == "http" && url.host_str() == Some("localhost")
        })
        .on_webview_ready(|window| {
            println!("[lifecycle] Webview ready: {}", window.label());
            window.listen("content-loaded", |event| {
                println!("[lifecycle] Content loaded: {:?}", event.payload());
            });
        })
        .on_event(|app, event| {
            match event {
                RunEvent::ExitRequested { api, .. } => {
                    println!("[lifecycle] Exit requested");
                    // Uncomment to prevent exit:
                    // api.prevent_exit();
                }
                RunEvent::Exit => {
                    println!("[lifecycle] App exiting, performing cleanup");
                }
                _ => {}
            }
        })
        .on_drop(|app| {
            println!("[lifecycle] Plugin dropped, final cleanup");
        })
        .build()
}
```

---

## Example 5: Standalone Plugin Crate with build.rs

```toml
# tauri-plugin-analytics/Cargo.toml
[package]
name = "tauri-plugin-analytics"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = "2"
serde = { version = "1", features = ["derive"] }

[build-dependencies]
tauri-plugin = "2"
```

```rust
// tauri-plugin-analytics/build.rs
const COMMANDS: &[&str] = &["track_event", "get_session_id", "flush"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
```

```rust
// tauri-plugin-analytics/src/lib.rs
use tauri::plugin::{Builder, TauriPlugin};
use tauri::Runtime;

#[tauri::command]
async fn track_event<R: Runtime>(
    _app: tauri::AppHandle<R>,
    name: String,
    properties: std::collections::HashMap<String, String>,
) -> Result<(), String> {
    println!("Track: {} {:?}", name, properties);
    Ok(())
}

#[tauri::command]
async fn get_session_id<R: Runtime>(
    _app: tauri::AppHandle<R>,
) -> Result<String, String> {
    Ok("session-abc123".into())
}

#[tauri::command]
async fn flush<R: Runtime>(
    _app: tauri::AppHandle<R>,
) -> Result<(), String> {
    Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("analytics")
        .invoke_handler(tauri::generate_handler![track_event, get_session_id, flush])
        .build()
}
```

Capability file to enable the plugin:

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "analytics:allow-track-event",
    "analytics:allow-get-session-id",
    "analytics:allow-flush"
  ]
}
```

---

## Example 6: Plugin with Scoped Permissions

```rust
use serde::Deserialize;
use tauri::ipc::{CommandScope, GlobalScope};
use tauri::plugin::{Builder, TauriPlugin};
use tauri::Runtime;

#[derive(Debug, Deserialize)]
struct PathScope {
    path: String,
}

#[tauri::command]
async fn read_scoped<R: Runtime>(
    command_scope: CommandScope<'_, PathScope>,
    global_scope: GlobalScope<'_, PathScope>,
    path: String,
) -> Result<String, String> {
    let allowed_paths: Vec<&str> = command_scope
        .allows()
        .iter()
        .map(|s| s.path.as_str())
        .collect();

    let denied_paths: Vec<&str> = command_scope
        .denies()
        .iter()
        .map(|s| s.path.as_str())
        .collect();

    // Validate path against allowed/denied before reading
    if denied_paths.iter().any(|d| path.starts_with(d)) {
        return Err("Path denied by scope".into());
    }
    if !allowed_paths.iter().any(|a| path.starts_with(a)) {
        return Err("Path not in allowed scope".into());
    }

    Ok(format!("Read from: {}", path))
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("scoped-reader")
        .invoke_handler(tauri::generate_handler![read_scoped])
        .build()
}
```
