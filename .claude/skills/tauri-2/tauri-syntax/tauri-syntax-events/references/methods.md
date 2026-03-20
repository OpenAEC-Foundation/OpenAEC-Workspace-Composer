# tauri-syntax-events: Method Reference

Sources: https://docs.rs/tauri/2/tauri/trait.Emitter.html,
https://docs.rs/tauri/2/tauri/trait.Listener.html,
https://v2.tauri.app/reference/javascript/api/namespaceevent/

---

## Emitter Trait (Rust — Tauri 2.x)

Import: `use tauri::Emitter;`

Implemented by: `App`, `AppHandle`, `Webview`, `WebviewWindow`, `Window`.

### emit

```rust
fn emit<S: Serialize + Clone>(&self, event: &str, payload: S) -> Result<()>
```

Broadcasts an event to ALL listeners (frontend and backend, all windows). The payload must implement `Serialize + Clone`.

### emit_str

```rust
fn emit_str(&self, event: &str, payload: String) -> Result<()>
```

Broadcasts an event with a pre-serialized JSON string payload. Use when you already have JSON data and want to avoid double serialization.

### emit_to

```rust
fn emit_to<I: Into<EventTarget>, S: Serialize + Clone>(
    &self, target: I, event: &str, payload: S
) -> Result<()>
```

Emits an event to a specific target. The target can be a window label (string) or an `EventTarget` enum variant.

**EventTarget variants:**
- `EventTarget::Any` — all listeners
- `EventTarget::AnyLabel { label }` — all targets with a specific label
- `EventTarget::Window { label }` — a specific window
- `EventTarget::Webview { label }` — a specific webview
- `EventTarget::WebviewWindow { label }` — a specific webview window

### emit_filter

```rust
fn emit_filter<S: Serialize + Clone, F: Fn(&EventTarget) -> bool>(
    &self, event: &str, payload: S, filter: F
) -> Result<()>
```

Emits an event to all targets for which the filter closure returns `true`. Useful for excluding specific windows or sending to a subset.

---

## Listener Trait (Rust — Tauri 2.x)

Import: `use tauri::Listener;`

Implemented by: `App`, `AppHandle`, `Webview`, `WebviewWindow`, `Window`.

### listen

```rust
fn listen<F>(&self, event: impl Into<String>, handler: F) -> EventId
where F: Fn(Event) + Send + 'static
```

Registers a persistent listener. The handler is called every time the event fires. Returns an `EventId` for later removal via `unlisten()`.

### once

```rust
fn once<F>(&self, event: impl Into<String>, handler: F) -> EventId
where F: FnOnce(Event) + Send + 'static
```

Registers a one-shot listener. The handler fires once and then auto-removes. Returns an `EventId` (can be used to cancel before it fires).

### listen_any

```rust
fn listen_any<F>(&self, event: impl Into<String>, handler: F) -> EventId
where F: Fn(Event) + Send + 'static
```

Listens for events from ANY source (ignores target filtering). Useful for global monitoring.

### once_any

```rust
fn once_any<F>(&self, event: impl Into<String>, handler: F) -> EventId
where F: FnOnce(Event) + Send + 'static
```

One-shot variant of `listen_any`.

### unlisten

```rust
fn unlisten(&self, id: EventId)
```

Removes a previously registered listener by its `EventId`.

---

## Event Struct (Rust — Tauri 2.x)

```rust
pub struct Event {
    // Private fields
}

impl Event {
    pub fn payload(&self) -> &str  // Returns raw JSON payload string
    pub fn id(&self) -> EventId    // The event listener ID
}
```

The payload is returned as a raw JSON string. Parse it with `serde_json::from_str()` if needed:

```rust
app.listen("my-event", |event| {
    let data: MyStruct = serde_json::from_str(event.payload()).unwrap();
});
```

---

## Frontend API (TypeScript — Tauri 2.x)

Import: `import { listen, once, emit, emitTo } from '@tauri-apps/api/event'`

### listen

```typescript
function listen<T>(
  event: EventName,
  handler: EventCallback<T>,
  options?: Options
): Promise<UnlistenFn>
```

Registers a persistent listener. Returns a Promise that resolves to an unlisten function. The generic type `T` specifies the payload type.

### once

```typescript
function once<T>(
  event: EventName,
  handler: EventCallback<T>,
  options?: Options
): Promise<UnlistenFn>
```

Registers a one-shot listener. Auto-removes after the first event.

### emit

```typescript
function emit(event: EventName, payload?: unknown): Promise<void>
```

Broadcasts an event globally to all listeners (frontend and backend).

### emitTo

```typescript
function emitTo(
  target: string | EventTarget,
  event: EventName,
  payload?: unknown
): Promise<void>
```

Sends an event to a specific target identified by window label or EventTarget object.

---

## TypeScript Types

```typescript
type EventName = string;
// Valid characters: alphanumeric, hyphens, slashes, colons, underscores

type EventCallback<T> = (event: Event<T>) => void;

type UnlistenFn = () => void;

interface Event<T> {
  event: EventName;  // The event name
  id: number;        // Unique event ID
  payload: T;        // Deserialized payload
}

interface Options {
  target?: string | EventTarget;
}

type EventTarget =
  | { kind: 'Any' }
  | { kind: 'AnyLabel'; label: string }
  | { kind: 'Window'; label: string }
  | { kind: 'Webview'; label: string }
  | { kind: 'WebviewWindow'; label: string };
```

---

## TauriEvent Enum (TypeScript — Tauri 2.x)

Import: `import { TauriEvent } from '@tauri-apps/api/event'`

| Member | String Value | Description |
|--------|-------------|-------------|
| `WINDOW_RESIZED` | `"tauri://resize"` | Window was resized |
| `WINDOW_MOVED` | `"tauri://move"` | Window was moved |
| `WINDOW_CLOSE_REQUESTED` | `"tauri://close-requested"` | Window close was requested |
| `WINDOW_DESTROYED` | `"tauri://destroyed"` | Window was destroyed |
| `WINDOW_FOCUS` | `"tauri://focus"` | Window gained focus |
| `WINDOW_BLUR` | `"tauri://blur"` | Window lost focus |
| `WINDOW_SCALE_FACTOR_CHANGED` | `"tauri://scale-change"` | Monitor DPI changed |
| `WINDOW_THEME_CHANGED` | `"tauri://theme-changed"` | OS theme changed |
| `WINDOW_CREATED` | `"tauri://window-created"` | New window created |
| `WEBVIEW_CREATED` | `"tauri://webview-created"` | New webview created |
| `DRAG_ENTER` | `"tauri://drag-enter"` | File drag entered window |
| `DRAG_OVER` | `"tauri://drag-over"` | File drag moving over window |
| `DRAG_DROP` | `"tauri://drag-drop"` | File dropped on window |
| `DRAG_LEAVE` | `"tauri://drag-leave"` | File drag left window |

Usage:

```typescript
import { listen, TauriEvent } from '@tauri-apps/api/event';

const unlisten = await listen(TauriEvent.WINDOW_CLOSE_REQUESTED, (event) => {
  console.log('Window close requested');
});
```

---

## Payload Constraints

### Rust Payload Requirements

| Constraint | Required For | Notes |
|------------|-------------|-------|
| `serde::Serialize` | All `emit()` variants | Payload is JSON-serialized |
| `Clone` | All `emit()` variants (except `emit_str`) | Payload is cloned for each target |

### Common Payload Derive

```rust
#[derive(Clone, serde::Serialize)]
struct MyPayload {
    id: String,
    value: f64,
}
```

### TypeScript Payload

Payloads are automatically deserialized from JSON. Use generics to type them:

```typescript
interface MyPayload {
  id: string;
  value: number;
}

const unlisten = await listen<MyPayload>('my-event', (event) => {
  // event.payload is typed as MyPayload
  console.log(event.payload.id, event.payload.value);
});
```
