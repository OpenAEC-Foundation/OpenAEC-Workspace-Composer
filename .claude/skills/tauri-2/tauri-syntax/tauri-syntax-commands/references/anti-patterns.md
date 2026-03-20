# tauri-syntax-commands: Anti-Patterns Reference

> Tauri 2.x. Every anti-pattern listed here causes bugs, panics, or silent failures.

## Anti-Pattern 1: snake_case Keys in JavaScript invoke()

**WRONG**: Tauri auto-converts JS camelCase to Rust snake_case. Passing snake_case from JS results in double conversion or no match.

```typescript
// WRONG -- Rust parameter file_path will NOT receive this value
await invoke('save_file', { file_path: '/doc.txt' });
```

**CORRECT**: Always use camelCase in JavaScript invoke arguments.

```typescript
// CORRECT -- Tauri converts filePath -> file_path for Rust
await invoke('save_file', { filePath: '/doc.txt' });
```

```rust
#[tauri::command]
fn save_file(file_path: String) { /* receives "/doc.txt" */ }
```

## Anti-Pattern 2: Missing Serialize on Error Type

**WRONG**: `Result<T, E>` requires E to implement `Serialize` for sending to the frontend.

```rust
#[derive(Debug, thiserror::Error)]
enum MyError {
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
}

// WRONG -- won't compile: MyError does not implement Serialize
#[tauri::command]
fn read(path: String) -> Result<String, MyError> {
    Ok(std::fs::read_to_string(path)?)
}
```

**CORRECT**: Add a manual Serialize implementation.

```rust
impl serde::Serialize for MyError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

## Anti-Pattern 3: Using &str in Async Commands

**WRONG**: Borrowed references cannot cross the async spawn boundary.

```rust
// WRONG -- won't compile
#[tauri::command]
async fn process(value: &str) -> String {
    value.to_uppercase()
}
```

**CORRECT**: Use owned types, or wrap return in Result to allow `&str`.

```rust
// CORRECT option 1: owned type
#[tauri::command]
async fn process(value: String) -> String {
    value.to_uppercase()
}

// CORRECT option 2: wrap return in Result (allows &str)
#[tauri::command]
async fn process_ref(value: &str) -> Result<String, ()> {
    Ok(value.to_uppercase())
}
```

## Anti-Pattern 4: Multiple invoke_handler() Calls

**WRONG**: Only the last `invoke_handler()` takes effect. Earlier registrations are silently overwritten.

```rust
// WRONG -- greet and search are LOST
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet, search])
    .invoke_handler(tauri::generate_handler![save_file])
    .run(tauri::generate_context!())
    .expect("error");
```

**CORRECT**: One invoke_handler with all commands.

```rust
// CORRECT
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet, search, save_file])
    .run(tauri::generate_context!())
    .expect("error");
```

## Anti-Pattern 5: Pub Commands in lib.rs

**WRONG**: Commands defined directly in `lib.rs` cannot be marked `pub` due to glue code generation.

```rust
// src-tauri/src/lib.rs
// WRONG -- compilation error
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

**CORRECT**: Non-pub in lib.rs, or move to a module where pub is allowed.

```rust
// CORRECT option 1: non-pub in lib.rs
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// CORRECT option 2: pub in a separate module
// src-tauri/src/commands.rs
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

## Anti-Pattern 6: Not Handling invoke() Errors in JS

**WRONG**: Unhandled promise rejection when Rust returns `Err`.

```typescript
// WRONG -- unhandled rejection if command fails
const data = await invoke('risky_operation');
```

**CORRECT**: Always use try/catch with invoke.

```typescript
// CORRECT
try {
    const data = await invoke('risky_operation');
} catch (error) {
    console.error('Operation failed:', error);
    showErrorToUser(String(error));
}
```

## Anti-Pattern 7: Result<T, String> Everywhere

**WRONG**: Using `String` as the error type loses all type information.

```rust
// WRONG -- no structured error information
#[tauri::command]
async fn complex_op() -> Result<Data, String> {
    let file = std::fs::read_to_string("data.json")
        .map_err(|e| e.to_string())?;  // all errors become strings
    let data: Data = serde_json::from_str(&file)
        .map_err(|e| e.to_string())?;  // can't distinguish error types
    Ok(data)
}
```

**CORRECT**: Use thiserror with a proper error enum.

```rust
// CORRECT
#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
    #[error("validation: {0}")]
    Validation(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
async fn complex_op() -> Result<Data, AppError> {
    let file = std::fs::read_to_string("data.json")?;  // typed error
    let data: Data = serde_json::from_str(&file)?;       // typed error
    Ok(data)
}
```

## Anti-Pattern 8: Blocking Main Thread with Sync Commands

**WRONG**: Sync commands doing I/O block the main thread and freeze the UI.

```rust
// WRONG -- blocks main thread
#[tauri::command]
fn read_large_file(path: String) -> String {
    std::fs::read_to_string(path).unwrap() // UI freezes during read
}
```

**CORRECT**: Use async for any I/O operation.

```rust
// CORRECT -- runs on tokio runtime
#[tauri::command]
async fn read_large_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| e.to_string())
}
```

Alternative: force sync function onto async runtime.

```rust
// CORRECT -- #[tauri::command(async)] moves to tokio runtime
#[tauri::command(async)]
fn read_large_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}
```

## Anti-Pattern 9: State Type Mismatch

**WRONG**: Registering `Mutex<T>` but accessing as `State<'_, T>` causes a runtime panic.

```rust
// Registered as Mutex<Counter>
app.manage(Mutex::new(Counter::default()));

// WRONG -- runtime panic!
#[tauri::command]
fn get_count(state: tauri::State<'_, Counter>) -> u32 {
    state.value // PANIC
}
```

**CORRECT**: The State type parameter MUST match the registered type exactly.

```rust
// CORRECT
#[tauri::command]
fn get_count(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    state.lock().unwrap().value
}
```

## Anti-Pattern 10: Using Tauri APIs Without isTauri() Guard

**WRONG**: `invoke()` crashes when running in a regular browser.

```typescript
// WRONG -- crashes in browser during development
const data = await invoke('get_data');
```

**CORRECT**: Guard with `isTauri()` for dual-environment apps.

```typescript
import { invoke, isTauri } from '@tauri-apps/api/core';

// CORRECT
if (isTauri()) {
    const data = await invoke('get_data');
} else {
    // Fallback for browser
    const data = await fetch('/api/data').then(r => r.json());
}
```

## Anti-Pattern 11: Passing Channel Wrong Way

**WRONG**: Trying to create a Channel on the Rust side for JS consumption.

Channels flow from Rust to JS only. The JS side creates the Channel, passes it to invoke, and Rust calls `.send()` on it.

```typescript
// WRONG -- don't try to receive channels from Rust
const result = await invoke<Channel>('get_channel'); // Not how it works

// CORRECT -- JS creates channel, passes to Rust
const channel = new Channel<ProgressData>();
channel.onmessage = (data) => handleProgress(data);
await invoke('long_task', { onProgress: channel });
```

## Anti-Pattern 12: Forgetting to Register Command

**WRONG**: Defining a command but not adding it to `generate_handler![]`.

```rust
#[tauri::command]
fn secret_command() -> String {
    "hidden".into()
}

// WRONG -- secret_command not registered!
.invoke_handler(tauri::generate_handler![greet, save_file])
```

```typescript
// Runtime error: command secret_command not found
await invoke('secret_command');
```

**CORRECT**: Add every command to the handler.

```rust
.invoke_handler(tauri::generate_handler![greet, save_file, secret_command])
```

## Anti-Pattern 13: Sending Non-Serializable Return Types

**WRONG**: Returning types that don't implement Serialize.

```rust
// WRONG -- std::io::Error does not implement Serialize
#[tauri::command]
fn read_file(path: String) -> Result<String, std::io::Error> {
    std::fs::read_to_string(path)
}
```

**CORRECT**: Map errors to a serializable type.

```rust
// CORRECT -- map to String
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

// BETTER -- use thiserror with Serialize impl
#[tauri::command]
fn read_file(path: String) -> Result<String, AppError> {
    Ok(std::fs::read_to_string(path)?)
}
```

## Anti-Pattern 14: Forgetting await on listen() Return

**WRONG**: `listen()` returns a `Promise<UnlistenFn>`, not an `UnlistenFn`.

```typescript
// WRONG -- listen returns a Promise!
const unlisten = listen('event', handler);
unlisten(); // TypeError: unlisten is not a function
```

**CORRECT**: Await the listen call.

```typescript
// CORRECT
const unlisten = await listen('event', handler);
unlisten(); // works
```

## Anti-Pattern 15: Not Cleaning Up Event Listeners

**WRONG**: Memory leak in component-based frameworks.

```typescript
// WRONG -- listener never cleaned up
useEffect(() => {
    listen('update', (e) => setState(e.payload));
}, []);
```

**CORRECT**: Store the unlisten function and call it on cleanup.

```typescript
// CORRECT
useEffect(() => {
    const promise = listen('update', (e) => setState(e.payload));
    return () => {
        promise.then((unlisten) => unlisten());
    };
}, []);
```

## Anti-Pattern 16: Wrong Import Path (v1 vs v2)

**WRONG**: Using Tauri v1 import paths.

```typescript
// WRONG -- v1 path, does not exist in v2
import { invoke } from '@tauri-apps/api/tauri';
```

**CORRECT**: Use v2 import paths.

```typescript
// CORRECT -- v2 path
import { invoke } from '@tauri-apps/api/core';
```

| v1 Path (WRONG) | v2 Path (CORRECT) |
|------------------|-------------------|
| `@tauri-apps/api/tauri` | `@tauri-apps/api/core` |
| `@tauri-apps/api/window` (for WebviewWindow) | `@tauri-apps/api/webviewWindow` |
