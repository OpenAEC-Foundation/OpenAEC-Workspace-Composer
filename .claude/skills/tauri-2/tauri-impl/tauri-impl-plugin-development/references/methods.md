# tauri-impl-plugin-development: API Method Reference

Sources: https://v2.tauri.app/develop/plugins/,
https://docs.rs/tauri/latest/tauri/plugin/struct.Builder.html,
vooronderzoek-tauri.md Section 2.5

---

## tauri::plugin::Builder

The `Builder<R, C>` struct constructs a `TauriPlugin`. `R` is the runtime generic (defaults to `Wry`), `C` is the optional config type.

### Constructor

```rust
pub fn new(name: &'static str) -> Self
```

Creates a new plugin builder. The `name` MUST be unique across all registered plugins. This name determines the JS invoke prefix: `plugin:<name>|<command>`.

### Methods

```rust
// Register command handlers for this plugin
pub fn invoke_handler<F>(self, invoke_handler: F) -> Self
where
    F: Fn(tauri::ipc::Invoke<R>) -> bool + Send + Sync + 'static

// Typical usage with macro:
.invoke_handler(tauri::generate_handler![cmd_a, cmd_b])
```

```rust
// Plugin initialization hook
// Receives &AppHandle<R> and &PluginApi<R, C>
pub fn setup<F>(self, setup: F) -> Self
where
    F: FnOnce(&AppHandle<R>, PluginApi<R, C>) -> Result<(), Box<dyn std::error::Error>> + Send + 'static
```

```rust
// Navigation filter for webviews
// Return true to allow, false to block
pub fn on_navigation<F>(self, on_navigation: F) -> Self
where
    F: Fn(&WebviewWindow<R>, &Url) -> bool + Send + Sync + 'static
```

```rust
// Called when a webview is ready
pub fn on_webview_ready<F>(self, on_webview_ready: F) -> Self
where
    F: Fn(WebviewWindow<R>) + Send + Sync + 'static
```

```rust
// Called on application events (exit, window events)
pub fn on_event<F>(self, on_event: F) -> Self
where
    F: Fn(&AppHandle<R>, &RunEvent) + Send + Sync + 'static
```

```rust
// Called when plugin is destroyed / app exits
pub fn on_drop<F>(self, on_drop: F) -> Self
where
    F: FnOnce(AppHandle<R>) + Send + 'static
```

```rust
// Build the plugin
pub fn build(self) -> TauriPlugin<R, C>
```

---

## tauri::plugin::PluginApi<R, C>

Provided in the `setup` callback. Gives access to plugin configuration.

```rust
// Get plugin configuration (deserialized from tauri.conf.json -> plugins.<name>)
pub fn config(&self) -> &C
```

---

## tauri::plugin::TauriPlugin<R, C>

Type alias for the built plugin. Registered via `Builder::default().plugin(my_plugin::init())`.

```rust
pub type TauriPlugin<R, C = ()> = Box<dyn Plugin<R, C>>
```

---

## tauri_plugin::Builder (build.rs)

Used in `build.rs` of plugin crates to auto-generate permission files.

```rust
// Constructor — takes list of command names
pub fn new(commands: &[&str]) -> Self

// Build and generate permission files
pub fn build(self)
```

Generated permissions per command:
- `allow-<command-name>` -- Allows invoking the command
- `deny-<command-name>` -- Denies invoking the command

---

## tauri::ipc::CommandScope<'a, T>

Access scope entries defined for a specific command in capability files.

```rust
// Get allowed scope entries
pub fn allows(&self) -> &[T]

// Get denied scope entries
pub fn denies(&self) -> &[T]
```

`T` must implement `serde::Deserialize`.

---

## tauri::ipc::GlobalScope<'a, T>

Access global scope entries (applies to all commands of a plugin).

```rust
// Get allowed global scope entries
pub fn allows(&self) -> &[T]

// Get denied global scope entries
pub fn denies(&self) -> &[T]
```

---

## RunEvent Variants (used in on_event)

| Variant | Fields | Description |
|---------|--------|-------------|
| `ExitRequested` | `api: ExitRequestApi` | App exit requested; call `api.prevent_exit()` to cancel |
| `Exit` | -- | App is exiting (final cleanup) |
| `WindowEvent` | `label: String, event: WindowEvent` | Window-level event |
| `WebviewEvent` | `label: String, event: WebviewEvent` | Webview-level event |
| `Reopen` | `has_visible_windows: bool` | App reopened (macOS dock click) |

---

## Plugin Command Function Signature

Plugin commands ALWAYS use the `R: Runtime` generic:

```rust
#[tauri::command]
async fn my_command<R: Runtime>(
    app: AppHandle<R>,           // Application handle
    window: WebviewWindow<R>,    // Calling window
    state: State<'_, MyState>,   // Managed state
    arg: String,                 // User argument
) -> Result<String, String> {
    Ok("result".into())
}
```

Frontend invocation uses the `plugin:<name>|<command>` prefix:

```typescript
await invoke('plugin:my-plugin|my_command', { arg: 'value' });
```
