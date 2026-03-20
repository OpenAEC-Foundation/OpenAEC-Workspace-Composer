# tauri-errors-ipc: Anti-Patterns

These are confirmed IPC error patterns for Tauri 2. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/calling-rust/
- vooronderzoek-tauri.md Section 2.1 (Error Handling), Section 10.1 (Rust anti-patterns), Section 10.2 (Frontend anti-patterns)

---

## AP-001: Result<T, String> Everywhere

**WHY this is wrong**: Loses error type information. The frontend cannot distinguish between different error kinds. Error messages are fragile strings that break when reworded.

```rust
// WRONG -- string errors lose type info
#[tauri::command]
async fn load_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}
```

```rust
// CORRECT -- typed errors with thiserror + Serialize
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("not found: {0}")]
    NotFound(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
async fn load_file(path: String) -> Result<String, Error> {
    let content = std::fs::read_to_string(path)?;
    Ok(content)
}
```

ALWAYS use `thiserror` with a custom error enum. NEVER use `String` as the error type beyond prototyping.

---

## AP-002: Missing Serialize on Error Type

**WHY this is wrong**: The error type in `Result<T, E>` MUST implement `Serialize` to be sent over IPC. Without it, compilation fails with a cryptic error about trait bounds.

```rust
// WRONG -- std::io::Error does not implement Serialize
#[tauri::command]
fn read_data() -> Result<String, std::io::Error> {
    std::fs::read_to_string("data.txt")
}
// Compile error: the trait `Serialize` is not implemented for `std::io::Error`
```

```rust
// CORRECT -- wrap in a serializable error type
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
fn read_data() -> Result<String, Error> {
    Ok(std::fs::read_to_string("data.txt")?)
}
```

NEVER derive `Serialize` on error enums containing non-serializable types. ALWAYS use the manual `Serialize` impl pattern.

---

## AP-003: snake_case Arguments in JavaScript

**WHY this is wrong**: Tauri auto-converts Rust `snake_case` parameters to `camelCase` for JavaScript. Passing `snake_case` keys causes "missing field" deserialization errors.

```typescript
// WRONG -- snake_case keys do not match
await invoke('save_file', { file_path: '/doc.txt', file_name: 'doc.txt' });
// Error: missing field `filePath`
```

```typescript
// CORRECT -- camelCase keys match auto-converted parameter names
await invoke('save_file', { filePath: '/doc.txt', fileName: 'doc.txt' });
```

ALWAYS use camelCase for invoke argument keys. The mapping is automatic: `file_path` (Rust) becomes `filePath` (JS).

---

## AP-004: Multiple invoke_handler() Calls

**WHY this is wrong**: Only the last `invoke_handler()` call takes effect. Previous registrations are silently overwritten. Commands from earlier calls become "not found".

```rust
// WRONG -- only cmd_b is registered
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd_a])
    .invoke_handler(tauri::generate_handler![cmd_b])  // Overwrites!
```

```rust
// CORRECT -- all commands in a single call
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd_a, cmd_b])
```

ALWAYS put all commands in a single `generate_handler![]` macro invocation.

---

## AP-005: Using &str in Async Commands

**WHY this is wrong**: Async commands are spawned on the tokio runtime. Borrowed references do not live long enough because the original data may be dropped before the async task completes.

```rust
// WRONG -- borrowed reference in async context
#[tauri::command]
async fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}
// May fail at runtime or compile time depending on version
```

```rust
// CORRECT -- use owned String
#[tauri::command]
async fn greet(name: String) -> String {
    format!("Hello, {name}!")
}
```

ALWAYS use owned types (`String`, `Vec<T>`, etc.) in async command parameters. NEVER use borrowed references.

---

## AP-006: unwrap() in Async Commands

**WHY this is wrong**: A panic inside an async command crashes the tokio worker thread. The frontend invoke() never resolves -- it hangs indefinitely. No error is returned to JavaScript.

```rust
// WRONG -- panics on error, invoke() hangs forever
#[tauri::command]
async fn read_config() -> String {
    std::fs::read_to_string("config.toml").unwrap()
}
```

```rust
// CORRECT -- returns error to frontend
#[tauri::command]
async fn read_config() -> Result<String, Error> {
    let content = std::fs::read_to_string("config.toml")?;
    Ok(content)
}
```

NEVER use `.unwrap()` or `.expect()` inside commands. ALWAYS return `Result<T, E>` and use the `?` operator.

---

## AP-007: Not Handling invoke() Errors in Frontend

**WHY this is wrong**: If a Rust command returns `Err`, the invoke Promise rejects. Unhandled rejections cause silent failures and may crash the app in strict environments.

```typescript
// WRONG -- unhandled rejection
const data = await invoke('risky_operation');
// If Rust returns Err, this line silently throws
```

```typescript
// CORRECT -- always wrap in try/catch
try {
    const data = await invoke('risky_operation');
    // handle success
} catch (error: unknown) {
    console.error('Operation failed:', error);
    // handle error gracefully
}
```

ALWAYS wrap `invoke()` calls in try/catch or use `.catch()`.

---

## AP-008: Pub Commands in lib.rs

**WHY this is wrong**: The `#[tauri::command]` macro generates glue code that conflicts with `pub` visibility when the function is defined directly in `lib.rs`. This causes compile errors.

```rust
// WRONG -- in src-tauri/src/lib.rs
#[tauri::command]
pub fn my_command() -> String {  // pub causes compile error
    "hello".into()
}
```

```rust
// CORRECT -- in lib.rs, commands must NOT be pub
#[tauri::command]
fn my_command() -> String {
    "hello".into()
}

// ALSO CORRECT -- move to a module where pub is required
// src-tauri/src/commands.rs
#[tauri::command]
pub fn my_command() -> String {
    "hello".into()
}
```

NEVER mark commands as `pub` when they are defined directly in `lib.rs`. Commands in separate modules MUST be `pub`.

---

## AP-009: State Type Mismatch

**WHY this is wrong**: Using `State<'_, T>` when you registered `Mutex<T>` causes a runtime panic, not a compile error. This is one of the most confusing Tauri errors.

```rust
// Registration uses Mutex wrapper
app.manage(std::sync::Mutex::new(Counter { value: 0 }));

// WRONG -- State type does not match registered type
#[tauri::command]
fn get_count(state: tauri::State<'_, Counter>) -> u32 {
    state.value  // PANIC at runtime!
}

// CORRECT -- State type matches exactly what was registered
#[tauri::command]
fn get_count(state: tauri::State<'_, std::sync::Mutex<Counter>>) -> u32 {
    state.lock().unwrap().value
}
```

ALWAYS match the `State<'_, T>` generic parameter to the EXACT type passed to `app.manage()`.

---

## AP-010: Forgetting Clone on Event Payloads

**WHY this is wrong**: The `emit()` function requires `Serialize + Clone` on payloads. Missing `Clone` causes a compile error that can be confusing since `Serialize` is already present.

```rust
// WRONG -- missing Clone
#[derive(serde::Serialize)]
struct Update {
    message: String,
}
app_handle.emit("update", Update { message: "hi".into() })?;
// Error: the trait `Clone` is not implemented for `Update`
```

```rust
// CORRECT -- both Serialize and Clone
#[derive(Clone, serde::Serialize)]
struct Update {
    message: String,
}
app_handle.emit("update", Update { message: "hi".into() })?;
```

ALWAYS derive both `Clone` and `Serialize` on event payload types.
