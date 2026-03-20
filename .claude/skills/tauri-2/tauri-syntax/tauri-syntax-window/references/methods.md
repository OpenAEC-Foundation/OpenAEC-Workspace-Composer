# tauri-syntax-window: API Method Reference

Sources: https://v2.tauri.app/develop/window-customization/,
https://docs.rs/tauri/2.10.2/tauri/webview/struct.WebviewWindowBuilder.html,
https://v2.tauri.app/reference/javascript/api/namespacewindow/

---

## Rust: WebviewWindowBuilder

`tauri::webview::WebviewWindowBuilder` creates and configures new windows with an embedded webview.

### Constructor

```rust
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;

WebviewWindowBuilder::new(
    manager: &M,           // any type implementing Manager (App, AppHandle, etc.)
    label: impl Into<String>,  // unique window identifier
    url: WebviewUrl,       // URL to load in the webview
) -> Self
```

### WebviewUrl Variants

```rust
WebviewUrl::App(PathBuf)        // relative path to frontend asset (e.g., "settings.html")
WebviewUrl::External(Url)       // external URL (e.g., "https://example.com".parse().unwrap())
WebviewUrl::CustomProtocol(Url) // custom protocol URL
```

### Geometry Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `inner_size` | `(width: f64, height: f64) -> Self` | Set client area dimensions |
| `min_inner_size` | `(width: f64, height: f64) -> Self` | Set minimum dimensions |
| `max_inner_size` | `(width: f64, height: f64) -> Self` | Set maximum dimensions |
| `position` | `(x: f64, y: f64) -> Self` | Set window position |
| `center` | `() -> Self` | Center window on screen |

### Behavior Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `title` | `(title: impl Into<String>) -> Self` | Set title bar text |
| `visible` | `(bool) -> Self` | Show/hide on creation |
| `focused` | `(bool) -> Self` | Focus on creation |
| `maximized` | `(bool) -> Self` | Start maximized |
| `fullscreen` | `(bool) -> Self` | Start fullscreen |
| `resizable` | `(bool) -> Self` | Allow resizing |
| `closable` | `(bool) -> Self` | Allow close button |
| `minimizable` | `(bool) -> Self` | Allow minimize button |
| `maximizable` | `(bool) -> Self` | Allow maximize button |
| `focusable` | `(bool) -> Self` | Allow receiving focus |
| `transparent` | `(bool) -> Self` | Enable transparency |

### Webview Configuration Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `initialization_script` | `(script: impl Into<String>) -> Self` | JS to execute on page load |
| `user_agent` | `(ua: &str) -> Self` | Set custom user agent |
| `devtools` | `(enabled: bool) -> Self` | Enable/disable devtools |
| `disable_javascript` | `() -> Self` | Disable JS execution |
| `zoom_hotkeys_enabled` | `(bool) -> Self` | Enable Ctrl+/- zoom |

### Event Handler Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `on_page_load` | `(F: Fn(&WebviewWindow, PageLoadPayload)) -> Self` | Page load callback |
| `on_navigation` | `(F: Fn(&Url) -> bool) -> Self` | Navigation filter (return false to cancel) |
| `on_web_resource_request` | `(F) -> Self` | Intercept resource requests |
| `on_download` | `(F) -> Self` | Download request handler |
| `on_document_title_changed` | `(F) -> Self` | Title change handler |
| `on_new_window` | `(F) -> Self` | New window request handler |

### Build

```rust
.build() -> tauri::Result<WebviewWindow<R>>
```

---

## Rust: WindowEvent Enum

```rust
pub enum WindowEvent {
    Resized(PhysicalSize<u32>),
    Moved(PhysicalPosition<i32>),
    CloseRequested { api: CloseRequestApi },
    Destroyed,
    Focused(bool),
    ScaleFactorChanged {
        scale_factor: f64,
        new_inner_size: PhysicalSize<u32>,
    },
    DragDrop(DragDropEvent),
    ThemeChanged(Theme),
}
```

### CloseRequestApi

```rust
impl CloseRequestApi {
    pub fn prevent_close(&self)  // Call to prevent the window from closing
}
```

---

## Rust: Manager Trait Window Methods

```rust
// Get a specific WebviewWindow by label
fn get_webview_window(&self, label: &str) -> Option<WebviewWindow<R>>

// Get all WebviewWindows
fn webview_windows(&self) -> HashMap<String, WebviewWindow<R>>

// Get a raw Window by label (without webview)
fn get_window(&self, label: &str) -> Option<Window<R>>

// Get the currently focused window
fn get_focused_window(&self) -> Option<Window<R>>

// Get all raw Windows
fn windows(&self) -> HashMap<String, Window<R>>
```

---

## Rust: WebviewWindow Instance Methods

```rust
// Get window label
fn label(&self) -> &str

// Visibility
fn show(&self) -> Result<()>
fn hide(&self) -> Result<()>

// Focus
fn set_focus(&self) -> Result<()>

// State
fn maximize(&self) -> Result<()>
fn minimize(&self) -> Result<()>
fn unmaximize(&self) -> Result<()>
fn unminimize(&self) -> Result<()>
fn set_fullscreen(&self, fullscreen: bool) -> Result<()>

// Properties
fn set_title(&self, title: &str) -> Result<()>
fn set_decorations(&self, decorations: bool) -> Result<()>
fn set_always_on_top(&self, always_on_top: bool) -> Result<()>
fn set_resizable(&self, resizable: bool) -> Result<()>

// Lifecycle
fn close(&self) -> Result<()>
fn destroy(&self) -> Result<()>
```

---

## JavaScript: Window Class

**Import:** `import { Window, getCurrentWindow, getAllWindows } from '@tauri-apps/api/window'`

### Static Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `Window.getByLabel` | `(label: string) => Promise<Window \| null>` | Get window by label |
| `Window.getFocusedWindow` | `() => Promise<Window \| null>` | Get focused window |

### Global Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `getCurrentWindow` | `() => Window` | Get current window instance |
| `getAllWindows` | `() => Promise<Window[]>` | Get all windows |

### Constructor

```typescript
new Window(label: string, options?: WindowOptions)
```

### WindowOptions

```typescript
interface WindowOptions {
  url?: string;
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  center?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  fullscreen?: boolean;
  decorations?: boolean;
  alwaysOnTop?: boolean;
  transparent?: boolean;
  focus?: boolean;
  visible?: boolean;
  maximized?: boolean;
}
```

### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Unique window identifier (read-only) |

### Position and Size Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `center()` | `Promise<void>` | Center on screen |
| `setPosition(pos)` | `Promise<void>` | Set position (LogicalPosition or PhysicalPosition) |
| `setSize(size)` | `Promise<void>` | Set size (LogicalSize or PhysicalSize) |
| `innerSize()` | `Promise<PhysicalSize>` | Get client area size |
| `outerSize()` | `Promise<PhysicalSize>` | Get total window size |
| `innerPosition()` | `Promise<PhysicalPosition>` | Get client area position |
| `outerPosition()` | `Promise<PhysicalPosition>` | Get window frame position |

### Visibility and State Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `show()` | `Promise<void>` | Show window |
| `hide()` | `Promise<void>` | Hide window |
| `maximize()` | `Promise<void>` | Maximize |
| `minimize()` | `Promise<void>` | Minimize |
| `unmaximize()` | `Promise<void>` | Restore from maximized |
| `unminimize()` | `Promise<void>` | Restore from minimized |
| `toggleMaximize()` | `Promise<void>` | Toggle maximize state |
| `setFullscreen(bool)` | `Promise<void>` | Set fullscreen mode |
| `isMaximized()` | `Promise<boolean>` | Check maximized state |
| `isMinimized()` | `Promise<boolean>` | Check minimized state |
| `isVisible()` | `Promise<boolean>` | Check visibility |
| `isFullscreen()` | `Promise<boolean>` | Check fullscreen state |

### Property Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setTitle(title)` | `Promise<void>` | Set title bar text |
| `title()` | `Promise<string>` | Get current title |
| `setIcon(path)` | `Promise<void>` | Set window icon |
| `setDecorations(bool)` | `Promise<void>` | Show/hide title bar and borders |
| `setAlwaysOnTop(bool)` | `Promise<void>` | Set always-on-top |
| `setResizable(bool)` | `Promise<void>` | Set resizable |
| `setClosable(bool)` | `Promise<void>` | Set closable |

### Lifecycle Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `close()` | `Promise<void>` | Close (triggers CloseRequested event) |
| `destroy()` | `Promise<void>` | Force-close (no events) |

### Event Methods

| Method | Callback Signature | Description |
|--------|-------------------|-------------|
| `onCloseRequested(cb)` | `(event: CloseRequestedEvent) => void \| Promise<void>` | Close requested |
| `onResized(cb)` | `(event: Event<PhysicalSize>) => void` | Window resized |
| `onMoved(cb)` | `(event: Event<PhysicalPosition>) => void` | Window moved |
| `onFocusChanged(cb)` | `(event: Event<boolean>) => void` | Focus changed |
| `onThemeChanged(cb)` | `(event: Event<Theme>) => void` | Theme changed |
| `onScaleChanged(cb)` | `(event: Event<ScaleChangePayload>) => void` | DPI scale changed |
| `onDragDropEvent(cb)` | `(event: Event<DragDropEvent>) => void` | File drag-and-drop |

All event methods return `Promise<UnlistenFn>`. ALWAYS store and call the unlisten function during cleanup.

---

## JavaScript: Monitor Functions

**Import:** `import { availableMonitors, currentMonitor, primaryMonitor, cursorPosition } from '@tauri-apps/api/window'`

| Function | Returns | Description |
|----------|---------|-------------|
| `availableMonitors()` | `Promise<Monitor[]>` | All available monitors |
| `currentMonitor()` | `Promise<Monitor \| null>` | Monitor containing the window |
| `primaryMonitor()` | `Promise<Monitor \| null>` | Primary display |
| `cursorPosition()` | `Promise<PhysicalPosition>` | Current cursor position |

### Monitor Interface

```typescript
interface Monitor {
  name: string | null;
  size: PhysicalSize;
  position: PhysicalPosition;
  scaleFactor: number;
}
```

---

## JavaScript: DPI Types

**Import:** `import { LogicalSize, PhysicalSize, LogicalPosition, PhysicalPosition } from '@tauri-apps/api/dpi'`

```typescript
class LogicalSize { constructor(width: number, height: number) }
class PhysicalSize { width: number; height: number; toLogical(scaleFactor: number): LogicalSize }
class LogicalPosition { constructor(x: number, y: number) }
class PhysicalPosition { x: number; y: number; toLogical(scaleFactor: number): LogicalPosition }
```
