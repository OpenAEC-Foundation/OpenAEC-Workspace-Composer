# tauri-impl-multi-window: Anti-Patterns

These are confirmed error patterns from Tauri 2 multi-window development. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/window-customization/
- https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html
- vooronderzoek-tauri.md Sections 2.6, 3.3, 10

---

## AP-001: Duplicate Window Labels

**WHY this is wrong**: Window labels MUST be unique across the entire application. Creating two windows with the same label causes a runtime error. This commonly happens when a "create window" function is called multiple times.

```typescript
// WRONG -- creates duplicate label on second click
document.getElementById('open')?.addEventListener('click', () => {
    new Window('details', { url: '/details' }); // Error on second click!
});
```

```typescript
// CORRECT -- check if window exists first
document.getElementById('open')?.addEventListener('click', async () => {
    const existing = await Window.getByLabel('details');
    if (existing) {
        await existing.show();
        await existing.setFocus();
        return;
    }
    new Window('details', { url: '/details' });
});
```

ALWAYS check for existing windows before creating new ones with the same label.

---

## AP-002: Not Awaiting listen() Before Calling Unlisten

**WHY this is wrong**: `listen()` returns `Promise<UnlistenFn>`, not `UnlistenFn`. Calling the result without awaiting it is a `TypeError`.

```typescript
// WRONG -- listen returns a Promise, not the unlisten function directly
const unlisten = listen('event', handler);
unlisten(); // TypeError: unlisten is not a function
```

```typescript
// CORRECT -- await the Promise
const unlisten = await listen('event', handler);
unlisten(); // Works correctly
```

ALWAYS await `listen()` before storing or calling the unlisten function.

---

## AP-003: Memory Leaks from Uncleaned Event Listeners

**WHY this is wrong**: In component-based frameworks (React, Vue, Svelte), event listeners persist after component unmount. Each mount adds a new listener, causing duplicate handling and memory leaks.

```typescript
// WRONG -- React: no cleanup
useEffect(() => {
    listen('update', (e) => setState(e.payload));
    // Missing return cleanup!
}, []);
```

```typescript
// CORRECT -- React: proper cleanup
useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen('update', (e) => {
        setState(e.payload);
    }).then((fn) => {
        unlisten = fn;
    });

    return () => {
        if (unlisten) unlisten();
    };
}, []);
```

ALWAYS clean up event listeners in component lifecycle hooks.

---

## AP-004: Using v1 WindowBuilder Instead of WebviewWindowBuilder

**WHY this is wrong**: In Tauri 2, `Window` and `WindowBuilder` were renamed to `WebviewWindow` and `WebviewWindowBuilder`. Using the old names results in compilation errors or incorrect behavior.

```rust
// WRONG -- v1 API names
use tauri::WindowBuilder;
use tauri::WindowUrl;

let window = WindowBuilder::new(app, "label", WindowUrl::App("page.html".into()))
    .build()?;
```

```rust
// CORRECT -- v2 API names
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;

let window = WebviewWindowBuilder::new(app, "label", WebviewUrl::App("page.html".into()))
    .build()?;
```

ALWAYS use `WebviewWindowBuilder` and `WebviewUrl` in Tauri 2.

---

## AP-005: Assuming Window Exists Without Checking

**WHY this is wrong**: `get_webview_window()` returns `Option<WebviewWindow>`. Calling `.unwrap()` directly causes a panic if the window was closed or never created.

```rust
// WRONG -- panics if window doesn't exist
let window = app.get_webview_window("settings").unwrap();
window.show().unwrap();
```

```rust
// CORRECT -- handle the None case
if let Some(window) = app.get_webview_window("settings") {
    window.show().unwrap();
    window.set_focus().unwrap();
} else {
    // Window doesn't exist -- create it or log a warning
    eprintln!("Settings window not found");
}
```

ALWAYS handle the `None` case when accessing windows by label.

---

## AP-006: Using emit() When emit_to() Is Needed

**WHY this is wrong**: `emit()` broadcasts to ALL windows and Rust listeners. When you only need to send data to a specific window, broadcasting wastes resources and may cause unintended side effects in other windows.

```rust
// WRONG -- broadcasts to all windows
app.emit("settings-update", payload).unwrap();
// Every window's listener fires, even those that don't care
```

```rust
// CORRECT -- target specific window
app.emit_to("settings", "settings-update", payload).unwrap();
```

```typescript
// WRONG -- broadcasts to all
await emit('settings-update', payload);

// CORRECT -- target specific window
await emitTo('settings', 'settings-update', payload);
```

ALWAYS use `emit_to()` / `emitTo()` when the event is intended for a single window.

---

## AP-007: Closing Splashscreen Before Main Window Is Ready

**WHY this is wrong**: If you close the splashscreen in `setup()` or immediately after window creation, the main window may not be fully loaded yet, resulting in a blank or flickering window.

```rust
// WRONG -- closing splash immediately in setup
.setup(|app| {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        splash.close().unwrap(); // Main window hasn't loaded yet!
    }
    if let Some(main) = app.get_webview_window("main") {
        main.show().unwrap(); // Shows blank/loading window
    }
    Ok(())
})
```

```rust
// CORRECT -- let the main window signal when it's ready
#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        splash.close().unwrap();
    }
    if let Some(main) = app.get_webview_window("main") {
        main.show().unwrap();
        main.set_focus().unwrap();
    }
}
```

```typescript
// Main window calls this when fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    await invoke('close_splashscreen');
});
```

ALWAYS let the main window signal readiness before closing the splashscreen.

---

## AP-008: Using snake_case Event Names in JavaScript

**WHY this is wrong**: Event name validation allows alphanumeric characters, `-`, `/`, `:`, and `_`. While underscores work, the Tauri convention uses kebab-case for event names. Mixing conventions causes missed events when sender and listener disagree on the name.

```typescript
// INCONSISTENT -- sender uses camelCase, listener uses kebab-case
await emit('dataUpdated', payload);        // sender
await listen('data-updated', handler);     // listener -- NEVER receives the event!
```

```typescript
// CORRECT -- consistent kebab-case
await emit('data-updated', payload);       // sender
await listen('data-updated', handler);     // listener -- receives correctly
```

ALWAYS use consistent event names. The Tauri convention is kebab-case.
