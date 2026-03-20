# tauri-impl-plugin-development: Anti-Patterns

These are confirmed error patterns from Tauri 2 plugin development. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/plugins/
- https://docs.rs/tauri/latest/tauri/plugin/struct.Builder.html
- vooronderzoek-tauri.md Section 2.5, Section 10

---

## AP-001: Missing Runtime Generic on Plugin Commands

**WHY this is wrong**: Plugin commands MUST use the `R: Runtime` generic to remain runtime-agnostic. Without it, the command is tied to a specific runtime and cannot be used in the plugin builder's `generate_handler![]`.

```rust
// WRONG -- concrete types instead of generics
#[tauri::command]
async fn my_cmd(app: tauri::AppHandle, window: tauri::WebviewWindow) -> Result<(), String> {
    Ok(())
}
```

```rust
// CORRECT -- generic over Runtime
#[tauri::command]
async fn my_cmd<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    window: tauri::WebviewWindow<R>,
) -> Result<(), String> {
    Ok(())
}
```

ALWAYS use `<R: Runtime>` on plugin command functions.

---

## AP-002: Registering Plugin State on the App Builder

**WHY this is wrong**: Plugin state should be self-contained within the plugin's `.setup()` hook. Registering state on the app `Builder` creates a hidden dependency -- the app must "know" about plugin internals, and forgetting to register breaks the plugin silently at runtime.

```rust
// WRONG -- plugin state registered outside the plugin
tauri::Builder::default()
    .manage(PluginState::default())  // Leaks plugin details to app
    .plugin(my_plugin::init())
```

```rust
// CORRECT -- state registered inside plugin setup
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("my-plugin")
        .setup(|app, _api| {
            app.manage(PluginState::default());
            Ok(())
        })
        .build()
}
```

ALWAYS register plugin-specific state inside the plugin's `.setup()` hook.

---

## AP-003: Wrong JS Invoke Prefix for Plugin Commands

**WHY this is wrong**: Plugin commands use the prefix `plugin:<name>|<command>`, not just the command name. Invoking without the prefix calls app-level commands, which will fail with "command not found".

```typescript
// WRONG -- missing plugin prefix
await invoke('do_something', { arg: 'value' });

// WRONG -- wrong separator
await invoke('plugin:my-plugin/do_something', { arg: 'value' });
await invoke('plugin:my-plugin:do_something', { arg: 'value' });
```

```typescript
// CORRECT -- plugin:<name>|<command>
await invoke('plugin:my-plugin|do_something', { arg: 'value' });
```

ALWAYS use the `plugin:<name>|<command>` format with the pipe `|` separator.

---

## AP-004: Forgetting build.rs Permission Generation

**WHY this is wrong**: Tauri 2 requires explicit permissions for ALL commands. Without `build.rs` generating permission definitions, the plugin's commands cannot be referenced in capability files and will fail at runtime with "command not allowed".

```rust
// WRONG -- no build.rs, or build.rs without permission generation
fn main() {
    // Nothing here, or just tauri_build::build()
}
```

```rust
// CORRECT -- build.rs in plugin crate
const COMMANDS: &[&str] = &["do_something", "get_status"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
```

ALWAYS include a `build.rs` with `tauri_plugin::Builder` listing all command names for standalone plugin crates.

---

## AP-005: Using pub on Plugin Commands in lib.rs

**WHY this is wrong**: Commands defined directly in `src-tauri/src/lib.rs` must NOT be `pub` due to glue code generation constraints. The `#[tauri::command]` macro generates wrapper code that conflicts with public visibility in the crate root.

```rust
// WRONG -- pub command in lib.rs
#[tauri::command]
pub async fn my_cmd() -> String {
    "hello".into()
}
```

```rust
// CORRECT -- non-pub in lib.rs
#[tauri::command]
async fn my_cmd() -> String {
    "hello".into()
}

// OR: move to a separate module where pub is fine
// src-tauri/src/commands.rs
#[tauri::command]
pub async fn my_cmd() -> String {
    "hello".into()
}
```

NEVER mark commands as `pub` when defined in `lib.rs`. Move to a submodule if public visibility is needed.

---

## AP-006: Multiple invoke_handler Calls on App Builder

**WHY this is wrong**: Only the LAST `.invoke_handler()` call on `tauri::Builder` takes effect. Previous calls are silently overwritten. This is a common mistake when trying to register both app commands and plugin commands on the app builder.

```rust
// WRONG -- second invoke_handler overwrites the first
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd_a, cmd_b])
    .invoke_handler(tauri::generate_handler![cmd_c, cmd_d])  // Only this takes effect!
```

```rust
// CORRECT -- all app commands in a single generate_handler
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd_a, cmd_b, cmd_c, cmd_d])
```

Note: Plugin commands use the plugin builder's `.invoke_handler()`, which is separate and does not conflict.

ALWAYS put all app-level commands in a single `generate_handler![]` call.

---

## AP-007: Wrapping Plugin State in Arc

**WHY this is wrong**: Tauri already wraps all managed state in `Arc` internally. Adding your own `Arc` creates a redundant layer of reference counting with no benefit.

```rust
// WRONG -- redundant Arc
use std::sync::{Arc, Mutex};

app.manage(Arc::new(Mutex::new(PluginState::default())));
```

```rust
// CORRECT -- Tauri handles Arc wrapping
use std::sync::Mutex;

app.manage(Mutex::new(PluginState::default()));
```

NEVER wrap managed state in `Arc`. Tauri does this automatically.

---

## AP-008: State Type Mismatch in Commands

**WHY this is wrong**: Using `State<'_, T>` when you registered `Mutex<T>` causes a runtime panic (not a compile error). The type in the `State` parameter must exactly match the type passed to `manage()`.

```rust
// Registered as:
app.manage(Mutex::new(MyState::default()));

// WRONG -- panics at runtime
#[tauri::command]
fn bad(state: tauri::State<'_, MyState>) { }

// CORRECT -- matches the registered type exactly
#[tauri::command]
fn good(state: tauri::State<'_, Mutex<MyState>>) { }
```

ALWAYS match the `State<'_, T>` type parameter to the exact type passed to `manage()`.
