# tauri-impl-security: Anti-Patterns

These are confirmed security anti-patterns from Tauri 2. Each entry documents the WRONG pattern, the CORRECT pattern, and WHY.

Sources: https://v2.tauri.app/security/, vooronderzoek-tauri.md Section 5 and Section 10.3/10.5

---

## AP-001: Disabling CSP in Production

**WHY this is wrong**: Setting CSP to `null` removes all content security restrictions. Any XSS vulnerability becomes fully exploitable -- an attacker can load scripts from any origin, exfiltrate data, and access Tauri IPC commands.

```json
// WRONG: no content security policy
{
  "app": {
    "security": {
      "csp": null
    }
  }
}
```

```json
// CORRECT: restrictive CSP
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https://asset.localhost data:; connect-src ipc: http://ipc.localhost"
    }
  }
}
```

ALWAYS define a restrictive CSP for production. NEVER use `null`.

---

## AP-002: Wildcard Window Permissions

**WHY this is wrong**: Using `"windows": ["*"]` with broad permissions gives every window in the application identical access. A less-trusted window (e.g., settings, about) gains the same permissions as the main window.

```json
// WRONG: all windows get full access
{
  "identifier": "everything",
  "windows": ["*"],
  "permissions": [
    "fs:default",
    "fs:allow-write-file",
    "shell:default",
    "http:default"
  ]
}
```

```json
// CORRECT: scoped per window
{
  "identifier": "main-cap",
  "windows": ["main"],
  "permissions": ["fs:default", "fs:allow-write-file", "shell:default"]
}
```

```json
{
  "identifier": "settings-cap",
  "windows": ["settings"],
  "permissions": ["core:default", "store:default"]
}
```

ALWAYS assign permissions to specific window labels. NEVER use `"*"` with broad permissions.

---

## AP-003: Not Enabling freezePrototype

**WHY this is wrong**: Without `freezePrototype`, an attacker who achieves XSS can modify `Object.prototype`, `Array.prototype`, or other built-in prototypes. This can intercept IPC calls, modify serialization, or escalate privileges within the Tauri runtime.

```json
// WRONG: prototype pollution possible
{
  "app": {
    "security": {
      "freezePrototype": false
    }
  }
}
```

```json
// CORRECT: prototypes frozen
{
  "app": {
    "security": {
      "freezePrototype": true
    }
  }
}
```

ALWAYS set `freezePrototype: true` in production builds.

---

## AP-004: Unscoped Shell Permissions

**WHY this is wrong**: `shell:default` or `shell:allow-execute` without explicit command scopes allows the frontend to spawn arbitrary system commands. A single XSS vulnerability becomes a full system compromise.

```json
// WRONG: unrestricted shell access
{
  "permissions": ["shell:default"]
}
```

```json
// CORRECT: explicit command scope with argument validation
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [{
        "name": "run-git",
        "cmd": "git",
        "args": ["status"],
        "sidecar": false
      }]
    }
  ]
}
```

ALWAYS define explicit command scopes with argument validators for shell permissions.

---

## AP-005: Missing Plugin Capabilities

**WHY this is wrong**: Installing a plugin (adding the Cargo crate and npm package) does NOT automatically grant permissions. All plugin API calls will throw "command not allowed" runtime errors.

```rust
// Plugin registered in Rust
app.handle().plugin(tauri_plugin_fs::init());
```

```typescript
// WRONG: no capability defined -- throws runtime error
import { readTextFile } from '@tauri-apps/plugin-fs';
const content = await readTextFile('data.json'); // Error: command not allowed
```

```json
// CORRECT: capability grants permission
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["fs:default", "fs:allow-read-file"]
}
```

ALWAYS add permissions to a capability file for every plugin you install.

---

## AP-006: Using dangerousDisableAssetCspModification

**WHY this is wrong**: Tauri automatically injects CSP nonces for asset protocol resources. Disabling this removes that protection, allowing potential injection of unauthorized resources through the asset protocol.

```json
// WRONG: removes CSP nonce protection
{
  "app": {
    "security": {
      "dangerousDisableAssetCspModification": true
    }
  }
}
```

```json
// CORRECT: keep automatic CSP management
{
  "app": {
    "security": {
      "dangerousDisableAssetCspModification": false
    }
  }
}
```

NEVER set `dangerousDisableAssetCspModification: true` unless you have a specific technical requirement and understand the security implications.

---

## AP-007: Broad File System Scope Without Deny Rules

**WHY this is wrong**: Granting access to `$HOME/**` without deny rules exposes sensitive files like SSH keys, browser profiles, and password manager databases.

```json
// WRONG: full home directory access
{
  "permissions": [
    {
      "identifier": "fs:allow-read-file",
      "allow": [{ "path": "$HOME/**" }]
    }
  ]
}
```

```json
// CORRECT: home access with sensitive paths denied
{
  "permissions": [
    {
      "identifier": "fs:allow-read-file",
      "allow": [{ "path": "$HOME/**" }],
      "deny": [
        { "path": "$HOME/.ssh/**" },
        { "path": "$HOME/.gnupg/**" },
        { "path": "$HOME/.config/chromium/**" },
        { "path": "$HOME/.mozilla/**" }
      ]
    }
  ]
}
```

ALWAYS add deny rules for sensitive directories when granting broad file system access.

---

## AP-008: Mixing Permission File Formats

**WHY this is wrong**: Application permissions (in `src-tauri/permissions/`) MUST use TOML format. Using JSON for permissions will not be recognized by the build system.

```json
// WRONG: permissions in JSON format
// src-tauri/permissions/my-commands.json
{
  "permission": [{
    "identifier": "allow-greet",
    "commands": { "allow": ["greet"] }
  }]
}
```

```toml
# CORRECT: permissions in TOML format
# src-tauri/permissions/my-commands.toml
[[permission]]
identifier = "allow-greet"
description = "Allow the greet command"
commands.allow = ["greet"]
```

ALWAYS use TOML for application permission files. Capabilities support both JSON and TOML.

---

## AP-009: Forgetting Core Permissions

**WHY this is wrong**: In Tauri v2, even core features (window management, events, paths) require explicit permissions. Unlike v1 where these were implicitly available, v2 will fail at runtime without them.

```json
// WRONG: only plugin permissions, no core
{
  "permissions": ["fs:default", "dialog:default"]
}
```

```json
// CORRECT: include core permissions
{
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "core:app:default",
    "fs:default",
    "dialog:default"
  ]
}
```

ALWAYS include `core:default` and relevant core sub-permissions in your capabilities.
