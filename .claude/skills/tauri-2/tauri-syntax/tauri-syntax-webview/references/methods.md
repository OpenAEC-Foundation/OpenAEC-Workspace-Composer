# tauri-syntax-webview: API Method Reference

Sources: https://v2.tauri.app/reference/javascript/api/namespacewebview/,
https://docs.rs/tauri/latest/tauri/webview/index.html

---

## TypeScript: Webview Class

**Import:** `import { Webview, getCurrentWebview, getAllWebviews } from '@tauri-apps/api/webview'`

### Constructor

```typescript
new Webview(window: Window, label: string, options: WebviewOptions): Webview
```

Creates a new webview inside an existing window.

**Parameters:**
- `window` -- Parent `Window` instance (from `@tauri-apps/api/window`)
- `label` -- Unique string identifier for this webview
- `options` -- Configuration object

**WebviewOptions:**

| Property | Type | Description |
|----------|------|-------------|
| `url` | `string` | URL or app path to load |
| `x` | `number` | X position within parent window (logical pixels) |
| `y` | `number` | Y position within parent window (logical pixels) |
| `width` | `number` | Width in logical pixels |
| `height` | `number` | Height in logical pixels |
| `transparent` | `boolean` | Enable transparent background |
| `acceptFirstMouse` | `boolean` | macOS: accept first mouse click |
| `windowEffects` | `WindowEffectsConfig` | Visual effects (blur, vibrancy) |
| `incognito` | `boolean` | Private browsing mode |
| `zoomHotkeysEnabled` | `boolean` | Enable Ctrl+/- zoom shortcuts |
| `dragDropEnabled` | `boolean` | Enable file drag-drop events |
| `useHttpsScheme` | `boolean` | Use https:// instead of http:// for asset protocol |
| `devtools` | `boolean` | Enable developer tools |
| `backgroundColor` | `Color` | Background color |
| `proxyUrl` | `string` | Proxy URL for network requests |
| `userAgent` | `string` | Custom user agent string |
| `javascript` | `boolean` | Enable/disable JavaScript execution |
| `focus` | `boolean` | Focus on creation |

### Static Methods

```typescript
Webview.getByLabel(label: string): Promise<Webview | null>
```

Returns the `Webview` with the given label, or `null` if not found.

### Module-Level Functions

```typescript
getCurrentWebview(): Webview
```

Returns the `Webview` instance for the current context. Synchronous.

```typescript
getAllWebviews(): Promise<Webview[]>
```

Returns all webview instances across all windows.

### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Unique identifier (read-only) |
| `window` | `Window` | Parent window reference (read-only) |

### Instance Methods -- Content

```typescript
webview.setZoom(scaleFactor: number): Promise<void>
```

Sets the zoom level. `1.0` = 100%, `1.5` = 150%, `0.5` = 50%.

```typescript
webview.clearAllBrowsingData(): Promise<void>
```

Clears cookies, cache, local storage, and all other browsing data.

### Instance Methods -- Layout

```typescript
webview.size(): Promise<PhysicalSize>
```

Returns the current physical size of the webview.

```typescript
webview.position(): Promise<PhysicalPosition>
```

Returns the current physical position within the parent window.

```typescript
webview.setSize(size: LogicalSize | PhysicalSize): Promise<void>
```

Sets the webview size. Use `LogicalSize` for DPI-independent sizing.

```typescript
webview.setPosition(position: LogicalPosition | PhysicalPosition): Promise<void>
```

Sets the webview position within its parent window.

```typescript
webview.setAutoResize(enabled: boolean): Promise<void>
```

When `true`, the webview automatically resizes with its parent window.

### Instance Methods -- Visibility

```typescript
webview.show(): Promise<void>
```

Makes the webview visible.

```typescript
webview.hide(): Promise<void>
```

Hides the webview without destroying it.

```typescript
webview.setFocus(): Promise<void>
```

Sets keyboard focus to this webview.

### Instance Methods -- Lifecycle

```typescript
webview.reparent(window: Window | WebviewWindow | string): Promise<void>
```

Moves this webview to a different parent window. Accepts a `Window` instance, `WebviewWindow` instance, or a window label string.

```typescript
webview.close(): Promise<void>
```

Closes and destroys the webview. Cannot be used after calling this.

### Instance Methods -- Events

```typescript
webview.listen<T>(event: string, handler: EventCallback<T>): Promise<UnlistenFn>
```

Listens for events emitted to this specific webview. Returns a function to remove the listener.

```typescript
webview.once<T>(event: string, handler: EventCallback<T>): Promise<UnlistenFn>
```

Listens for a single event, then auto-removes.

```typescript
webview.emit(event: string, payload?: unknown): Promise<void>
```

Emits an event from this webview.

```typescript
webview.emitTo(target: string | EventTarget, event: string, payload?: unknown): Promise<void>
```

Emits an event to a specific target from this webview.

```typescript
webview.onDragDropEvent(handler: EventCallback<DragDropEvent>): Promise<UnlistenFn>
```

Listens for file drag-and-drop events on this webview.

---

## TypeScript: DPI Types

**Import:** `import { LogicalSize, PhysicalSize, LogicalPosition, PhysicalPosition } from '@tauri-apps/api/dpi'`

### LogicalSize

```typescript
new LogicalSize(width: number, height: number)
```

Properties: `width: number`, `height: number`, `type: 'Logical'`

### PhysicalSize

```typescript
new PhysicalSize(width: number, height: number)
```

Properties: `width: number`, `height: number`, `type: 'Physical'`

Method: `toLogical(scaleFactor: number): LogicalSize`

### LogicalPosition

```typescript
new LogicalPosition(x: number, y: number)
```

Properties: `x: number`, `y: number`, `type: 'Logical'`

### PhysicalPosition

```typescript
new PhysicalPosition(x: number, y: number)
```

Properties: `x: number`, `y: number`, `type: 'Physical'`

Method: `toLogical(scaleFactor: number): LogicalPosition`

---

## Rust: Webview and WebviewBuilder

**Import:** `use tauri::webview::{Webview, WebviewBuilder};`

### WebviewBuilder

```rust
WebviewBuilder::new(label: &str, url: WebviewUrl) -> WebviewBuilder
```

Creates a new webview builder. Key chaining methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `.auto_resize()` | `-> Self` | Auto-resize with parent |
| `.transparent(bool)` | `-> Self` | Transparent background |
| `.initialization_script(script)` | `-> Self` | Inject JS on page load |
| `.user_agent(ua)` | `-> Self` | Custom user agent |
| `.devtools(bool)` | `-> Self` | Enable devtools |
| `.disable_javascript()` | `-> Self` | Disable JS execution |
| `.zoom_hotkeys_enabled(bool)` | `-> Self` | Enable zoom shortcuts |
| `.on_page_load(F)` | `-> Self` | Page load callback |
| `.on_navigation(F)` | `-> Self` | Navigation callback |
| `.on_download(F)` | `-> Self` | Download callback |
| `.build()` | `-> Result<Webview>` | Build the webview |

### Webview Instance (Rust)

| Method | Returns | Description |
|--------|---------|-------------|
| `webview.label()` | `&str` | Get the label |
| `webview.url()` | `Result<Url>` | Get current URL |
| `webview.navigate(url)` | `Result<()>` | Navigate to URL |
| `webview.eval(js)` | `Result<()>` | Execute JavaScript |
| `webview.set_zoom(factor)` | `Result<()>` | Set zoom level |
| `webview.show()` | `Result<()>` | Show webview |
| `webview.hide()` | `Result<()>` | Hide webview |
| `webview.set_focus()` | `Result<()>` | Focus webview |
| `webview.close()` | `Result<()>` | Close and destroy |
| `webview.reparent(window)` | `Result<()>` | Move to another window |

### WebviewUrl Variants

```rust
use tauri::WebviewUrl;

WebviewUrl::App("index.html".into())          // App asset path
WebviewUrl::External("https://example.com".parse().unwrap())  // External URL
```

---

## Rust: WebviewWindowBuilder (Combined)

**Import:** `use tauri::webview::WebviewWindowBuilder;`

For the common pattern of one webview per window:

```rust
WebviewWindowBuilder::new(manager, label, url)
    .title("Title")
    .inner_size(800.0, 600.0)
    .build()?;
```

This creates both a `Window` and a `Webview` bound together as a `WebviewWindow`.
