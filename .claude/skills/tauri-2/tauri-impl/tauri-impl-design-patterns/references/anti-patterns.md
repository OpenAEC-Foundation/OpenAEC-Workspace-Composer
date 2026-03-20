# tauri-impl-design-patterns: Architectural Anti-Patterns

These are confirmed architectural mistakes in Tauri 2 application design. Each entry documents the WRONG approach, the CORRECT approach, and the WHY.

Sources: vooronderzoek-tauri.md sections 2, 3, 10, v2.tauri.app/concept/

---

## DAP-001: Using Events for Request/Response

**WHY this is wrong**: Events are fire-and-forget. There is no built-in correlation between a request event and a response event. You end up building your own correlation layer (request IDs, matching listeners) which is exactly what `invoke()` already provides.

```typescript
// WRONG -- using events as poor man's RPC
await emit('get-user-request', { userId: 42 });
const unlisten = await listen('get-user-response', (event) => {
    // Which request does this response belong to?
    // What if multiple components are requesting?
    setUser(event.payload);
});
```

```typescript
// CORRECT -- use commands for request/response
const user = await invoke<User>('get_user', { userId: 42 });
setUser(user);
```

ALWAYS use commands (invoke) for request/response patterns. NEVER use events as RPC.

---

## DAP-002: Doing Heavy Computation in JavaScript

**WHY this is wrong**: The webview JavaScript engine is single-threaded and shares the UI thread. Heavy computation blocks rendering, causing freezes and poor user experience. Rust's async runtime and native performance handle computation without affecting the UI.

```typescript
// WRONG -- blocks UI thread
function processLargeDataset(data: number[]): number[] {
    return data.map(x => expensiveCalculation(x));  // Freezes UI
}
```

```rust
// CORRECT -- offload to Rust
#[tauri::command]
async fn process_large_dataset(data: Vec<f64>) -> Vec<f64> {
    // Runs on tokio runtime, UI stays responsive
    data.iter().map(|x| expensive_calculation(*x)).collect()
}
```

ALWAYS move computation over 10ms to Rust. NEVER do heavy processing in JavaScript.

---

## DAP-003: Chatty IPC (Too Many Small Calls)

**WHY this is wrong**: Each `invoke()` call has serialization overhead (Rust -> JSON -> JS and back). Hundreds of small calls cause noticeable latency and poor performance.

```typescript
// WRONG -- N IPC calls
for (const item of items) {
    await invoke('save_item', { item });  // 100 roundtrips!
}
```

```typescript
// CORRECT -- 1 IPC call with batch
await invoke('save_items', { items });  // 1 roundtrip
```

```rust
#[tauri::command]
async fn save_items(items: Vec<Item>) -> AppResult<u32> {
    for item in &items {
        db.insert(item)?;
    }
    Ok(items.len() as u32)
}
```

ALWAYS batch operations into single IPC calls. NEVER loop invoke() in the frontend.

---

## DAP-004: Storing Secrets in Frontend

**WHY this is wrong**: JavaScript in the webview is accessible to browser devtools, extensions, and potentially XSS. Secrets stored in localStorage, sessionStorage, or JS variables are exposed.

```typescript
// WRONG -- secret in frontend
const apiKey = localStorage.getItem('apiKey');
const token = sessionStorage.getItem('authToken');
```

```rust
// CORRECT -- secrets in Rust state (or keyring/stronghold plugin)
#[tauri::command]
fn make_authenticated_request(
    state: State<'_, Mutex<AuthState>>,
    endpoint: String,
) -> AppResult<String> {
    let auth = state.lock().unwrap();
    let token = &auth.token;  // Token never leaves Rust
    // Make request with token...
    Ok(response)
}
```

ALWAYS store secrets in Rust state or the Stronghold plugin. NEVER expose secrets to JavaScript.

---

## DAP-005: Using Commands for Push Notifications

**WHY this is wrong**: Commands are pull-based (frontend initiates). For server-push patterns (background task completion, real-time updates), the frontend would need to poll with repeated invoke() calls, wasting resources.

```typescript
// WRONG -- polling pattern
setInterval(async () => {
    const status = await invoke('check_status');  // Wasteful polling
    if (status.changed) updateUI(status);
}, 1000);
```

```rust
// CORRECT -- Rust pushes via events
async fn background_task(app: AppHandle) {
    loop {
        let result = do_work().await;
        app.emit("task-update", result).unwrap();  // Push when ready
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}
```

ALWAYS use events for push notifications from Rust. NEVER poll with invoke() loops.

---

## DAP-006: Putting All State in Rust

**WHY this is wrong**: UI-specific state (form values, scroll position, animation state, modal visibility) should live in the frontend framework's state management. Routing it through Rust adds unnecessary IPC overhead and complexity.

```rust
// WRONG -- Rust tracks UI state
struct AppState {
    sidebar_open: bool,      // UI concern
    scroll_position: f64,    // UI concern
    selected_tab: String,    // UI concern
    modal_visible: bool,     // UI concern
    data: Vec<Item>,         // This one is OK
}
```

```rust
// CORRECT -- Rust only tracks business state
struct AppState {
    data: Vec<Item>,
    config: AppConfig,
    last_sync: Option<DateTime>,
}
```

```typescript
// Frontend handles UI state
const [sidebarOpen, setSidebarOpen] = useState(true);
const [selectedTab, setSelectedTab] = useState('home');
```

ALWAYS put UI state in the frontend. ALWAYS put business/persistent state in Rust.

---

## DAP-007: Loading Large Files Through invoke()

**WHY this is wrong**: `invoke()` serializes data to JSON. A 10MB image becomes a JSON array of numbers, bloating to ~30MB and requiring deserialization. The asset protocol serves files natively with zero-copy.

```typescript
// WRONG -- loads entire file through JSON
const imageData = await invoke<number[]>('read_image', { path });
const blob = new Blob([new Uint8Array(imageData)]);
img.src = URL.createObjectURL(blob);
```

```typescript
// CORRECT -- native asset protocol
import { convertFileSrc } from '@tauri-apps/api/core';
img.src = convertFileSrc(imagePath);  // Zero-copy, native performance
```

For binary command responses, use `tauri::ipc::Response`:

```rust
#[tauri::command]
fn read_binary(path: String) -> Result<tauri::ipc::Response, AppError> {
    let data = std::fs::read(&path)?;
    Ok(tauri::ipc::Response::new(data))  // Bypasses JSON
}
```

ALWAYS use asset protocol for images/media. Use `ipc::Response` for binary command data. NEVER serialize large binaries through JSON.

---

## DAP-008: No Error Boundary Strategy

**WHY this is wrong**: Without structured error handling, all errors become opaque strings or unhandled rejections. The frontend cannot distinguish recoverable errors from fatal ones, leading to poor UX.

```rust
// WRONG -- all errors are strings
fn load(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}
```

```rust
// CORRECT -- structured errors with severity
#[derive(serde::Serialize)]
#[serde(tag = "severity")]
enum AppError {
    #[serde(rename = "recoverable")]
    Recoverable { message: String },
    #[serde(rename = "validation")]
    Validation { field: String, message: String },
    #[serde(rename = "fatal")]
    Fatal { message: String },
}
```

ALWAYS design error types with frontend consumption in mind. ALWAYS include error severity or category.

---

## DAP-009: Ignoring Multi-Window State Sync

**WHY this is wrong**: When multiple windows share state, modifying state from one window without notifying others leads to stale UIs and data inconsistency.

```rust
// WRONG -- updates state but does not notify other windows
#[tauri::command]
fn update_config(state: State<'_, Mutex<Config>>, key: String, value: String) {
    let mut config = state.lock().unwrap();
    config.set(&key, &value);
    // Other windows show stale config!
}
```

```rust
// CORRECT -- update + notify
#[tauri::command]
fn update_config(
    app: tauri::AppHandle,
    state: State<'_, Mutex<Config>>,
    key: String,
    value: String,
) -> AppResult<()> {
    {
        let mut config = state.lock().unwrap();
        config.set(&key, &value);
    }
    // Notify ALL windows of the change
    app.emit("config-changed", ConfigUpdate { key, value })?;
    Ok(())
}
```

ALWAYS emit events when shared state changes in multi-window apps.

---

## DAP-010: Synchronous I/O in Commands

**WHY this is wrong**: Synchronous I/O blocks the main thread. While the file reads/writes, the entire app freezes -- no window events, no rendering, no user interaction.

```rust
// WRONG -- blocks main thread
#[tauri::command]
fn load_all_data() -> Vec<Item> {
    let files = std::fs::read_dir("data/").unwrap();
    files.filter_map(|f| {
        let content = std::fs::read_to_string(f.unwrap().path()).unwrap();
        serde_json::from_str(&content).ok()
    }).collect()
}
```

```rust
// CORRECT -- async, non-blocking
#[tauri::command]
async fn load_all_data() -> AppResult<Vec<Item>> {
    let mut entries = tokio::fs::read_dir("data/").await?;
    let mut items = Vec::new();
    while let Some(entry) = entries.next_entry().await? {
        let content = tokio::fs::read_to_string(entry.path()).await?;
        if let Ok(item) = serde_json::from_str(&content) {
            items.push(item);
        }
    }
    Ok(items)
}
```

ALWAYS use async + tokio for file and network I/O. NEVER use std::fs in command handlers.

---

## Tradeoff Summary Table

| Decision | Option A | Option B | Choose A When | Choose B When |
|----------|----------|----------|---------------|---------------|
| Storage | Files (fs plugin) | Database (sql plugin) | User needs file access, simple data | Complex queries, relations, transactions |
| IPC | Commands | Events | Request/response, CRUD | Push notifications, broadcasts |
| State lock | Mutex | RwLock | Balanced read/write | Many concurrent readers |
| Data loading | Eager (all at once) | Lazy (pagination) | Small dataset (<100 items) | Large dataset or slow loading |
| Thumbnails | Asset protocol | Base64 in commands | Images on disk | Generated/computed images |
| Error handling | String errors | Structured enums | Prototyping | Production apps |
| Window pattern | Single window | Multi-window | Simple apps | Complex workflows |
