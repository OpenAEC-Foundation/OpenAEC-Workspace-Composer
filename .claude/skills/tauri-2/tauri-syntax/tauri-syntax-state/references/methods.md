# tauri-syntax-state: Method Reference

Sources: https://docs.rs/tauri/2/tauri/struct.State.html,
https://docs.rs/tauri/2/tauri/trait.Manager.html,
https://v2.tauri.app/develop/state-management/

---

## State Registration

### Builder::manage

```rust
pub fn manage<T>(self, state: T) -> Self
where T: Send + Sync + 'static
```

Registers a state value with the application. The state is wrapped in `Arc` internally — do NOT wrap it yourself. Can be called multiple times for different types. Calling `manage()` twice with the same type replaces the previous value.

### App::manage (in setup)

```rust
pub fn manage<T>(&self, state: T) -> bool
where T: Send + Sync + 'static
```

Registers state during the `setup()` hook. Returns `true` if the state was newly registered, `false` if it replaced an existing value of the same type.

---

## State Access in Commands

### tauri::State

```rust
pub struct State<'r, T: Send + Sync + 'static>(&'r T);
```

A managed state accessor. Used as a command parameter to receive injected state.

**Deref**: `State<T>` implements `Deref<Target = T>`, so you can access fields and methods directly.

```rust
#[tauri::command]
fn my_command(state: tauri::State<'_, MyType>) -> String {
    state.some_field.clone()  // Direct access via Deref
}
```

**With Mutex**: When the registered type is `Mutex<T>`, the parameter type must be `State<'_, Mutex<T>>`:

```rust
#[tauri::command]
fn my_command(state: tauri::State<'_, std::sync::Mutex<MyType>>) -> String {
    let guard = state.lock().unwrap();
    guard.some_field.clone()
}
```

**With RwLock**: Same pattern applies:

```rust
#[tauri::command]
fn read_cmd(state: tauri::State<'_, std::sync::RwLock<MyType>>) -> String {
    let guard = state.read().unwrap();
    guard.some_field.clone()
}
```

---

## State Access Outside Commands (Manager Trait)

### state

```rust
fn state<T>(&self) -> State<'_, T>
where T: Send + Sync + 'static
```

Returns a reference to the managed state. **Panics** if the state type has not been registered via `manage()`.

Available on: `App`, `AppHandle`, `Window`, `Webview`, `WebviewWindow`.

```rust
let config = app_handle.state::<AppConfig>();
let counter = app_handle.state::<std::sync::Mutex<Counter>>();
```

### try_state

```rust
fn try_state<T>(&self) -> Option<State<'_, T>>
where T: Send + Sync + 'static
```

Returns `Some(State<T>)` if the state type has been registered, `None` otherwise. Safe alternative to `state()`.

```rust
if let Some(config) = app_handle.try_state::<AppConfig>() {
    println!("API URL: {}", config.api_url);
}
```

---

## Thread-Safety Wrappers

### std::sync::Mutex

```rust
pub struct Mutex<T: ?Sized> { /* ... */ }
```

Standard library mutex. Use for most mutable state scenarios.

| Method | Returns | Blocks? |
|--------|---------|---------|
| `.lock()` | `Result<MutexGuard<T>>` | Yes, until lock acquired |
| `.try_lock()` | `Result<MutexGuard<T>>` | No, returns `Err` if locked |
| `.is_poisoned()` | `bool` | No |

**Lock guard**: The `MutexGuard` is dropped automatically at end of scope, releasing the lock.

```rust
{
    let mut guard = state.lock().unwrap();
    guard.value += 1;
} // Lock released here
```

### tokio::sync::Mutex

```rust
pub struct Mutex<T: ?Sized> { /* ... */ }
```

Async-aware mutex from tokio. Use ONLY when you need to hold the lock across `.await` points.

| Method | Returns | Async? |
|--------|---------|--------|
| `.lock()` | `MutexGuard<T>` | Yes (`.await`) |
| `.try_lock()` | `Result<MutexGuard<T>>` | No |

```rust
let guard = state.lock().await;  // Note: .await, not .unwrap()
```

### std::sync::RwLock

```rust
pub struct RwLock<T: ?Sized> { /* ... */ }
```

Read-write lock. Allows multiple concurrent readers OR one exclusive writer.

| Method | Returns | Concurrent? |
|--------|---------|-------------|
| `.read()` | `Result<RwLockReadGuard<T>>` | Yes (multiple readers) |
| `.write()` | `Result<RwLockWriteGuard<T>>` | No (exclusive) |
| `.try_read()` | `Result<RwLockReadGuard<T>>` | Non-blocking |
| `.try_write()` | `Result<RwLockWriteGuard<T>>` | Non-blocking |

```rust
// Multiple readers — concurrent
let data = state.read().unwrap();

// Exclusive writer
let mut data = state.write().unwrap();
data.items.push("new".into());
```

---

## Type Matching Rules

The type in `State<'_, T>` must EXACTLY match the type passed to `manage()`:

| Registered As | State Parameter | Result |
|---------------|----------------|--------|
| `manage(MyConfig { .. })` | `State<'_, MyConfig>` | OK |
| `manage(Mutex::new(data))` | `State<'_, Mutex<Data>>` | OK |
| `manage(Mutex::new(data))` | `State<'_, Data>` | RUNTIME PANIC |
| `manage(RwLock::new(data))` | `State<'_, RwLock<Data>>` | OK |
| `manage(RwLock::new(data))` | `State<'_, Data>` | RUNTIME PANIC |
| `manage(Arc::new(data))` | `State<'_, Arc<Data>>` | Works but redundant |

---

## State Trait Bounds

For a type `T` to be used as managed state, it must satisfy:

```rust
T: Send + Sync + 'static
```

- `Send`: Can be transferred between threads
- `Sync`: Can be referenced from multiple threads
- `'static`: No borrowed references (owned data only)

Most types satisfy these bounds automatically. `Mutex<T>` and `RwLock<T>` provide `Sync` for types that are only `Send`.
