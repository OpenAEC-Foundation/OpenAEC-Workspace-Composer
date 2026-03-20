# tauri-impl-security: Configuration and API Reference

Sources: https://v2.tauri.app/security/, https://v2.tauri.app/security/capabilities/,
https://v2.tauri.app/security/permissions/

---

## Security Configuration Properties (tauri.conf.json)

### app.security

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `csp` | `string \| null` | Tauri default | Content Security Policy string. Set `null` to disable (NOT recommended). |
| `freezePrototype` | `boolean` | `false` | Freeze `Object.prototype` to prevent pollution attacks |
| `dangerousDisableAssetCspModification` | `boolean \| string[]` | `false` | Disable automatic CSP nonce injection for asset protocol |
| `assetProtocol.enable` | `boolean` | `false` | Enable the `asset:` protocol |
| `assetProtocol.scope` | `string[]` | `[]` | Glob patterns for allowed asset paths |
| `pattern.use` | `string` | `"brownfield"` | Security pattern: `"brownfield"` or `"isolation"` |
| `pattern.options.dir` | `string` | -- | Isolation app directory (only for `"isolation"` pattern) |
| `capabilities` | `array` | `[]` | Inline capability definitions or external capability identifiers |

### Scope Variables

| Variable | Resolves To |
|----------|-------------|
| `$APPDATA` | App data directory |
| `$APPCONFIG` | App config directory |
| `$APPLOCALDATA` | App local data directory |
| `$APPCACHE` | App cache directory |
| `$APPLOG` | App log directory |
| `$HOME` | User home directory |
| `$DESKTOP` | Desktop directory |
| `$DOCUMENT` | Documents directory |
| `$DOWNLOAD` | Downloads directory |
| `$RESOURCE` | App resource directory |
| `$TEMP` | System temp directory |

---

## Permission Format

### Permission Definition (TOML)

Application permissions MUST use TOML format. Located in `src-tauri/permissions/`.

```toml
# Basic command permission
[[permission]]
identifier = "allow-my-command"
description = "Allow the my_command function"
commands.allow = ["my_command"]

# Deny permission
[[permission]]
identifier = "deny-my-command"
description = "Deny the my_command function"
commands.deny = ["my_command"]

# Permission with scope
[[permission]]
identifier = "scope-appdata"
description = "Access to app data directory"

[[scope.allow]]
path = "$APPDATA/**"

[[scope.deny]]
path = "$APPDATA/secrets/**"

# Permission set (bundle multiple)
[[set]]
identifier = "my-read-set"
description = "Bundle of read permissions"
permissions = [
    "fs:read-files",
    "fs:scope-home",
    "allow-my-command"
]
```

### Naming Convention

- `<plugin>:default` -- Default permission set for a plugin
- `<plugin>:allow-<command>` -- Allow a specific command
- `<plugin>:deny-<command>` -- Deny a specific command
- `<plugin>:<custom-set>` -- Custom permission set
- Identifiers: lowercase ASCII `[a-z]`, max 116 characters
- System auto-prepends `tauri-plugin-` to plugin identifiers at compile time

---

## Capability Format

### Capability Definition (JSON or TOML)

Located in `src-tauri/capabilities/`. Files here are automatically enabled.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["core:default", "fs:default"],
  "platforms": ["linux", "macOS", "windows"],
  "remote": {
    "urls": ["https://*.example.com"]
  }
}
```

### Capability Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `identifier` | `string` | Yes | Unique capability name |
| `description` | `string` | No | Purpose description |
| `windows` | `string[]` | Yes | Window labels (`"*"` for all) |
| `permissions` | `(string \| object)[]` | Yes | Permission identifiers or inline permissions with scopes |
| `platforms` | `string[]` | No | `"linux"`, `"macOS"`, `"windows"`, `"iOS"`, `"android"` |
| `remote` | `object` | No | Remote URL access: `{ "urls": ["pattern"] }` |

### Merging Behavior

Windows that appear in multiple capabilities receive the **union** of all permissions. This is additive -- there is no override or conflict resolution.

Deny rules ALWAYS take precedence over allow rules within the same scope.

---

## CSP Directives Reference

### Standard Directives Used in Tauri

| Directive | Controls | Example |
|-----------|----------|---------|
| `default-src` | Fallback for all types | `'self'` |
| `script-src` | JavaScript execution | `'self'` |
| `style-src` | CSS stylesheets | `'self' 'unsafe-inline'` |
| `img-src` | Image loading | `'self' asset: https://asset.localhost data:` |
| `font-src` | Font loading | `'self' data:` |
| `connect-src` | XHR, WebSocket, fetch | `ipc: http://ipc.localhost https://api.example.com` |
| `media-src` | Audio/video | `'self' asset: https://asset.localhost` |
| `frame-src` | Iframe sources | `'none'` |
| `object-src` | Plugins (Flash, etc.) | `'none'` |

### Tauri Protocol URLs

| Protocol | Standard URL Form | Used In |
|----------|-------------------|---------|
| `tauri:` | N/A | Internal asset serving |
| `asset:` | `https://asset.localhost` | File access via asset protocol |
| `ipc:` | `http://ipc.localhost` | IPC communication |

---

## Schema Files

Tauri generates platform-specific JSON schemas in `src-tauri/gen/schemas/`:

| Schema | Use For |
|--------|---------|
| `desktop-schema.json` | Desktop platform capabilities |
| `mobile-schema.json` | Mobile platform capabilities |
| `remote-schema.json` | Remote URL access capabilities |

Reference via `$schema` for IDE autocompletion in capability files.

---

## Rust Scope API

```rust
use tauri::ipc::{CommandScope, GlobalScope};

// In a command handler
#[tauri::command]
async fn my_command<R: tauri::Runtime>(
    command_scope: CommandScope<'_, MyScopeEntry>,
    global_scope: GlobalScope<'_, MyScopeEntry>,
) -> Result<(), String> {
    // Get allowed entries
    let allowed: &[MyScopeEntry] = command_scope.allows();
    let denied: &[MyScopeEntry] = command_scope.denies();

    // Get global scope entries
    let global_allowed: &[MyScopeEntry] = global_scope.allows();
    let global_denied: &[MyScopeEntry] = global_scope.denies();

    Ok(())
}
```

---

## Plugin Permission Generation (build.rs)

```rust
// src-tauri/build.rs (for plugins)
const COMMANDS: &[&str] = &["read_file", "write_file", "delete_file"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
```

This auto-generates `allow-read-file`, `deny-read-file`, `allow-write-file`, `deny-write-file`, etc.
