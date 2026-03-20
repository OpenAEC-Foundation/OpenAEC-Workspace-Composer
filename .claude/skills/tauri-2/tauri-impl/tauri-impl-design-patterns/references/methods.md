# tauri-impl-design-patterns: IPC & State API Reference

Sources: vooronderzoek-tauri.md sections 2, 3, 11, v2.tauri.app/concept/inter-process-communication/

---

## Commands API (Request/Response)

### Rust Side

```rust
// Sync command (runs on main thread)
#[tauri::command]
fn compute(x: i32, y: i32) -> i32 { x + y }

// Async command (runs on tokio runtime)
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, AppError> { ... }

// With injected parameters
#[tauri::command]
async fn complex(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    state: tauri::State<'_, Mutex<AppState>>,
    user_input: String,
) -> Result<String, AppError> { ... }
```

### JavaScript Side

```typescript
import { invoke } from '@tauri-apps/api/core';

// Basic
const result = await invoke<string>('compute', { x: 1, y: 2 });

// With error handling
try {
    const data = await invoke<DataType>('fetch_data', { url: 'https://...' });
} catch (error) {
    console.error(error);
}
```

---

## Events API (Pub/Sub)

### Rust Side (Emitter trait)

```rust
use tauri::Emitter;

// Broadcast to all
app_handle.emit("event-name", payload)?;

// To specific window
app_handle.emit_to("main", "event-name", payload)?;

// With filter
app_handle.emit_filter("event-name", payload, |target| {
    matches!(target, EventTarget::WebviewWindow { label } if label != "settings")
})?;
```

### Rust Side (Listener trait)

```rust
use tauri::Listener;

let id = app_handle.listen("event-name", |event| {
    println!("Payload: {:?}", event.payload());
});

app_handle.unlisten(id);
```

### JavaScript Side

```typescript
import { listen, emit, emitTo, once } from '@tauri-apps/api/event';

// Listen
const unlisten = await listen<PayloadType>('event-name', (event) => {
    console.log(event.payload);
});
unlisten(); // cleanup

// Emit
await emit('event-name', { key: 'value' });
await emitTo('settings', 'update', data);

// Listen once
await once<string>('ready', (event) => { ... });
```

---

## Channels API (Streaming)

### Rust Side

```rust
use tauri::ipc::Channel;

#[derive(Clone, serde::Serialize)]
struct Progress { percent: f64, message: String }

#[tauri::command]
async fn long_task(on_progress: Channel<Progress>) -> Result<(), AppError> {
    for i in 0..100 {
        on_progress.send(Progress {
            percent: i as f64,
            message: format!("Step {i}"),
        }).unwrap();
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    Ok(())
}
```

### JavaScript Side

```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

const onProgress = new Channel<{ percent: number; message: string }>();
onProgress.onmessage = (progress) => {
    updateProgressBar(progress.percent);
};

await invoke('long_task', { onProgress });
```

---

## State Management API

### Registration

```rust
// On Builder
tauri::Builder::default().manage(MyState::default())

// In setup (when state depends on app)
.setup(|app| {
    let db_path = app.path().app_data_dir()?.join("data.db");
    app.manage(Database::new(&db_path)?);
    Ok(())
})
```

### Access Patterns

```rust
// In commands (injected)
fn cmd(state: State<'_, Mutex<T>>) { ... }

// Outside commands (via Manager trait)
let state = app_handle.state::<Mutex<T>>();
let maybe = app_handle.try_state::<Mutex<T>>();
```

### Lock Types Comparison

| Type | Import | Lock | Unlock | Across .await? | Concurrent Reads? |
|------|--------|------|--------|----------------|-------------------|
| `Mutex<T>` | `std::sync::Mutex` | `.lock().unwrap()` | Drop guard | No | No |
| `RwLock<T>` | `std::sync::RwLock` | `.read()` / `.write()` | Drop guard | No | Yes (reads) |
| `tokio::Mutex<T>` | `tokio::sync::Mutex` | `.lock().await` | Drop guard | Yes | No |
| `AtomicU64` | `std::sync::atomic` | `.load()` / `.store()` | Immediate | N/A | Yes |

---

## Plugin Quick Reference for Architecture Decisions

| Need | Plugin | Key API |
|------|--------|---------|
| Read/write files | `fs` | `readTextFile()`, `writeTextFile()`, `readDir()` |
| File/folder picker | `dialog` | `open()`, `save()` |
| Key-value storage | `store` | `store.set()`, `store.get()` |
| HTTP requests | `http` | `fetch()` |
| Run external programs | `shell` | `Command.create().execute()` |
| System notifications | `notification` | `sendNotification()` |
| Clipboard | `clipboard-manager` | `readText()`, `writeText()` |
| OS information | `os` | `platform()`, `arch()` |
| App lifecycle | `process` | `exit()`, `relaunch()` |
| Auto-updates | `updater` | `check()`, `downloadAndInstall()` |
| Keyboard shortcuts | `global-shortcut` | `register()`, `unregister()` |
| Open files externally | `opener` | `open()` |
| Persist window state | `window-state` | Automatic save/restore |
| Database | `sql` | SQL queries via sqlx |

---

## Custom Protocol API

```rust
// Register custom URI scheme
.register_uri_scheme_protocol("myprotocol", |_app, request| {
    let path = request.uri().path();
    let content = std::fs::read(path)?;
    tauri::http::Response::builder()
        .header("Content-Type", "image/png")
        .body(content)
})
```

```typescript
// Use in frontend
const img = document.createElement('img');
img.src = 'myprotocol://localhost/path/to/image.png';
```

---

## Window Management API

```rust
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;

// Create window
let window = WebviewWindowBuilder::new(app, "label", WebviewUrl::App("path.html".into()))
    .title("Title")
    .inner_size(800.0, 600.0)
    .build()?;

// Get existing window
let window = app.get_webview_window("label");

// Window operations
window.show()?;
window.hide()?;
window.set_focus()?;
window.close()?;
```

```typescript
import { getCurrentWindow, Window } from '@tauri-apps/api/window';

const win = getCurrentWindow();
await win.setTitle('New Title');
await win.center();
const size = await win.innerSize();
```

---

## Asset Protocol

```typescript
import { convertFileSrc } from '@tauri-apps/api/core';

// Convert native path to asset URL
const url = convertFileSrc('/path/to/image.png');
// Returns: "https://asset.localhost/path/to/image.png"

// Use in HTML
document.getElementById('img').src = url;
```

Configuration required:

```json
{
  "app": {
    "security": {
      "assetProtocol": {
        "enable": true,
        "scope": ["$APPDATA/**", "$RESOURCE/**"]
      }
    }
  }
}
```
