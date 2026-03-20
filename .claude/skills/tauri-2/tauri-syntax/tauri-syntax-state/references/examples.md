# tauri-syntax-state: Working Code Examples

All examples based on Tauri 2.x documentation:
- https://v2.tauri.app/develop/state-management/
- https://docs.rs/tauri/2/tauri/struct.State.html

---

## Example 1: Simple Counter with Mutex

```rust
// Tauri 2.x — Mutable counter state
use std::sync::Mutex;

#[derive(Default)]
struct Counter {
    value: u32,
}

#[tauri::command]
fn increment(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    let mut counter = state.lock().unwrap();
    counter.value += 1;
    counter.value
}

#[tauri::command]
fn get_count(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    state.lock().unwrap().value
}

#[tauri::command]
fn reset(state: tauri::State<'_, Mutex<Counter>>) {
    state.lock().unwrap().value = 0;
}

// In lib.rs:
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(Counter::default()))
        .invoke_handler(tauri::generate_handler![increment, get_count, reset])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

```typescript
// Tauri 2.x — TypeScript: interact with counter
import { invoke } from '@tauri-apps/api/core';

const count = await invoke<number>('increment');
console.log(`Count: ${count}`);

const current = await invoke<number>('get_count');
console.log(`Current: ${current}`);

await invoke('reset');
```

---

## Example 2: Application Config (Immutable State)

```rust
// Tauri 2.x — Read-only configuration, no Mutex needed
struct AppConfig {
    api_url: String,
    max_retries: u32,
    debug_mode: bool,
}

#[tauri::command]
fn get_api_url(config: tauri::State<'_, AppConfig>) -> String {
    config.api_url.clone()
}

#[tauri::command]
fn is_debug(config: tauri::State<'_, AppConfig>) -> bool {
    config.debug_mode
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppConfig {
            api_url: "https://api.example.com".into(),
            max_retries: 3,
            debug_mode: cfg!(debug_assertions),
        })
        .invoke_handler(tauri::generate_handler![get_api_url, is_debug])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Example 3: State Initialization in setup()

```rust
// Tauri 2.x — State that depends on app paths
use std::sync::Mutex;

struct DatabaseState {
    path: std::path::PathBuf,
    connection_count: u32,
}

#[tauri::command]
fn get_db_path(db: tauri::State<'_, Mutex<DatabaseState>>) -> String {
    db.lock().unwrap().path.to_string_lossy().to_string()
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = app.path().app_data_dir()?.join("app.db");

            // Ensure directory exists
            std::fs::create_dir_all(db_path.parent().unwrap())?;

            app.manage(Mutex::new(DatabaseState {
                path: db_path,
                connection_count: 0,
            }));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_db_path])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Example 4: RwLock for Read-Heavy Workload

```rust
// Tauri 2.x — Many concurrent readers, occasional writer
use std::sync::RwLock;

#[derive(Default, Clone, serde::Serialize)]
struct Document {
    title: String,
    content: String,
    revision: u32,
}

struct DocumentStore {
    documents: Vec<Document>,
}

#[tauri::command]
fn list_documents(store: tauri::State<'_, RwLock<DocumentStore>>) -> Vec<Document> {
    let data = store.read().unwrap();
    data.documents.clone()
}

#[tauri::command]
fn get_document(
    store: tauri::State<'_, RwLock<DocumentStore>>,
    index: usize,
) -> Result<Document, String> {
    let data = store.read().unwrap();
    data.documents.get(index).cloned().ok_or("Not found".into())
}

#[tauri::command]
fn add_document(
    store: tauri::State<'_, RwLock<DocumentStore>>,
    title: String,
    content: String,
) {
    let mut data = store.write().unwrap();
    data.documents.push(Document {
        title,
        content,
        revision: 1,
    });
}

pub fn run() {
    tauri::Builder::default()
        .manage(RwLock::new(DocumentStore { documents: vec![] }))
        .invoke_handler(tauri::generate_handler![
            list_documents, get_document, add_document
        ])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Example 5: Async Command with tokio::sync::Mutex

```rust
// Tauri 2.x — Hold lock across .await points
use tokio::sync::Mutex;

struct ApiClient {
    base_url: String,
    request_count: u32,
}

#[tauri::command]
async fn fetch_data(
    client: tauri::State<'_, Mutex<ApiClient>>,
    endpoint: String,
) -> Result<String, String> {
    let mut api = client.lock().await;
    api.request_count += 1;

    let url = format!("{}/{}", api.base_url, endpoint);
    // Lock is held across this .await — requires tokio Mutex
    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    let body = response.text().await.map_err(|e| e.to_string())?;

    Ok(body)
}

pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(ApiClient {
            base_url: "https://api.example.com".into(),
            request_count: 0,
        }))
        .invoke_handler(tauri::generate_handler![fetch_data])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Example 6: Multiple State Types

```rust
// Tauri 2.x — Register and use multiple independent state types
use std::sync::Mutex;

struct AppConfig {
    app_name: String,
    version: String,
}

#[derive(Default)]
struct UserSession {
    username: Option<String>,
    is_authenticated: bool,
}

#[derive(Default)]
struct AppMetrics {
    command_count: u64,
    error_count: u64,
}

#[tauri::command]
fn get_app_info(config: tauri::State<'_, AppConfig>) -> String {
    format!("{} v{}", config.app_name, config.version)
}

#[tauri::command]
fn login(
    session: tauri::State<'_, Mutex<UserSession>>,
    metrics: tauri::State<'_, Mutex<AppMetrics>>,
    username: String,
) -> bool {
    let mut s = session.lock().unwrap();
    let mut m = metrics.lock().unwrap();
    m.command_count += 1;
    s.username = Some(username);
    s.is_authenticated = true;
    true
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppConfig {
            app_name: "My App".into(),
            version: "1.0.0".into(),
        })
        .manage(Mutex::new(UserSession::default()))
        .manage(Mutex::new(AppMetrics::default()))
        .invoke_handler(tauri::generate_handler![get_app_info, login])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Example 7: Background Thread Accessing State

```rust
// Tauri 2.x — Access state from a spawned thread via AppHandle
use std::sync::Mutex;
use tauri::Emitter;

#[derive(Default)]
struct SyncStatus {
    last_sync: Option<String>,
    syncing: bool,
}

pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(SyncStatus::default()))
        .setup(|app| {
            let handle = app.handle().clone();

            std::thread::spawn(move || {
                loop {
                    // Access state via AppHandle
                    {
                        let state = handle.state::<Mutex<SyncStatus>>();
                        let mut status = state.lock().unwrap();
                        status.syncing = true;
                    } // Lock released before sleep

                    // Simulate sync work
                    std::thread::sleep(std::time::Duration::from_secs(60));

                    {
                        let state = handle.state::<Mutex<SyncStatus>>();
                        let mut status = state.lock().unwrap();
                        status.syncing = false;
                        status.last_sync = Some(
                            chrono::Utc::now().to_rfc3339()
                        );
                    }

                    handle.emit("sync-complete", ()).unwrap();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Example 8: Safe State Access with try_state

```rust
// Tauri 2.x — Gracefully handle missing state
use std::sync::Mutex;

struct PluginData {
    enabled: bool,
}

#[tauri::command]
fn check_plugin(handle: tauri::AppHandle) -> String {
    match handle.try_state::<Mutex<PluginData>>() {
        Some(state) => {
            let data = state.lock().unwrap();
            if data.enabled { "enabled".into() } else { "disabled".into() }
        }
        None => "plugin not loaded".into(),
    }
}
```
