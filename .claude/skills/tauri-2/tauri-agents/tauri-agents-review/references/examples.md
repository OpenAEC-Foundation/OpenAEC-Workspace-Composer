# tauri-agents-review: Example Review Findings

Sources: vooronderzoek-tauri.md sections 10.1-10.7

---

## Example Review Report 1: Well-Structured Project

```
## Tauri 2 Code Review Report

### Summary
- Total issues found: 2
- Critical: 0
- Warning: 2
- Info: 0

### Warnings
1. [WARN-001] Missing try/catch on invoke('save_settings')
   Location: src/pages/Settings.tsx:42
   Fix: Wrap in try/catch to handle Rust Err variant

2. [WARN-002] Event listener cleanup missing in Dashboard component
   Location: src/components/Dashboard.tsx:15
   Fix: Return unlisten function from useEffect cleanup

### Passed Checks
- Commands & IPC Bridge: PASS (12/12 checks)
- Permissions: PASS (8/8 checks)
- State Management: PASS (5/5 checks)
- Error Handling: FAIL (10/12 checks -- 2 warnings)
- Security: PASS (6/6 checks)
- Build Config: PASS (10/10 checks)
- Anti-Patterns: PASS (13/13 checks)
```

---

## Example Review Report 2: Multiple Issues Found

```
## Tauri 2 Code Review Report

### Summary
- Total issues found: 7
- Critical: 3
- Warning: 3
- Info: 1

### Critical Issues
1. [CRIT-001] State type mismatch: manage(Mutex<AppState>) but
   State<'_, AppState> in get_status command
   Location: src-tauri/src/lib.rs:15, src-tauri/src/commands.rs:28
   Fix: Change to State<'_, Mutex<AppState>>

2. [CRIT-002] Multiple invoke_handler() calls -- only last one works
   Location: src-tauri/src/lib.rs:22-23
   Fix: Merge into single generate_handler![cmd1, cmd2, cmd3]

3. [CRIT-003] Plugin fs registered but no capability permissions
   Location: src-tauri/capabilities/default.json
   Fix: Add "fs:default" or specific fs:allow-* permissions

### Warnings
1. [WARN-001] Using .unwrap() in save_file command
   Location: src-tauri/src/commands.rs:45
   Fix: Replace with ? operator and Result return type

2. [WARN-002] CSP is null -- no content security protection
   Location: src-tauri/tauri.conf.json app.security.csp
   Fix: Set restrictive CSP for production

3. [WARN-003] snake_case key in invoke: { file_path: path }
   Location: src/utils/fileOps.ts:12
   Fix: Change to { filePath: path }

### Info
1. [INFO-001] Consider using RwLock instead of Mutex for
   read-heavy cache state
   Location: src-tauri/src/state.rs:8
```

---

## Example Finding: Permission Gap

### Detected Pattern

```
Cargo.toml contains:
  tauri-plugin-dialog = "2"
  tauri-plugin-fs = "2"
  tauri-plugin-shell = "2"

lib.rs registers:
  .plugin(tauri_plugin_dialog::init())
  .plugin(tauri_plugin_fs::init())
  .plugin(tauri_plugin_shell::init())

capabilities/default.json permissions:
  "dialog:default"
  "fs:default"
  // MISSING: shell permissions!
```

### Report Entry

```
[CRIT-004] Shell plugin registered but no permissions granted
Location: src-tauri/capabilities/default.json
Impact: All shell commands will fail at runtime with "command not allowed"
Fix: Add "shell:default" with appropriate scope restrictions to capabilities
```

---

## Example Finding: IPC Bridge Gap

### Detected Pattern

```
Rust commands registered:
  generate_handler![greet, save_file, load_file, delete_file, get_settings]

Frontend invoke calls found:
  invoke('greet', ...)
  invoke('save_file', ...)
  invoke('load_file', ...)
  invoke('get_settings', ...)
  // MISSING: no invoke('delete_file', ...) found
```

### Report Entry

```
[INFO-002] Command 'delete_file' registered but never invoked from frontend
Location: src-tauri/src/commands.rs:55
Impact: Dead code -- command exists but is never called
Action: Verify if this is intentional (future use) or remove it
```

---

## Example Finding: Security Issue

### Detected Pattern

```json
{
  "identifier": "main-capability",
  "windows": ["*"],
  "permissions": [
    "shell:default",
    "fs:default",
    "fs:allow-write-file"
  ]
}
```

### Report Entry

```
[WARN-004] Overly broad capability: windows: ["*"] with shell and fs write
Location: src-tauri/capabilities/main-capability.json
Impact: ALL windows (including potential future ones) get shell access
         and filesystem write permission
Fix: Replace ["*"] with specific window labels ["main"]
     Add scope restrictions to shell permissions
     Restrict fs write to specific directories
```

---

## Example Finding: Correct Pattern (PASS)

### Command Wiring

```rust
// lib.rs
mod commands;

tauri::Builder::default()
    .manage(Mutex::new(AppState::default()))
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
        commands::greet,
        commands::save_data,
    ])
```

```toml
# permissions/commands.toml
[[permission]]
identifier = "allow-greet"
commands.allow = ["greet"]

[[permission]]
identifier = "allow-save-data"
commands.allow = ["save_data"]
```

```json
// capabilities/default.json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "allow-greet",
    "allow-save-data"
  ]
}
```

```typescript
// Frontend
try {
    const msg = await invoke<string>('greet', { name: 'World' });
} catch (error) {
    console.error('Greet failed:', error);
}
```

**Verdict**: PASS -- command is correctly wired end-to-end with permissions and error handling.
