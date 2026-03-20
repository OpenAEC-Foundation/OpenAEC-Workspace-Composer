# tauri-syntax-window: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/develop/window-customization/
- https://docs.rs/tauri/2.10.2/tauri/webview/struct.WebviewWindowBuilder.html
- vooronderzoek-tauri.md sections 2.6, 3.3, 4.1

---

## Example 1: Basic Window from tauri.conf.json

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "My App",
        "url": "/",
        "width": 800,
        "height": 600,
        "minWidth": 400,
        "minHeight": 300,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false,
        "focus": true,
        "create": true
      }
    ]
  }
}
```

---

## Example 2: Creating a Window from Rust (setup hook)

```rust
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;

tauri::Builder::default()
    .setup(|app| {
        // Main window is created from tauri.conf.json
        // Additional windows created programmatically:
        let _settings = WebviewWindowBuilder::new(
            app,
            "settings",
            WebviewUrl::App("settings.html".into()),
        )
        .title("Settings")
        .inner_size(600.0, 400.0)
        .visible(false)  // hidden by default
        .build()?;

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error running app");
```

---

## Example 3: Show/Hide Window from a Command

```rust
#[tauri::command]
fn show_settings(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

#[tauri::command]
fn hide_settings(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        window.hide().unwrap();
    }
}
```

---

## Example 4: Prevent Close and Hide Instead (Rust)

```rust
tauri::Builder::default()
    .on_window_event(|window, event| {
        match event {
            WindowEvent::CloseRequested { api, .. } => {
                // Prevent close and hide instead (e.g., for tray apps)
                api.prevent_close();
                window.hide().unwrap();
            }
            _ => {}
        }
    })
    .run(tauri::generate_context!())
    .expect("error running app");
```

---

## Example 5: Prevent Close with Confirmation (JavaScript)

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const win = getCurrentWindow();

await win.onCloseRequested(async (event) => {
  const confirmed = await confirm('Are you sure you want to close?');
  if (!confirmed) {
    event.preventDefault();
  }
});
```

---

## Example 6: Creating a Window from JavaScript

```typescript
import { Window } from '@tauri-apps/api/window';

const settingsWindow = new Window('settings-window', {
  url: '/settings',
  title: 'Settings',
  width: 600,
  height: 400,
  center: true,
  decorations: true,
  resizable: true,
});
```

---

## Example 7: Manipulating Window Properties (JavaScript)

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';

const win = getCurrentWindow();

// Set position and size
await win.center();
await win.setPosition(new LogicalPosition(100, 100));
await win.setSize(new LogicalSize(800, 600));

// Read current state
const innerSize = await win.innerSize();
const outerPos = await win.outerPosition();
const isMax = await win.isMaximized();
const title = await win.title();

console.log(`Size: ${innerSize.width}x${innerSize.height}`);
console.log(`Position: ${outerPos.x}, ${outerPos.y}`);
console.log(`Maximized: ${isMax}, Title: ${title}`);
```

---

## Example 8: Listening to Window Events (JavaScript)

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const win = getCurrentWindow();

const unlistenResize = await win.onResized(({ payload: size }) => {
  console.log('New size:', size.width, size.height);
});

const unlistenFocus = await win.onFocusChanged(({ payload: focused }) => {
  console.log('Focused:', focused);
});

const unlistenTheme = await win.onThemeChanged(({ payload: theme }) => {
  console.log('Theme:', theme);
});

// Cleanup (e.g., in React useEffect return)
// unlistenResize();
// unlistenFocus();
// unlistenTheme();
```

---

## Example 9: React Hook for Window Event Cleanup

```typescript
import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const win = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    win.innerSize().then(s => setSize({ width: s.width, height: s.height }));

    win.onResized(({ payload }) => {
      setSize({ width: payload.width, height: payload.height });
    }).then(fn => { unlisten = fn; });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return size;
}
```

---

## Example 10: Multi-Window Communication

```rust
// Rust: emit event to a specific window
use tauri::Emitter;

#[tauri::command]
fn notify_settings(app: tauri::AppHandle) {
    app.emit_to("settings", "config-changed", serde_json::json!({
        "key": "theme",
        "value": "dark"
    })).unwrap();
}
```

```typescript
// JavaScript: listen for events from another window
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<{ key: string; value: string }>(
  'config-changed',
  (event) => {
    console.log(`Config changed: ${event.payload.key} = ${event.payload.value}`);
  }
);
```

---

## Example 11: Query Monitor Information

```typescript
import {
  availableMonitors,
  currentMonitor,
  primaryMonitor,
  cursorPosition,
} from '@tauri-apps/api/window';

const monitors = await availableMonitors();
for (const monitor of monitors) {
  console.log(`Monitor: ${monitor.name}`);
  console.log(`  Size: ${monitor.size.width}x${monitor.size.height}`);
  console.log(`  Position: ${monitor.position.x}, ${monitor.position.y}`);
  console.log(`  Scale: ${monitor.scaleFactor}`);
}

const current = await currentMonitor();
const primary = await primaryMonitor();
const cursor = await cursorPosition();
console.log(`Cursor at: ${cursor.x}, ${cursor.y}`);
```

---

## Example 12: Window with Initialization Script (Rust)

```rust
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;

let window = WebviewWindowBuilder::new(
    app,
    "custom",
    WebviewUrl::App("index.html".into()),
)
    .title("Custom Window")
    .inner_size(800.0, 600.0)
    .initialization_script("console.log('Window initialized');")
    .devtools(true)
    .build()?;
```
