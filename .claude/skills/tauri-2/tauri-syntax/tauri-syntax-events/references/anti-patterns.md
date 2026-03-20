# tauri-syntax-events: Anti-Patterns

These are confirmed error patterns for the Tauri 2.x event system. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/calling-rust/#event-system
- https://docs.rs/tauri/2/tauri/trait.Emitter.html
- vooronderzoek-tauri.md Section 10 (Common Mistakes & Anti-Patterns)

---

## AP-001: Missing Clone on Event Payloads

**WHY this is wrong**: The `emit()` method requires `Serialize + Clone` because the payload is cloned for each listener target. Missing `Clone` produces a confusing compile error.

```rust
// WRONG — missing Clone derive
#[derive(serde::Serialize)]
struct MyPayload {
    value: String,
}

app_handle.emit("event", MyPayload { value: "test".into() })?;
// Error: the trait `Clone` is not implemented for `MyPayload`
```

```rust
// CORRECT — include both Serialize and Clone
#[derive(Clone, serde::Serialize)]
struct MyPayload {
    value: String,
}

app_handle.emit("event", MyPayload { value: "test".into() })?;
```

ALWAYS derive both `Clone` and `serde::Serialize` on any struct used as an event payload.

---

## AP-002: Forgetting to Import Emitter/Listener Traits

**WHY this is wrong**: The `emit()` and `listen()` methods come from the `Emitter` and `Listener` traits respectively. Without importing them, the compiler cannot find the methods on `AppHandle`, `Window`, etc.

```rust
// WRONG — no trait import
fn setup(app: &mut tauri::App) {
    app.emit("ready", ()).unwrap();
    // Error: no method named `emit` found for `&mut App`
}
```

```rust
// CORRECT — import the trait
use tauri::Emitter;

fn setup(app: &mut tauri::App) {
    app.emit("ready", ()).unwrap();
}
```

ALWAYS add `use tauri::Emitter;` and/or `use tauri::Listener;` at the top of any file using event methods.

---

## AP-003: Not Awaiting listen() in TypeScript

**WHY this is wrong**: `listen()` returns a `Promise<UnlistenFn>`, not an `UnlistenFn` directly. Calling the result without awaiting produces a TypeError at runtime.

```typescript
// WRONG — unlisten is a Promise, not a function
const unlisten = listen('event', handler);
unlisten(); // TypeError: unlisten is not a function
```

```typescript
// CORRECT — await the Promise
const unlisten = await listen('event', handler);
unlisten(); // Works correctly
```

ALWAYS await `listen()`, `once()`, and similar functions that return `Promise<UnlistenFn>`.

---

## AP-004: Memory Leak from Missing Cleanup in React

**WHY this is wrong**: In React (and other component frameworks), components mount and unmount frequently. Each mount registers a new listener. Without cleanup, listeners accumulate and fire handlers on stale component state.

```typescript
// WRONG — listener never cleaned up
useEffect(() => {
  listen('update', (event) => {
    setData(event.payload);
  });
}, []);
```

```typescript
// CORRECT — cleanup on unmount
useEffect(() => {
  let unlisten: (() => void) | undefined;

  listen<MyData>('update', (event) => {
    setData(event.payload);
  }).then((fn) => { unlisten = fn; });

  return () => {
    if (unlisten) unlisten();
  };
}, []);
```

ALWAYS return a cleanup function from `useEffect` that calls the unlisten function.

---

## AP-005: Invalid Event Name Characters

**WHY this is wrong**: Tauri validates event names and only allows alphanumeric characters, hyphens (`-`), forward slashes (`/`), colons (`:`), and underscores (`_`). Any other characters cause a runtime panic.

```rust
// WRONG — spaces and dots are not allowed
app.emit("my event.data", payload)?;  // PANIC at runtime

// WRONG — special characters
app.emit("update@v2", payload)?;      // PANIC at runtime
```

```rust
// CORRECT — use allowed separators
app.emit("my-event/data", payload)?;  // hyphens and slashes OK
app.emit("update:v2", payload)?;      // colons OK
app.emit("my_event_data", payload)?;  // underscores OK
```

ALWAYS use only alphanumeric characters, `-`, `/`, `:`, and `_` in event names.

---

## AP-006: Using emit() Without Error Handling

**WHY this is wrong**: `emit()` returns a `Result`. Ignoring it means silent failures when events cannot be sent (e.g., window was closed).

```rust
// WRONG — ignoring the Result
app_handle.emit("update", data);
// Compiler warning: unused Result

// ALSO WRONG — unwrap in production
app_handle.emit("update", data).unwrap();
// Panics if the emit fails
```

```rust
// CORRECT — handle the error
if let Err(e) = app_handle.emit("update", data) {
    eprintln!("Failed to emit event: {}", e);
}

// OR — propagate with ?
app_handle.emit("update", data)?;
```

ALWAYS handle the `Result` from `emit()`. Use `?` in functions that return `Result`, or log the error.

---

## AP-007: Listening in a Loop Without Unlisten

**WHY this is wrong**: Each call to `listen()` registers a NEW listener. Calling it in a loop or repeatedly without unlisting previous ones creates duplicate handlers that all fire on every event.

```rust
// WRONG — registers a new listener every iteration
for _ in 0..10 {
    app.listen("tick", |event| {
        println!("Tick!"); // Prints 10 times per event after loop
    });
}
```

```rust
// CORRECT — listen once, or manage the EventId
let id = app.listen("tick", |event| {
    println!("Tick!");
});

// When replacing a listener:
app.unlisten(id);
let new_id = app.listen("tick", |event| {
    println!("New tick handler");
});
```

ALWAYS track `EventId` values and unlisten before re-registering.

---

## AP-008: Emitting Before Listeners Are Ready

**WHY this is wrong**: If Rust emits an event during `setup()` before the frontend has loaded and registered its listeners, the event is lost. Events are not queued.

```rust
// WRONG — frontend hasn't loaded yet
.setup(|app| {
    app.emit("config-loaded", config)?; // Frontend misses this
    Ok(())
})
```

```rust
// CORRECT — wait for frontend to signal readiness
use tauri::Listener;

.setup(|app| {
    let handle = app.handle().clone();
    app.listen("frontend-ready", move |_| {
        handle.emit("config-loaded", config.clone()).unwrap();
    });
    Ok(())
})
```

```typescript
// Frontend signals readiness after mounting
import { emit } from '@tauri-apps/api/event';

// After all listeners are registered:
await emit('frontend-ready', null);
```

ALWAYS implement a readiness handshake when the backend needs to send events during initialization.
