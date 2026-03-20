# tauri-syntax-permissions: Complete Capability File Examples

All examples based on Tauri 2.x documentation:
- https://v2.tauri.app/security/permissions/
- https://v2.tauri.app/security/capabilities/

---

## Example 1: Minimal Default Capability

The simplest working capability file. Save as `src-tauri/capabilities/default.json`.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

---

## Example 2: Standard Desktop Application

A typical desktop app with file system, dialogs, and clipboard access.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Standard desktop application capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:app:default",
    "core:event:default",
    "core:path:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-mkdir",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "dialog:allow-message",
    "shell:default",
    "notification:default",
    "clipboard-manager:allow-read",
    "clipboard-manager:allow-write",
    "process:allow-restart",
    "process:allow-exit"
  ]
}
```

---

## Example 3: Multi-Window Application

Separate capabilities for different windows with different access levels.

**Main window** (`src-tauri/capabilities/main-window.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-window",
  "description": "Full capabilities for the main editor window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "allow-save-document",
    "allow-load-document"
  ]
}
```

**Settings window** (`src-tauri/capabilities/settings-window.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "settings-window",
  "description": "Limited capabilities for the settings window",
  "windows": ["settings"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "allow-get-settings",
    "allow-save-settings"
  ]
}
```

---

## Example 4: Custom Command Permissions (Full Flow)

Step 1 — Define Rust commands:

```rust
#[tauri::command]
fn read_config() -> Result<String, String> {
    // ... read config
    Ok("config data".into())
}

#[tauri::command]
fn write_config(data: String) -> Result<(), String> {
    // ... write config
    Ok(())
}

#[tauri::command]
fn delete_config(key: String) -> Result<(), String> {
    // ... delete config entry
    Ok(())
}

// Register all in one handler:
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        read_config, write_config, delete_config
    ])
```

Step 2 — Define permissions (`src-tauri/permissions/config-commands.toml`):

```toml
[[permission]]
identifier = "allow-read-config"
description = "Allow reading application configuration"
commands.allow = ["read_config"]

[[permission]]
identifier = "allow-write-config"
description = "Allow writing application configuration"
commands.allow = ["write_config"]

[[permission]]
identifier = "allow-delete-config"
description = "Allow deleting configuration entries"
commands.allow = ["delete_config"]

[[permission]]
identifier = "deny-delete-config"
description = "Deny configuration deletion (safety)"
commands.deny = ["delete_config"]

[[set]]
identifier = "config-read-write"
description = "Read and write config without delete"
permissions = [
    "allow-read-config",
    "allow-write-config",
    "deny-delete-config"
]
```

Step 3 — Add to capability (`src-tauri/capabilities/default.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "config-read-write"
  ]
}
```

Step 4 — Call from TypeScript:

```typescript
import { invoke } from '@tauri-apps/api/core';

const config = await invoke<string>('read_config');
await invoke('write_config', { data: '{"theme": "dark"}' });

// This will fail with "command not allowed":
try {
  await invoke('delete_config', { key: 'theme' });
} catch (e) {
  console.error(e); // Permission denied
}
```

---

## Example 5: File System Scopes

Permission with scoped file access (`src-tauri/permissions/file-scopes.toml`):

```toml
[[permission]]
identifier = "scope-app-data"
description = "Access to application data directory"

[[scope.allow]]
path = "$APPDATA/**"

[[scope.deny]]
path = "$APPDATA/secrets/**"

[[permission]]
identifier = "scope-documents-readonly"
description = "Read-only access to user documents"

[[scope.allow]]
path = "$DOCUMENT/**"

[[set]]
identifier = "safe-file-access"
description = "Safe file access with app data and read-only documents"
permissions = [
    "fs:allow-read-file",
    "fs:allow-write-file",
    "scope-app-data",
    "scope-documents-readonly"
]
```

Capability using the scopes:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "safe-file-access"
  ]
}
```

---

## Example 6: Platform-Specific Capabilities

Desktop capability (`src-tauri/capabilities/desktop.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "desktop-capability",
  "description": "Desktop-only features",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "core:default",
    "core:window:default",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "shell:allow-open",
    "updater:default"
  ]
}
```

Mobile capability (`src-tauri/capabilities/mobile.json`):

```json
{
  "$schema": "../gen/schemas/mobile-schema.json",
  "identifier": "mobile-capability",
  "description": "Mobile-only features",
  "windows": ["main"],
  "platforms": ["iOS", "android"],
  "permissions": [
    "core:default",
    "core:window:default",
    "nfc:allow-scan",
    "biometric:allow-authenticate",
    "barcode-scanner:allow-scan",
    "haptics:default"
  ]
}
```

---

## Example 7: Remote API Access

Allow a remote website loaded in the webview to use Tauri APIs:

```json
{
  "$schema": "../gen/schemas/remote-schema.json",
  "identifier": "remote-capability",
  "description": "Allow remote content to access specific APIs",
  "windows": ["main"],
  "remote": {
    "urls": ["https://*.example.com", "https://app.myservice.io"]
  },
  "permissions": [
    "core:event:default",
    "notification:allow-notify"
  ]
}
```

---

## Example 8: Inline Capabilities in tauri.conf.json

For simple apps, capabilities can be defined inline:

```json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "default",
          "windows": ["*"],
          "permissions": [
            "core:default",
            "fs:default"
          ]
        }
      ]
    }
  }
}
```

This replaces the need for separate capability files in `src-tauri/capabilities/`.

---

## Example 9: HTTP Plugin with URL Scope

```toml
# src-tauri/permissions/http-scopes.toml
[[permission]]
identifier = "scope-api-access"
description = "Allow HTTP requests to our API"

[[scope.allow]]
url = "https://api.example.com/*"

[[scope.allow]]
url = "https://cdn.example.com/*"

[[scope.deny]]
url = "https://api.example.com/admin/*"
```

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "http:default",
    "http:allow-fetch",
    "scope-api-access"
  ]
}
```

---

## Example 10: Complete Real-World Application

A document editor with multiple windows, platform-specific features, and custom commands.

**Common capability** (`src-tauri/capabilities/common.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "common",
  "description": "Shared capabilities for all windows",
  "windows": ["*"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:path:default"
  ]
}
```

**Editor capability** (`src-tauri/capabilities/editor.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "editor",
  "description": "Editor window with full document access",
  "windows": ["editor"],
  "permissions": [
    "core:window:default",
    "core:menu:default",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-mkdir",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "clipboard-manager:allow-read",
    "clipboard-manager:allow-write",
    "allow-save-document",
    "allow-load-document",
    "allow-export-pdf",
    "document-editor-full"
  ]
}
```

**Custom permissions** (`src-tauri/permissions/editor-commands.toml`):

```toml
[[permission]]
identifier = "allow-save-document"
description = "Save a document"
commands.allow = ["save_document"]

[[permission]]
identifier = "allow-load-document"
description = "Load a document"
commands.allow = ["load_document"]

[[permission]]
identifier = "allow-export-pdf"
description = "Export document as PDF"
commands.allow = ["export_pdf"]

[[set]]
identifier = "document-editor-full"
description = "Full document editing permission set"
permissions = [
    "allow-save-document",
    "allow-load-document",
    "allow-export-pdf"
]
```
