# tauri-syntax-window: Anti-Patterns

These are confirmed error patterns from the Tauri 2 Window API. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/window-customization/
- vooronderzoek-tauri.md sections 2.6, 3.3, 10

---

## AP-001: Duplicate Window Labels

**WHY this is wrong**: Window labels MUST be unique across the application. Creating a window with a label that already exists causes a runtime panic in Rust and silent failure in JavaScript.

```rust
// WRONG — duplicate labels cause panic
let _win1 = WebviewWindowBuilder::new(app, "settings", url.clone()).build()?;
let _win2 = WebviewWindowBuilder::new(app, "settings", url.clone()).build()?; // PANIC
```

```rust
// CORRECT — unique labels for each window
let _win1 = WebviewWindowBuilder::new(app, "settings", url.clone()).build()?;
let _win2 = WebviewWindowBuilder::new(app, "preferences", url.clone()).build()?;
```

ALWAYS use unique labels. If you need to re-create a window, close the old one first.

---

## AP-002: Using destroy() Instead of close()

**WHY this is wrong**: `destroy()` force-closes the window without emitting the `CloseRequested` event, skipping all cleanup handlers. Unsaved data may be lost.

```typescript
// WRONG — skips CloseRequested event handlers
const win = getCurrentWindow();
await win.destroy();
```

```typescript
// CORRECT — triggers CloseRequested, allowing cleanup
const win = getCurrentWindow();
await win.close();
```

ALWAYS use `close()` unless you specifically need to bypass close prevention logic. NEVER use `destroy()` as the default close mechanism.

---

## AP-003: Not Checking for null When Getting Windows by Label

**WHY this is wrong**: `get_webview_window()` returns `Option<WebviewWindow>` (Rust) or `Promise<Window | null>` (JS). The window may not exist yet, may have been closed, or the label may be misspelled.

```rust
// WRONG — unwrap panics if window doesn't exist
let win = app.get_webview_window("settings").unwrap();
win.show().unwrap();
```

```rust
// CORRECT — handle the None case
if let Some(window) = app.get_webview_window("settings") {
    window.show().unwrap();
}
```

```typescript
// WRONG — no null check
const win = await Window.getByLabel('settings');
await win.show(); // TypeError if null

// CORRECT — null check
const win = await Window.getByLabel('settings');
if (win) {
  await win.show();
}
```

ALWAYS check for None/null before using windows retrieved by label.

---

## AP-004: Using get_window Instead of get_webview_window in Tauri 2

**WHY this is wrong**: In Tauri 2, `get_window()` returns a raw `Window` without webview access. Most operations (showing content, navigation, JS execution) require the `WebviewWindow` type.

```rust
// WRONG — returns raw Window, cannot access webview methods
let win = app.get_window("main");
```

```rust
// CORRECT — returns WebviewWindow with full webview access
let win = app.get_webview_window("main");
```

ALWAYS use `get_webview_window()` unless you specifically need the raw window handle without webview.

---

## AP-005: Forgetting to Prevent Close in CloseRequested Handler

**WHY this is wrong**: The `CloseRequested` event does NOT prevent closing by default. You MUST call `api.prevent_close()` (Rust) or `event.preventDefault()` (JS) to stop the window from closing.

```rust
// WRONG — logs but window still closes
.on_window_event(|window, event| {
    match event {
        WindowEvent::CloseRequested { api, .. } => {
            println!("Close requested but not prevented!");
            // Window closes anyway because prevent_close() was not called
        }
        _ => {}
    }
})
```

```rust
// CORRECT — actually prevents the close
.on_window_event(|window, event| {
    match event {
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            window.hide().unwrap();
        }
        _ => {}
    }
})
```

ALWAYS call `api.prevent_close()` or `event.preventDefault()` if you intend to stop the window from closing.

---

## AP-006: Not Cleaning Up Window Event Listeners in JS Frameworks

**WHY this is wrong**: Window event listener methods return `Promise<UnlistenFn>`. Not calling the unlisten function causes memory leaks, especially in single-page apps with component mounting/unmounting.

```typescript
// WRONG — memory leak, listener never removed
useEffect(() => {
  getCurrentWindow().onResized((event) => {
    setSize(event.payload);
  });
}, []);
```

```typescript
// CORRECT — cleanup on unmount
useEffect(() => {
  let unlisten: (() => void) | undefined;

  getCurrentWindow().onResized((event) => {
    setSize(event.payload);
  }).then(fn => { unlisten = fn; });

  return () => {
    if (unlisten) unlisten();
  };
}, []);
```

ALWAYS store and call the unlisten function when the component unmounts or the listener is no longer needed.

---

## AP-007: Using Window v1 API Names in Tauri 2

**WHY this is wrong**: Tauri 2 renamed several Window types. Using v1 names causes compilation errors (Rust) or import errors (JS).

```rust
// WRONG — Tauri v1 names
use tauri::WindowBuilder;  // renamed
use tauri::WindowUrl;      // renamed

// CORRECT — Tauri v2 names
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;
```

```typescript
// WRONG — Tauri v1 import
import { appWindow } from '@tauri-apps/api/window'; // removed in v2

// CORRECT — Tauri v2 import
import { getCurrentWindow } from '@tauri-apps/api/window';
const win = getCurrentWindow();
```

ALWAYS use Tauri 2 names: `WebviewWindowBuilder`, `WebviewUrl`, `WebviewWindow`, `getCurrentWindow()`.

---

## AP-008: Creating Window Without Required Permissions

**WHY this is wrong**: In Tauri 2, window operations require explicit permissions in the capability file. Without `core:window:default`, JS calls to window methods will fail with "command not allowed" errors.

```json
// WRONG — missing window permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

```json
// CORRECT — includes window permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-set-title",
    "core:window:allow-close"
  ]
}
```

ALWAYS include `core:window:default` in capabilities for windows that need JS-side window manipulation.
