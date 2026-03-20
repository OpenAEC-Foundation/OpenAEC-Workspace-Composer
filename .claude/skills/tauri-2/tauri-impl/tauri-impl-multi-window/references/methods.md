# tauri-impl-multi-window: API Method Reference

Sources: https://v2.tauri.app/develop/window-customization/,
https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html,
https://v2.tauri.app/reference/javascript/api/namespacewindow/,
vooronderzoek-tauri.md Sections 2.6, 3.3

---

## Rust: WebviewWindowBuilder

### Constructor

```rust
pub fn new<M, L>(
    manager: &M,         // App, AppHandle, or any Manager implementor
    label: L,            // Unique window label (string)
    url: WebviewUrl,     // URL to load
) -> Self
where
    M: Manager<R>,
    L: Into<String>,
```

### WebviewUrl

```rust
pub enum WebviewUrl {
    App(PathBuf),           // Local file: WebviewUrl::App("index.html".into())
    External(Url),          // External URL: WebviewUrl::External("https://...".parse().unwrap())
    CustomProtocol(Url),    // Custom protocol URL
}
```

### Geometry Methods

```rust
pub fn inner_size(self, width: f64, height: f64) -> Self
pub fn min_inner_size(self, width: f64, height: f64) -> Self
pub fn max_inner_size(self, width: f64, height: f64) -> Self
pub fn position(self, x: f64, y: f64) -> Self
pub fn center(self) -> Self
```

### Behavior Methods

```rust
pub fn title(self, title: impl Into<String>) -> Self
pub fn visible(self, visible: bool) -> Self           // default: true
pub fn focused(self, focused: bool) -> Self           // default: true
pub fn maximized(self, maximized: bool) -> Self
pub fn fullscreen(self, fullscreen: bool) -> Self
pub fn resizable(self, resizable: bool) -> Self       // default: true
pub fn closable(self, closable: bool) -> Self         // default: true
pub fn minimizable(self, minimizable: bool) -> Self   // default: true
pub fn maximizable(self, maximizable: bool) -> Self   // default: true
pub fn focusable(self, focusable: bool) -> Self       // default: true
pub fn transparent(self, transparent: bool) -> Self
pub fn decorations(self, decorations: bool) -> Self   // default: true
pub fn always_on_top(self, always_on_top: bool) -> Self
```

### Webview Configuration Methods

```rust
pub fn initialization_script(self, script: impl Into<String>) -> Self
pub fn user_agent(self, user_agent: &str) -> Self
pub fn devtools(self, enabled: bool) -> Self
pub fn disable_javascript(self) -> Self
pub fn zoom_hotkeys_enabled(self, enabled: bool) -> Self
```

### Event Handlers

```rust
pub fn on_page_load<F>(self, f: F) -> Self
where F: Fn(WebviewWindow<R>, PageLoadPayload<'_>) + Send + Sync + 'static

pub fn on_navigation<F>(self, f: F) -> Self
where F: Fn(&Url) -> bool + Send + Sync + 'static
```

### Build

```rust
pub fn build(self) -> Result<WebviewWindow<R>>
```

---

## Rust: WebviewWindow<R> Methods

### Window Manipulation

```rust
pub fn show(&self) -> Result<()>
pub fn hide(&self) -> Result<()>
pub fn close(&self) -> Result<()>
pub fn destroy(&self) -> Result<()>       // Force close without events
pub fn set_focus(&self) -> Result<()>
pub fn maximize(&self) -> Result<()>
pub fn minimize(&self) -> Result<()>
pub fn unmaximize(&self) -> Result<()>
pub fn unminimize(&self) -> Result<()>
pub fn set_fullscreen(&self, fullscreen: bool) -> Result<()>
```

### Window Properties

```rust
pub fn set_title(&self, title: &str) -> Result<()>
pub fn title(&self) -> Result<String>
pub fn set_size<S: Into<Size>>(&self, size: S) -> Result<()>
pub fn set_position<P: Into<Position>>(&self, position: P) -> Result<()>
pub fn set_resizable(&self, resizable: bool) -> Result<()>
pub fn set_closable(&self, closable: bool) -> Result<()>
pub fn set_decorations(&self, decorations: bool) -> Result<()>
pub fn set_always_on_top(&self, always_on_top: bool) -> Result<()>
pub fn center(&self) -> Result<()>
```

### Window State Queries

```rust
pub fn label(&self) -> &str
pub fn is_visible(&self) -> Result<bool>
pub fn is_maximized(&self) -> Result<bool>
pub fn is_minimized(&self) -> Result<bool>
pub fn is_fullscreen(&self) -> Result<bool>
pub fn is_focused(&self) -> Result<bool>
pub fn inner_size(&self) -> Result<PhysicalSize<u32>>
pub fn outer_size(&self) -> Result<PhysicalSize<u32>>
pub fn inner_position(&self) -> Result<PhysicalPosition<i32>>
pub fn outer_position(&self) -> Result<PhysicalPosition<i32>>
pub fn scale_factor(&self) -> Result<f64>
pub fn theme(&self) -> Result<Theme>
```

---

## Rust: Manager Trait — Window Access

```rust
// Get window by label
fn get_webview_window(&self, label: &str) -> Option<WebviewWindow<R>>

// Get all windows
fn webview_windows(&self) -> HashMap<String, WebviewWindow<R>>

// Get focused window
fn get_focused_window(&self) -> Option<Window<R>>
```

---

## Rust: Emitter Trait — Inter-Window Events

```rust
// Broadcast to ALL windows
fn emit<S: Serialize + Clone>(&self, event: &str, payload: S) -> Result<()>

// Emit to a specific target (window label)
fn emit_to<I: Into<EventTarget>, S: Serialize + Clone>(
    &self, target: I, event: &str, payload: S
) -> Result<()>

// Emit to targets matching a filter
fn emit_filter<S: Serialize + Clone, F: Fn(&EventTarget) -> bool>(
    &self, event: &str, payload: S, filter: F
) -> Result<()>
```

---

## TypeScript: Window Class

### Static Methods

```typescript
static getByLabel(label: string): Promise<Window | null>
static getFocusedWindow(): Promise<Window | null>
```

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
    resizable?: boolean;
    closable?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    fullscreen?: boolean;
    decorations?: boolean;
    alwaysOnTop?: boolean;
    transparent?: boolean;
    visible?: boolean;
    focused?: boolean;
    maximized?: boolean;
}
```

### Instance Methods

```typescript
// Visibility
show(): Promise<void>
hide(): Promise<void>
close(): Promise<void>
destroy(): Promise<void>
setFocus(): Promise<void>

// Size and position
center(): Promise<void>
setPosition(position: LogicalPosition | PhysicalPosition): Promise<void>
setSize(size: LogicalSize | PhysicalSize): Promise<void>
innerSize(): Promise<PhysicalSize>
outerSize(): Promise<PhysicalSize>
innerPosition(): Promise<PhysicalPosition>
outerPosition(): Promise<PhysicalPosition>

// State
maximize(): Promise<void>
minimize(): Promise<void>
unmaximize(): Promise<void>
unminimize(): Promise<void>
toggleMaximize(): Promise<void>
setFullscreen(fullscreen: boolean): Promise<void>
isMaximized(): Promise<boolean>
isMinimized(): Promise<boolean>
isVisible(): Promise<boolean>
isFullscreen(): Promise<boolean>

// Properties
setTitle(title: string): Promise<void>
title(): Promise<string>
setDecorations(decorations: boolean): Promise<void>
setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>
setResizable(resizable: boolean): Promise<void>
setClosable(closable: boolean): Promise<void>
```

### Event Methods

```typescript
onCloseRequested(handler: (event: CloseRequestedEvent) => void | Promise<void>): Promise<UnlistenFn>
onResized(handler: EventCallback<PhysicalSize>): Promise<UnlistenFn>
onMoved(handler: EventCallback<PhysicalPosition>): Promise<UnlistenFn>
onFocusChanged(handler: EventCallback<boolean>): Promise<UnlistenFn>
onThemeChanged(handler: EventCallback<Theme>): Promise<UnlistenFn>
onScaleChanged(handler: EventCallback<ScaleChangePayload>): Promise<UnlistenFn>
onDragDropEvent(handler: EventCallback<DragDropEvent>): Promise<UnlistenFn>
```

---

## TypeScript: Event Functions

```typescript
// Import
import { listen, emit, emitTo, once } from '@tauri-apps/api/event';

// Listen for events (returns unlisten function)
listen<T>(event: string, handler: EventCallback<T>, options?: Options): Promise<UnlistenFn>

// Listen once (auto-removes after first event)
once<T>(event: string, handler: EventCallback<T>, options?: Options): Promise<UnlistenFn>

// Broadcast event to all listeners
emit(event: string, payload?: unknown): Promise<void>

// Send event to specific target
emitTo(target: string | EventTarget, event: string, payload?: unknown): Promise<void>
```

---

## TypeScript: Utility Functions

```typescript
import { getCurrentWindow, getAllWindows } from '@tauri-apps/api/window';

getCurrentWindow(): Window           // Current window reference
getAllWindows(): Promise<Window[]>    // All window references
```

```typescript
import { LogicalPosition, LogicalSize, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi';

new LogicalPosition(x: number, y: number)
new LogicalSize(width: number, height: number)
new PhysicalPosition(x: number, y: number)
new PhysicalSize(width: number, height: number)
```
