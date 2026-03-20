# tauri-syntax-commands: Examples Reference

> Tauri 2.x. Every Rust command includes a matching TypeScript invoke() call.

## Example 1: Sync Command — Simple Calculation

```rust
#[tauri::command]
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```typescript
const sum = await invoke<number>('add', { a: 5, b: 3 });
console.log(sum); // 8
```

## Example 2: Sync Command — Returning a Struct

```rust
#[derive(serde::Serialize)]
struct SystemInfo {
    os: String,
    arch: String,
    memory_mb: u64,
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
        memory_mb: 8192,
    }
}
```

```typescript
interface SystemInfo {
    os: string;
    arch: string;
    memoryMb: number;  // camelCase in JS
}

const info = await invoke<SystemInfo>('get_system_info');
console.log(`Running on ${info.os} (${info.arch})`);
```

## Example 3: Async Command — File Operations

```rust
#[tauri::command]
async fn read_config(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_config(path: String, content: String) -> Result<(), String> {
    tokio::fs::write(&path, &content)
        .await
        .map_err(|e| e.to_string())
}
```

```typescript
// Read
try {
    const config = await invoke<string>('read_config', { path: '/app/config.json' });
    console.log('Config loaded:', config);
} catch (error) {
    console.error('Read failed:', error);
}

// Write
try {
    await invoke('write_config', {
        path: '/app/config.json',
        content: JSON.stringify({ theme: 'dark' }),
    });
} catch (error) {
    console.error('Write failed:', error);
}
```

## Example 4: Async Command — Network Request

```rust
#[tauri::command]
async fn fetch_json(url: String) -> Result<serde_json::Value, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?;
    let json = response.json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(json)
}
```

```typescript
try {
    const data = await invoke<Record<string, unknown>>('fetch_json', {
        url: 'https://api.example.com/data',
    });
    console.log('Fetched:', data);
} catch (error) {
    console.error('Fetch failed:', error);
}
```

## Example 5: Error Handling — thiserror Pattern (Recommended)

```rust
#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("database error: {0}")]
    Database(String),
    #[error("validation error: {field} - {message}")]
    Validation { field: String, message: String },
    #[error("not found")]
    NotFound,
}

// REQUIRED: Manual Serialize impl to send error to frontend as string
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
async fn open_document(path: String) -> Result<String, AppError> {
    let content = std::fs::read_to_string(&path)?; // auto-converts via #[from]
    if content.is_empty() {
        return Err(AppError::Validation {
            field: "content".into(),
            message: "File is empty".into(),
        });
    }
    Ok(content)
}
```

```typescript
try {
    const doc = await invoke<string>('open_document', { path: '/docs/file.txt' });
} catch (error) {
    // error is a string: "not found", "database error: ...", etc.
    console.error('Error:', error);
}
```

## Example 6: Structured Errors — Tagged Enum

```rust
#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
enum ApiError {
    NetworkError(String),
    AuthFailed(String),
    NotFound(String),
    RateLimited { retry_after: u64 },
}

#[tauri::command]
async fn api_call(endpoint: String) -> Result<String, ApiError> {
    Err(ApiError::RateLimited { retry_after: 30 })
}
```

```typescript
interface ApiError {
    kind: 'networkError' | 'authFailed' | 'notFound' | 'rateLimited';
    message: string | { retryAfter: number };
}

try {
    await invoke<string>('api_call', { endpoint: '/users' });
} catch (err: unknown) {
    const error = err as ApiError;
    if (error.kind === 'rateLimited') {
        const data = error.message as { retryAfter: number };
        console.log(`Retry after ${data.retryAfter}s`);
    }
}
```

## Example 7: Custom Deserialized Argument

```rust
#[derive(serde::Deserialize)]
struct SearchQuery {
    text: String,
    case_sensitive: bool,
    max_results: Option<u32>,
    file_types: Vec<String>,
}

#[derive(serde::Serialize)]
struct SearchResult {
    file_path: String,
    line_number: u32,
    snippet: String,
}

#[tauri::command]
async fn search(query: SearchQuery) -> Result<Vec<SearchResult>, String> {
    // ... search implementation
    Ok(vec![SearchResult {
        file_path: "/src/main.rs".into(),
        line_number: 42,
        snippet: "fn main()".into(),
    }])
}
```

```typescript
interface SearchQuery {
    text: string;
    caseSensitive: boolean;
    maxResults?: number;
    fileTypes: string[];
}

interface SearchResult {
    filePath: string;
    lineNumber: number;
    snippet: string;
}

const results = await invoke<SearchResult[]>('search', {
    query: {
        text: 'hello',
        caseSensitive: false,
        maxResults: 100,
        fileTypes: ['.rs', '.ts'],
    },
});
```

## Example 8: State Access in Commands

```rust
use std::sync::Mutex;

#[derive(Default)]
struct Counter {
    value: u32,
}

// Register: app.manage(Mutex::new(Counter::default()));

#[tauri::command]
fn get_count(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    state.lock().unwrap().value
}

#[tauri::command]
fn increment(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    let mut counter = state.lock().unwrap();
    counter.value += 1;
    counter.value
}
```

```typescript
const count = await invoke<number>('get_count');
console.log('Current:', count);

const newCount = await invoke<number>('increment');
console.log('After increment:', newCount);
```

## Example 9: AppHandle and Window in Commands

```rust
use tauri::{AppHandle, WebviewWindow, Emitter, Manager};

#[tauri::command]
fn notify_all(app: AppHandle, message: String) -> Result<(), String> {
    app.emit("notification", &message).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_window_title(window: WebviewWindow) -> Result<String, String> {
    window.title().map_err(|e| e.to_string())
}

#[tauri::command]
fn focus_window(app: AppHandle, label: String) -> Result<(), String> {
    let win = app.get_webview_window(&label)
        .ok_or_else(|| format!("Window '{}' not found", label))?;
    win.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}
```

```typescript
await invoke('notify_all', { message: 'Hello everyone!' });

const title = await invoke<string>('get_window_title');
console.log('Window title:', title);

await invoke('focus_window', { label: 'settings' });
```

## Example 10: Channel — Progress Streaming

```rust
use tauri::ipc::Channel;

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ProcessingUpdate {
    step: String,
    progress: f64,
    items_processed: u32,
    total_items: u32,
}

#[tauri::command]
async fn process_batch(
    items: Vec<String>,
    on_progress: Channel<ProcessingUpdate>,
) -> Result<String, String> {
    let total = items.len() as u32;

    for (i, item) in items.iter().enumerate() {
        // Do work...
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        // Send progress update
        on_progress.send(ProcessingUpdate {
            step: format!("Processing: {}", item),
            progress: (i + 1) as f64 / total as f64 * 100.0,
            items_processed: (i + 1) as u32,
            total_items: total,
        }).map_err(|e| e.to_string())?;
    }

    Ok(format!("Processed {} items", total))
}
```

```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

interface ProcessingUpdate {
    step: string;
    progress: number;
    itemsProcessed: number;
    totalItems: number;
}

const onProgress = new Channel<ProcessingUpdate>();
onProgress.onmessage = (update) => {
    progressBar.style.width = `${update.progress}%`;
    statusText.textContent = update.step;
    counterText.textContent = `${update.itemsProcessed}/${update.totalItems}`;
};

const result = await invoke<string>('process_batch', {
    items: ['file1.txt', 'file2.txt', 'file3.txt'],
    onProgress,
});
console.log(result); // "Processed 3 items"
```

## Example 11: Binary Data — Upload and Download

```rust
use tauri::ipc::{Request, Response};

// Upload: receive binary from JS
#[tauri::command]
fn upload_file(request: Request) -> Result<String, String> {
    let tauri::ipc::InvokeBody::Raw(data) = request.body() else {
        return Err("Expected binary body".into());
    };

    let filename = request.headers()
        .get("x-filename")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unnamed");

    std::fs::write(format!("/tmp/{}", filename), data)
        .map_err(|e| e.to_string())?;

    Ok(format!("Saved {} ({} bytes)", filename, data.len()))
}

// Download: send binary to JS
#[tauri::command]
fn download_file(path: String) -> Result<Response, String> {
    let data = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Response::new(data))
}
```

```typescript
// Upload binary
const file = await fileInput.files[0].arrayBuffer();
const result = await invoke<string>('upload_file', new Uint8Array(file), {
    headers: { 'x-filename': 'photo.jpg' },
});

// Download binary
const data = await invoke<ArrayBuffer>('download_file', {
    path: '/tmp/photo.jpg',
});
const blob = new Blob([data], { type: 'image/jpeg' });
const url = URL.createObjectURL(blob);
```

## Example 12: Binary Streaming with Channel

```rust
use tauri::ipc::Channel;

#[tauri::command]
async fn stream_file(
    path: std::path::PathBuf,
    reader: Channel<&[u8]>,
) {
    use tokio::io::AsyncReadExt;

    let mut file = tokio::fs::File::open(path).await.unwrap();
    let mut chunk = vec![0u8; 4096];

    loop {
        let len = file.read(&mut chunk).await.unwrap();
        if len == 0 { break; }
        reader.send(&chunk[..len]).unwrap();
    }
}
```

```typescript
const chunks: Uint8Array[] = [];
const reader = new Channel<Uint8Array>();
reader.onmessage = (chunk) => {
    chunks.push(chunk);
};

await invoke('stream_file', { path: '/large-file.bin', reader });
console.log(`Received ${chunks.length} chunks`);
```

## Example 13: Optional Arguments

```rust
#[tauri::command]
fn search_items(
    query: String,
    page: Option<u32>,
    per_page: Option<u32>,
    sort_by: Option<String>,
) -> Vec<String> {
    let page = page.unwrap_or(1);
    let per_page = per_page.unwrap_or(20);
    // ... search logic
    vec![]
}
```

```typescript
// All optional args omitted
const results1 = await invoke<string[]>('search_items', { query: 'test' });

// Some optional args provided
const results2 = await invoke<string[]>('search_items', {
    query: 'test',
    page: 2,
    perPage: 50,
});
```

## Example 14: Command with isTauri() Guard (Dual Environment)

```typescript
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@tauri-apps/api/core';

async function loadData(): Promise<Data> {
    if (isTauri()) {
        // Running in Tauri — use IPC
        return await invoke<Data>('load_data');
    } else {
        // Running in browser — use HTTP API
        const response = await fetch('/api/data');
        return await response.json();
    }
}
```

## Example 15: Command Registration — Complete Pattern

```rust
// src-tauri/src/commands/mod.rs
mod auth;
mod files;
mod settings;

pub use auth::*;
pub use files::*;
pub use settings::*;

// src-tauri/src/commands/auth.rs
#[tauri::command]
pub async fn login(username: String, password: String) -> Result<String, String> {
    Ok("token-123".into())
}

#[tauri::command]
pub fn logout(state: tauri::State<'_, std::sync::Mutex<Session>>) {
    *state.lock().unwrap() = Session::default();
}

// src-tauri/src/lib.rs
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(std::sync::Mutex::new(Session::default()))
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::login,
            commands::logout,
            // Files
            commands::read_file,
            commands::write_file,
            // Settings
            commands::get_settings,
            commands::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
