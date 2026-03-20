# tauri-core-runtime: Methods Reference

> Tauri 2.x (v2.10.2+). All signatures from docs.rs/tauri.

## Builder Methods

### Constructor

```rust
tauri::Builder::default() -> Builder<Wry>
tauri::Builder::new() -> Builder<Wry>
```

### Configuration Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setup` | `fn setup<F>(self, f: F) -> Self where F: FnOnce(&mut App<R>) -> Result<(), Box<dyn Error>> + Send + 'static` | App initialization hook. Runs after app init, before windows shown. |
| `invoke_handler` | `fn invoke_handler<F>(self, f: F) -> Self` | Register IPC command handlers. Use `tauri::generate_handler![...]`. |
| `manage` | `fn manage<T: Send + Sync + 'static>(self, state: T) -> Self` | Register managed state. Wraps in `Arc` internally. |
| `plugin` | `fn plugin<P: Plugin<R>>(self, plugin: P) -> Self` | Register a plugin. |
| `plugin_boxed` | `fn plugin_boxed(self, plugin: Box<dyn Plugin<R>>) -> Self` | Register a boxed plugin. |
| `menu` | `fn menu<F>(self, f: F) -> Self where F: FnOnce(&AppHandle<R>) -> Result<Menu<R>, Box<dyn Error>> + Send + 'static` | Set the application menu. |
| `on_menu_event` | `fn on_menu_event<F>(self, f: F) -> Self where F: Fn(&AppHandle<R>, MenuEvent) + Send + Sync + 'static` | Global menu event handler. |
| `on_tray_icon_event` | `fn on_tray_icon_event<F>(self, f: F) -> Self where F: Fn(&TrayIcon<R>, TrayIconEvent) + Send + Sync + 'static` | Tray icon event handler. |
| `on_window_event` | `fn on_window_event<F>(self, f: F) -> Self where F: Fn(&Window<R>, &WindowEvent) + Send + Sync + 'static` | Window event handler for ALL windows. |
| `on_webview_event` | `fn on_webview_event<F>(self, f: F) -> Self where F: Fn(&Webview<R>, &WebviewEvent) + Send + Sync + 'static` | Webview event handler. |
| `on_page_load` | `fn on_page_load<F>(self, f: F) -> Self where F: Fn(&Webview<R>, &PageLoadPayload<'_>) + Send + Sync + 'static` | Page load handler. |
| `any_thread` | `fn any_thread(self) -> Self` | Allow running on any thread (not just main). |
| `enable_macos_default_menu` | `fn enable_macos_default_menu(self, enable: bool) -> Self` | Toggle macOS default menu. |
| `register_uri_scheme_protocol` | `fn register_uri_scheme_protocol<N, H>(self, name: N, handler: H) -> Self` | Register custom URI scheme. |
| `register_asynchronous_uri_scheme_protocol` | `fn register_asynchronous_uri_scheme_protocol<N, H>(self, name: N, handler: H) -> Self` | Async URI scheme handler. |
| `device_event_filter` | `fn device_event_filter(self, filter: DeviceEventFilter) -> Self` | Filter device events. |

### Terminal Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `build` | `fn build(self, context: Context<impl Assets>) -> Result<App<R>>` | Build the app without running. Returns `App<R>`. |
| `run` | `fn run(self, context: Context<impl Assets>) -> Result<()>` | Build and run the app. Blocks until exit. |

## AppHandle Methods

`AppHandle<R>` implements: `Clone`, `Send`, `Sync`, `Manager<R>`, `Emitter<R>`, `Listener<R>`.

### Core Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `exit` | `fn exit(&self, exit_code: i32)` | Exit the application with given code. |
| `restart` | `fn restart(&self)` | Restart the application (requires process plugin). |
| `cleanup_before_exit` | `fn cleanup_before_exit(&self)` | Run cleanup routines before exit. |
| `default_window_icon` | `fn default_window_icon(&self) -> Option<&Image<'_>>` | Get default window icon. |
| `asset_protocol_scope` | `fn asset_protocol_scope(&self) -> Scope` | Get the asset protocol scope. |
| `env` | `fn env(&self) -> Env` | Get environment info. |

### Obtained via Manager trait

| Method | Signature | Description |
|--------|-----------|-------------|
| `state` | `fn state<T: Send + Sync + 'static>(&self) -> State<'_, T>` | Get managed state. Panics if type not registered. |
| `try_state` | `fn try_state<T: Send + Sync + 'static>(&self) -> Option<State<'_, T>>` | Get managed state, returns None if not registered. |
| `manage` | `fn manage<T: Send + Sync + 'static>(&self, state: T) -> bool` | Register state at runtime. Returns false if already registered. |
| `unmanage` | `fn unmanage<T: Send + Sync + 'static>(&self) -> Option<T>` | Remove and return managed state. |
| `get_webview_window` | `fn get_webview_window(&self, label: &str) -> Option<WebviewWindow<R>>` | Get window by label. |
| `webview_windows` | `fn webview_windows(&self) -> HashMap<String, WebviewWindow<R>>` | Get all windows. |
| `get_window` | `fn get_window(&self, label: &str) -> Option<Window<R>>` | Get raw window by label. |
| `get_focused_window` | `fn get_focused_window(&self) -> Option<Window<R>>` | Get currently focused window. |
| `windows` | `fn windows(&self) -> HashMap<String, Window<R>>` | Get all raw windows. |
| `config` | `fn config(&self) -> &Config` | Get app configuration. |
| `package_info` | `fn package_info(&self) -> &PackageInfo` | Get package info (name, version). |
| `path` | `fn path(&self) -> &PathResolver<R>` | Get path resolver for app directories. |
| `add_capability` | `fn add_capability(&self, cap: impl RuntimeCapability) -> Result<()>` | Add runtime capability. |

## Manager Trait

The `Manager` trait is the unifying interface. It is implemented by:
- `App<R>`
- `AppHandle<R>`
- `Window<R>`
- `WebviewWindow<R>`
- `Webview<R>`

### Required Method

```rust
fn resources_table(&self) -> MutexGuard<'_, ResourceTable>
```

### Provided Methods (full list)

```rust
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

// Paths
fn path(&self) -> &PathResolver<R>

// Capabilities
fn add_capability(&self, capability: impl RuntimeCapability) -> Result<()>
```

## PathResolver Methods

Obtained via `Manager::path()`. All methods return `Result<PathBuf>`.

| Method | Returns | Platform Example (Linux) |
|--------|---------|--------------------------|
| `app_config_dir()` | App config directory | `~/.config/{identifier}` |
| `app_data_dir()` | App data directory | `~/.local/share/{identifier}` |
| `app_local_data_dir()` | Local data directory | `~/.local/share/{identifier}` |
| `app_cache_dir()` | Cache directory | `~/.cache/{identifier}` |
| `app_log_dir()` | Log directory | `~/.local/share/{identifier}/logs` |
| `resource_dir()` | Bundled resource directory | App bundle resources |
| `temp_dir()` | System temp directory | `/tmp` |
| `home_dir()` | User home directory | `~` |
| `desktop_dir()` | Desktop directory | `~/Desktop` |
| `document_dir()` | Documents directory | `~/Documents` |
| `download_dir()` | Downloads directory | `~/Downloads` |

## RunEvent Enum

Used in the run callback when using `.build()` + `app.run()`:

| Variant | Description |
|---------|-------------|
| `Ready` | App is ready |
| `ExitRequested { api, code }` | Exit requested; call `api.prevent_exit()` to cancel |
| `Exit` | Final event before process exit |
| `Resumed` | App resumed (mobile) |
| `MainEventsCleared` | Main event loop iteration complete |

## Emitter Trait Methods

Implemented by `App`, `AppHandle`, `Webview`, `WebviewWindow`, `Window`.

```rust
fn emit<S: Serialize + Clone>(&self, event: &str, payload: S) -> Result<()>
fn emit_str(&self, event: &str, payload: String) -> Result<()>
fn emit_to<I: Into<EventTarget>, S: Serialize + Clone>(&self, target: I, event: &str, payload: S) -> Result<()>
fn emit_filter<S: Serialize + Clone, F: Fn(&EventTarget) -> bool>(&self, event: &str, payload: S, filter: F) -> Result<()>
```

## Listener Trait Methods

Implemented by the same types as Emitter.

```rust
fn listen<F>(&self, event: impl Into<String>, handler: F) -> EventId
    where F: Fn(Event) + Send + 'static
fn once<F>(&self, event: impl Into<String>, handler: F) -> EventId
    where F: FnOnce(Event) + Send + 'static
fn unlisten(&self, id: EventId)
fn listen_any<F>(&self, event: impl Into<String>, handler: F) -> EventId
    where F: Fn(Event) + Send + 'static
fn once_any<F>(&self, event: impl Into<String>, handler: F) -> EventId
    where F: FnOnce(Event) + Send + 'static
```
