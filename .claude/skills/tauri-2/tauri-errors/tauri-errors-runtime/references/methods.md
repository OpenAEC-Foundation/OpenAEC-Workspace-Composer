# tauri-errors-runtime: Error Types & State API Reference

Sources: v2.tauri.app/develop/, docs.rs/tauri/2.10.2, vooronderzoek-tauri.md sections 2.2, 10.1, 10.2

---

## Error Handling Types

### thiserror Pattern (Recommended)

```rust
#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("database error: {0}")]
    Database(String),
    #[error("not found")]
    NotFound,
    #[error("unauthorized")]
    Unauthorized,
}

// Required: manual Serialize for error types
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

### Structured Error Pattern (for frontend consumption)

```rust
#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
enum AppError {
    Io(String),
    NotFound(String),
    Unauthorized(String),
}
```

Frontend receives:
```typescript
// catch block receives: { kind: "notFound", message: "File missing" }
```

---

## State Management API

### Registration

| Method | Context | Signature |
|--------|---------|-----------|
| `Builder::manage()` | Builder chain | `.manage(T)` where `T: Send + Sync + 'static` |
| `App::manage()` | In `setup()` hook | `app.manage(T) -> bool` (returns false if already managed) |
| `AppHandle::manage()` | Anywhere with handle | `handle.manage(T) -> bool` |

### Access

| Method | Context | Signature |
|--------|---------|-----------|
| `State<'_, T>` | Command parameter | Injected automatically by Tauri |
| `Manager::state()` | Any Manager impl | `.state::<T>() -> State<'_, T>` -- panics if not managed |
| `Manager::try_state()` | Any Manager impl | `.try_state::<T>() -> Option<State<'_, T>>` -- safe |
| `Manager::unmanage()` | Any Manager impl | `.unmanage::<T>() -> Option<T>` -- removes and returns |

### Mutable State Patterns

| Pattern | Use When | Type to Manage |
|---------|----------|---------------|
| `Mutex<T>` | Most cases, short-lived locks | `app.manage(Mutex::new(data))` |
| `RwLock<T>` | Read-heavy, concurrent reads needed | `app.manage(RwLock::new(data))` |
| `tokio::sync::Mutex<T>` | Lock held across `.await` points | `app.manage(tokio::sync::Mutex::new(data))` |
| `AtomicU64` etc. | Simple counters/flags | `app.manage(AtomicU64::new(0))` |

---

## Manager Trait (Implemented by App, AppHandle, WebviewWindow, Window)

| Method | Return Type | Description |
|--------|-------------|-------------|
| `app_handle()` | `&AppHandle<R>` | Get app handle reference |
| `config()` | `&Config` | Access runtime config |
| `get_window(label)` | `Option<Window<R>>` | Get window by label |
| `get_webview_window(label)` | `Option<WebviewWindow<R>>` | Get webview window by label |
| `windows()` | `HashMap<String, Window<R>>` | All windows |
| `webview_windows()` | `HashMap<String, WebviewWindow<R>>` | All webview windows |
| `get_focused_window()` | `Option<Window<R>>` | Currently focused window |
| `state::<T>()` | `State<'_, T>` | Get managed state (panics if missing) |
| `try_state::<T>()` | `Option<State<'_, T>>` | Safe state access |
| `manage(T)` | `bool` | Register state (false if duplicate) |
| `unmanage::<T>()` | `Option<T>` | Remove and return state |
| `path()` | `&PathResolver<R>` | Path resolution utilities |

---

## Special Command Parameters (Auto-Injected)

| Parameter Type | What It Provides | Passed by Frontend? |
|----------------|-----------------|---------------------|
| `tauri::AppHandle` | Application handle | No -- injected |
| `tauri::WebviewWindow` | Calling window reference | No -- injected |
| `tauri::State<'_, T>` | Managed state reference | No -- injected |
| `tauri::ipc::Request` | Raw IPC request (headers, body) | No -- injected |
| `tauri::ipc::Channel<T>` | Streaming channel | Yes -- pass Channel from JS |
| `tauri::ipc::CommandScope<'_, T>` | Command-level scope | No -- injected |
| `tauri::ipc::GlobalScope<'_, T>` | Global scope | No -- injected |

---

## Event Name Validation

Allowed characters in event names: `[a-zA-Z0-9]`, `-`, `/`, `:`, `_`

| Character | Allowed? |
|-----------|----------|
| `a-z`, `A-Z`, `0-9` | Yes |
| `-` (hyphen) | Yes |
| `/` (slash) | Yes |
| `:` (colon) | Yes |
| `_` (underscore) | Yes |
| `.` (dot) | **No -- PANIC** |
| ` ` (space) | **No -- PANIC** |
| `@`, `#`, `$`, etc. | **No -- PANIC** |

---

## Emitter Trait Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `emit()` | `emit(event, payload) -> Result<()>` | Broadcast to all |
| `emit_str()` | `emit_str(event, json_string) -> Result<()>` | Broadcast pre-serialized |
| `emit_to()` | `emit_to(target, event, payload) -> Result<()>` | Emit to specific target |
| `emit_filter()` | `emit_filter(event, payload, filter_fn) -> Result<()>` | Emit with filter |

Payloads require `Serialize + Clone`.

## Listener Trait Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `listen()` | `listen(event, handler) -> EventId` | Listen for events |
| `once()` | `once(event, handler) -> EventId` | Listen once, auto-remove |
| `unlisten()` | `unlisten(id)` | Remove listener |
| `listen_any()` | `listen_any(event, handler) -> EventId` | Listen from any source |
| `once_any()` | `once_any(event, handler) -> EventId` | Once from any source |

---

## Frontend Error Types

```typescript
// invoke() rejection payload types
type InvokeError = string | Record<string, unknown>;

// Event callback type
interface Event<T> {
    event: string;
    id: number;
    payload: T;
}

// Unlisten function
type UnlistenFn = () => void;
```
