# tauri-impl-design-patterns: Architectural Examples

Complete architectural blueprints for common Tauri 2 application types.
Sources: vooronderzoek-tauri.md, v2.tauri.app/develop/

---

## Example 1: Note-Taking App Architecture

### Architecture Diagram

```
+-----------------------+        +------------------------+
|      Frontend         |        |     Rust Backend       |
|                       |        |                        |
| +-------------------+ |        | +--------------------+ |
| | Editor Component  | | invoke | | commands::          | |
| | (contenteditable) |--------->| |   save_note()      | |
| +-------------------+ |        | |   load_note()      | |
|                       |        | |   list_notes()     | |
| +-------------------+ |        | |   search_notes()   | |
| | Sidebar (files)   | |        | |   delete_note()    | |
| +-------------------+ |        | +--------------------+ |
|                       |        |          |              |
| +-------------------+ |        | +--------v-----------+ |
| | Settings Panel    | |        | | State:             | |
| | (store plugin)    | |        | |   RwLock<Index>    | |
| +-------------------+ |        | +--------------------+ |
|                       |        |          |              |
+-----------------------+        | +--------v-----------+ |
                                 | | fs plugin          | |
                                 | | (file storage)     | |
                                 | +--------------------+ |
                                 +------------------------+
```

### Key Decisions

- **Storage**: Files via fs plugin (user-accessible, git-friendly)
- **State**: RwLock<NoteIndex> for fast search without blocking reads
- **IPC**: Commands only (CRUD pattern)
- **Settings**: Store plugin (auto-persisted key-value)

### Command Design

```rust
#[tauri::command]
pub async fn save_note(
    state: State<'_, RwLock<NoteIndex>>,
    title: String,
    content: String,
) -> AppResult<()> {
    let path = get_notes_dir()?.join(format!("{title}.md"));
    tokio::fs::write(&path, &content).await?;
    // Update index
    let mut index = state.write().unwrap();
    index.update_entry(&title, content.len());
    Ok(())
}

#[tauri::command]
pub async fn search_notes(
    state: State<'_, RwLock<NoteIndex>>,
    query: String,
) -> AppResult<Vec<NotePreview>> {
    let index = state.read().unwrap();  // Non-blocking read
    Ok(index.search(&query))
}
```

---

## Example 2: Dashboard with Live Data

### Architecture Diagram

```
+-----------------------+        +------------------------+
|      Frontend         |        |     Rust Backend       |
|                       |        |                        |
| +-------------------+ | invoke | +--------------------+ |
| | Chart.js / D3     |<--------| | start_monitoring() | |
| | (live updating)   | |channel| | -> Channel<Metrics> | |
| +-------------------+ |        | +--------------------+ |
|                       |        |          |              |
| +-------------------+ | event  | +--------v-----------+ |
| | Alert Banner      |<--------| | Background Task    | |
| | (threshold)       | |        | | (tokio::spawn)     | |
| +-------------------+ |        | +--------------------+ |
|                       |        |          |              |
| +-------------------+ | invoke | +--------v-----------+ |
| | Config Panel      |-------->| | Mutex<MonitorCfg>  | |
| +-------------------+ |        | +--------------------+ |
+-----------------------+        +------------------------+
```

### Key Decisions

- **Live data**: Channels for continuous streaming
- **Alerts**: Events for push notifications
- **Config**: Commands for CRUD
- **State**: Mutex for config (write-heavy), background task handle

### Streaming Pattern

```rust
#[tauri::command]
async fn start_monitoring(
    app: tauri::AppHandle,
    config: State<'_, Mutex<MonitorConfig>>,
    on_metrics: Channel<MetricsUpdate>,
) -> AppResult<()> {
    let interval = {
        let cfg = config.lock().unwrap();
        cfg.poll_interval_ms
    };

    loop {
        let metrics = collect_system_metrics().await?;

        // Stream to frontend via channel
        on_metrics.send(metrics.clone())?;

        // Check thresholds and emit alert event
        if metrics.cpu_usage > 90.0 {
            app.emit("alert", AlertPayload {
                level: "critical",
                message: format!("CPU at {:.1}%", metrics.cpu_usage),
            })?;
        }

        tokio::time::sleep(Duration::from_millis(interval)).await;
    }
}
```

```typescript
// Frontend: start monitoring with channel
const onMetrics = new Channel<MetricsUpdate>();
onMetrics.onmessage = (metrics) => {
    updateChart(metrics);
};

invoke('start_monitoring', { onMetrics });

// Listen for alerts separately
const unlisten = await listen<Alert>('alert', (event) => {
    showAlertBanner(event.payload);
});
```

---

## Example 3: File Manager Architecture

### Architecture Diagram

```
+-----------------------+        +------------------------+
|      Frontend         |        |     Rust Backend       |
|                       |        |                        |
| +-------------------+ | invoke | +--------------------+ |
| | File Grid/List    |-------->| | list_dir()         | |
| | (with thumbnails) | |        | | copy_file()        | |
| +-------------------+ |        | | move_file()        | |
|         |             |        | | delete_file()      | |
|    asset://           |        | | get_metadata()     | |
|    (thumbnails)       |        | +--------------------+ |
|                       |        |          |              |
| +-------------------+ | event  | +--------v-----------+ |
| | Watcher Status    |<--------| | File Watcher       | |
| | (auto-refresh)    | |        | | (notify crate)     | |
| +-------------------+ |        | +--------------------+ |
|                       |        |          |              |
| +-------------------+ |        | +--------v-----------+ |
| | Breadcrumb Nav    | |        | | RwLock<FsCache>    | |
| | Drag-Drop Zone    | |        | | (dir listing cache)| |
| +-------------------+ |        | +--------------------+ |
+-----------------------+        +------------------------+
```

### Thumbnail Strategy

```rust
// Use asset protocol for images (zero-copy, fast)
// Configure in tauri.conf.json:
// "assetProtocol": { "enable": true, "scope": ["$HOME/**"] }
```

```typescript
import { convertFileSrc } from '@tauri-apps/api/core';

function getThumbnailUrl(filePath: string): string {
    return convertFileSrc(filePath);
}

// In component
<img src={getThumbnailUrl(file.path)} loading="lazy" />
```

### File Watcher Pattern

```rust
use notify::{Watcher, RecursiveMode, Event};

.setup(|app| {
    let handle = app.handle().clone();

    std::thread::spawn(move || {
        let (tx, rx) = std::sync::mpsc::channel();
        let mut watcher = notify::recommended_watcher(tx).unwrap();
        watcher.watch(Path::new("/watched/dir"), RecursiveMode::Recursive).unwrap();

        for event in rx {
            if let Ok(event) = event {
                let _ = handle.emit("fs-changed", FsEvent::from(event));
            }
        }
    });

    Ok(())
})
```

---

## Example 4: Offline-First App with Sync

### Architecture

```rust
// State
struct AppData {
    local_db: SqliteConnection,
    sync_queue: Vec<PendingChange>,
    last_sync: Option<DateTime>,
}

// Sync flow
#[tauri::command]
async fn sync_data(
    app: tauri::AppHandle,
    state: State<'_, Mutex<AppData>>,
) -> AppResult<SyncResult> {
    app.emit("sync-status", "started")?;

    let pending = {
        let data = state.lock().unwrap();
        data.sync_queue.clone()
    };

    // Try to push changes
    match push_to_server(&pending).await {
        Ok(remote_changes) => {
            let mut data = state.lock().unwrap();
            data.apply_remote_changes(remote_changes)?;
            data.sync_queue.clear();
            data.last_sync = Some(now());
            app.emit("sync-status", "complete")?;
            Ok(SyncResult::Success)
        }
        Err(e) => {
            app.emit("sync-status", "failed")?;
            // Keep queue for retry -- data is safe locally
            Ok(SyncResult::Offline)
        }
    }
}
```

---

## Example 5: Multi-Window Communication

### Pattern: Main + Settings Windows

```rust
// From settings window, update config and notify main
#[tauri::command]
fn update_setting(
    app: tauri::AppHandle,
    state: State<'_, Mutex<Config>>,
    key: String,
    value: String,
) -> AppResult<()> {
    {
        let mut config = state.lock().unwrap();
        config.set(&key, &value)?;
    }
    // Notify main window
    app.emit_to("main", "settings-changed", SettingsUpdate { key, value })?;
    Ok(())
}
```

```typescript
// In main window: react to settings changes
useEffect(() => {
    const unlisten = listen<SettingsUpdate>('settings-changed', (event) => {
        applySettingChange(event.payload.key, event.payload.value);
    });
    return () => { unlisten.then(fn => fn()); };
}, []);
```

---

## Example 6: Performance-Optimized Data Loading

### Pagination Pattern

```rust
#[derive(serde::Serialize)]
struct Page<T> {
    items: Vec<T>,
    total: u64,
    has_more: bool,
}

#[tauri::command]
async fn list_items(
    state: State<'_, RwLock<Database>>,
    page: u32,
    page_size: u32,
) -> AppResult<Page<Item>> {
    let db = state.read().unwrap();
    let offset = page * page_size;
    let items = db.query_items(offset, page_size)?;
    let total = db.count_items()?;
    Ok(Page {
        has_more: (offset + page_size) < total as u32,
        items,
        total,
    })
}
```

```typescript
// Frontend: infinite scroll
async function loadPage(page: number) {
    const result = await invoke<Page<Item>>('list_items', {
        page,
        pageSize: 50,
    });
    appendItems(result.items);
    if (result.hasMore) {
        setupScrollTrigger(() => loadPage(page + 1));
    }
}
```

### Binary Response Pattern

```rust
use tauri::ipc::Response;

#[tauri::command]
fn read_binary_file(path: String) -> Result<Response, AppError> {
    let data = std::fs::read(&path)?;
    Ok(Response::new(data))  // Bypasses JSON serialization
}
```
