# tauri-syntax-events: Working Code Examples

All examples based on Tauri 2.x documentation:
- https://v2.tauri.app/develop/calling-rust/#event-system
- https://docs.rs/tauri/2/tauri/trait.Emitter.html
- https://docs.rs/tauri/2/tauri/trait.Listener.html

---

## Example 1: Background Task with Progress Events

```rust
// Tauri 2.x — Rust: emit progress events from a background task
use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct DownloadProgress {
    url: String,
    bytes_received: u64,
    total_bytes: u64,
}

#[tauri::command]
async fn start_download(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let handle = app.clone();

    tokio::spawn(async move {
        for i in 0..=100 {
            handle.emit("download-progress", DownloadProgress {
                url: url.clone(),
                bytes_received: i * 1024,
                total_bytes: 100 * 1024,
            }).unwrap();
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }
    });

    Ok(())
}
```

```typescript
// Tauri 2.x — TypeScript: listen to progress events
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface DownloadProgress {
  url: string;
  bytesReceived: number;
  totalBytes: number;
}

const unlisten = await listen<DownloadProgress>('download-progress', (event) => {
  const { bytesReceived, totalBytes } = event.payload;
  const percent = Math.round((bytesReceived / totalBytes) * 100);
  console.log(`Download: ${percent}%`);
});

// Start the download
await invoke('start_download', { url: 'https://example.com/file.zip' });

// When component unmounts or download completes:
unlisten();
```

---

## Example 2: Bidirectional Communication (Frontend to Rust and Back)

```rust
// Tauri 2.x — Rust: listen for frontend events and respond
use tauri::{Emitter, Listener};

fn setup_event_handlers(app: &mut tauri::App) {
    let handle = app.handle().clone();

    app.listen("save-request", move |event| {
        // Parse the payload
        let payload: serde_json::Value =
            serde_json::from_str(event.payload()).unwrap_or_default();

        println!("Save requested for: {}", payload);

        // Do work, then emit response
        handle.emit("save-complete", serde_json::json!({
            "success": true,
            "timestamp": chrono::Utc::now().to_rfc3339()
        })).unwrap();
    });
}

// Call from Builder:
// .setup(|app| { setup_event_handlers(app); Ok(()) })
```

```typescript
// Tauri 2.x — TypeScript: emit request, listen for response
import { emit, once } from '@tauri-apps/api/event';

interface SaveResult {
  success: boolean;
  timestamp: string;
}

// Listen for the response (once — we only expect one reply)
await once<SaveResult>('save-complete', (event) => {
  if (event.payload.success) {
    console.log(`Saved at ${event.payload.timestamp}`);
  }
});

// Send the request
await emit('save-request', { documentId: 42, format: 'pdf' });
```

---

## Example 3: Window-Scoped Events

```rust
// Tauri 2.x — Rust: emit to a specific window
use tauri::Emitter;

#[tauri::command]
fn notify_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    app.emit_to("settings", "config-updated", serde_json::json!({
        "key": "theme",
        "value": "dark"
    })).map_err(|e| e.to_string())
}
```

```typescript
// Tauri 2.x — TypeScript: targeted emit from frontend
import { emitTo, listen } from '@tauri-apps/api/event';

// In the settings window — listen for config updates
const unlisten = await listen<{ key: string; value: string }>('config-updated', (event) => {
  console.log(`Config changed: ${event.payload.key} = ${event.payload.value}`);
});

// From the main window — send to settings
await emitTo('settings', 'config-updated', { key: 'theme', value: 'dark' });
```

---

## Example 4: Emit with Filter (Exclude Specific Windows)

```rust
// Tauri 2.x — Rust: emit to all windows except one
use tauri::{Emitter, EventTarget};

#[tauri::command]
fn broadcast_except_sender(
    app: tauri::AppHandle,
    sender_label: String,
    message: String,
) -> Result<(), String> {
    app.emit_filter("broadcast", message, |target| {
        match target {
            EventTarget::WebviewWindow { label } => label != &sender_label,
            _ => true,
        }
    }).map_err(|e| e.to_string())
}
```

---

## Example 5: React Component with Event Listener

```typescript
// Tauri 2.x — React: proper event listener lifecycle
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

interface StatusUpdate {
  status: string;
  timestamp: number;
}

function StatusDisplay() {
  const [status, setStatus] = useState<string>('idle');

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<StatusUpdate>('status-changed', (event) => {
      setStatus(event.payload.status);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return <div>Status: {status}</div>;
}
```

---

## Example 6: Built-in TauriEvent Listeners

```typescript
// Tauri 2.x — Listen to built-in window events
import { listen, TauriEvent } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

// Prevent window close (ask for confirmation)
const unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
  const confirmed = await confirm('Are you sure you want to close?');
  if (!confirmed) {
    event.preventDefault();
  }
});

// Listen to focus/blur
const unlistenFocus = await listen(TauriEvent.WINDOW_FOCUS, () => {
  console.log('Window focused');
});

const unlistenBlur = await listen(TauriEvent.WINDOW_BLUR, () => {
  console.log('Window blurred');
});

// Listen to theme changes
const unlistenTheme = await listen(TauriEvent.WINDOW_THEME_CHANGED, (event) => {
  console.log('Theme changed:', event.payload);
});
```

---

## Example 7: Unlisten Pattern in Rust

```rust
// Tauri 2.x — Rust: register and later remove a listener
use tauri::Listener;

let event_id = app.listen("heartbeat", |event| {
    println!("Heartbeat received: {:?}", event.payload());
});

// Later, when no longer needed:
app.unlisten(event_id);
```

---

## Example 8: Svelte Component with Event Listener

```svelte
<!-- Tauri 2.x — Svelte: event listener with onMount/onDestroy -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { listen } from '@tauri-apps/api/event';

  let message = '';
  let unlisten: (() => void) | undefined;

  onMount(async () => {
    unlisten = await listen<string>('notification', (event) => {
      message = event.payload;
    });
  });

  onDestroy(() => {
    if (unlisten) unlisten();
  });
</script>

<p>{message}</p>
```

---

## Example 9: Vue 3 Composition API with Event Listener

```typescript
// Tauri 2.x — Vue 3: event listener with composable
import { ref, onMounted, onUnmounted } from 'vue';
import { listen } from '@tauri-apps/api/event';

export function useTauriEvent<T>(eventName: string) {
  const data = ref<T | null>(null);
  let unlisten: (() => void) | undefined;

  onMounted(async () => {
    unlisten = await listen<T>(eventName, (event) => {
      data.value = event.payload;
    });
  });

  onUnmounted(() => {
    if (unlisten) unlisten();
  });

  return data;
}
```
