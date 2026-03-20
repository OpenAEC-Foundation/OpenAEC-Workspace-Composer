# tauri-errors-permissions: Permission System API Reference

Sources: https://v2.tauri.app/security/permissions/,
https://v2.tauri.app/security/capabilities/,
vooronderzoek-tauri.md Section 5 (Security & Permissions)

---

## Capability File Structure

Location: `src-tauri/capabilities/<name>.json` or `src-tauri/capabilities/<name>.toml`

### JSON Format

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "core:default",
    "fs:default",
    {
      "identifier": "fs:allow-read-file",
      "allow": [{ "path": "$APPDATA/**" }],
      "deny": [{ "path": "$APPDATA/secrets/**" }]
    }
  ],
  "remote": {
    "urls": ["https://*.example.com"]
  }
}
```

### TOML Format

```toml
[capability]
identifier = "main-capability"
description = "Capability for the main window"
windows = ["main"]
platforms = ["linux", "macOS", "windows"]
permissions = ["core:default", "fs:default"]
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `$schema` | `string` | No | JSON Schema for IDE autocompletion |
| `identifier` | `string` | Yes | Unique capability name |
| `description` | `string` | No | Purpose description |
| `windows` | `string[]` | Yes | Window labels to apply to (`"*"` for all) |
| `platforms` | `string[]` | No | Target platforms: `"linux"`, `"macOS"`, `"windows"`, `"iOS"`, `"android"` |
| `permissions` | `(string \| object)[]` | Yes | Permission identifiers or scoped permission objects |
| `remote` | `object` | No | Remote URL access: `{ "urls": ["https://*.example.com"] }` |

---

## Permission File Structure

Location: `src-tauri/permissions/<name>.toml` (application-level, TOML ONLY)

### Basic Permission

```toml
[[permission]]
identifier = "allow-my-command"
description = "Allow the my_command function"
commands.allow = ["my_command"]
```

### Permission with Deny

```toml
[[permission]]
identifier = "deny-dangerous-command"
description = "Block the dangerous_command function"
commands.deny = ["dangerous_command"]
```

### Permission with Scope

```toml
[[permission]]
identifier = "scope-app-data"
description = "Access to app data directory"

[[scope.allow]]
path = "$APPDATA/**"

[[scope.deny]]
path = "$APPDATA/secrets/**"
```

### Permission Set (Bundle)

```toml
[[set]]
identifier = "app-default"
description = "Default permissions for the application"
permissions = [
    "allow-my-command",
    "allow-another-command",
    "fs:read-files",
]
```

---

## Permission Naming Convention

| Format | Example | Description |
|--------|---------|-------------|
| `<plugin>:default` | `fs:default` | Safe default permission set |
| `<plugin>:allow-<cmd>` | `fs:allow-read-file` | Allow specific command |
| `<plugin>:deny-<cmd>` | `fs:deny-write-file` | Deny specific command |
| `<plugin>:<custom>` | `http:fetch-external` | Custom permission set |
| `core:<feature>:default` | `core:window:default` | Core feature default |
| `core:<feature>:allow-<cmd>` | `core:window:allow-close` | Core feature specific |
| `allow-<cmd>` | `allow-my-command` | Custom app command (no prefix) |

---

## Core Permissions (Built-in)

No plugin needed. These control access to core Tauri features:

| Permission | Controls |
|-----------|----------|
| `core:default` | Basic app operations |
| `core:window:default` | Window management basics |
| `core:window:allow-set-title` | Set window title |
| `core:window:allow-close` | Close windows |
| `core:window:allow-minimize` | Minimize windows |
| `core:window:allow-maximize` | Maximize windows |
| `core:event:default` | Event system (listen/emit) |
| `core:path:default` | Path resolution functions |
| `core:app:default` | App info (version, name) |
| `core:resources:default` | Resource table access |
| `core:menu:default` | Menu operations |
| `core:tray:default` | System tray operations |

---

## Plugin Permission Quick Reference

| Plugin | Default Permission | Common Extras |
|--------|-------------------|---------------|
| `fs` | `fs:default` (read in app dirs) | `fs:allow-write-file`, `fs:allow-mkdir`, `fs:allow-remove` |
| `dialog` | `dialog:default` | `dialog:allow-open`, `dialog:allow-save` |
| `http` | `http:default` (needs URL scope) | URL scopes in capability |
| `shell` | `shell:default` | `shell:allow-execute` (needs scope) |
| `notification` | `notification:default` | `notification:allow-request-permission` |
| `clipboard-manager` | (none) | `clipboard-manager:allow-read-text`, `clipboard-manager:allow-write-text` |
| `store` | `store:default` | -- |
| `sql` | `sql:default` | -- |
| `os` | `os:default` | -- |
| `process` | `process:default` | `process:allow-restart` |
| `updater` | `updater:default` | `updater:allow-check`, `updater:allow-download-and-install` |
| `global-shortcut` | `global-shortcut:default` | `global-shortcut:allow-register` |

---

## Scope Variables

| Variable | Resolves To | Platform |
|----------|-------------|----------|
| `$APPDATA` | App-specific data directory | All |
| `$APPCONFIG` | App-specific config directory | All |
| `$APPLOCALDATA` | App-specific local data | All |
| `$APPCACHE` | App-specific cache | All |
| `$APPLOG` | App-specific log directory | All |
| `$RESOURCE` | Bundled resource directory | All |
| `$HOME` | User home directory | All |
| `$DESKTOP` | Desktop directory | Desktop |
| `$DOCUMENT` | Documents directory | Desktop |
| `$DOWNLOAD` | Downloads directory | Desktop |
| `$PICTURE` | Pictures directory | Desktop |
| `$VIDEO` | Videos directory | Desktop |
| `$AUDIO` | Music/Audio directory | Desktop |
| `$TEMP` | Temporary directory | All |

---

## Inline Capabilities (in tauri.conf.json)

```json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "inline-cap",
          "windows": ["*"],
          "permissions": ["fs:default"]
        },
        "external-capability-name"
      ]
    }
  }
}
```

When `capabilities` is specified in `tauri.conf.json`, ONLY listed capabilities are active. Files in `src-tauri/capabilities/` are NOT auto-loaded unless referenced by name.

---

## CSP Configuration

Location: `src-tauri/tauri.conf.json` under `app.security`

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; connect-src ipc: http://ipc.localhost",
      "freezePrototype": true,
      "dangerousDisableAssetCspModification": false,
      "assetProtocol": {
        "enable": true,
        "scope": ["$APPDATA/**", "$RESOURCE/**"]
      }
    }
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `csp` | `string \| null` | Auto-generated | Content Security Policy string |
| `freezePrototype` | `boolean` | `false` | Freeze Object.prototype |
| `dangerousDisableAssetCspModification` | `boolean` | `false` | Disable CSP nonce injection |
| `assetProtocol.enable` | `boolean` | `false` | Enable asset: protocol |
| `assetProtocol.scope` | `string[]` | `[]` | Allowed asset paths |

---

## Schema Generation

Schemas are generated in `src-tauri/gen/schemas/` during `cargo build`:

| Schema | Purpose | Used In |
|--------|---------|---------|
| `desktop-schema.json` | Desktop capabilities validation | `$schema` in desktop capabilities |
| `mobile-schema.json` | Mobile capabilities validation | `$schema` in mobile capabilities |
| `remote-schema.json` | Remote access capabilities | `$schema` in remote capabilities |

Reference via `"$schema": "../gen/schemas/desktop-schema.json"` for IDE autocompletion of valid permission identifiers.

---

## Rust API for Dynamic Capabilities

```rust
use tauri::Manager;

// Add capability at runtime
app.add_capability(runtime_capability)?;

// Check plugin permissions (from frontend)
import { checkPermissions } from '@tauri-apps/api/core';
const perms = await checkPermissions('notification');
```

---

## Permission Precedence Rules

1. **Deny overrides allow**: If both `allow` and `deny` match, the operation is denied.
2. **Multiple capabilities merge**: Windows in multiple capabilities get the union of all permissions.
3. **No implicit permissions**: Nothing is allowed unless explicitly granted.
4. **Platform filtering**: Capabilities with `platforms` only apply on matching platforms.
5. **Window scoping**: Permissions only apply to windows listed in the capability's `windows` array.
