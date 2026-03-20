# tauri-errors-permissions: Working Capability & Permission Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/security/permissions/
- https://v2.tauri.app/security/capabilities/

---

## Example 1: Minimal Capability File

The simplest valid capability for a Tauri 2 app:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:app:default"
  ]
}
```

Save as: `src-tauri/capabilities/default.json`

---

## Example 2: Full-Featured Desktop Capability

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "desktop-main",
  "description": "Full desktop capabilities",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-set-title",
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "core:event:default",
    "core:path:default",
    "core:app:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default",
    "fs:default",
    "fs:allow-write-file",
    "fs:allow-mkdir",
    "dialog:default",
    "notification:default",
    "notification:allow-request-permission",
    "clipboard-manager:allow-read-text",
    "clipboard-manager:allow-write-text",
    "store:default",
    "process:default",
    "os:default",
    "opener:default"
  ]
}
```

---

## Example 3: Multi-Window with Separate Permissions

### Main Window (full access)

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-window-cap",
  "description": "Capabilities for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "fs:default",
    "fs:allow-write-file",
    "dialog:default",
    "store:default",
    "allow-save-project",
    "allow-load-project"
  ]
}
```

### Settings Window (restricted access)

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "settings-window-cap",
  "description": "Capabilities for the settings window",
  "windows": ["settings"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-close",
    "store:default"
  ]
}
```

---

## Example 4: Scoped File System Access

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "scoped-fs",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "fs:allow-read-file",
      "allow": [
        { "path": "$APPDATA/**" },
        { "path": "$DOCUMENT/**" },
        { "path": "$RESOURCE/**" }
      ],
      "deny": [
        { "path": "$APPDATA/secrets/**" },
        { "path": "$HOME/.ssh/**" }
      ]
    },
    {
      "identifier": "fs:allow-write-file",
      "allow": [
        { "path": "$APPDATA/**" }
      ]
    }
  ]
}
```

---

## Example 5: HTTP Plugin with URL Scoping

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "http-access",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "http:default",
      "allow": [
        { "url": "https://api.example.com/*" },
        { "url": "https://cdn.example.com/*" }
      ],
      "deny": [
        { "url": "https://api.example.com/admin/*" }
      ]
    }
  ]
}
```

---

## Example 6: Custom Command Permissions (TOML)

### Permission Definition

```toml
# src-tauri/permissions/app-commands.toml

# Individual command permissions
[[permission]]
identifier = "allow-save-project"
description = "Allow saving project files"
commands.allow = ["save_project"]

[[permission]]
identifier = "allow-load-project"
description = "Allow loading project files"
commands.allow = ["load_project"]

[[permission]]
identifier = "allow-export-data"
description = "Allow data export"
commands.allow = ["export_data"]

[[permission]]
identifier = "deny-delete-all"
description = "Block the delete_all command"
commands.deny = ["delete_all"]

# Permission set bundling multiple permissions
[[set]]
identifier = "project-management"
description = "All project management permissions"
permissions = [
    "allow-save-project",
    "allow-load-project",
    "allow-export-data",
    "deny-delete-all",
]
```

### Referenced in Capability

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "project-management"
  ]
}
```

---

## Example 7: Platform-Specific Capabilities

### Desktop Only

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "desktop-only",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "core:default",
    "global-shortcut:default",
    "core:tray:default",
    "window-state:default"
  ]
}
```

### Mobile Only

```json
{
  "$schema": "../gen/schemas/mobile-schema.json",
  "identifier": "mobile-only",
  "windows": ["main"],
  "platforms": ["iOS", "android"],
  "permissions": [
    "core:default",
    "haptics:default",
    "barcode-scanner:default",
    "biometric:default"
  ]
}
```

---

## Example 8: Remote URL Access

For hybrid apps that load remote content and need Tauri API access:

```json
{
  "$schema": "../gen/schemas/remote-schema.json",
  "identifier": "remote-access",
  "windows": ["main"],
  "remote": {
    "urls": ["https://app.example.com"]
  },
  "platforms": ["iOS", "android"],
  "permissions": [
    "core:default",
    "nfc:allow-scan",
    "barcode-scanner:allow-scan"
  ]
}
```

---

## Example 9: Inline Capabilities in tauri.conf.json

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; connect-src ipc: http://ipc.localhost",
      "freezePrototype": true,
      "capabilities": [
        {
          "identifier": "inline-default",
          "windows": ["*"],
          "permissions": [
            "core:default",
            "core:window:default",
            "core:event:default",
            "fs:default",
            "store:default"
          ]
        }
      ]
    }
  }
}
```

Note: When `capabilities` is defined inline, external capability files are NOT auto-loaded unless listed by name in the array.

---

## Example 10: Complete Project Permission Setup

### Directory Structure

```
src-tauri/
├── capabilities/
│   ├── default.json          # Main capability
│   ├── settings.json         # Settings window capability
│   └── mobile.json           # Mobile-only capability
├── permissions/
│   └── app-commands.toml     # Custom command permissions
├── src/
│   ├── lib.rs
│   └── commands.rs
└── tauri.conf.json
```

### Custom Commands (Rust)

```rust
// src-tauri/src/commands.rs
#[tauri::command]
pub fn save_project(name: String, data: String) -> Result<(), Error> { ... }

#[tauri::command]
pub fn load_project(name: String) -> Result<String, Error> { ... }
```

### Permission File

```toml
# src-tauri/permissions/app-commands.toml
[[permission]]
identifier = "allow-save-project"
description = "Allow saving projects"
commands.allow = ["save_project"]

[[permission]]
identifier = "allow-load-project"
description = "Allow loading projects"
commands.allow = ["load_project"]
```

### Capability File

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "core:path:default",
    "fs:default",
    "store:default",
    "allow-save-project",
    "allow-load-project"
  ]
}
```
