# tauri-agents-review: Review Commands & Validation Rules

Sources: vooronderzoek-tauri.md all sections, v2.tauri.app/security/

---

## File Locations to Inspect

| File | What to Check |
|------|--------------|
| `src-tauri/src/lib.rs` | Entry point, Builder chain, command registration |
| `src-tauri/src/main.rs` | Desktop entry point, should call lib::run() |
| `src-tauri/src/commands.rs` | Command implementations (if separate module) |
| `src-tauri/tauri.conf.json` | All configuration |
| `src-tauri/Cargo.toml` | Dependencies, crate-type, features |
| `src-tauri/Cargo.lock` | Must exist in repo |
| `src-tauri/build.rs` | Must call tauri_build::build() |
| `src-tauri/capabilities/*.json` | Permission grants per window |
| `src-tauri/permissions/*.toml` | Custom command permissions |
| `package.json` | Frontend dependencies |
| `src/**/*.ts` or `src/**/*.js` | Frontend invoke() calls |

---

## Grep Patterns for Review

### Find all Tauri commands

```
Pattern: #\[tauri::command\]
Files: src-tauri/src/**/*.rs
```

### Find generate_handler calls

```
Pattern: generate_handler!\[
Files: src-tauri/src/**/*.rs
Expected: Exactly 1 match
```

### Find invoke calls in frontend

```
Pattern: invoke\(|invoke<
Files: src/**/*.ts, src/**/*.tsx, src/**/*.js, src/**/*.jsx
```

### Find unwrap in command handlers

```
Pattern: \.unwrap\(\)
Files: src-tauri/src/**/*.rs
Each match: verify it is NOT inside a #[tauri::command] function
```

### Find snake_case keys in invoke

```
Pattern: invoke\([^)]*_[a-z]
Files: src/**/*.ts, src/**/*.tsx
Note: This catches potential snake_case keys in arguments
```

### Find event listeners without cleanup

```
Pattern: listen\(.*=>
Files: src/**/*.ts, src/**/*.tsx
Verify: each listen() has a corresponding unlisten in cleanup
```

### Find manage() calls

```
Pattern: \.manage\(
Files: src-tauri/src/**/*.rs
```

### Find State usage

```
Pattern: State<'_,\s*
Files: src-tauri/src/**/*.rs
Cross-reference with manage() calls
```

### Find plugin registrations

```
Pattern: \.plugin\(
Files: src-tauri/src/**/*.rs
```

### Find capability files

```
Pattern: *.json
Directory: src-tauri/capabilities/
```

---

## Validation Rules

### Rule V001: Single invoke_handler

There MUST be exactly one `.invoke_handler()` call on Builder. Multiple calls mean only the last one takes effect.

### Rule V002: Command-Permission Pairing

Every command in `generate_handler![]` MUST have a corresponding permission in `src-tauri/permissions/` AND be referenced in at least one capability file.

### Rule V003: Plugin Triple Registration

Every plugin MUST have all three:
1. Cargo.toml dependency: `tauri-plugin-X = "2"`
2. Builder registration: `.plugin(tauri_plugin_X::init())`
3. Capability permission: `"X:default"` or specific `"X:allow-*"`

### Rule V004: State Type Consistency

For every `State<'_, T>` in commands, there MUST be a `manage(T)` call where T matches EXACTLY. If `manage(Mutex::new(data))`, then `State<'_, Mutex<DataType>>`.

### Rule V005: Error Serialize Requirement

Every type `E` used in `Result<T, E>` return types of commands MUST implement `serde::Serialize`.

### Rule V006: Event Payload Requirements

Every type used in `emit()` payloads MUST implement both `serde::Serialize` AND `Clone`.

### Rule V007: Async for I/O

Any command performing file I/O, network requests, or database queries MUST be `async`.

### Rule V008: Frontend Error Handling

Every `invoke()` call in the frontend MUST be wrapped in try/catch or have a `.catch()` handler.

---

## Permission Format Reference

### Custom Command Permission (TOML)

```toml
# src-tauri/permissions/commands.toml
[[permission]]
identifier = "allow-my-command"
description = "Allow the my_command function"
commands.allow = ["my_command"]

[[permission]]
identifier = "deny-my-command"
description = "Deny the my_command function"
commands.deny = ["my_command"]
```

### Capability File (JSON)

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "allow-my-command"
  ]
}
```

### Plugin Permission Naming

| Pattern | Example | Meaning |
|---------|---------|---------|
| `plugin:default` | `fs:default` | Default safe permissions |
| `plugin:allow-cmd` | `fs:allow-read-file` | Allow specific command |
| `plugin:deny-cmd` | `fs:deny-write-file` | Deny specific command |

---

## Security Checklist Values

### CSP Directives (Production Minimum)

```
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' asset: https://asset.localhost data:
font-src 'self' data:
connect-src ipc: http://ipc.localhost
```

### Dangerous Settings to Flag

| Setting | Location | Risk |
|---------|----------|------|
| `"csp": null` | app.security | XSS vulnerability |
| `"freezePrototype": false` | app.security | Prototype pollution |
| `"dangerousDisableAssetCspModification": true` | app.security | CSP bypass |
| `"withGlobalTauri": true` | app | API exposed to all JS |
| `"windows": ["*"]` | capabilities | Over-permissive |
| `shell:default` without scope | capabilities | Command injection |
