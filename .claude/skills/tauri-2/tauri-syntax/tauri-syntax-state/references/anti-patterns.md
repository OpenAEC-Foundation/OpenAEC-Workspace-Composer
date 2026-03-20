# tauri-syntax-state: Anti-Patterns

These are confirmed error patterns for Tauri 2.x state management. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/state-management/
- https://docs.rs/tauri/2/tauri/struct.State.html
- vooronderzoek-tauri.md Section 2.2 and Section 10.1

---

## AP-001: Type Mismatch Between manage() and State<T>

**WHY this is wrong**: Tauri resolves state by exact type at runtime, not at compile time. If the type in `State<'_, T>` does not match the type passed to `manage()`, Tauri panics with an unhelpful error message. This is the most common state-related bug.

```rust
// WRONG — registered Mutex<Counter>, but State expects Counter
app.manage(Mutex::new(Counter::default()));

#[tauri::command]
fn get_count(state: tauri::State<'_, Counter>) -> u32 {
    state.value  // RUNTIME PANIC: state not managed
}
```

```rust
// CORRECT — types match exactly
app.manage(Mutex::new(Counter::default()));

#[tauri::command]
fn get_count(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    state.lock().unwrap().value
}
```

ALWAYS verify that the type in `State<'_, T>` exactly matches what was passed to `manage()`, including all wrappers.

---

## AP-002: Wrapping State in Arc

**WHY this is wrong**: Tauri internally wraps all managed state in `Arc`. Adding your own `Arc` creates a double-`Arc` (`Arc<Arc<T>>`), which is wasteful and requires `State<'_, Arc<T>>` instead of `State<'_, T>`.

```rust
// WRONG — redundant Arc
app.manage(Arc::new(Mutex::new(Counter::default())));

#[tauri::command]
fn get_count(state: tauri::State<'_, Arc<Mutex<Counter>>>) -> u32 {
    state.lock().unwrap().value
}
```

```rust
// CORRECT — let Tauri handle the Arc
app.manage(Mutex::new(Counter::default()));

#[tauri::command]
fn get_count(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    state.lock().unwrap().value
}
```

NEVER use `Arc` with `manage()`. Tauri provides thread-safe sharing automatically.

---

## AP-003: Deadlock from Nested Mutex Locks

**WHY this is wrong**: `std::sync::Mutex` is not reentrant. If a thread holds a lock and attempts to acquire the same lock again (directly or through a called function), it deadlocks permanently. The application freezes without any error message.

```rust
// WRONG — locks Mutex twice in same scope
#[tauri::command]
fn process(state: tauri::State<'_, Mutex<AppData>>) {
    let data = state.lock().unwrap();
    update_nested(&state, &data);  // Tries to lock again!
}

fn update_nested(state: &Mutex<AppData>, _data: &AppData) {
    let mut data = state.lock().unwrap();  // DEADLOCK — already locked
    data.count += 1;
}
```

```rust
// CORRECT — lock once, pass the guard
#[tauri::command]
fn process(state: tauri::State<'_, Mutex<AppData>>) {
    let mut data = state.lock().unwrap();
    update_nested(&mut data);  // Pass the guard, not the Mutex
}

fn update_nested(data: &mut AppData) {
    data.count += 1;
}
```

NEVER pass a `Mutex` to a function while holding its lock. Pass the `MutexGuard` instead, or restructure to lock only once.

---

## AP-004: Holding Mutex Lock Across .await with std::sync::Mutex

**WHY this is wrong**: `std::sync::MutexGuard` is not `Send`. Holding it across an `.await` point prevents the async task from being moved between threads, causing a compile error. Even if it compiled, it would block the entire thread while awaiting.

```rust
// WRONG — std::sync::Mutex held across .await
#[tauri::command]
async fn fetch_and_update(state: tauri::State<'_, std::sync::Mutex<Data>>) -> Result<(), String> {
    let mut data = state.lock().unwrap();
    let result = reqwest::get(&data.url).await.map_err(|e| e.to_string())?;
    // Compile error: MutexGuard is not Send
    data.last_result = result.text().await.map_err(|e| e.to_string())?;
    Ok(())
}
```

```rust
// CORRECT — use tokio::sync::Mutex for async contexts
#[tauri::command]
async fn fetch_and_update(state: tauri::State<'_, tokio::sync::Mutex<Data>>) -> Result<(), String> {
    let mut data = state.lock().await;
    let result = reqwest::get(&data.url).await.map_err(|e| e.to_string())?;
    data.last_result = result.text().await.map_err(|e| e.to_string())?;
    Ok(())
}
```

ALWAYS use `tokio::sync::Mutex` when you need to hold the lock across `.await` points. Use `std::sync::Mutex` for everything else.

---

## AP-005: Using tokio::sync::Mutex When std::sync::Mutex Suffices

**WHY this is wrong**: `tokio::sync::Mutex` has higher overhead than `std::sync::Mutex` because it supports async waiting. If you never hold the lock across `.await` points, the extra overhead is wasted.

```rust
// WRONG — unnecessary tokio Mutex for simple sync access
#[tauri::command]
fn increment(state: tauri::State<'_, tokio::sync::Mutex<Counter>>) -> u32 {
    // This is a sync command — no .await needed
    let mut counter = state.blocking_lock(); // Works but inefficient
    counter.value += 1;
    counter.value
}
```

```rust
// CORRECT — use std::sync::Mutex for sync operations
#[tauri::command]
fn increment(state: tauri::State<'_, std::sync::Mutex<Counter>>) -> u32 {
    let mut counter = state.lock().unwrap();
    counter.value += 1;
    counter.value
}
```

ALWAYS prefer `std::sync::Mutex` unless you specifically need to hold the lock across `.await` points.

---

## AP-006: Accessing Unregistered State

**WHY this is wrong**: Calling `state::<T>()` or using `State<'_, T>` in a command for a type that was never passed to `manage()` causes a runtime panic. The error message is not always clear about the cause.

```rust
// WRONG — forgot to register state
pub fn run() {
    tauri::Builder::default()
        // Missing: .manage(AppConfig { ... })
        .invoke_handler(tauri::generate_handler![get_config])
        .run(tauri::generate_context!())
        .expect("error running app");
}

#[tauri::command]
fn get_config(config: tauri::State<'_, AppConfig>) -> String {
    config.api_url.clone()  // RUNTIME PANIC
}
```

```rust
// CORRECT — register before use
pub fn run() {
    tauri::Builder::default()
        .manage(AppConfig {
            api_url: "https://api.example.com".into(),
        })
        .invoke_handler(tauri::generate_handler![get_config])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

ALWAYS verify that every type used in `State<'_, T>` has a corresponding `manage()` call. Use `try_state()` when the state might not be registered.

---

## AP-007: Holding Lock Longer Than Necessary

**WHY this is wrong**: Holding a Mutex lock while doing expensive work blocks all other commands that need the same state. This serializes access and can cause UI freezes.

```rust
// WRONG — lock held during expensive operation
#[tauri::command]
fn process(state: tauri::State<'_, Mutex<Data>>) {
    let data = state.lock().unwrap();
    let result = expensive_computation(&data.input);  // Lock held!
    // Other commands waiting for this state are blocked
    println!("Result: {}", result);
}
```

```rust
// CORRECT — clone data, release lock, then compute
#[tauri::command]
fn process(state: tauri::State<'_, Mutex<Data>>) {
    let input = {
        let data = state.lock().unwrap();
        data.input.clone()
    }; // Lock released here

    let result = expensive_computation(&input);  // Lock NOT held
    println!("Result: {}", result);
}
```

ALWAYS minimize the duration of lock holds. Clone data out of the lock guard, release the lock, then process.

---

## AP-008: Multiple invoke_handler Calls

**WHY this is wrong**: Only the LAST `invoke_handler()` call takes effect. Previous registrations are silently overwritten, causing "command not found" errors at runtime.

```rust
// WRONG — only cmd3 and cmd4 are registered
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd1, cmd2])
    .invoke_handler(tauri::generate_handler![cmd3, cmd4])
```

```rust
// CORRECT — all commands in a single generate_handler!
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd1, cmd2, cmd3, cmd4])
```

ALWAYS put all commands in a single `generate_handler![]` macro call.
