# tauri-core-runtime: Anti-Patterns Reference

> Tauri 2.x. Every mistake listed here causes bugs, panics, or undefined behavior.

## Anti-Pattern 1: Multiple invoke_handler() Calls

**WRONG**: Only the last `invoke_handler()` takes effect. Earlier registrations are silently overwritten.

```rust
// WRONG -- greet is LOST, only fetch_data is registered
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet])
    .invoke_handler(tauri::generate_handler![fetch_data])
    .run(tauri::generate_context!())
    .expect("error");
```

**CORRECT**: Put ALL commands in a single `generate_handler![]`.

```rust
// CORRECT
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet, fetch_data])
    .run(tauri::generate_context!())
    .expect("error");
```

## Anti-Pattern 2: Wrapping State in Arc

**WRONG**: Tauri already wraps managed state in `Arc` internally. Adding another `Arc` is redundant and confusing.

```rust
// WRONG -- double Arc
app.manage(Arc::new(MyState::default()));
```

**CORRECT**: Pass the value directly. Use `Mutex` or `RwLock` only for interior mutability.

```rust
// CORRECT
app.manage(MyState::default());

// CORRECT -- Mutex for mutable state (no Arc needed)
app.manage(Mutex::new(Counter { value: 0 }));
```

## Anti-Pattern 3: State Type Mismatch

**WRONG**: Registering `Mutex<T>` but accessing as `State<'_, T>` causes a runtime panic.

```rust
// Registered as Mutex<Counter>
app.manage(Mutex::new(Counter::default()));

// WRONG -- panics at runtime! Type does not match.
#[tauri::command]
fn bad(state: tauri::State<'_, Counter>) -> u32 {
    state.value // PANIC: state not found
}

// CORRECT -- must match the registered wrapper type
#[tauri::command]
fn good(state: tauri::State<'_, Mutex<Counter>>) -> u32 {
    let counter = state.lock().unwrap();
    counter.value
}
```

## Anti-Pattern 4: Using App Reference Instead of AppHandle in Threads

**WRONG**: `&App` is borrowed and cannot be moved into threads.

```rust
// WRONG -- app is borrowed, cannot move into thread
.setup(|app| {
    std::thread::spawn(move || {
        app.emit("event", ()).unwrap(); // ERROR: cannot move &mut App
    });
    Ok(())
})
```

**CORRECT**: Clone the `AppHandle` which is `Clone + Send + Sync`.

```rust
// CORRECT
.setup(|app| {
    let handle = app.handle().clone();
    std::thread::spawn(move || {
        use tauri::Emitter;
        handle.emit("event", ()).unwrap();
    });
    Ok(())
})
```

## Anti-Pattern 5: Blocking I/O in Setup Without Spawning

**WRONG**: Synchronous heavy work in setup blocks app startup and delays window creation.

```rust
// WRONG -- blocks startup for potentially seconds
.setup(|app| {
    let data = std::fs::read_to_string("/very/large/file.json")?; // BLOCKS
    let parsed: Config = serde_json::from_str(&data)?;             // BLOCKS
    app.manage(parsed);
    Ok(())
})
```

**CORRECT**: Spawn heavy work on a background thread. Use a sensible default state until ready.

```rust
// CORRECT -- non-blocking setup
.setup(|app| {
    app.manage(Mutex::new(Config::default())); // immediate default

    let handle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        match load_config().await {
            Ok(config) => {
                let state = handle.state::<Mutex<Config>>();
                *state.lock().unwrap() = config;
                use tauri::Emitter;
                handle.emit("config-loaded", ()).unwrap();
            }
            Err(e) => eprintln!("Config load failed: {}", e),
        }
    });
    Ok(())
})
```

## Anti-Pattern 6: Forgetting Error Return in Setup

**WRONG**: Panicking in setup crashes the app with an unhelpful message.

```rust
// WRONG -- panic with no useful error message
.setup(|app| {
    let path = app.path().app_data_dir().unwrap(); // panics if path fails
    std::fs::create_dir_all(&path).unwrap();       // panics on fs error
    Ok(())
})
```

**CORRECT**: Use `?` operator to propagate errors. Setup returns `Result<(), Box<dyn Error>>`.

```rust
// CORRECT -- proper error propagation
.setup(|app| {
    let path = app.path().app_data_dir()?;
    std::fs::create_dir_all(&path)?;
    Ok(())
})
```

## Anti-Pattern 7: Pub Commands in lib.rs

**WRONG**: Command functions defined directly in `lib.rs` must NOT be `pub` due to glue code generation.

```rust
// src-tauri/src/lib.rs
// WRONG -- compilation error
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

**CORRECT**: Either make them non-pub in lib.rs, or move to a separate module where they can be pub.

```rust
// CORRECT -- non-pub in lib.rs
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// CORRECT -- pub in a separate module
// src-tauri/src/commands.rs
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

## Anti-Pattern 8: Not Using mobile_entry_point for Cross-Platform

**WRONG**: Missing the mobile entry point macro when targeting mobile.

```rust
// WRONG -- will not compile for mobile targets
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}
```

**CORRECT**: Always add the mobile entry point macro.

```rust
// CORRECT -- works on both desktop and mobile
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error");
}
```

## Anti-Pattern 9: Deadlock with Nested Mutex Locks

**WRONG**: Locking the same Mutex twice in a call chain deadlocks.

```rust
#[tauri::command]
fn update_and_read(state: tauri::State<'_, Mutex<AppData>>) -> String {
    let mut data = state.lock().unwrap();
    data.count += 1;
    read_data(&state) // DEADLOCK: tries to lock again
}

fn read_data(state: &Mutex<AppData>) -> String {
    let data = state.lock().unwrap(); // DEADLOCK!
    data.name.clone()
}
```

**CORRECT**: Lock once and pass the guard, or restructure the code.

```rust
// CORRECT -- lock once, pass the guard
#[tauri::command]
fn update_and_read(state: tauri::State<'_, Mutex<AppData>>) -> String {
    let mut data = state.lock().unwrap();
    data.count += 1;
    data.name.clone() // read within same lock scope
}

// ALTERNATIVE -- use RwLock for read-heavy access
#[tauri::command]
fn read_only(state: tauri::State<'_, RwLock<AppData>>) -> String {
    let data = state.read().unwrap(); // multiple readers allowed
    data.name.clone()
}
```

## Anti-Pattern 10: Forgetting Clone on Event Payloads

**WRONG**: `emit()` requires payloads to implement both `Serialize` and `Clone`.

```rust
#[derive(serde::Serialize)] // Missing Clone!
struct Update {
    message: String,
}

// WRONG -- won't compile
app_handle.emit("update", Update { message: "hello".into() })?;
```

**CORRECT**: Always derive both `Serialize` and `Clone`.

```rust
#[derive(Clone, serde::Serialize)]
struct Update {
    message: String,
}

// CORRECT
app_handle.emit("update", Update { message: "hello".into() })?;
```

## Anti-Pattern 11: Using .run() When You Need Exit Handling

**WRONG**: Using `.run()` gives no way to intercept exit events.

```rust
// WRONG -- no exit handling possible
tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error");
```

**CORRECT**: Use `.build()` + `app.run()` to get the run callback.

```rust
// CORRECT
let app = tauri::Builder::default()
    .build(tauri::generate_context!())
    .expect("error building app");

app.run(|_app_handle, event| {
    if let tauri::RunEvent::ExitRequested { api, .. } = event {
        api.prevent_exit(); // keep running in tray
    }
});
```

## Anti-Pattern 12: Event Name With Invalid Characters

**WRONG**: Event names with spaces or special characters cause a panic.

```rust
// WRONG -- panics at runtime!
app_handle.emit("my event!", "data")?;
```

**CORRECT**: Event names may only contain alphanumeric characters, `-`, `/`, `:`, and `_`.

```rust
// CORRECT
app_handle.emit("my-event", "data")?;
app_handle.emit("app:data/updated", "data")?;
```
