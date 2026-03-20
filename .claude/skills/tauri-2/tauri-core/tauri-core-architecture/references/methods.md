# API Signatures Reference (Tauri 2.x)

## App

The `App` type represents the full application instance. Only available inside the `setup()` hook.

```rust
impl<R: Runtime> App<R> {
    // Manager trait
    fn app_handle(&self) -> &AppHandle<R>
    fn config(&self) -> &Config
    fn package_info(&self) -> &PackageInfo
    fn get_window(&self, label: &str) -> Option<Window<R>>
    fn get_focused_window(&self) -> Option<Window<R>>
    fn windows(&self) -> HashMap<String, Window<R>>
    fn get_webview_window(&self, label: &str) -> Option<WebviewWindow<R>>
    fn webview_windows(&self) -> HashMap<String, WebviewWindow<R>>
    fn manage<T: Send + Sync + 'static>(&self, state: T) -> bool
    fn unmanage<T: Send + Sync + 'static>(&self) -> Option<T>
    fn state<T: Send + Sync + 'static>(&self) -> State<'_, T>
    fn try_state<T: Send + Sync + 'static>(&self) -> Option<State<'_, T>>
    fn path(&self) -> &PathResolver<R>
    fn add_capability(&self, capability: impl RuntimeCapability) -> Result<()>
    fn resources_table(&self) -> MutexGuard<'_, ResourceTable>

    // App-specific
    fn handle(&self) -> &AppHandle<R>
    fn run<F: FnMut(&AppHandle<R>, RunEvent) + 'static>(self, callback: F)
}
```

**Usage context**: Only available as `&mut App` in `setup()`. For all other contexts, use `AppHandle`.

---

## AppHandle

The primary handle for interacting with the application. `Clone + Send + Sync` -- safe to pass to threads.

```rust
impl<R: Runtime> AppHandle<R> {
    // Manager trait (same as App)
    fn app_handle(&self) -> &AppHandle<R>
    fn config(&self) -> &Config
    fn package_info(&self) -> &PackageInfo
    fn get_window(&self, label: &str) -> Option<Window<R>>
    fn get_focused_window(&self) -> Option<Window<R>>
    fn windows(&self) -> HashMap<String, Window<R>>
    fn get_webview_window(&self, label: &str) -> Option<WebviewWindow<R>>
    fn webview_windows(&self) -> HashMap<String, WebviewWindow<R>>
    fn manage<T: Send + Sync + 'static>(&self, state: T) -> bool
    fn unmanage<T: Send + Sync + 'static>(&self) -> Option<T>
    fn state<T: Send + Sync + 'static>(&self) -> State<'_, T>
    fn try_state<T: Send + Sync + 'static>(&self) -> Option<State<'_, T>>
    fn path(&self) -> &PathResolver<R>
    fn add_capability(&self, capability: impl RuntimeCapability) -> Result<()>
    fn resources_table(&self) -> MutexGuard<'_, ResourceTable>

    // Emitter trait
    fn emit<S: Serialize + Clone>(&self, event: &str, payload: S) -> Result<()>
    fn emit_str(&self, event: &str, payload: String) -> Result<()>
    fn emit_to<I: Into<EventTarget>, S: Serialize + Clone>(
        &self, target: I, event: &str, payload: S
    ) -> Result<()>
    fn emit_filter<S: Serialize + Clone, F: Fn(&EventTarget) -> bool>(
        &self, event: &str, payload: S, filter: F
    ) -> Result<()>

    // Listener trait
    fn listen<F: Fn(Event) + Send + 'static>(
        &self, event: impl Into<String>, handler: F
    ) -> EventId
    fn once<F: FnOnce(Event) + Send + 'static>(
        &self, event: impl Into<String>, handler: F
    ) -> EventId
    fn unlisten(&self, id: EventId)
    fn listen_any<F: Fn(Event) + Send + 'static>(
        &self, event: impl Into<String>, handler: F
    ) -> EventId
    fn once_any<F: FnOnce(Event) + Send + 'static>(
        &self, event: impl Into<String>, handler: F
    ) -> EventId

    // AppHandle-specific
    fn exit(&self, exit_code: i32)
    fn restart(&self)
    fn cleanup_before_exit(&self)
}
```

**Obtaining**: `app.handle().clone()` in `setup()`, or injected as `app: tauri::AppHandle` in commands.

---

## Manager Trait

Implemented by: `App`, `AppHandle`, `Webview`, `WebviewWindow`, `Window`.

```rust
pub trait Manager<R: Runtime>: sealed::ManagerBase<R> {
    fn app_handle(&self) -> &AppHandle<R>
    fn config(&self) -> &Config
    fn package_info(&self) -> &PackageInfo

    // Window access
    fn get_window(&self, label: &str) -> Option<Window<R>>
    fn get_focused_window(&self) -> Option<Window<R>>
    fn windows(&self) -> HashMap<String, Window<R>>
    fn get_webview_window(&self, label: &str) -> Option<WebviewWindow<R>>
    fn webview_windows(&self) -> HashMap<String, WebviewWindow<R>>

    // State management
    fn manage<T: Send + Sync + 'static>(&self, state: T) -> bool
    fn unmanage<T: Send + Sync + 'static>(&self) -> Option<T>
    fn state<T: Send + Sync + 'static>(&self) -> State<'_, T>
    fn try_state<T: Send + Sync + 'static>(&self) -> Option<State<'_, T>>

    // Utilities
    fn path(&self) -> &PathResolver<R>
    fn add_capability(&self, capability: impl RuntimeCapability) -> Result<()>
    fn resources_table(&self) -> MutexGuard<'_, ResourceTable>  // only required method
}
```

**Key rule**: `resources_table()` is the only required method; all others have default implementations.

---

## WebviewWindow

Combined window + webview. The most commonly used type for interacting with application windows.

```rust
impl<R: Runtime> WebviewWindow<R> {
    // Manager trait (all methods listed above)
    // Emitter trait (all methods listed above)
    // Listener trait (all methods listed above)

    // Identity
    fn label(&self) -> &str

    // Window operations
    fn show(&self) -> Result<()>
    fn hide(&self) -> Result<()>
    fn close(&self) -> Result<()>
    fn destroy(&self) -> Result<()>
    fn set_focus(&self) -> Result<()>
    fn is_focused(&self) -> Result<bool>
    fn is_visible(&self) -> Result<bool>

    // Geometry
    fn set_size(&self, size: impl Into<Size>) -> Result<()>
    fn inner_size(&self) -> Result<PhysicalSize<u32>>
    fn outer_size(&self) -> Result<PhysicalSize<u32>>
    fn set_position(&self, position: impl Into<Position>) -> Result<()>
    fn inner_position(&self) -> Result<PhysicalPosition<i32>>
    fn outer_position(&self) -> Result<PhysicalPosition<i32>>
    fn set_min_size(&self, size: Option<impl Into<Size>>) -> Result<()>
    fn set_max_size(&self, size: Option<impl Into<Size>>) -> Result<()>
    fn center(&self) -> Result<()>
    fn scale_factor(&self) -> Result<f64>

    // Window state
    fn set_title(&self, title: &str) -> Result<()>
    fn title(&self) -> Result<String>
    fn set_fullscreen(&self, fullscreen: bool) -> Result<()>
    fn is_fullscreen(&self) -> Result<bool>
    fn maximize(&self) -> Result<()>
    fn unmaximize(&self) -> Result<()>
    fn is_maximized(&self) -> Result<bool>
    fn minimize(&self) -> Result<()>
    fn unminimize(&self) -> Result<()>
    fn is_minimized(&self) -> Result<bool>
    fn set_decorations(&self, decorations: bool) -> Result<()>
    fn is_decorated(&self) -> Result<bool>
    fn set_resizable(&self, resizable: bool) -> Result<()>
    fn is_resizable(&self) -> Result<bool>
    fn set_always_on_top(&self, always_on_top: bool) -> Result<()>
    fn is_always_on_top(&self) -> Result<bool>

    // Webview operations
    fn url(&self) -> Result<Url>
    fn navigate(&self, url: Url) -> Result<()>
    fn eval(&self, js: &str) -> Result<()>
    fn set_zoom(&self, scale_factor: f64) -> Result<()>
    fn clear_all_browsing_data(&self) -> Result<()>

    // Menu
    fn set_menu(&self, menu: Menu<R>) -> Result<Option<Menu<R>>>
    fn menu(&self) -> Option<Menu<R>>
    fn remove_menu(&self) -> Result<Option<Menu<R>>>
    fn is_menu_visible(&self) -> Result<bool>
    fn set_menu_visibility(&self, visible: bool) -> Result<()>
    fn popup_menu(&self, menu: &Menu<R>) -> Result<()>
}
```

---

## Webview

A webview inside a window. Used when you need to access the webview separately from the window.

```rust
impl<R: Runtime> Webview<R> {
    // Manager trait (all methods listed above)
    // Emitter trait (all methods listed above)
    // Listener trait (all methods listed above)

    fn label(&self) -> &str
    fn url(&self) -> Result<Url>
    fn navigate(&self, url: Url) -> Result<()>
    fn eval(&self, js: &str) -> Result<()>
    fn set_zoom(&self, scale_factor: f64) -> Result<()>
    fn clear_all_browsing_data(&self) -> Result<()>
    fn window(&self) -> Window<R>  // get the parent window
}
```

---

## Window

The OS-level window (without webview). Rarely used directly -- prefer `WebviewWindow`.

```rust
impl<R: Runtime> Window<R> {
    // Manager trait (all methods listed above)
    // Emitter trait (all methods listed above)
    // Listener trait (all methods listed above)

    fn label(&self) -> &str

    // All window operations from WebviewWindow (show, hide, close, geometry, etc.)
    // But NO webview operations (url, navigate, eval, etc.)
}
```

---

## WebviewWindowBuilder

Creates new `WebviewWindow` instances programmatically.

```rust
impl<'a, R: Runtime, M: Manager<R>> WebviewWindowBuilder<'a, R, M> {
    fn new(manager: &'a M, label: &str, url: WebviewUrl) -> Self

    // Window geometry
    fn inner_size(self, width: f64, height: f64) -> Self
    fn min_inner_size(self, width: f64, height: f64) -> Self
    fn max_inner_size(self, width: f64, height: f64) -> Self
    fn position(self, x: f64, y: f64) -> Self
    fn center(self) -> Self

    // Window behavior
    fn title(self, title: impl Into<String>) -> Self
    fn visible(self, visible: bool) -> Self
    fn focused(self, focused: bool) -> Self
    fn maximized(self, maximized: bool) -> Self
    fn fullscreen(self, fullscreen: bool) -> Self
    fn resizable(self, resizable: bool) -> Self
    fn closable(self, closable: bool) -> Self
    fn minimizable(self, minimizable: bool) -> Self
    fn maximizable(self, maximizable: bool) -> Self
    fn transparent(self, transparent: bool) -> Self

    // Webview configuration
    fn initialization_script(self, script: impl Into<String>) -> Self
    fn user_agent(self, user_agent: &str) -> Self
    fn devtools(self, enabled: bool) -> Self
    fn disable_javascript(self) -> Self
    fn zoom_hotkeys_enabled(self, enabled: bool) -> Self

    // Event handlers
    fn on_page_load(self, f: F) -> Self
    fn on_navigation(self, f: F) -> Self
    fn on_web_resource_request(self, f: F) -> Self
    fn on_download(self, f: F) -> Self

    // Build
    fn build(self) -> Result<WebviewWindow<R>>
}
```

---

## State<'_, T>

Accessor for managed state in commands.

```rust
pub struct State<'r, T: Send + Sync + 'static>(&'r T);

impl<'r, T: Send + Sync + 'static> State<'r, T> {
    fn inner(&self) -> &'r T
}

// Deref to &T -- you can call T's methods directly
impl<T: Send + Sync + 'static> Deref for State<'_, T> {
    type Target = T;
}
```

**ALWAYS** match the exact registered type:
- Registered `Mutex<T>` -> use `State<'_, Mutex<T>>`
- Registered `T` -> use `State<'_, T>`

---

## Builder

The application configuration entry point.

```rust
impl<R: Runtime> Builder<R> {
    fn new() -> Self
    fn default() -> Self  // equivalent to new()
    fn any_thread(self) -> Self
    fn setup<F>(self, setup: F) -> Self
        where F: FnOnce(&mut App<R>) -> Result<(), Box<dyn Error>> + Send + 'static
    fn invoke_handler<F>(self, handler: F) -> Self
    fn manage<T: Send + Sync + 'static>(self, state: T) -> Self
    fn plugin<P: Plugin<R> + 'static>(self, plugin: P) -> Self
    fn menu<F>(self, f: F) -> Self
    fn on_menu_event<F>(self, handler: F) -> Self
    fn on_window_event<F>(self, handler: F) -> Self
    fn on_webview_event<F>(self, handler: F) -> Self
    fn on_page_load<F>(self, handler: F) -> Self
    fn on_tray_icon_event<F>(self, handler: F) -> Self
    fn enable_macos_default_menu(self, enable: bool) -> Self
    fn register_uri_scheme_protocol<N, H>(self, name: N, handler: H) -> Self
    fn device_event_filter(self, filter: DeviceEventFilter) -> Self
    fn build(self, context: Context<R>) -> Result<App<R>>
    fn run(self, context: Context<R>) -> Result<()>
}
```

---

## Channel<T> (IPC Streaming)

Enables streaming data from Rust to JavaScript.

```rust
pub struct Channel<TSend = InvokeResponseBody> { /* ... */ }

impl<TSend: IpcResponse> Channel<TSend> {
    fn new<F>(on_message: F) -> Self
        where F: Fn(InvokeResponseBody) -> Result<()> + Send + Sync + 'static
    fn id(&self) -> u32
    fn send(&self, data: TSend) -> Result<()>
}

// Clone + Send + Sync -- safe across threads
```

---

## PathResolver

Access standard application directories.

```rust
impl<R: Runtime> PathResolver<R> {
    fn app_data_dir(&self) -> Result<PathBuf>
    fn app_local_data_dir(&self) -> Result<PathBuf>
    fn app_cache_dir(&self) -> Result<PathBuf>
    fn app_config_dir(&self) -> Result<PathBuf>
    fn app_log_dir(&self) -> Result<PathBuf>
    fn audio_dir(&self) -> Result<PathBuf>
    fn cache_dir(&self) -> Result<PathBuf>
    fn config_dir(&self) -> Result<PathBuf>
    fn data_dir(&self) -> Result<PathBuf>
    fn desktop_dir(&self) -> Result<PathBuf>
    fn document_dir(&self) -> Result<PathBuf>
    fn download_dir(&self) -> Result<PathBuf>
    fn home_dir(&self) -> Result<PathBuf>
    fn temp_dir(&self) -> Result<PathBuf>
    fn resource_dir(&self) -> Result<PathBuf>
}
```
