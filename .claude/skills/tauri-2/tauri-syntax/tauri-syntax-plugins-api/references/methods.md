# tauri-syntax-plugins-api: API Method Reference

Sources: https://v2.tauri.app/plugin/,
https://v2.tauri.app/reference/javascript/api/namespacepath/,
https://v2.tauri.app/reference/javascript/api/namespacecore/,
vooronderzoek-tauri.md sections 3.5, 3.8, 9.1-9.6

---

## File System Plugin (`@tauri-apps/plugin-fs`)

### File Operations

| Function | Signature | Description |
|----------|-----------|-------------|
| `readTextFile` | `(path: string, options?: { baseDir: BaseDirectory }) => Promise<string>` | Read text file |
| `writeTextFile` | `(path: string, contents: string, options?) => Promise<void>` | Write text file |
| `readFile` | `(path: string, options?) => Promise<Uint8Array>` | Read binary file |
| `writeFile` | `(path: string, contents: Uint8Array, options?) => Promise<void>` | Write binary file |
| `exists` | `(path: string, options?) => Promise<boolean>` | Check file existence |
| `stat` | `(path: string, options?) => Promise<FileInfo>` | Get file metadata |
| `lstat` | `(path: string, options?) => Promise<FileInfo>` | Get symlink metadata |
| `rename` | `(oldPath: string, newPath: string, options?) => Promise<void>` | Rename/move file |
| `copyFile` | `(source: string, destination: string, options?) => Promise<void>` | Copy file |
| `remove` | `(path: string, options?) => Promise<void>` | Delete file or directory |
| `truncate` | `(path: string, len?: number, options?) => Promise<void>` | Truncate file |

### Directory Operations

| Function | Signature | Description |
|----------|-----------|-------------|
| `readDir` | `(path: string, options?) => Promise<DirEntry[]>` | List directory entries |
| `mkdir` | `(path: string, options?) => Promise<void>` | Create directory |

### File Handle API

| Function | Signature | Description |
|----------|-----------|-------------|
| `create` | `(path: string, options?) => Promise<FileHandle>` | Create new file |
| `open` | `(path: string, options?) => Promise<FileHandle>` | Open existing file |

### FileHandle Methods

```typescript
interface FileHandle {
  read(buffer: Uint8Array): Promise<number>;
  write(data: Uint8Array): Promise<number>;
  seek(offset: number, whence: SeekMode): Promise<number>;
  stat(): Promise<FileInfo>;
  truncate(len?: number): Promise<void>;
  close(): Promise<void>;
}
```

### Streaming

| Function | Signature | Description |
|----------|-----------|-------------|
| `readTextFileLines` | `(path: string, options?) => Promise<AsyncIterableIterator<string>>` | Stream lines |
| `watch` | `(path: string, cb: (event) => void, options?) => Promise<UnwatchFn>` | Watch for changes |
| `watchImmediate` | `(path: string, cb: (event) => void, options?) => Promise<UnwatchFn>` | Watch (immediate first event) |

### Permissions

| Permission | Description |
|------------|-------------|
| `fs:default` | App-specific directory read access |
| `fs:allow-read-file` | Read files |
| `fs:allow-write-file` | Write files |
| `fs:allow-read-dir` | Read directories |
| `fs:allow-mkdir` | Create directories |
| `fs:allow-remove` | Delete files/directories |
| `fs:allow-exists` | Check existence |
| `fs:allow-stat` | Get file metadata |
| `fs:deny-write-file` | Deny file writing |

---

## Dialog Plugin (`@tauri-apps/plugin-dialog`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `open` | `(options?: OpenDialogOptions) => Promise<string \| string[] \| null>` | File/directory picker |
| `save` | `(options?: SaveDialogOptions) => Promise<string \| null>` | Save file dialog |
| `message` | `(message: string, options?) => Promise<void>` | Message box |
| `ask` | `(message: string, options?) => Promise<boolean>` | Yes/No dialog |
| `confirm` | `(message: string, options?) => Promise<boolean>` | Ok/Cancel dialog |

### OpenDialogOptions

```typescript
interface OpenDialogOptions {
  multiple?: boolean;
  directory?: boolean;
  defaultPath?: string;
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}
```

### SaveDialogOptions

```typescript
interface SaveDialogOptions {
  defaultPath?: string;
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}
```

### MessageOptions

```typescript
interface MessageDialogOptions {
  title?: string;
  kind?: 'info' | 'warning' | 'error';
  okLabel?: string;
  cancelLabel?: string;
}
```

### Permissions

`dialog:default`, `dialog:allow-open`, `dialog:allow-save`, `dialog:allow-ask`, `dialog:allow-confirm`, `dialog:allow-message`

---

## HTTP Plugin (`@tauri-apps/plugin-http`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `fetch` | `(url: string, options?: RequestInit) => Promise<Response>` | HTTP request |

Uses the standard `fetch` API signature. The Response object matches the standard Web API.

### Permission with URL Scoping

```json
{
  "identifier": "http:default",
  "allow": [{ "url": "https://api.example.com/*" }],
  "deny": [{ "url": "https://api.example.com/admin/*" }]
}
```

Note: Forbidden headers (like `Origin`) are silently dropped unless the `unsafe-headers` Cargo feature is enabled.

---

## Notification Plugin (`@tauri-apps/plugin-notification`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `isPermissionGranted` | `() => Promise<boolean>` | Check notification permission |
| `requestPermission` | `() => Promise<string>` | Request permission |
| `sendNotification` | `(options: NotificationOptions) => void` | Send notification |
| `createChannel` | `(channel: Channel) => Promise<void>` | Create Android channel |

### NotificationOptions

```typescript
interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  sound?: string;
  channelId?: string;  // Android only
}
```

### Permissions

`notification:default`, `notification:allow-notify`, `notification:allow-request-permission`, `notification:allow-is-permission-granted`

---

## Shell Plugin (`@tauri-apps/plugin-shell`)

### Command Class

```typescript
Command.create(program: string, args?: string | string[]): Command
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `execute` | `() => Promise<ChildProcess>` | Run and wait for completion |
| `spawn` | `() => Promise<Child>` | Run in background |

### ChildProcess (execute result)

```typescript
interface ChildProcess {
  stdout: string;
  stderr: string;
  status: { code: number; success: boolean };
}
```

### Permission with Command Whitelisting

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

### Permissions

`shell:default`, `shell:allow-execute`, `shell:allow-spawn`, `shell:allow-kill`, `shell:allow-stdin-write`

---

## Clipboard Plugin (`@tauri-apps/plugin-clipboard-manager`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `writeText` | `(text: string) => Promise<void>` | Write text to clipboard |
| `readText` | `() => Promise<string>` | Read text from clipboard |

### Permissions

No default permission. MUST use explicit: `clipboard-manager:allow-read-text`, `clipboard-manager:allow-write-text`

---

## OS Plugin (`@tauri-apps/plugin-os`)

| Function | Signature | Returns |
|----------|-----------|---------|
| `platform` | `() => Promise<string>` | `"windows"`, `"linux"`, `"macos"`, `"android"`, `"ios"` |
| `arch` | `() => Promise<string>` | `"x86_64"`, `"aarch64"`, etc. |
| `type` | `() => Promise<string>` | `"windows_nt"`, `"linux"`, `"darwin"` |
| `version` | `() => Promise<string>` | e.g., `"10.0.22621"` |
| `family` | `() => Promise<string>` | `"unix"` or `"windows"` |
| `hostname` | `() => Promise<string>` | Machine hostname |
| `locale` | `() => Promise<string \| null>` | e.g., `"en-US"` |
| `eol` | `() => string` | `"\r\n"` (Windows) or `"\n"` (Unix) -- synchronous |

### Permissions

`os:default`

---

## Process Plugin (`@tauri-apps/plugin-process`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `exit` | `(code: number) => Promise<void>` | Exit application with code |
| `relaunch` | `() => Promise<void>` | Restart application |

### Permissions

`process:default`, `process:allow-exit`, `process:allow-restart`

---

## Updater Plugin (`@tauri-apps/plugin-updater`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `check` | `(options?) => Promise<Update \| null>` | Check for updates |

### Update Object

```typescript
interface Update {
  version: string;
  date?: string;
  body?: string;
  downloadAndInstall(onProgress?: (event: ProgressEvent) => void): Promise<void>;
}
```

### ProgressEvent

```typescript
interface ProgressEvent {
  event: 'Started' | 'Progress' | 'Finished';
  data: {
    contentLength?: number;  // Started
    chunkLength?: number;    // Progress
  };
}
```

### Check Options

```typescript
interface CheckOptions {
  proxy?: string;
  timeout?: number;
  headers?: Record<string, string>;
  target?: string;
}
```

### Permissions

`updater:default`, `updater:allow-check`, `updater:allow-download`, `updater:allow-install`, `updater:allow-download-and-install`

---

## Store Plugin (`@tauri-apps/plugin-store`)

### Factory Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `load` | `(path: string, options?: { autoSave: boolean }) => Promise<Store>` | Eager loading |
| `new LazyStore` | `(path: string) => LazyStore` | Deferred initialization |

### Store Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `set` | `(key: string, value: unknown) => Promise<void>` | Set value |
| `get` | `<T>(key: string) => Promise<T \| null>` | Get value |
| `has` | `(key: string) => Promise<boolean>` | Check key exists |
| `delete` | `(key: string) => Promise<boolean>` | Delete key |
| `clear` | `() => Promise<void>` | Clear all |
| `keys` | `() => Promise<string[]>` | Get all keys |
| `values` | `() => Promise<unknown[]>` | Get all values |
| `entries` | `() => Promise<[string, unknown][]>` | Get all entries |
| `length` | `() => Promise<number>` | Get entry count |
| `save` | `() => Promise<void>` | Save to disk |
| `reload` | `() => Promise<void>` | Reload from disk |
| `reset` | `() => Promise<void>` | Reset to defaults |

### Permissions

`store:default`

---

## Opener Plugin (`@tauri-apps/plugin-opener`)

Opens files and URLs in external applications. Replaces `shell.open` from v1.

### Permissions

`opener:default`

---

## Path API (`@tauri-apps/api/path`)

### Directory Functions (all async, return `Promise<string>`)

| Function | Description |
|----------|-------------|
| `appDataDir()` | App data directory |
| `appConfigDir()` | App config directory |
| `appLocalDataDir()` | App local data directory |
| `appCacheDir()` | App cache directory |
| `appLogDir()` | App log directory |
| `audioDir()` | User audio directory |
| `cacheDir()` | System cache directory |
| `configDir()` | System config directory |
| `dataDir()` | System data directory |
| `desktopDir()` | User desktop |
| `documentDir()` | User documents |
| `downloadDir()` | User downloads |
| `executableDir()` | Executable directory |
| `fontDir()` | Font directory |
| `homeDir()` | User home directory |
| `localDataDir()` | Local data directory |
| `pictureDir()` | User pictures |
| `publicDir()` | User public directory |
| `resourceDir()` | Bundled resources |
| `runtimeDir()` | Runtime directory |
| `tempDir()` | System temp directory |
| `templateDir()` | User templates |
| `videoDir()` | User videos |
| `resolveResource(path)` | Resolve bundled resource path |

### Path Manipulation Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `join` | `(...paths: string[]) => Promise<string>` | Join path segments |
| `resolve` | `(...paths: string[]) => Promise<string>` | Resolve to absolute path |
| `dirname` | `(path: string) => Promise<string>` | Get directory name |
| `basename` | `(path: string) => Promise<string>` | Get file name |
| `extname` | `(path: string) => Promise<string>` | Get file extension |
| `normalize` | `(path: string) => Promise<string>` | Normalize path |
| `isAbsolute` | `(path: string) => Promise<boolean>` | Check if absolute |

### Synchronous Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `sep` | `() => string` | Path separator (`\\` on Windows, `/` on Unix) |
| `delimiter` | `() => string` | Path delimiter (`;` on Windows, `:` on Unix) |

### BaseDirectory Enum

**Import:** `import { BaseDirectory } from '@tauri-apps/api/path'`

Full member list (24 members):

| Member | Value |
|--------|-------|
| `Audio` | 1 |
| `Cache` | 2 |
| `Config` | 3 |
| `Data` | 4 |
| `LocalData` | 5 |
| `Document` | 6 |
| `Download` | 7 |
| `Picture` | 8 |
| `Public` | 9 |
| `Video` | 10 |
| `Resource` | 11 |
| `Temp` | 12 |
| `AppConfig` | 13 |
| `AppData` | 14 |
| `AppLocalData` | 15 |
| `AppCache` | 16 |
| `AppLog` | 17 |
| `Desktop` | 18 |
| `Executable` | 19 |
| `Font` | 20 |
| `Home` | 21 |
| `Runtime` | 22 |
| `Template` | 23 |

---

## Core Utilities (`@tauri-apps/api/core`)

### convertFileSrc

```typescript
convertFileSrc(filePath: string, protocol?: string): string
```

Converts a native file path to a URL usable in HTML (`<img>`, `<video>`, `<audio>`, CSS).

Default protocol produces: `https://asset.localhost/path/to/file`

Custom protocol: `convertFileSrc('/path', 'my-protocol')` produces `my-protocol://localhost/path`

### isTauri

```typescript
isTauri(): boolean
```

Returns `true` when running inside a Tauri webview. Synchronous.
