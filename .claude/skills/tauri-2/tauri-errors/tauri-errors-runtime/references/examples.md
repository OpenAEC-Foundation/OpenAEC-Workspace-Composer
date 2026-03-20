# tauri-errors-runtime: Error Handling Patterns

All examples verified against Tauri 2.x documentation.
Sources: v2.tauri.app/develop/, vooronderzoek-tauri.md sections 2.1, 2.2, 2.3, 10.1, 10.2

---

## Example 1: Complete Error Handling Setup

```rust
// src-tauri/src/error.rs
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("database error: {0}")]
    Database(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

```rust
// src-tauri/src/commands.rs
use crate::error::{AppError, AppResult};

#[tauri::command]
pub async fn read_config(path: String) -> AppResult<String> {
    let content = tokio::fs::read_to_string(&path).await?;
    Ok(content)
}

#[tauri::command]
pub async fn find_item(id: u32) -> AppResult<String> {
    if id == 0 {
        return Err(AppError::NotFound(format!("Item {id} not found")));
    }
    Ok(format!("Item {id}"))
}
```

```typescript
// Frontend error handling
try {
    const config = await invoke<string>('read_config', { path: '/app/config.toml' });
    console.log('Config loaded:', config);
} catch (error) {
    // error is the serialized string from AppError
    console.error('Failed to load config:', error);
}
```

---

## Example 2: Structured Errors for Frontend

```rust
#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
pub enum AppError {
    Io(String),
    NotFound(String),
    Unauthorized(String),
    Validation(String),
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

#[tauri::command]
async fn load_data(path: String) -> Result<String, AppError> {
    if !std::path::Path::new(&path).exists() {
        return Err(AppError::NotFound(format!("File not found: {path}")));
    }
    let content = std::fs::read_to_string(&path)?;
    Ok(content)
}
```

```typescript
try {
    await invoke('load_data', { path: '/missing.txt' });
} catch (err: any) {
    // err = { kind: "notFound", message: "File not found: /missing.txt" }
    switch (err.kind) {
        case 'notFound':
            showNotFoundUI(err.message);
            break;
        case 'unauthorized':
            redirectToLogin();
            break;
        default:
            showGenericError(err.message);
    }
}
```

---

## Example 3: Safe State Management

```rust
use std::sync::Mutex;
use tauri::State;

#[derive(Default)]
struct AppState {
    counter: u32,
    last_action: String,
}

// Registration in Builder
tauri::Builder::default()
    .manage(Mutex::new(AppState::default()))
    .invoke_handler(tauri::generate_handler![
        increment,
        get_count,
    ])

// Command using mutable state
#[tauri::command]
fn increment(state: State<'_, Mutex<AppState>>) -> u32 {
    let mut app_state = state.lock().unwrap();
    app_state.counter += 1;
    app_state.last_action = "increment".into();
    app_state.counter
}

// Command using read-only state
#[tauri::command]
fn get_count(state: State<'_, Mutex<AppState>>) -> u32 {
    let app_state = state.lock().unwrap();
    app_state.counter
}
```

---

## Example 4: Safe State with RwLock

```rust
use std::sync::RwLock;

#[derive(Default)]
struct Cache {
    entries: Vec<String>,
}

tauri::Builder::default()
    .manage(RwLock::new(Cache::default()))

#[tauri::command]
fn read_cache(state: State<'_, RwLock<Cache>>) -> Vec<String> {
    let cache = state.read().unwrap();  // Multiple readers allowed
    cache.entries.clone()
}

#[tauri::command]
fn add_to_cache(state: State<'_, RwLock<Cache>>, entry: String) {
    let mut cache = state.write().unwrap();  // Exclusive writer
    cache.entries.push(entry);
}
```

---

## Example 5: Safe Window Access

```rust
#[tauri::command]
fn show_settings(app: tauri::AppHandle) -> Result<(), String> {
    match app.get_webview_window("settings") {
        Some(window) => {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
            Ok(())
        }
        None => Err("Settings window not found".into()),
    }
}
```

---

## Example 6: Event Listener Cleanup in React

```typescript
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

interface ProgressData {
    percent: number;
    message: string;
}

function ProgressBar() {
    const [progress, setProgress] = useState<ProgressData>({ percent: 0, message: '' });

    useEffect(() => {
        // listen() returns Promise<UnlistenFn>
        const unlistenPromise = listen<ProgressData>('download-progress', (event) => {
            setProgress(event.payload);
        });

        // Cleanup on unmount
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    return <div>{progress.percent}% - {progress.message}</div>;
}
```

---

## Example 7: Async State with tokio::sync::Mutex

```rust
use tokio::sync::Mutex as TokioMutex;

struct Database {
    connection: String,
}

impl Database {
    async fn query(&self, sql: &str) -> Result<String, String> {
        // Simulated async database query
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        Ok(format!("Result of: {sql}"))
    }
}

tauri::Builder::default()
    .manage(TokioMutex::new(Database {
        connection: "sqlite://app.db".into(),
    }))

#[tauri::command]
async fn query_db(
    state: State<'_, TokioMutex<Database>>,
    sql: String,
) -> Result<String, String> {
    let db = state.lock().await;  // tokio Mutex: can hold across .await
    db.query(&sql).await
}
```

---

## Example 8: Global Panic Handler

```rust
.setup(|app| {
    // Set a custom panic hook for better error reporting
    let handle = app.handle().clone();
    std::panic::set_hook(Box::new(move |panic_info| {
        let msg = format!("Application panic: {panic_info}");
        eprintln!("{msg}");

        // Optionally emit to frontend before crash
        let _ = handle.emit("app-panic", msg);
    }));

    Ok(())
})
```
