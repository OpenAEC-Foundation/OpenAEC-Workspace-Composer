# tauri-errors-runtime: Runtime Anti-Patterns

These are confirmed runtime error patterns. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources: vooronderzoek-tauri.md sections 2.2, 10.1, 10.2, 10.3

---

## RAP-001: State Type Mismatch

**WHY this is wrong**: Tauri resolves state by exact type at runtime. `State<'_, Counter>` when `Mutex<Counter>` was registered causes a panic -- not a compile error.

```rust
// WRONG -- registers Mutex<Counter>, accesses Counter
app.manage(Mutex::new(Counter::default()));

#[tauri::command]
fn get_count(state: State<'_, Counter>) -> u32 {  // RUNTIME PANIC
    state.value
}
```

```rust
// CORRECT -- types match exactly
app.manage(Mutex::new(Counter::default()));

#[tauri::command]
fn get_count(state: State<'_, Mutex<Counter>>) -> u32 {
    let counter = state.lock().unwrap();
    counter.value
}
```

ALWAYS match the exact registered type. If you `manage(Mutex::new(T))`, access as `State<'_, Mutex<T>>`.

---

## RAP-002: Using Result<T, String> Everywhere

**WHY this is wrong**: Serializing all errors to `String` loses type information. The frontend cannot distinguish error kinds or take appropriate action.

```rust
// WRONG -- all errors become opaque strings
#[tauri::command]
fn load(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}
```

```rust
// CORRECT -- typed errors with thiserror
#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("not found: {0}")]
    NotFound(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

ALWAYS use `thiserror` with custom error enums. NEVER use `String` as the sole error type in production.

---

## RAP-003: Blocking the Main Thread

**WHY this is wrong**: Synchronous commands run on the main thread. I/O operations block the event loop, freezing the UI until the operation completes.

```rust
// WRONG -- freezes UI during file read
#[tauri::command]
fn read_file(path: String) -> String {
    std::fs::read_to_string(path).unwrap()
}
```

```rust
// CORRECT -- async, runs on tokio runtime
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(path).await.map_err(|e| e.to_string())
}
```

ALWAYS use `async` for commands involving I/O, network, or computation over 10ms.

---

## RAP-004: Using unwrap() in Commands

**WHY this is wrong**: `.unwrap()` panics on `None` or `Err`, crashing the entire application. Users lose unsaved work.

```rust
// WRONG -- crashes app on any file error
#[tauri::command]
fn load(path: String) -> String {
    std::fs::read_to_string(path).unwrap()
}
```

```rust
// CORRECT -- returns error to frontend
#[tauri::command]
fn load(path: String) -> Result<String, AppError> {
    let content = std::fs::read_to_string(path)?;
    Ok(content)
}
```

NEVER use `.unwrap()` or `.expect()` in command handlers. ALWAYS use `?` with `Result`.

---

## RAP-005: Wrapping State in Arc

**WHY this is wrong**: Tauri wraps all managed state in `Arc` internally. Adding another `Arc` is redundant and adds confusion.

```rust
// WRONG -- double Arc
app.manage(Arc::new(Mutex::new(data)));

// CORRECT
app.manage(Mutex::new(data));
```

NEVER wrap state in `Arc` before calling `manage()`.

---

## RAP-006: Not Cleaning Up Event Listeners

**WHY this is wrong**: In component-based frameworks (React, Vue, Svelte), listeners created in mount hooks persist after the component unmounts. This causes memory leaks, duplicate handlers, and stale closures.

```typescript
// WRONG -- React component leaks listener
useEffect(() => {
    listen('update', (e) => setData(e.payload));
}, []);
```

```typescript
// CORRECT -- cleanup on unmount
useEffect(() => {
    const promise = listen('update', (e) => setData(e.payload));
    return () => { promise.then(fn => fn()); };
}, []);
```

ALWAYS return the unlisten function in effect cleanup.

---

## RAP-007: Using snake_case Keys in invoke()

**WHY this is wrong**: Tauri auto-converts camelCase JS keys to snake_case Rust parameters. If you pass snake_case from JS, the conversion produces double_snake_case, and parameters don't match.

```typescript
// WRONG -- Rust receives "file_path" as undefined
await invoke('save_file', { file_path: '/doc.txt' });

// CORRECT -- Tauri converts filePath -> file_path
await invoke('save_file', { filePath: '/doc.txt' });
```

ALWAYS use camelCase keys in `invoke()` arguments.

---

## RAP-008: Missing Clone on Event Payloads

**WHY this is wrong**: `emit()` requires payloads to implement both `Serialize` and `Clone`. Missing `Clone` causes a compile error.

```rust
// WRONG -- missing Clone
#[derive(serde::Serialize)]
struct Update { data: String }

app.emit("update", Update { data: "test".into() })?;  // Compile error

// CORRECT
#[derive(Clone, serde::Serialize)]
struct Update { data: String }
```

ALWAYS derive both `Clone` and `Serialize` on event payload structs.

---

## RAP-009: Using Tauri APIs in Browser Without Guard

**WHY this is wrong**: When developing with a shared codebase (SSR, hybrid apps), `invoke()` and other Tauri APIs crash in a regular browser context.

```typescript
// WRONG -- crashes in browser
const data = await invoke('get_data');

// CORRECT
import { isTauri } from '@tauri-apps/api/core';
if (isTauri()) {
    const data = await invoke('get_data');
} else {
    const data = await fetch('/api/data').then(r => r.json());
}
```

ALWAYS guard Tauri API calls with `isTauri()` in hybrid or SSR contexts.

---

## RAP-010: Assuming Path Functions Are Synchronous

**WHY this is wrong**: Unlike Node.js, Tauri path functions are async. Treating them as sync returns a Promise object instead of a string.

```typescript
// WRONG -- dir is a Promise, not a string
const dir = appDataDir();
const filePath = dir + '/config.json';  // "[object Promise]/config.json"

// CORRECT
const dir = await appDataDir();
const filePath = await join(dir, 'config.json');
```

ALWAYS await path API calls.

---

## RAP-011: Using Relative Paths Without BaseDirectory

**WHY this is wrong**: The fs plugin requires paths relative to a `BaseDirectory` or absolute paths within allowed scopes. Bare relative paths fail security checks.

```typescript
// WRONG -- no base directory
await readTextFile('config.json');

// CORRECT
await readTextFile('config.json', { baseDir: BaseDirectory.AppConfig });
```

ALWAYS specify `baseDir` when using the fs plugin.

---

## RAP-012: Not Setting CSP

**WHY this is wrong**: Setting CSP to `null` disables all content security restrictions, allowing XSS attacks and arbitrary script execution.

```json
// WRONG -- no CSP protection
{ "app": { "security": { "csp": null } } }

// CORRECT -- restrictive CSP
{ "app": { "security": {
    "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https://asset.localhost data:; connect-src ipc: http://ipc.localhost"
} } }
```

NEVER set CSP to `null` in production. ALWAYS define explicit directives.
