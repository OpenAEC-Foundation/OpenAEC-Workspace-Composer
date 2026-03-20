# tauri-syntax-commands: Methods Reference

> Tauri 2.x (v2.10.2+). All signatures from docs.rs/tauri and @tauri-apps/api.

## #[tauri::command] Macro

### Macro Attributes

| Attribute | Effect | Example |
|-----------|--------|---------|
| (none) | Default: camelCase arg mapping, sync on main thread | `#[tauri::command]` |
| `async` | Force sync function onto tokio runtime | `#[tauri::command(async)]` |
| `rename_all = "snake_case"` | JS passes snake_case argument keys | `#[tauri::command(rename_all = "snake_case")]` |

### What the Macro Generates

The `#[tauri::command]` macro generates wrapper code that:
1. Deserializes JSON arguments from the IPC message into Rust types
2. Injects special parameters (AppHandle, State, Window, Request)
3. Serializes the return value (or error) back to JSON
4. For async commands, spawns the function on the tokio runtime

### Sync Command Signature

```rust
#[tauri::command]
fn command_name(
    // Regular params (from JS invoke args):
    arg1: Type1,     // Must impl Deserialize
    arg2: Type2,
    // Injected params (Tauri provides automatically):
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    state: tauri::State<'_, MyState>,
) -> ReturnType     // Must impl Serialize (or () for void)
```

### Async Command Signature

```rust
#[tauri::command]
async fn command_name(
    arg1: String,    // MUST use owned types (no &str in async)
    app: tauri::AppHandle,
    state: tauri::State<'_, MyState>,
) -> Result<ReturnType, ErrorType>  // ErrorType must impl Serialize
```

## Argument Types (Detailed)

### Primitives

| Rust | TypeScript | JSON |
|------|-----------|------|
| `i8`, `i16`, `i32`, `i64` | `number` | integer |
| `u8`, `u16`, `u32`, `u64` | `number` | integer |
| `f32`, `f64` | `number` | float |
| `bool` | `boolean` | boolean |
| `String` | `string` | string |
| `char` | `string` | single char string |

### Collections

| Rust | TypeScript | JSON |
|------|-----------|------|
| `Vec<T>` | `T[]` | array |
| `HashMap<String, T>` | `Record<string, T>` | object |
| `Option<T>` | `T \| null \| undefined` | value or null |
| `(T1, T2)` | `[T1, T2]` | array (positional) |

### Path Types

| Rust | TypeScript | Notes |
|------|-----------|-------|
| `std::path::PathBuf` | `string` | Deserialized from string |
| `std::path::Path` | N/A | Cannot use in commands (not owned) |

### Custom Structs

```rust
#[derive(serde::Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
    age: Option<u32>,
}

#[tauri::command]
fn create_user(request: CreateUserRequest) -> Result<User, Error> {
    // ...
}
```

```typescript
await invoke('create_user', {
    request: {
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
    }
});
```

## Return Types (Detailed)

### Void Return

```rust
#[tauri::command]
fn do_something() {
    // Returns ()
}
```

```typescript
await invoke('do_something'); // resolves to null
```

### Direct Value Return

```rust
#[derive(serde::Serialize)]
struct User {
    id: u32,
    name: String,
}

#[tauri::command]
fn get_user() -> User {
    User { id: 1, name: "Alice".into() }
}
```

```typescript
interface User {
    id: number;
    name: string;
}
const user = await invoke<User>('get_user');
```

### Result Return

```rust
#[tauri::command]
fn risky_op() -> Result<String, String> {
    Ok("success".into())
    // or: Err("something failed".into())
}
```

```typescript
try {
    const result = await invoke<string>('risky_op');
} catch (error) {
    // error is the serialized Err value
    console.error(error); // "something failed"
}
```

### Binary Return (Response)

```rust
use tauri::ipc::Response;

#[tauri::command]
fn get_binary() -> Response {
    let bytes = vec![0u8; 1024];
    Response::new(bytes)
}
```

```typescript
const data = await invoke<ArrayBuffer>('get_binary');
const view = new Uint8Array(data);
```

## Special Injected Parameters

These are provided by Tauri at runtime. The frontend does NOT pass them.

### AppHandle

```rust
#[tauri::command]
fn my_cmd(app: tauri::AppHandle) {
    // Clone+Send+Sync -- safe for threads
    let handle = app.clone();
    std::thread::spawn(move || {
        use tauri::Emitter;
        handle.emit("event", "data").unwrap();
    });
}
```

### WebviewWindow

```rust
#[tauri::command]
fn my_cmd(window: tauri::WebviewWindow) {
    println!("Called from: {}", window.label());
    window.set_title("Updated").unwrap();
}
```

### State

```rust
#[tauri::command]
fn my_cmd(state: tauri::State<'_, MyConfig>) -> String {
    state.api_url.clone()
}

// For mutable state:
#[tauri::command]
fn my_cmd(state: tauri::State<'_, std::sync::Mutex<Counter>>) -> u32 {
    let mut counter = state.lock().unwrap();
    counter.value += 1;
    counter.value
}
```

### Request (Raw IPC Access)

```rust
use tauri::ipc::Request;

#[tauri::command]
fn my_cmd(request: Request) -> Result<(), String> {
    // Access raw body
    let tauri::ipc::InvokeBody::Raw(data) = request.body() else {
        return Err("Expected binary".into());
    };
    // Access headers
    let auth = request.headers().get("Authorization");
    Ok(())
}
```

## Command Registration

### generate_handler! Macro

```rust
tauri::generate_handler![cmd1, cmd2, cmd3]
```

Returns an `InvokeHandler` that maps command names to functions. Command names are derived from the function name.

### invoke_handler() Builder Method

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        commands::greet,
        commands::read_file,
        commands::write_file,
    ])
```

**CRITICAL**: Only ONE `invoke_handler()` call is processed per Builder. Multiple calls do NOT merge -- only the last one takes effect.

### Module Organization

```rust
// src-tauri/src/lib.rs
mod commands;
mod file_commands;

.invoke_handler(tauri::generate_handler![
    commands::greet,
    file_commands::read_file,
    file_commands::write_file,
])
```

## Frontend invoke() API

### Function Signature

```typescript
function invoke<T>(
    cmd: string,
    args?: InvokeArgs,
    options?: InvokeOptions
): Promise<T>
```

### Type Definitions

```typescript
type InvokeArgs = Record<string, unknown> | number[] | ArrayBuffer | Uint8Array;

interface InvokeOptions {
    headers?: HeadersInit;
}
```

### Import

```typescript
import { invoke } from '@tauri-apps/api/core';
```

## Channel API

### Rust Side

```rust
pub struct Channel<TSend = InvokeResponseBody> { /* ... */ }

impl<TSend: IpcResponse> Channel<TSend> {
    pub fn id(&self) -> u32;
    pub fn send(&self, data: TSend) -> Result<()>;
}
```

`Channel` is `Clone + Send + Sync`. Safe to use across threads.

### TypeScript Side

```typescript
import { Channel } from '@tauri-apps/api/core';

const channel = new Channel<MessageType>();
channel.onmessage = (message: MessageType) => {
    // Handle each message from Rust
};

// Pass as argument to invoke
await invoke('streaming_command', { onData: channel });
```

### Channel Properties

| Property | Value |
|----------|-------|
| Direction | Rust -> JavaScript only |
| Thread safety | `Clone + Send + Sync` |
| Lifetime | Tied to command invocation |
| Serialization | Uses same serde pipeline as commands |

## Other Core Exports (@tauri-apps/api/core)

| Export | Type | Description |
|--------|------|-------------|
| `Channel<T>` | class | Streaming data channel from Rust |
| `Resource` | class | Base class for native resources; call `.close()` to release |
| `PluginListener` | class | Plugin event subscription; call `.unregister()` |
| `convertFileSrc` | function | Converts native paths to asset protocol URLs |
| `isTauri` | function | Returns `true` in Tauri webview, `false` in browser |
| `transformCallback` | function | Internal callback registration |
| `addPluginListener` | function | Subscribe to plugin events |
| `checkPermissions` | function | Query plugin permission state |
| `requestPermissions` | function | Request plugin permissions |
