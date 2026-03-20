# tauri-errors-ipc: IPC API Method Reference

Sources: https://v2.tauri.app/develop/calling-rust/,
https://docs.rs/tauri/latest/tauri/command/index.html,
vooronderzoek-tauri.md Section 2.1 (Commands System)

---

## Frontend: invoke()

```typescript
import { invoke } from '@tauri-apps/api/core';

// invoke<T>(cmd: string, args?: InvokeArgs, options?: InvokeOptions): Promise<T>
const result = await invoke<string>('greet', { name: 'World' });
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cmd` | `string` | Yes | Command name (snake_case, matches Rust function name) |
| `args` | `Record<string, unknown>` | No | Arguments object (keys in camelCase) |
| `options` | `InvokeOptions` | No | Headers for the IPC request |

### InvokeOptions

```typescript
interface InvokeOptions {
  headers?: Headers | Record<string, string>;
}
```

---

## Rust: #[tauri::command] Macro

### Basic Signatures

```rust
// Sync command (runs on main thread)
#[tauri::command]
fn sync_cmd(arg: String) -> String { ... }

// Async command (runs on tokio runtime)
#[tauri::command]
async fn async_cmd(arg: String) -> Result<String, Error> { ... }

// Force sync function to run on async runtime
#[tauri::command(async)]
fn forced_async(arg: String) -> String { ... }

// Change argument naming convention
#[tauri::command(rename_all = "snake_case")]
fn renamed_cmd(user_name: String) { ... }
```

### Attribute Options

| Attribute | Effect | Default |
|-----------|--------|---------|
| `(async)` | Run sync function on async runtime instead of main thread | Sync on main thread |
| `(rename_all = "snake_case")` | JS arguments use snake_case | camelCase |

---

## Argument Name Conversion

Default behavior (no `rename_all`):

| Rust Parameter | JavaScript Key | Notes |
|----------------|---------------|-------|
| `file_path` | `filePath` | snake_case to camelCase |
| `user_name` | `userName` | snake_case to camelCase |
| `item_count` | `itemCount` | snake_case to camelCase |
| `id` | `id` | Single word unchanged |

With `rename_all = "snake_case"`:

| Rust Parameter | JavaScript Key |
|----------------|---------------|
| `file_path` | `file_path` |
| `user_name` | `user_name` |

---

## Type Mapping: Rust to JavaScript

### Argument Types (Rust receives from JS)

All argument types must implement `serde::Deserialize`.

| Rust Type | JavaScript Type | JSON Representation |
|-----------|----------------|-------------------|
| `String` | `string` | `"hello"` |
| `&str` | `string` | `"hello"` (sync commands only) |
| `i32`, `i64`, `u32`, `u64` | `number` | `42` |
| `f32`, `f64` | `number` | `3.14` |
| `bool` | `boolean` | `true` |
| `Vec<T>` | `T[]` | `[1, 2, 3]` |
| `Option<T>` | `T \| null` | `null` or value |
| `HashMap<String, T>` | `Record<string, T>` | `{"key": "value"}` |
| `PathBuf` | `string` | `"/path/to/file"` |
| Custom struct | object | `{"field": "value"}` |

### Return Types (Rust sends to JS)

All return types must implement `serde::Serialize`.

| Rust Return | JavaScript Receives | Notes |
|-------------|-------------------|-------|
| `()` | `null` | Void command |
| `String` | `string` | |
| `i32`, `u64`, etc. | `number` | |
| `bool` | `boolean` | |
| `Vec<T>` | `T[]` | |
| `Option<T>` | `T \| null` | |
| Custom struct | object | Struct must derive `Serialize` |
| `Result<T, E>` | `T` on Ok, throws `E` on Err | `E` must implement `Serialize` |

---

## Special Injected Parameters

These parameters are provided by Tauri at runtime. The frontend does NOT pass them:

```rust
#[tauri::command]
async fn my_cmd(
    app: tauri::AppHandle,             // Application handle
    window: tauri::WebviewWindow,      // The calling window
    state: tauri::State<'_, MyState>,  // Managed state
    request: tauri::ipc::Request,      // Raw IPC request
) -> Result<(), Error> { ... }
```

| Parameter Type | Provides | Usage |
|---------------|----------|-------|
| `tauri::AppHandle` | Application handle | Emit events, access state, manage windows |
| `tauri::WebviewWindow` | Calling window | Get window label, show/hide, emit to self |
| `tauri::State<'_, T>` | Managed state | Access registered state |
| `tauri::ipc::Request` | Raw IPC request | Access headers, raw body |

---

## Error Types

### InvokeError (Internal)

Tauri converts command errors to `InvokeError` internally. The error type in `Result<T, E>` must implement one of:
- `serde::Serialize` (recommended)
- `Into<InvokeError>`

### thiserror + Serialize Pattern

```rust
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("not found: {0}")]
    NotFound(String),
}

// Manual Serialize -- serializes as Display string
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

### Tagged Enum Pattern (Structured Errors)

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
// catch block receives: { kind: "notFound", message: "Item 42 not found" }
```

---

## Command Registration

```rust
// All commands in a single generate_handler! call
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        cmd_a,
        cmd_b,
        module::cmd_c,
    ])
```

| Rule | Description |
|------|-------------|
| Single `invoke_handler()` call | Multiple calls do NOT merge; only the last one applies |
| `#[tauri::command]` required | Functions without the attribute cause compile error in `generate_handler!` |
| `pub` in modules | Commands in separate modules must be `pub` |
| NOT `pub` in lib.rs | Commands directly in `lib.rs` must NOT be `pub` |

---

## Binary Data (Bypass JSON Serialization)

```rust
use tauri::ipc::Response;

#[tauri::command]
fn get_binary() -> Response {
    let data = std::fs::read("file.bin").unwrap();
    tauri::ipc::Response::new(data)
}
```

```rust
use tauri::ipc::Request;

#[tauri::command]
fn upload(request: Request) -> Result<(), Error> {
    let tauri::ipc::InvokeBody::Raw(data) = request.body() else {
        return Err(Error::InvalidBody);
    };
    // process raw bytes
    Ok(())
}
```
