# tauri-syntax-permissions: Format Reference

Sources: https://v2.tauri.app/security/permissions/,
https://v2.tauri.app/security/capabilities/,
https://v2.tauri.app/develop/plugins/

---

## Permission Definition Format (TOML)

Application permissions are defined in `src-tauri/permissions/<identifier>.toml`. Only TOML format is supported for app-level permissions.

### Basic Command Permission

```toml
[[permission]]
identifier = "allow-my-command"
description = "Allows invoking the my_command function"
commands.allow = ["my_command"]
```

### Deny Permission

```toml
[[permission]]
identifier = "deny-my-command"
description = "Denies the my_command function"
commands.deny = ["my_command"]
```

### Permission with Scope

```toml
[[permission]]
identifier = "scope-user-docs"
description = "Access to user documents"

[[scope.allow]]
path = "$DOCUMENT/*"

[[scope.deny]]
path = "$DOCUMENT/.private/*"
```

### Multiple Permissions in One File

```toml
[[permission]]
identifier = "allow-read"
description = "Allow read operations"
commands.allow = ["read_file", "list_files"]

[[permission]]
identifier = "allow-write"
description = "Allow write operations"
commands.allow = ["write_file", "create_dir"]

[[permission]]
identifier = "deny-delete"
description = "Deny delete operations"
commands.deny = ["delete_file"]
```

### Permission Set

Bundle multiple permissions under a single identifier:

```toml
[[set]]
identifier = "full-access"
description = "Complete read/write access"
permissions = [
    "allow-read",
    "allow-write",
    "fs:default"
]
```

---

## Capability File Format (JSON)

Capabilities are defined in `src-tauri/capabilities/<identifier>.json` (JSON or TOML).

### Complete JSON Schema

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "string (required, unique)",
  "description": "string (optional)",
  "windows": ["string[] (required, window labels or '*')"],
  "permissions": ["string[] (required, permission identifiers)"],
  "platforms": ["string[] (optional, OS filters)"],
  "remote": {
    "urls": ["string[] (glob patterns for remote URLs)"]
  }
}
```

### Property Details

#### identifier

- Type: `string`
- Required: Yes
- Format: Lowercase ASCII `[a-z0-9-]`, max 116 characters
- Must be unique across all capability files

#### windows

- Type: `string[]`
- Required: Yes
- Values: Window labels as defined in `tauri.conf.json` or created at runtime
- Wildcard: `"*"` matches all windows
- Examples: `["main"]`, `["main", "settings"]`, `["*"]`

#### permissions

- Type: `string[]`
- Required: Yes
- Format: See Permission Naming Convention below

#### platforms

- Type: `string[]`
- Required: No (defaults to all platforms)
- Valid values: `"linux"`, `"macOS"`, `"windows"`, `"iOS"`, `"android"`
- Case-sensitive: `"macOS"` not `"macos"`

#### remote

- Type: `object`
- Required: No
- Contains `urls` array with glob patterns
- Enables Tauri API access from remote URLs loaded in the webview

---

## Permission Naming Convention

### Plugin Permissions

Format: `<plugin-name>:<action>`

The system auto-prepends `tauri-plugin-` to plugin identifiers at compile time. In capability files, use the short name.

| Pattern | Example | Description |
|---------|---------|-------------|
| `<plugin>:default` | `fs:default` | Default safe permission set |
| `<plugin>:allow-<command>` | `fs:allow-read-file` | Allow specific command |
| `<plugin>:deny-<command>` | `fs:deny-write-file` | Deny specific command |
| `<plugin>:<custom-set>` | `fs:read-files` | Custom named permission set |

### Core Permissions

Format: `core:<module>:<action>`

| Pattern | Example | Description |
|---------|---------|-------------|
| `core:default` | — | All core module defaults |
| `core:<module>:default` | `core:window:default` | Default for specific module |
| `core:<module>:allow-<cmd>` | `core:window:allow-set-title` | Allow specific core command |
| `core:<module>:deny-<cmd>` | `core:window:deny-close` | Deny specific core command |

Core modules: `app`, `window`, `webview`, `event`, `path`, `menu`, `tray`, `resources`, `image`.

### Custom App Permissions

Format: `<identifier>` (no plugin prefix)

```toml
# Defined in src-tauri/permissions/my-commands.toml
[[permission]]
identifier = "allow-greet"
commands.allow = ["greet"]
```

Referenced in capability file as `"allow-greet"` (not `"my-commands:allow-greet"`).

---

## Scope Variables

Scopes support path variables that resolve to platform-specific directories:

| Variable | Description | Example (Windows) |
|----------|-------------|-------------------|
| `$APPCONFIG` | App config directory | `C:\Users\<user>\AppData\Roaming\<app>` |
| `$APPDATA` | App data directory | `C:\Users\<user>\AppData\Roaming\<app>` |
| `$APPLOCALDATA` | App local data | `C:\Users\<user>\AppData\Local\<app>` |
| `$APPCACHE` | App cache directory | `C:\Users\<user>\AppData\Local\<app>` |
| `$APPLOG` | App log directory | `C:\Users\<user>\AppData\Roaming\<app>\logs` |
| `$AUDIO` | Audio directory | `C:\Users\<user>\Music` |
| `$CACHE` | Cache directory | `C:\Users\<user>\AppData\Local` |
| `$CONFIG` | Config directory | `C:\Users\<user>\AppData\Roaming` |
| `$DATA` | Data directory | `C:\Users\<user>\AppData\Roaming` |
| `$DESKTOP` | Desktop directory | `C:\Users\<user>\Desktop` |
| `$DOCUMENT` | Documents directory | `C:\Users\<user>\Documents` |
| `$DOWNLOAD` | Downloads directory | `C:\Users\<user>\Downloads` |
| `$HOME` | Home directory | `C:\Users\<user>` |
| `$PICTURE` | Pictures directory | `C:\Users\<user>\Pictures` |
| `$PUBLIC` | Public directory | `C:\Users\Public` |
| `$RESOURCE` | Resource directory | App bundle resources |
| `$TEMP` | Temp directory | `C:\Users\<user>\AppData\Local\Temp` |
| `$VIDEO` | Video directory | `C:\Users\<user>\Videos` |

### Scope Glob Patterns

| Pattern | Matches |
|---------|---------|
| `$DOCUMENT/*` | Files directly in Documents |
| `$DOCUMENT/**` | All files recursively in Documents |
| `$HOME/*.txt` | All .txt files in home directory |
| `$APPDATA/**/*.json` | All JSON files recursively in app data |

---

## File Structure Overview

```
src-tauri/
├── capabilities/                    # Capability definitions
│   ├── default.json                 # Main capability (auto-enabled)
│   ├── desktop-only.json            # Platform-specific
│   └── mobile-only.json             # Platform-specific
├── permissions/                     # Custom permission definitions
│   ├── my-commands.toml             # App command permissions
│   └── file-access.toml             # Custom scope permissions
├── gen/
│   └── schemas/
│       ├── desktop-schema.json      # Generated — desktop platforms
│       ├── mobile-schema.json       # Generated — mobile platforms
│       └── remote-schema.json       # Generated — remote URLs
└── tauri.conf.json                  # Main config (can inline capabilities)
```

---

## Build-Time Validation

Permissions and capabilities are validated at `cargo build` time. Common build errors:

| Error | Cause |
|-------|-------|
| `permission not found` | Typo in permission identifier or missing TOML definition |
| `capability references unknown permission` | Permission identifier not defined by any plugin or app |
| `invalid identifier` | Characters outside `[a-z0-9-]` or exceeds 116 chars |
| `unknown platform` | Typo in platforms array (case-sensitive) |
