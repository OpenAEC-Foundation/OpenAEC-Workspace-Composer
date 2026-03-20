# Working Code Examples (Tauri 2.x)

## Example 1: Minimal Application Setup

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

```typescript
// src/main.ts
import { invoke } from '@tauri-apps/api/core';

const greeting = await invoke<string>('greet', { name: 'World' });
console.log(greeting); // "Hello, World!"
```

---

## Example 2: Async Command with Error Handling

```rust
// src-tauri/src/commands.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("not found: {0}")]
    NotFound(String),
}

// Required: Serialize for sending error to frontend
impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, Error> {
    let content = tokio::fs::read_to_string(&path).await?;
    Ok(content)
}
```

```typescript
// Frontend
try {
    const content = await invoke<string>('read_file', { path: '/tmp/data.txt' });
    console.log(content);
} catch (error) {
    console.error('Failed:', error); // error is the serialized string
}
```

---

## Example 3: State Management with Mutex

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;

#[derive(Default)]
struct AppState {
    counter: u32,
    name: String,
}

#[tauri::command]
fn increment(state: tauri::State<'_, Mutex<AppState>>) -> u32 {
    let mut s = state.lock().unwrap();
    s.counter += 1;
    s.counter
}

#[tauri::command]
fn get_count(state: tauri::State<'_, Mutex<AppState>>) -> u32 {
    state.lock().unwrap().counter
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![increment, get_count])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Example 4: Event System (Bidirectional)

```rust
// Rust: emit events to frontend
use tauri::Emitter;

#[tauri::command]
async fn start_processing(app: tauri::AppHandle) {
    for i in 0..100 {
        app.emit("progress", i).unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
    app.emit("complete", "done").unwrap();
}
```

```typescript
// Frontend: listen for events
import { listen } from '@tauri-apps/api/event';

// IMPORTANT: listen() returns a Promise<UnlistenFn>
const unlisten = await listen<number>('progress', (event) => {
    console.log(`Progress: ${event.payload}%`);
});

// Clean up when done
unlisten();
```

### React useEffect Pattern

```typescript
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

function ProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const promise = listen<number>('progress', (event) => {
            setProgress(event.payload);
        });
        // CORRECT cleanup: await the promise, then call unlisten
        return () => { promise.then(fn => fn()); };
    }, []);

    return <div style={{ width: `${progress}%` }} />;
}
```

---

## Example 5: IPC Channel (Streaming Data)

```rust
use tauri::ipc::Channel;

#[derive(Clone, serde::Serialize)]
struct DownloadProgress {
    bytes_read: u64,
    total: u64,
}

#[tauri::command]
async fn download_file(
    url: String,
    on_progress: Channel<DownloadProgress>,
) -> Result<String, String> {
    let total = 1000u64;
    for i in 0..10 {
        on_progress.send(DownloadProgress {
            bytes_read: i * 100,
            total,
        }).unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
    Ok("download complete".into())
}
```

```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

const onProgress = new Channel<{ bytesRead: number; total: number }>();
onProgress.onmessage = (progress) => {
    console.log(`${progress.bytesRead} / ${progress.total}`);
};

const result = await invoke<string>('download_file', {
    url: 'https://example.com/file.zip',
    onProgress,
});
```

---

## Example 6: Special Injected Parameters

```rust
#[tauri::command]
async fn complex_command(
    app: tauri::AppHandle,            // injected: app handle
    window: tauri::WebviewWindow,     // injected: calling window
    state: tauri::State<'_, MyState>, // injected: managed state
    // Regular parameters from frontend:
    name: String,
    count: u32,
) -> Result<String, String> {
    println!("Called from window: {}", window.label());
    let config = app.config();
    Ok(format!("Processed {} items for {}", count, name))
}
```

```typescript
// Frontend: only pass the regular parameters
// app, window, state are injected automatically by Tauri
await invoke('complex_command', { name: 'test', count: 42 });
```

---

## Example 7: Multi-Window Application

```rust
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![show_settings, close_settings])
        .setup(|app| {
            // Create a hidden settings window at startup
            let _settings = WebviewWindowBuilder::new(
                app,
                "settings",
                WebviewUrl::App("settings.html".into()),
            )
            .title("Settings")
            .inner_size(600.0, 400.0)
            .visible(false)
            .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running app");
}

#[tauri::command]
fn show_settings(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

#[tauri::command]
fn close_settings(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        window.hide().unwrap();
    }
}
```

---

## Example 8: Setup Hook with Background Task

```rust
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            // Access app-specific paths
            let db_path = app.path().app_data_dir()?.join("data.db");
            println!("Database path: {:?}", db_path);

            // Spawn a background heartbeat task
            std::thread::spawn(move || {
                loop {
                    handle.emit("heartbeat", ()).unwrap();
                    std::thread::sleep(std::time::Duration::from_secs(30));
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Example 9: Binary Data (Bypass JSON Serialization)

```rust
use tauri::ipc::Response;

#[tauri::command]
fn read_binary_file(path: String) -> Result<Response, String> {
    let data = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Response::new(data))
}
```

---

## Example 10: Plugin Registration

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![/* your commands */])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

Corresponding `src-tauri/capabilities/default.json`:

```json
{
    "$schema": "../gen/schemas/desktop-schema.json",
    "identifier": "default",
    "description": "Default capabilities for the main window",
    "windows": ["main"],
    "permissions": [
        "core:default",
        "shell:default",
        "fs:default",
        "dialog:default"
    ]
}
```

---

## Example 11: Window Close Prevention

```rust
use tauri::Manager;

tauri::Builder::default()
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            // Prevent close and hide instead
            api.prevent_close();
            window.hide().unwrap();
        }
    })
```

---

## Example 12: Structured Error Types for Frontend

```rust
#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
enum AppError {
    Io(String),
    NotFound(String),
    Unauthorized(String),
}

#[tauri::command]
fn load_data(path: String) -> Result<String, AppError> {
    if !std::path::Path::new(&path).exists() {
        return Err(AppError::NotFound(format!("File not found: {}", path)));
    }
    std::fs::read_to_string(&path).map_err(|e| AppError::Io(e.to_string()))
}
```

```typescript
try {
    await invoke('load_data', { path: '/missing.txt' });
} catch (err: any) {
    // err = { kind: "notFound", message: "File not found: /missing.txt" }
    if (err.kind === 'notFound') {
        showNotFoundUI(err.message);
    }
}
```
