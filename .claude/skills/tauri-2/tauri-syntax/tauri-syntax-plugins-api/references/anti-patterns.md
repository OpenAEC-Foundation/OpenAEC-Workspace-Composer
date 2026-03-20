# tauri-syntax-plugins-api: Anti-Patterns

These are confirmed error patterns from the Tauri 2 Plugin and Path API. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/plugin/
- vooronderzoek-tauri.md sections 3.5, 3.8, 9.1-9.6, 10

---

## AP-001: Using Plugin Without Permissions

**WHY this is wrong**: All plugin APIs require explicit permissions in the capability file. Without them, every JS API call throws a "command not allowed" runtime error. This is the most common source of plugin errors.

```json
// WRONG — plugin installed but no permissions configured
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

```json
// CORRECT — permissions added for each plugin
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "dialog:default",
    "notification:default"
  ]
}
```

ALWAYS add the corresponding permission to `src-tauri/capabilities/default.json` for every plugin you install.

---

## AP-002: Using Relative Paths Without BaseDirectory

**WHY this is wrong**: The fs plugin enforces path security. Relative paths without a `BaseDirectory` fail security checks and throw errors.

```typescript
// WRONG — no base directory, fails security check
import { readTextFile } from '@tauri-apps/plugin-fs';

const content = await readTextFile('config.json'); // Error!
```

```typescript
// CORRECT — always specify BaseDirectory
import { readTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

const content = await readTextFile('config.json', {
  baseDir: BaseDirectory.AppConfig,
});
```

ALWAYS use `baseDir` with fs plugin operations. NEVER pass bare relative paths.

---

## AP-003: Assuming Path Functions Are Synchronous

**WHY this is wrong**: Unlike Node.js, ALL Tauri path functions are async and return `Promise<string>`. Treating the result as a string directly produces `[object Promise]` or type errors.

```typescript
// WRONG — appDataDir() returns Promise, not string
import { appDataDir } from '@tauri-apps/api/path';

const dir = appDataDir(); // dir is a Promise, not a string!
console.log(dir + '/file.txt'); // "[object Promise]/file.txt"
```

```typescript
// CORRECT — await the promise
import { appDataDir } from '@tauri-apps/api/path';

const dir = await appDataDir();
console.log(dir + '/file.txt'); // actual path
```

ALWAYS `await` path functions. The only synchronous path functions are `sep()` and `delimiter()`.

---

## AP-004: Not Installing Both Cargo Crate and npm Package

**WHY this is wrong**: Tauri plugins have two components: a Rust crate (backend) and an npm package (frontend). Installing only one side causes either compilation errors or missing import errors.

```bash
# WRONG — only npm package installed
npm install @tauri-apps/plugin-fs
# Rust side: compilation error — tauri_plugin_fs not found
```

```bash
# CORRECT — install both
# In src-tauri/Cargo.toml:
# tauri-plugin-fs = "2"
# Then:
npm install @tauri-apps/plugin-fs
```

ALWAYS install BOTH the Cargo crate in `src-tauri/Cargo.toml` AND the npm package.

---

## AP-005: Not Registering Plugin in Builder

**WHY this is wrong**: Installing the crate and npm package is not sufficient. The plugin MUST be registered in the Tauri Builder with `.plugin()` or the commands will not be available.

```rust
// WRONG — plugin crate installed but not registered
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![])
    .run(tauri::generate_context!())
```

```rust
// CORRECT — plugin registered with .plugin()
tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![])
    .run(tauri::generate_context!())
```

ALWAYS register each plugin with `.plugin()` on the Builder.

---

## AP-006: Using Tauri APIs in a Regular Browser Without Guard

**WHY this is wrong**: Tauri-specific APIs (`invoke`, `listen`, plugin functions) only work inside a Tauri webview. Calling them in a regular browser throws errors. This breaks dual-environment development.

```typescript
// WRONG — crashes when running in browser
import { invoke } from '@tauri-apps/api/core';

const data = await invoke('get_data'); // Error in browser
```

```typescript
// CORRECT — guard with isTauri()
import { isTauri, invoke } from '@tauri-apps/api/core';

if (isTauri()) {
  const data = await invoke('get_data');
} else {
  const data = await fetch('/api/data').then(r => r.json());
}
```

ALWAYS use `isTauri()` to guard Tauri-specific API calls when the frontend may run in both browser and Tauri contexts.

---

## AP-007: Using Direct File Paths in HTML src Attributes

**WHY this is wrong**: The webview cannot load files from direct filesystem paths. You MUST convert them to asset protocol URLs using `convertFileSrc()`.

```typescript
// WRONG — direct path does not work in webview
const img = document.createElement('img');
img.src = 'C:\\Users\\Alice\\Photos\\avatar.jpg'; // Fails to load
```

```typescript
// CORRECT — use convertFileSrc
import { convertFileSrc } from '@tauri-apps/api/core';

const img = document.createElement('img');
img.src = convertFileSrc('C:\\Users\\Alice\\Photos\\avatar.jpg');
// Produces: "https://asset.localhost/C:/Users/Alice/Photos/avatar.jpg"
```

ALWAYS use `convertFileSrc()` when displaying local files in `<img>`, `<video>`, `<audio>`, or CSS.

---

## AP-008: Not Handling invoke Errors

**WHY this is wrong**: When a Rust command returns `Err`, the `invoke()` Promise rejects. Unhandled rejections cause silent failures or unhandled promise rejection warnings.

```typescript
// WRONG — unhandled promise rejection
const data = await invoke('risky_operation');
```

```typescript
// CORRECT — wrap in try/catch
try {
  const data = await invoke('risky_operation');
} catch (error) {
  console.error('Operation failed:', error);
}
```

ALWAYS wrap `invoke()` calls in try/catch blocks.

---

## AP-009: Granting shell:default Without Scope Restrictions

**WHY this is wrong**: The shell plugin can execute arbitrary system commands. Granting broad permissions without scope restrictions creates a severe security vulnerability.

```json
// WRONG — unrestricted shell access
{
  "permissions": ["shell:default"]
}
```

```json
// CORRECT — restricted to specific commands with argument validation
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [{
        "name": "my-tool",
        "cmd": "/usr/local/bin/my-tool",
        "args": ["--safe-flag", { "validator": "^[a-zA-Z0-9]+$" }],
        "sidecar": false
      }]
    }
  ]
}
```

ALWAYS define specific command scopes for the shell plugin. NEVER grant broad shell access.

---

## AP-010: Forgetting Clipboard Has No Default Permission

**WHY this is wrong**: Unlike most plugins, the clipboard plugin has NO default permission. You must explicitly grant `clipboard-manager:allow-read-text` and/or `clipboard-manager:allow-write-text`.

```json
// WRONG — "default" does not exist for clipboard
{
  "permissions": ["clipboard-manager:default"]
}
```

```json
// CORRECT — explicit permissions
{
  "permissions": [
    "clipboard-manager:allow-read-text",
    "clipboard-manager:allow-write-text"
  ]
}
```

ALWAYS use explicit permission identifiers for the clipboard plugin.

---

## AP-011: Using Path Traversal in fs Plugin

**WHY this is wrong**: The fs plugin rejects path traversal patterns like `../`. Attempting to escape the base directory throws a security error.

```typescript
// WRONG — path traversal is rejected
import { readTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

await readTextFile('../../../etc/passwd', {
  baseDir: BaseDirectory.AppData,
}); // Security error!
```

```typescript
// CORRECT — stay within the base directory
await readTextFile('config.json', {
  baseDir: BaseDirectory.AppData,
});
```

NEVER use `../` in fs plugin paths. Deny rules ALWAYS take precedence over allow rules.

---

## AP-012: Not Requesting Notification Permission Before Sending

**WHY this is wrong**: On some platforms, notifications require explicit user permission. Sending without checking/requesting permission may silently fail.

```typescript
// WRONG — sends without checking permission
import { sendNotification } from '@tauri-apps/plugin-notification';

sendNotification({ title: 'Hello', body: 'World' }); // May silently fail
```

```typescript
// CORRECT — check and request first
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

let granted = await isPermissionGranted();
if (!granted) {
  const permission = await requestPermission();
  granted = permission === 'granted';
}
if (granted) {
  sendNotification({ title: 'Hello', body: 'World' });
}
```

ALWAYS check and request notification permission before sending.

---

## AP-013: Using v1 Import Paths

**WHY this is wrong**: Tauri 2 moved all non-core modules to separate plugin packages. The v1 import paths no longer exist.

```typescript
// WRONG — Tauri v1 import paths (do not exist in v2)
import { readTextFile } from '@tauri-apps/api/fs';
import { open } from '@tauri-apps/api/dialog';
import { fetch } from '@tauri-apps/api/http';
```

```typescript
// CORRECT — Tauri v2 plugin packages
import { readTextFile } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { fetch } from '@tauri-apps/plugin-http';
```

ALWAYS use `@tauri-apps/plugin-<name>` for plugin imports in Tauri 2. The base `@tauri-apps/api` only contains core, event, window, webview, path, menu, tray, image, dpi, and mocks.
