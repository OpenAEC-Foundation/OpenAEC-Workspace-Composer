# tauri-agents-project-scaffolder: Plugin Installation & Configuration Reference

Sources: vooronderzoek-tauri.md sections 4, 5, 9, v2.tauri.app/start/

---

## Project Initialization Commands

```bash
# Create new project with Tauri CLI
npm create tauri-app@latest

# Or add Tauri to existing frontend project
cd existing-project
npm install -D @tauri-apps/cli@latest
npm install @tauri-apps/api@latest
npx tauri init
```

---

## Plugin Installation Matrix

For each plugin, install BOTH the Cargo crate AND the npm package.

| Plugin | Cargo Command | npm Command |
|--------|--------------|-------------|
| Opener | `cargo add tauri-plugin-opener -F tauri-plugin-opener/2` | `npm install @tauri-apps/plugin-opener` |
| File System | `cargo add tauri-plugin-fs` | `npm install @tauri-apps/plugin-fs` |
| Dialog | `cargo add tauri-plugin-dialog` | `npm install @tauri-apps/plugin-dialog` |
| Store | `cargo add tauri-plugin-store` | `npm install @tauri-apps/plugin-store` |
| Shell | `cargo add tauri-plugin-shell` | `npm install @tauri-apps/plugin-shell` |
| HTTP | `cargo add tauri-plugin-http` | `npm install @tauri-apps/plugin-http` |
| Notification | `cargo add tauri-plugin-notification` | `npm install @tauri-apps/plugin-notification` |
| Clipboard | `cargo add tauri-plugin-clipboard-manager` | `npm install @tauri-apps/plugin-clipboard-manager` |
| OS | `cargo add tauri-plugin-os` | `npm install @tauri-apps/plugin-os` |
| Process | `cargo add tauri-plugin-process` | `npm install @tauri-apps/plugin-process` |
| Updater | `cargo add tauri-plugin-updater` | `npm install @tauri-apps/plugin-updater` |
| Global Shortcut | `cargo add tauri-plugin-global-shortcut` | `npm install @tauri-apps/plugin-global-shortcut` |
| Window State | `cargo add tauri-plugin-window-state` | `npm install @tauri-apps/plugin-window-state` |
| SQL | `cargo add tauri-plugin-sql` | `npm install @tauri-apps/plugin-sql` |
| Log | `cargo add tauri-plugin-log` | `npm install @tauri-apps/plugin-log` |
| Autostart | `cargo add tauri-plugin-autostart` | `npm install @tauri-apps/plugin-autostart` |
| Single Instance | `cargo add tauri-plugin-single-instance` | (Rust-only plugin) |

Or use the shorthand: `npm run tauri add <plugin-name>`

---

## Plugin Registration Pattern

For every plugin, add to lib.rs Builder chain:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_store::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_process::init())
```

Desktop-only plugins (wrap in cfg):

```rust
#[cfg(desktop)]
app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

#[cfg(desktop)]
app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

#[cfg(desktop)]
app.handle().plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
    }
}))?;
```

---

## Default Permission Sets Per Plugin

| Plugin | Default Permission ID | What It Grants |
|--------|----------------------|----------------|
| Core | `core:default` | Basic core operations |
| Core Window | `core:window:default` | Window read operations |
| Core App | `core:app:default` | App info access |
| FS | `fs:default` | App-specific directory read |
| Dialog | `dialog:default` | All dialog types |
| Store | `store:default` | Key-value operations |
| Shell | `shell:default` | None -- requires explicit scope |
| HTTP | `http:default` | None -- requires URL scope |
| Notification | `notification:default` | Send + permission check |
| Clipboard | (none) | Must use explicit allow-* |
| OS | `os:default` | All OS info queries |
| Process | `process:default` | Exit + relaunch |
| Updater | `updater:default` | Check + download + install |
| Opener | `opener:default` | Open URLs and files |

---

## Capability File Per-Plugin Permissions

### File System (with scopes)

```json
{
  "permissions": [
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-read-dir",
    "fs:allow-mkdir",
    "fs:allow-exists",
    {
      "identifier": "fs:scope",
      "allow": [{ "path": "$APPDATA/**" }]
    }
  ]
}
```

### HTTP (with URL scopes)

```json
{
  "permissions": [
    {
      "identifier": "http:default",
      "allow": [{ "url": "https://api.example.com/*" }],
      "deny": [{ "url": "https://api.example.com/admin/*" }]
    }
  ]
}
```

### Shell (with command scopes)

```json
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [{
        "name": "run-script",
        "cmd": "node",
        "args": ["scripts/process.js"],
        "sidecar": false
      }]
    }
  ]
}
```

---

## Frontend Framework Integration

### Vite Config (vite.config.ts)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,
    },
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
        target: ['es2021', 'chrome100', 'safari13'],
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_DEBUG,
    },
});
```

### TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

---

## Icon Requirements

| File | Size | Platform |
|------|------|----------|
| `icons/32x32.png` | 32x32 | All |
| `icons/128x128.png` | 128x128 | All |
| `icons/128x128@2x.png` | 256x256 | macOS Retina |
| `icons/icon.icns` | Multi-size | macOS |
| `icons/icon.ico` | Multi-size | Windows |
| `icons/icon.png` | 512x512+ | Linux |

Generate all icons from a single 1024x1024 PNG:

```bash
npx tauri icon path/to/icon.png
```
