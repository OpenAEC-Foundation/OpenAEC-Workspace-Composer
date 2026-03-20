# tauri-errors-permissions: Anti-Patterns

These are confirmed permission and security error patterns for Tauri 2. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/security/permissions/
- https://v2.tauri.app/security/capabilities/
- vooronderzoek-tauri.md Section 5 (Security), Section 10.3, 10.5

---

## AP-001: Not Adding Capabilities for Plugins

**WHY this is wrong**: Installing a plugin (Cargo crate + npm package + `.plugin()` call) does NOT automatically grant permissions. Every plugin API call throws "command not allowed" at runtime.

```json
// WRONG -- plugin installed but no permission granted
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
// Result: await readTextFile(...) throws "command fs|read_text_file not allowed"
```

```json
// CORRECT -- explicitly grant plugin permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "fs:allow-write-file"
  ]
}
```

ALWAYS add plugin permissions to a capability file after installing a plugin.

---

## AP-002: Forgetting Core Permissions

**WHY this is wrong**: In Tauri v2, core features (window management, events, paths, menus, tray) also require explicit permissions. Unlike v1 which had a global allowlist, v2 denies everything by default.

```json
// WRONG -- missing core permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "fs:default"
  ]
}
// Result: window.setTitle() fails, event system fails, path functions fail
```

```json
// CORRECT -- include core permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "core:path:default",
    "core:app:default",
    "fs:default"
  ]
}
```

ALWAYS include `core:default` as a minimum. Add specific `core:<feature>:default` as needed.

---

## AP-003: Using JSON for Application Permissions

**WHY this is wrong**: Application-level permission files (in `src-tauri/permissions/`) MUST be TOML format. JSON format is only valid for plugin-internal permissions. Using JSON causes silent parsing failures.

```json
// WRONG -- src-tauri/permissions/commands.json
{
  "permission": [{
    "identifier": "allow-my-command",
    "commands": { "allow": ["my_command"] }
  }]
}
```

```toml
# CORRECT -- src-tauri/permissions/commands.toml
[[permission]]
identifier = "allow-my-command"
description = "Allow the my_command function"
commands.allow = ["my_command"]
```

ALWAYS use TOML format for files in `src-tauri/permissions/`. Capabilities can be JSON or TOML.

---

## AP-004: Using Wildcard Windows with Broad Permissions

**WHY this is wrong**: `"windows": ["*"]` grants permissions to ALL windows, including any dynamically created ones. Combined with broad permissions, this violates the principle of least privilege.

```json
// WRONG -- all windows get full filesystem access
{
  "identifier": "default",
  "windows": ["*"],
  "permissions": [
    "fs:default",
    "fs:allow-write-file",
    "shell:allow-execute"
  ]
}
```

```json
// CORRECT -- scope permissions to specific windows
{
  "identifier": "main-cap",
  "windows": ["main"],
  "permissions": [
    "fs:default",
    "fs:allow-write-file",
    "shell:allow-execute"
  ]
}
```

ALWAYS use specific window labels. NEVER use `"*"` with security-sensitive permissions.

---

## AP-005: Setting CSP to Null in Production

**WHY this is wrong**: Setting CSP to `null` disables ALL content security restrictions. Any injected script can access the full Tauri API, making XSS vulnerabilities critical.

```json
// WRONG -- no CSP
{
  "app": {
    "security": {
      "csp": null
    }
  }
}
```

```json
// CORRECT -- restrictive CSP
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https://asset.localhost data:; connect-src ipc: http://ipc.localhost",
      "freezePrototype": true
    }
  }
}
```

NEVER set CSP to `null` in production. ALWAYS define a restrictive CSP that only allows necessary origins.

---

## AP-006: Missing IPC Protocols in CSP

**WHY this is wrong**: Without `ipc:` and `http://ipc.localhost` in `connect-src`, the IPC bridge between frontend and Rust backend is blocked. All `invoke()` calls fail silently.

```json
// WRONG -- missing IPC protocols
{
  "app": {
    "security": {
      "csp": "default-src 'self'; connect-src 'self'"
    }
  }
}
// Result: invoke() calls are blocked by CSP
```

```json
// CORRECT -- IPC protocols included
{
  "app": {
    "security": {
      "csp": "default-src 'self'; connect-src ipc: http://ipc.localhost"
    }
  }
}
```

ALWAYS include `ipc:` and `http://ipc.localhost` in the `connect-src` CSP directive.

---

## AP-007: Adding Plugin Prefix to Custom Commands

**WHY this is wrong**: Custom application commands (defined with `#[tauri::command]`) do NOT use a plugin prefix in permissions. Adding a prefix causes the permission to not match.

```json
// WRONG -- custom command with plugin-style prefix
{
  "permissions": [
    "app:allow-my-command",
    "my-app:allow-save"
  ]
}
// Result: permission identifier not recognized
```

```json
// CORRECT -- bare identifier for custom commands
{
  "permissions": [
    "allow-my-command",
    "allow-save"
  ]
}
```

NEVER add a prefix to custom command permissions. Use bare identifiers matching the TOML file.

---

## AP-008: Not Enabling freezePrototype

**WHY this is wrong**: Without `freezePrototype`, JavaScript prototype pollution attacks can modify built-in objects. If combined with any XSS vulnerability, attackers can intercept all Tauri API calls.

```json
// WRONG -- prototype not frozen
{
  "app": {
    "security": {
      "csp": "default-src 'self'"
    }
  }
}
```

```json
// CORRECT -- prototype frozen
{
  "app": {
    "security": {
      "csp": "default-src 'self'; connect-src ipc: http://ipc.localhost",
      "freezePrototype": true
    }
  }
}
```

ALWAYS set `freezePrototype: true` in production builds.

---

## AP-009: Shell Permissions Without Scope Restrictions

**WHY this is wrong**: `shell:allow-execute` without scope restrictions allows arbitrary command execution from the frontend. This is equivalent to giving the frontend full system access.

```json
// WRONG -- unrestricted shell access
{
  "permissions": ["shell:allow-execute"]
}
```

```toml
# CORRECT -- define allowed commands in permission scope
# src-tauri/permissions/shell-scope.toml
[[permission]]
identifier = "shell-restricted"
description = "Only allow specific commands"
commands.allow = ["execute"]

[[scope.allow]]
name = "git"
cmd = "git"
args = ["status"]
```

ALWAYS define explicit scopes when granting shell execution permissions. NEVER grant unrestricted shell access.

---

## AP-010: Capability File in Wrong Location

**WHY this is wrong**: Capability files are only auto-loaded from `src-tauri/capabilities/`. Files placed elsewhere (like `src-tauri/permissions/` or the project root) are silently ignored.

```
# WRONG -- capability in wrong directory
src-tauri/
├── permissions/
│   └── default.json       # This is a PERMISSION file location, not capability
```

```
# CORRECT -- capability in correct directory
src-tauri/
├── capabilities/
│   └── default.json       # Auto-loaded as capability
├── permissions/
│   └── commands.toml       # Permission definitions (TOML only)
```

ALWAYS place capability files in `src-tauri/capabilities/`. ALWAYS place permission files in `src-tauri/permissions/`.

---

## AP-011: Using dangerousDisableAssetCspModification

**WHY this is wrong**: This flag disables automatic CSP nonce injection for the asset protocol. Without nonces, inline scripts in bundled assets cannot be verified, opening the door to script injection.

```json
// WRONG -- disabling CSP nonce injection
{
  "app": {
    "security": {
      "dangerousDisableAssetCspModification": true
    }
  }
}
```

```json
// CORRECT -- keep automatic CSP nonce injection
{
  "app": {
    "security": {
      "dangerousDisableAssetCspModification": false
    }
  }
}
```

NEVER set `dangerousDisableAssetCspModification` to `true` unless you fully understand the security implications and have an alternative nonce strategy.
