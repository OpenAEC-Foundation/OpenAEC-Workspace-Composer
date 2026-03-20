# tauri-syntax-plugins-api: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/plugin/
- vooronderzoek-tauri.md sections 3.5, 3.8, 9.1-9.6

---

## Example 1: File System -- Read/Write Text Files

```typescript
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

// Ensure directory exists
if (!(await exists('config', { baseDir: BaseDirectory.AppConfig }))) {
  await mkdir('config', { baseDir: BaseDirectory.AppConfig });
}

// Write config
await writeTextFile('config/settings.json', JSON.stringify({
  theme: 'dark',
  language: 'en',
}), { baseDir: BaseDirectory.AppConfig });

// Read config
const content = await readTextFile('config/settings.json', {
  baseDir: BaseDirectory.AppConfig,
});
const settings = JSON.parse(content);
console.log('Theme:', settings.theme);
```

---

## Example 2: File System -- Binary Files and File Handle

```typescript
import { readFile, open } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

// Read binary file
const bytes = await readFile('icon.png', { baseDir: BaseDirectory.Resource });
console.log('File size:', bytes.length, 'bytes');

// File handle API for random access
const file = await open('data.bin', {
  read: true,
  write: true,
  create: true,
  baseDir: BaseDirectory.AppData,
});
const stat = await file.stat();
console.log('File size:', stat.size);
await file.close();
```

---

## Example 3: File System -- Stream Large Files

```typescript
import { readTextFileLines } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

const lines = await readTextFileLines('app.log', {
  baseDir: BaseDirectory.AppLog,
});

for await (const line of lines) {
  console.log(line);
}
```

---

## Example 4: File System -- Watch for Changes

```typescript
import { watch } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

// Requires "watch" feature in Cargo.toml:
// tauri-plugin-fs = { version = "2", features = ["watch"] }

const stopWatching = await watch(
  'app.log',
  (event) => {
    console.log('File changed:', event);
  },
  { baseDir: BaseDirectory.AppLog, delayMs: 500 }
);

// Later: stop watching
// stopWatching();
```

---

## Example 5: Dialog -- File Picker with Filters

```typescript
import { open, save } from '@tauri-apps/plugin-dialog';

// Pick single file
const filePath = await open({
  multiple: false,
  directory: false,
  title: 'Select an Image',
  filters: [
    { name: 'Images', extensions: ['png', 'jpg', 'gif', 'webp'] },
    { name: 'All Files', extensions: ['*'] },
  ],
});

if (filePath) {
  console.log('Selected:', filePath);
}

// Pick multiple files
const files = await open({ multiple: true });
if (files) {
  for (const f of files) {
    console.log('File:', f);
  }
}

// Pick directory
const dirPath = await open({ directory: true });

// Save dialog
const savePath = await save({
  title: 'Save Document',
  filters: [{ name: 'PDF', extensions: ['pdf'] }],
});
```

---

## Example 6: Dialog -- Message Boxes

```typescript
import { message, ask, confirm } from '@tauri-apps/plugin-dialog';

// Info message
await message('File saved successfully!', {
  title: 'Success',
  kind: 'info',
});

// Warning with Yes/No
const deleteConfirmed = await ask('Are you sure you want to delete?', {
  title: 'Delete File',
  kind: 'warning',
});
if (deleteConfirmed) {
  // proceed with deletion
}

// Ok/Cancel confirmation
const proceed = await confirm('This action cannot be undone. Proceed?', {
  title: 'Warning',
});
```

---

## Example 7: HTTP -- API Requests

```typescript
import { fetch } from '@tauri-apps/plugin-http';

// GET request
const response = await fetch('https://api.example.com/users');
const users = await response.json();

// POST request with JSON body
const createResponse = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
});

if (createResponse.ok) {
  const newUser = await createResponse.json();
  console.log('Created user:', newUser.id);
} else {
  console.error('Error:', createResponse.status);
}
```

---

## Example 8: Notification -- With Permission Check

```typescript
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  createChannel,
  Importance,
  Visibility,
} from '@tauri-apps/plugin-notification';

// Check and request permission
let granted = await isPermissionGranted();
if (!granted) {
  const permission = await requestPermission();
  granted = permission === 'granted';
}

if (granted) {
  sendNotification({
    title: 'Download Complete',
    body: 'Your file has been downloaded successfully.',
  });
}

// Android: create notification channel (required for Android 8+)
await createChannel({
  id: 'updates',
  name: 'App Updates',
  importance: Importance.High,
  visibility: Visibility.Public,
});
```

---

## Example 9: Shell -- Execute Commands

```typescript
import { Command } from '@tauri-apps/plugin-shell';

// Execute and wait for result
const result = await Command.create('exec-sh', ['-c', 'ls -la']).execute();
console.log('Exit code:', result.status.code);
console.log('Stdout:', result.stdout);
console.log('Stderr:', result.stderr);

if (result.status.success) {
  // command succeeded
}
```

Required permission scope:

```json
{
  "identifier": "shell:allow-execute",
  "allow": [{
    "name": "exec-sh",
    "cmd": "sh",
    "args": ["-c", { "validator": "\\S+" }],
    "sidecar": false
  }]
}
```

---

## Example 10: Store -- Persistent Key-Value Storage

```typescript
import { load, LazyStore } from '@tauri-apps/plugin-store';

// Eager loading with auto-save
const store = await load('settings.json', { autoSave: true });

// CRUD operations
await store.set('theme', 'dark');
await store.set('user', { name: 'Alice', prefs: { lang: 'en' } });

const theme = await store.get<string>('theme');
const hasUser = await store.has('user');
const allKeys = await store.keys();       // ["theme", "user"]
const allValues = await store.values();
const allEntries = await store.entries();
const count = await store.length();        // 2

await store.delete('theme');
await store.clear();

// Manual save (if autoSave is false)
await store.save();
// Reload from disk
await store.reload();

// Lazy loading (defers initialization until first use)
const lazyStore = new LazyStore('cache.json');
```

---

## Example 11: Path API -- Building File Paths

```typescript
import { appDataDir, appConfigDir, join, resolve, dirname, basename, extname } from '@tauri-apps/api/path';
import { sep, delimiter } from '@tauri-apps/api/path';

// Get app directories
const dataPath = await appDataDir();
const configPath = await appConfigDir();
console.log('Data:', dataPath);
console.log('Config:', configPath);

// Build paths
const dbPath = await join(await appDataDir(), 'databases', 'app.db');
console.log('DB path:', dbPath);

// Parse paths
const dir = await dirname('/path/to/file.txt');    // "/path/to"
const base = await basename('/path/to/file.txt');  // "file.txt"
const ext = await extname('document.pdf');          // "pdf"

// Platform info (synchronous)
console.log('Separator:', sep());      // "\\" on Windows, "/" on Unix
console.log('Delimiter:', delimiter()); // ";" on Windows, ":" on Unix
```

---

## Example 12: convertFileSrc -- Display Local Files in HTML

```typescript
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';

// Display local image in an <img> tag
const imagePath = await join(await appDataDir(), 'photos', 'avatar.jpg');
const imageUrl = convertFileSrc(imagePath);
document.getElementById('avatar').src = imageUrl;
// imageUrl = "https://asset.localhost/C:/Users/.../avatar.jpg"

// Use in CSS
const bgPath = await join(await appDataDir(), 'themes', 'background.png');
document.body.style.backgroundImage = `url('${convertFileSrc(bgPath)}')`;
```

---

## Example 13: isTauri Guard for Dual-Environment Code

```typescript
import { isTauri } from '@tauri-apps/api/core';

async function getData(): Promise<Data> {
  if (isTauri()) {
    // Running in Tauri -- use invoke
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<Data>('get_data');
  } else {
    // Running in browser -- use fetch
    const response = await fetch('/api/data');
    return await response.json();
  }
}
```

---

## Example 14: Updater -- Check and Install Updates

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkForUpdates() {
  const update = await check();

  if (!update) {
    console.log('No update available');
    return;
  }

  console.log(`Update available: ${update.version}`);

  let totalBytes = 0;
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        totalBytes = event.data.contentLength ?? 0;
        console.log(`Downloading: ${totalBytes} bytes`);
        break;
      case 'Progress':
        console.log(`Downloaded chunk: ${event.data.chunkLength} bytes`);
        break;
      case 'Finished':
        console.log('Download complete, installing...');
        break;
    }
  });

  // Restart to apply update
  await relaunch();
}
```

---

## Example 15: Complete Plugin Registration (Rust)

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::new(vec![]).build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Example 16: Custom Command with Plugin Permissions -- Full Flow

```rust
// 1. Define command (src-tauri/src/lib.rs or commands module)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

// 2. Register in builder
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet])
```

```toml
# 3. Define permission (src-tauri/permissions/commands.toml)
[[permission]]
identifier = "allow-greet"
description = "Allow the greet command"
commands.allow = ["greet"]
```

```json
// 4. Add to capability (src-tauri/capabilities/default.json)
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "allow-greet"
  ]
}
```

```typescript
// 5. Call from JavaScript
import { invoke } from '@tauri-apps/api/core';

const greeting = await invoke<string>('greet', { name: 'World' });
console.log(greeting); // "Hello, World!"
```
