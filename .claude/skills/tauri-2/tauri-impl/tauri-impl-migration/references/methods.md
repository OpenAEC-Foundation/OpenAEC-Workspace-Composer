# tauri-impl-migration: Complete API Mapping Reference

Sources: https://v2.tauri.app/start/migrate/from-tauri-1/,
vooronderzoek-tauri.md Section 8

---

## Configuration Key Mapping

### Top-Level Keys

| Tauri v1 Path | Tauri v2 Path | Notes |
|---------------|---------------|-------|
| `package.productName` | `productName` | Moved to top level |
| `package.version` | `version` | Moved to top level |
| `tauri` | `app` | Renamed |
| `tauri.bundle` | `bundle` | Moved to top level |
| `tauri.allowlist` | -- | Removed, replaced by capabilities/permissions |
| `plugins` | `plugins` | Unchanged |

### Build Section

| Tauri v1 Path | Tauri v2 Path |
|---------------|---------------|
| `build.distDir` | `build.frontendDist` |
| `build.devPath` | `build.devUrl` |
| `build.withGlobalTauri` | `app.withGlobalTauri` |
| `build.beforeDevCommand` | `build.beforeDevCommand` (unchanged) |
| `build.beforeBuildCommand` | `build.beforeBuildCommand` (unchanged) |

### App Section

| Tauri v1 Path | Tauri v2 Path |
|---------------|---------------|
| `tauri.windows` | `app.windows` |
| `tauri.windows[].fileDropEnabled` | `app.windows[].dragDropEnabled` |
| `tauri.systemTray` | `app.trayIcon` |
| `tauri.cli` | `plugins.cli` |
| `tauri.updater` | `plugins.updater` |

### Security Section

| Tauri v1 Path | Tauri v2 Path |
|---------------|---------------|
| `tauri.security.csp` | `app.security.csp` |
| `tauri.security.freezePrototype` | `app.security.freezePrototype` |
| `tauri.allowlist.protocol.assetScope` | `app.security.assetProtocol.scope` |
| `tauri.pattern` | `app.security.pattern` |
| `tauri.allowlist.*` | `src-tauri/capabilities/*.json` (permissions system) |

---

## Rust API Mapping

### Type Renames

| Tauri v1 | Tauri v2 | Import |
|----------|----------|--------|
| `tauri::Window` | `tauri::WebviewWindow` | `use tauri::WebviewWindow;` |
| `tauri::WindowBuilder` | `tauri::webview::WebviewWindowBuilder` | `use tauri::webview::WebviewWindowBuilder;` |
| `tauri::WindowUrl` | `tauri::WebviewUrl` | `use tauri::WebviewUrl;` |
| `tauri::Manager::get_window()` | `tauri::Manager::get_webview_window()` | -- |
| `tauri::Manager::windows()` | `tauri::Manager::webview_windows()` | -- |

### Removed APIs (Moved to Plugins)

| v1 API | v2 Plugin Crate | v2 Usage |
|--------|----------------|----------|
| `tauri::api::dialog` | `tauri-plugin-dialog` | `app.plugin(tauri_plugin_dialog::init())` |
| `tauri::api::http` | `tauri-plugin-http` | `app.plugin(tauri_plugin_http::init())` |
| `tauri::api::path::*` | Built-in | `app.path().app_data_dir()` via `Manager::path()` |
| `tauri::api::process` | `tauri-plugin-process` | `app.plugin(tauri_plugin_process::init())` |
| `tauri::api::shell` | `tauri-plugin-shell` | `app.plugin(tauri_plugin_shell::init())` |
| `App::clipboard_manager()` | `tauri-plugin-clipboard-manager` | Plugin API |
| `App::get_cli_matches()` | `tauri-plugin-cli` | Plugin API |
| `App::global_shortcut_manager()` | `tauri-plugin-global-shortcut` | Plugin API |

### Event System API Changes

| v1 API | v2 API | Behavior Change |
|--------|--------|----------------|
| `app.emit_all(event, payload)` | `app.emit(event, payload)` | `emit()` now broadcasts to all |
| `window.emit(event, payload)` | `app.emit_to(target, event, payload)` | New targeted emit |
| `app.listen_global(event, handler)` | `app.listen_any(event, handler)` | Renamed |
| `window.listen(event, handler)` | `webview_window.listen(event, handler)` | Only receives window-specific events |

### Emitter/Listener Traits (New in v2)

```rust
// v2 requires explicit trait imports
use tauri::Emitter;  // for emit(), emit_to(), emit_filter()
use tauri::Listener;  // for listen(), once(), unlisten(), listen_any()
```

### Menu API Changes

| v1 API | v2 API |
|--------|--------|
| `Menu::new()` | `MenuBuilder::new(app)` |
| `CustomMenuItem::new(id, text)` | `MenuItemBuilder::new(text).id(id)` or `MenuItem::with_id()` |
| `Submenu::new(title, menu)` | `SubmenuBuilder::new(app, title)` |
| `MenuItem::Quit` | `PredefinedMenuItem::quit()` |
| `MenuItem::Copy` | `PredefinedMenuItem::copy()` |
| `SystemTray::new()` | `TrayIconBuilder::new()` |
| `Builder::on_menu_event(handler)` | `App::on_menu_event(handler)` |
| `.system_tray(tray)` | `TrayIconBuilder::new().build(app)` (in setup) |

---

## JavaScript API Mapping

### Module Path Changes

| v1 Import | v2 Import |
|-----------|-----------|
| `@tauri-apps/api/tauri` | `@tauri-apps/api/core` |
| `@tauri-apps/api/window` | `@tauri-apps/api/window` (same, but Window class changed) |
| `@tauri-apps/api/dialog` | `@tauri-apps/plugin-dialog` |
| `@tauri-apps/api/fs` | `@tauri-apps/plugin-fs` |
| `@tauri-apps/api/http` | `@tauri-apps/plugin-http` |
| `@tauri-apps/api/shell` | `@tauri-apps/plugin-shell` |
| `@tauri-apps/api/notification` | `@tauri-apps/plugin-notification` |
| `@tauri-apps/api/clipboard` | `@tauri-apps/plugin-clipboard-manager` |
| `@tauri-apps/api/os` | `@tauri-apps/plugin-os` |
| `@tauri-apps/api/process` | `@tauri-apps/plugin-process` |
| `@tauri-apps/api/updater` | `@tauri-apps/plugin-updater` |
| `@tauri-apps/api/globalShortcut` | `@tauri-apps/plugin-global-shortcut` |

### Function Changes

| v1 Function | v2 Function |
|-------------|-------------|
| `invoke()` from `@tauri-apps/api/tauri` | `invoke()` from `@tauri-apps/api/core` |
| `appWindow` (global) | `getCurrentWindow()` |
| `WebviewWindow.getByLabel()` | `Window.getByLabel()` |
| `listen()` on window | Scoped to specific window events only |
| `shell.open(url)` | `import { open } from '@tauri-apps/plugin-opener'` |

### Event System Changes (Frontend)

| v1 | v2 |
|----|-----|
| `emit(event, payload)` on window | `emit(event, payload)` broadcasts globally |
| -- | `emitTo(target, event, payload)` for targeted |
| `listen(event, handler)` catches all | Window `.listen()` only catches window-specific |

---

## Feature Flag Changes

### Removed Cargo Features

| Removed Flag | v2 Replacement |
|-------------|---------------|
| `reqwest-client` | Use `tauri-plugin-http` |
| `reqwest-native-tls-vendored` | Configure in plugin |
| `process-command-api` | Use `tauri-plugin-process` |
| `shell-open-api` | Use `tauri-plugin-opener` |
| `windows7-compat` | Removed (Windows 10+ only) |
| `updater` | Use `tauri-plugin-updater` |
| `linux-protocol-headers` | Default behavior in v2 |
| `system-tray` | Default behavior in v2 |

### Added Cargo Features

| New Flag | Purpose |
|----------|---------|
| `linux-protocol-body` | Access request body in custom protocol on Linux |

---

## Permission System Migration

### v1 Allowlist to v2 Capabilities

The `npx @tauri-apps/cli migrate` command converts:

```json
// v1: tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "readFile": true,
        "writeFile": true,
        "scope": ["$APPDATA/*"]
      },
      "dialog": {
        "open": true,
        "save": true
      }
    }
  }
}
```

Into:

```json
// v2: src-tauri/capabilities/migrated.json
{
  "identifier": "migrated",
  "windows": ["main"],
  "permissions": [
    "fs:allow-read-file",
    "fs:allow-write-file",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

### Core Permissions (Required in v2)

These were implicit in v1 but require explicit grants in v2:

```json
{
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "core:path:default",
    "core:app:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default"
  ]
}
```
