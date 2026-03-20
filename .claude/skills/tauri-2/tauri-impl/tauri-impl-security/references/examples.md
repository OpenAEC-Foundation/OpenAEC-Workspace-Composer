# tauri-impl-security: Working Examples

All examples based on Tauri 2 documentation.
Sources: https://v2.tauri.app/security/, https://v2.tauri.app/security/capabilities/

---

## Example 1: Production-Ready Security Configuration

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https://asset.localhost data:; font-src 'self' data:; connect-src ipc: http://ipc.localhost; media-src 'self' asset: https://asset.localhost; object-src 'none'; frame-src 'none'",
      "freezePrototype": true,
      "dangerousDisableAssetCspModification": false,
      "assetProtocol": {
        "enable": true,
        "scope": ["$APPDATA/**", "$RESOURCE/**"]
      },
      "pattern": {
        "use": "brownfield"
      }
    }
  }
}
```

---

## Example 2: Minimal Capability for Main Window

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

---

## Example 3: Capability with Plugin Permissions and Scopes

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Main window with file and HTTP access",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:app:default",
    "core:event:default",
    "fs:default",
    {
      "identifier": "fs:allow-read-file",
      "allow": [{ "path": "$APPDATA/**" }, { "path": "$RESOURCE/**" }],
      "deny": [{ "path": "$APPDATA/secrets/**" }]
    },
    {
      "identifier": "fs:allow-write-file",
      "allow": [{ "path": "$APPDATA/**" }],
      "deny": [{ "path": "$APPDATA/secrets/**" }]
    },
    {
      "identifier": "http:default",
      "allow": [{ "url": "https://api.example.com/*" }],
      "deny": [{ "url": "https://api.example.com/admin/*" }]
    },
    "dialog:default",
    "notification:default"
  ]
}
```

---

## Example 4: Separate Capabilities per Window

**Main window -- full access:**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-cap",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "dialog:default",
    "shell:default"
  ]
}
```

**Settings window -- restricted:**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "settings-cap",
  "windows": ["settings"],
  "permissions": [
    "core:default",
    "core:window:allow-close",
    "store:default"
  ]
}
```

---

## Example 5: Platform-Specific Capabilities

**Desktop only:**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "desktop-cap",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "window-state:default",
    "autostart:default"
  ]
}
```

**Mobile only:**

```json
{
  "$schema": "../gen/schemas/mobile-schema.json",
  "identifier": "mobile-cap",
  "windows": ["main"],
  "platforms": ["iOS", "android"],
  "permissions": [
    "nfc:allow-scan",
    "biometric:allow-authenticate",
    "barcode-scanner:allow-scan",
    "haptics:default"
  ]
}
```

---

## Example 6: Remote URL Access

```json
{
  "$schema": "../gen/schemas/remote-schema.json",
  "identifier": "remote-cap",
  "windows": ["main"],
  "remote": {
    "urls": ["https://*.tauri.app", "https://app.example.com"]
  },
  "platforms": ["iOS", "android"],
  "permissions": [
    "nfc:allow-scan",
    "barcode-scanner:allow-scan"
  ]
}
```

---

## Example 7: Custom Command Permissions

**Define permissions** (`src-tauri/permissions/app-commands.toml`):

```toml
[[permission]]
identifier = "allow-greet"
description = "Allow the greet command"
commands.allow = ["greet"]

[[permission]]
identifier = "allow-save-config"
description = "Allow saving configuration"
commands.allow = ["save_config"]

[[permission]]
identifier = "deny-delete-data"
description = "Block data deletion"
commands.deny = ["delete_data"]

[[set]]
identifier = "safe-defaults"
description = "Safe default permissions for the app"
permissions = [
    "allow-greet",
    "allow-save-config",
    "deny-delete-data"
]
```

**Use in capability** (`src-tauri/capabilities/default.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "safe-defaults"
  ]
}
```

---

## Example 8: Shell Command Scope with Validators

```json
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "run-git",
          "cmd": "git",
          "args": ["status"],
          "sidecar": false
        },
        {
          "name": "run-node",
          "cmd": "node",
          "args": [{ "validator": "^[a-zA-Z0-9_\\-./]+\\.js$" }],
          "sidecar": false
        }
      ]
    }
  ]
}
```

---

## Example 9: Inline Capabilities in tauri.conf.json

```json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "inline-cap",
          "windows": ["*"],
          "permissions": ["core:default", "fs:default"]
        },
        "my-external-capability"
      ]
    }
  }
}
```

---

## Example 10: Isolation Pattern for Untrusted Content

```json
{
  "app": {
    "security": {
      "pattern": {
        "use": "isolation",
        "options": {
          "dir": "../isolation-app"
        }
      }
    }
  }
}
```

The isolation app is a minimal HTML/JS file that serves as a secure bridge between the untrusted frontend content and the Tauri IPC system.

---

## Example 11: CSP Allowing External API

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https://asset.localhost data: https://cdn.example.com; connect-src ipc: http://ipc.localhost https://api.example.com wss://ws.example.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com"
    }
  }
}
```

---

## Example 12: Windows HTTPS Scheme Preservation

To preserve LocalStorage/IndexedDB data when migrating from v1:

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "My App",
        "useHttpsScheme": true
      }
    ]
  }
}
```
