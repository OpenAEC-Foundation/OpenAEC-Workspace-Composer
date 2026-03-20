# tauri-agents-review: Anti-Pattern Detection Catalog

Complete catalog of anti-patterns to detect during code review. Each entry includes a detection pattern (what to grep for) and the correction.

Sources: vooronderzoek-tauri.md sections 10.1-10.7

---

## Category: Rust Commands

### DETECT-001: Multiple invoke_handler calls

**Search**: Count occurrences of `.invoke_handler(` in Builder chain.
**Trigger**: More than 1 match.
**Severity**: Critical -- only the last handler works.
**Fix**: Merge all commands into one `generate_handler![]`.

### DETECT-002: Pub commands in lib.rs

**Search**: `pub fn` or `pub async fn` preceded by `#[tauri::command]` in `lib.rs`.
**Trigger**: Any match in `lib.rs` (NOT in other modules).
**Severity**: Critical -- causes compilation errors.
**Fix**: Remove `pub` keyword.

### DETECT-003: unwrap() in command handlers

**Search**: `.unwrap()` inside functions marked with `#[tauri::command]`.
**Trigger**: Any match.
**Severity**: Warning -- causes runtime panics.
**Fix**: Replace with `?` operator and `Result` return type.

### DETECT-004: Borrowed references in async commands

**Search**: `async fn` with `&str` or `&[u8]` parameters in `#[tauri::command]` functions.
**Trigger**: Match where return type is NOT `Result`.
**Severity**: Critical -- compilation error.
**Fix**: Use `String` or wrap return in `Result`.

### DETECT-005: Missing Serialize on error types

**Search**: Types used as `E` in `Result<T, E>` returns from commands.
**Trigger**: Error type without `Serialize` impl.
**Severity**: Critical -- compilation error.
**Fix**: Add manual `Serialize` implementation.

---

## Category: State Management

### DETECT-010: State type mismatch

**Search**: Compare `manage()` call types with `State<'_, T>` parameter types.
**Trigger**: Types do not match exactly (e.g., `manage(Mutex::new(X))` vs `State<'_, X>`).
**Severity**: Critical -- runtime panic.
**Fix**: Ensure exact type match.

### DETECT-011: Arc-wrapped managed state

**Search**: `manage(Arc::new(` pattern.
**Trigger**: Any match.
**Severity**: Info -- redundant, Tauri manages Arc internally.
**Fix**: Remove Arc wrapper.

### DETECT-012: Nested Mutex locks

**Search**: Same `State<'_, Mutex<T>>` locked in function and called functions.
**Trigger**: Lock of same type in nested call.
**Severity**: Critical -- deadlock.
**Fix**: Lock once, pass the guard to helpers.

### DETECT-013: Sync I/O in command handlers

**Search**: `std::fs::`, `std::net::`, or blocking operations in non-async commands.
**Trigger**: I/O in sync command.
**Severity**: Warning -- blocks main thread, freezes UI.
**Fix**: Make command `async`, use `tokio::fs::` etc.

---

## Category: Frontend

### DETECT-020: snake_case keys in invoke

**Search**: `invoke(` calls with argument keys containing underscores.
**Trigger**: Keys like `file_path`, `user_name` in invoke arguments.
**Severity**: Critical -- arguments silently don't match Rust parameters.
**Fix**: Change to camelCase: `filePath`, `userName`.

### DETECT-021: Missing event listener cleanup

**Search**: `listen(` calls inside `useEffect` (React), `onMounted` (Vue), or `onMount` (Svelte).
**Trigger**: No corresponding unlisten in cleanup/unmount.
**Severity**: Warning -- memory leak, duplicate handlers.
**Fix**: Store unlisten promise, call in cleanup.

### DETECT-022: Missing await on listen

**Search**: `const unlisten = listen(` without `await`.
**Trigger**: Direct assignment without await.
**Severity**: Warning -- unlisten() call fails.
**Fix**: Add `await`: `const unlisten = await listen(...)`.

### DETECT-023: Missing try/catch on invoke

**Search**: `await invoke(` without surrounding try/catch.
**Trigger**: invoke() for commands that return Result.
**Severity**: Warning -- unhandled Promise rejection.
**Fix**: Wrap in try/catch.

### DETECT-024: Missing isTauri guard

**Search**: `invoke(` calls in code that may run in browser (SSR, hybrid).
**Trigger**: No `isTauri()` check in SSR/hybrid apps.
**Severity**: Warning -- crashes in browser.
**Fix**: Guard with `if (isTauri()) { ... }`.

### DETECT-025: Relative paths without BaseDirectory

**Search**: `readTextFile(`, `writeTextFile(`, `readFile(`, `writeFile(` without `baseDir`.
**Trigger**: fs calls with bare string path, no options or no baseDir.
**Severity**: Warning -- fails security scope check.
**Fix**: Add `{ baseDir: BaseDirectory.AppData }` or appropriate directory.

---

## Category: Security

### DETECT-030: CSP set to null

**Search**: `"csp": null` or `"csp": ""` in tauri.conf.json.
**Trigger**: Any match.
**Severity**: Critical for production -- XSS vulnerability.
**Fix**: Set restrictive CSP.

### DETECT-031: freezePrototype disabled

**Search**: `"freezePrototype": false` or absent in tauri.conf.json.
**Trigger**: Not set to true.
**Severity**: Warning -- prototype pollution risk.
**Fix**: Set to `true`.

### DETECT-032: Wildcard window permissions

**Search**: `"windows": ["*"]` in capability files.
**Trigger**: Wildcard with sensitive permissions (shell, fs write).
**Severity**: Warning -- over-permissive.
**Fix**: Use specific window labels.

### DETECT-033: Shell without scope

**Search**: `shell:default` or `shell:allow-execute` without scope restrictions.
**Trigger**: Shell permission without command whitelist.
**Severity**: Critical -- allows arbitrary command execution.
**Fix**: Add scope with specific allowed commands.

### DETECT-034: withGlobalTauri enabled

**Search**: `"withGlobalTauri": true` in tauri.conf.json.
**Trigger**: Enabled in production builds.
**Severity**: Warning -- exposes all APIs to window.__TAURI__.
**Fix**: Set to false in production.

---

## Category: Configuration

### DETECT-040: Missing beforeBuildCommand

**Search**: `"beforeBuildCommand"` absent or empty in build section.
**Trigger**: Not set.
**Severity**: Warning -- frontend not built before bundling.
**Fix**: Set to frontend build script.

### DETECT-041: Cargo.lock not committed

**Search**: Check `.gitignore` for `Cargo.lock` or check if file exists.
**Trigger**: Cargo.lock missing or ignored.
**Severity**: Warning -- non-deterministic builds.
**Fix**: Remove from .gitignore, commit the file.

### DETECT-042: Non-unique identifier

**Search**: `"identifier"` value in tauri.conf.json.
**Trigger**: Generic values like `"tauri-app"`, `"com.example.app"`.
**Severity**: Warning -- app conflicts on user systems.
**Fix**: Use actual unique reverse-domain identifier.

### DETECT-043: Missing mobile crate-type

**Search**: `crate-type` in Cargo.toml.
**Trigger**: Missing `"staticlib"` or `"cdylib"` when mobile targets exist.
**Severity**: Critical for mobile -- linking failure.
**Fix**: Set `crate-type = ["staticlib", "cdylib", "rlib"]`.

---

## Category: Permissions

### DETECT-050: Plugin without capability

**Search**: Compare plugin registrations in lib.rs with permissions in capability files.
**Trigger**: Plugin registered but no corresponding permission.
**Severity**: Critical -- all plugin commands fail at runtime.
**Fix**: Add plugin permissions to capability file.

### DETECT-051: Missing event name validation

**Search**: Event names used in `emit()` and `listen()` calls.
**Trigger**: Names containing `.`, ` `, or special characters.
**Severity**: Critical -- runtime panic.
**Fix**: Use only `[a-zA-Z0-9-/:_]`.

### DETECT-052: Missing Clone on event payloads

**Search**: Structs used in `emit()` calls.
**Trigger**: Missing `#[derive(Clone)]`.
**Severity**: Critical -- compilation error.
**Fix**: Add `#[derive(Clone, serde::Serialize)]`.
