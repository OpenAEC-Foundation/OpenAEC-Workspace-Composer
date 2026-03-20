# Anti-Patterns (Tauri 2.x Architecture)

## Rust Backend Anti-Patterns

### 1. Blocking the Main Thread

```rust
// WRONG: Synchronous I/O blocks the main thread and freezes the UI
#[tauri::command]
fn read_file(path: String) -> String {
    std::fs::read_to_string(path).unwrap() // blocks main thread!
}

// CORRECT: Use async for all I/O operations
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(path).await.map_err(|e| e.to_string())
}
```

**WHY**: Sync commands run on the main thread by default. Any I/O, network, or long computation blocks the event loop and freezes the entire application UI.

---

### 2. Multiple invoke_handler() Calls

```rust
// WRONG: Only the LAST invoke_handler takes effect
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd_a, cmd_b])
    .invoke_handler(tauri::generate_handler![cmd_c, cmd_d]) // replaces above!
    .run(tauri::generate_context!())

// CORRECT: All commands in a single generate_handler![]
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd_a, cmd_b, cmd_c, cmd_d])
    .run(tauri::generate_context!())
```

**WHY**: The Builder stores only one invoke handler. Multiple calls silently overwrite the previous handler.

---

### 3. Redundant Arc Wrapping

```rust
// WRONG: Tauri already wraps managed state in Arc internally
app.manage(Arc::new(MyState::default()));

// CORRECT: Just pass the state directly
app.manage(MyState::default());

// For mutable state, use Mutex (Tauri wraps in Arc for you)
app.manage(Mutex::new(MyState::default()));
```

**WHY**: Tauri internally stores managed state as `Arc<T>`. Adding your own `Arc` creates a double-indirection (`Arc<Arc<T>>`) with no benefit.

---

### 4. State Type Mismatch (Runtime Panic)

```rust
// WRONG: Registered Mutex<Counter> but accessing Counter -- runtime panic!
app.manage(Mutex::new(Counter::default()));

#[tauri::command]
fn bad(state: tauri::State<'_, Counter>) -> u32 {
    state.value // PANIC at runtime
}

// CORRECT: Match the exact registered type
#[tauri::command]
fn good(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    state.lock().unwrap().value
}
```

**WHY**: State lookup is by TypeId at runtime. Mismatched types cause a panic, not a compile error. There is no compiler check for this.

---

### 5. Using &str in Async Commands

```rust
// WRONG: Borrowed references fail with async command spawning
#[tauri::command]
async fn process(value: &str) -> String {
    value.to_uppercase()
}

// CORRECT: Use owned types
#[tauri::command]
async fn process(value: String) -> String {
    value.to_uppercase()
}

// ALTERNATIVE: Wrap return in Result to allow &str
#[tauri::command]
async fn process_ref(value: &str) -> Result<String, ()> {
    Ok(value.to_uppercase())
}
```

**WHY**: Async commands are spawned on the tokio runtime. Borrowed references cannot satisfy the `'static` lifetime required by `tokio::spawn`.

---

### 6. Pub Functions in lib.rs

```rust
// WRONG: Commands in lib.rs must NOT be pub
// src-tauri/src/lib.rs
#[tauri::command]
pub fn greet(name: String) -> String {  // compile error from glue code
    format!("Hello, {}!", name)
}

// CORRECT: Remove pub for commands defined directly in lib.rs
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// ALTERNATIVE: Move to a separate module where pub is fine
// src-tauri/src/commands.rs
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

**WHY**: The `#[tauri::command]` macro generates glue code that conflicts with `pub` visibility when the function is in the crate root (`lib.rs`).

---

### 7. Result<T, String> Everywhere

```rust
// WRONG: Loses error type information, makes debugging difficult
#[tauri::command]
async fn save_data(data: String) -> Result<(), String> {
    std::fs::write("data.txt", &data).map_err(|e| e.to_string())?;
    Ok(())
}

// CORRECT: Use thiserror with custom error enums
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("validation failed: {0}")]
    Validation(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
async fn save_data(data: String) -> Result<(), Error> {
    std::fs::write("data.txt", &data)?;
    Ok(())
}
```

**WHY**: `String` errors lose type information. With `thiserror`, you get automatic `From` conversions, pattern matching on error variants, and structured errors the frontend can interpret.

---

### 8. Missing Clone on Event Payloads

```rust
// WRONG: emit() requires Serialize + Clone
#[derive(serde::Serialize)]  // missing Clone!
struct Progress { percent: f64 }

app.emit("progress", Progress { percent: 50.0 })?; // compile error

// CORRECT: Always derive both Serialize and Clone for event payloads
#[derive(Clone, serde::Serialize)]
struct Progress { percent: f64 }
```

**WHY**: The `emit()` method requires `Serialize + Clone` because the payload may be sent to multiple targets.

---

### 9. Nested Mutex Deadlock

```rust
// WRONG: Locking the same Mutex twice causes a deadlock
#[tauri::command]
fn dangerous(state: tauri::State<'_, Mutex<Data>>) {
    let data = state.lock().unwrap();
    helper(&state); // tries to lock again -> deadlock!
}

fn helper(state: &Mutex<Data>) {
    let data = state.lock().unwrap(); // blocked forever
}

// CORRECT: Lock once, pass the guard
#[tauri::command]
fn safe(state: tauri::State<'_, Mutex<Data>>) {
    let mut data = state.lock().unwrap();
    helper(&mut data);
}

fn helper(data: &mut Data) {
    // work with data directly, no locking
}

// ALTERNATIVE: Use RwLock for read-heavy access
app.manage(std::sync::RwLock::new(Data::default()));
```

**WHY**: `std::sync::Mutex` is not reentrant. Attempting to lock it twice in the same thread causes a permanent deadlock.

---

## Frontend Anti-Patterns

### 10. Forgetting to Await Unlisten

```typescript
// WRONG: listen() returns Promise<UnlistenFn>, not UnlistenFn
const unlisten = listen('event', handler);
unlisten(); // TypeError: unlisten is not a function

// CORRECT
const unlisten = await listen('event', handler);
unlisten();
```

**WHY**: All Tauri event functions are async and return Promises.

---

### 11. Memory Leak: Not Cleaning Up Listeners

```typescript
// WRONG: Memory leak in React component
useEffect(() => {
    listen('update', handler); // never cleaned up!
}, []);

// CORRECT: Always return a cleanup function
useEffect(() => {
    const promise = listen('update', handler);
    return () => { promise.then(fn => fn()); };
}, []);
```

**WHY**: Event listeners persist until explicitly removed. Without cleanup, each component mount adds another listener.

---

### 12. Snake_case Keys in invoke()

```typescript
// WRONG: Rust expects camelCase -> snake_case auto-conversion
await invoke('save_file', { file_path: '/doc.txt' }); // won't match!

// CORRECT: Use camelCase in JavaScript
await invoke('save_file', { filePath: '/doc.txt' });
```

**WHY**: Tauri automatically converts camelCase JS keys to snake_case Rust parameter names. Sending snake_case from JS means the Rust side receives double-converted names.

---

### 13. Using Tauri APIs in a Regular Browser

```typescript
// WRONG: Crashes when running in a browser (not Tauri webview)
const data = await invoke('get_data');

// CORRECT: Guard with isTauri()
import { isTauri } from '@tauri-apps/api/core';
if (isTauri()) {
    const data = await invoke('get_data');
}
```

**WHY**: Tauri APIs depend on the injected `window.__TAURI__` object, which does not exist in regular browsers.

---

### 14. Not Handling invoke Errors

```typescript
// WRONG: Unhandled promise rejection if Rust returns Err
const data = await invoke('risky_operation');

// CORRECT: Always wrap invoke in try/catch
try {
    const data = await invoke('risky_operation');
} catch (error) {
    console.error('Operation failed:', error);
}
```

**WHY**: When a Rust command returns `Err`, the `invoke()` Promise rejects. Unhandled rejections crash the frontend.

---

### 15. Assuming Synchronous Path Operations

```typescript
// WRONG: Path functions are async in Tauri (unlike Node.js)
const dir = appDataDir(); // Returns Promise, not string!

// CORRECT
const dir = await appDataDir();
```

**WHY**: All Tauri path functions are async because they invoke the Rust backend via IPC.

---

## Project Structure Anti-Patterns

### 16. Not Splitting lib.rs and main.rs

```rust
// WRONG: Everything in main.rs -- breaks mobile support
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}

// CORRECT: Split into lib.rs + main.rs
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}

// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    app_lib::run();
}
```

**WHY**: Mobile platforms require the `#[tauri::mobile_entry_point]` macro on a function in `lib.rs`. Without the split, your app cannot target iOS or Android.

---

### 17. Not Committing Cargo.lock

**WHY**: Without `Cargo.lock` in version control, different developers (and CI) may resolve different dependency versions, causing non-deterministic builds and hard-to-debug failures.

---

### 18. Editing Generated Files

**NEVER** edit files in `src-tauri/gen/`. These are auto-generated by the Tauri CLI and will be overwritten.

**WHY**: The schemas in `gen/schemas/` are regenerated during builds. Manual changes are silently lost.
