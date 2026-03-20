# tauri-impl-multi-window: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/develop/window-customization/
- https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html
- vooronderzoek-tauri.md Sections 2.6, 3.3

---

## Example 1: Creating a Secondary Window from Rust

```rust
// src-tauri/src/lib.rs
use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Main window is created from tauri.conf.json automatically
            // Create a secondary settings window (hidden by default)
            let _settings = WebviewWindowBuilder::new(
                app,
                "settings",
                WebviewUrl::App("settings.html".into()),
            )
            .title("Settings")
            .inner_size(600.0, 400.0)
            .min_inner_size(400.0, 300.0)
            .center()
            .visible(false)
            .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_settings, hide_settings])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn show_settings(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

#[tauri::command]
fn hide_settings(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        window.hide().unwrap();
    }
}
```

```typescript
// Frontend (main window)
import { invoke } from '@tauri-apps/api/core';

document.getElementById('open-settings')?.addEventListener('click', async () => {
    await invoke('show_settings');
});
```

---

## Example 2: Creating a Window from TypeScript

```typescript
import { Window } from '@tauri-apps/api/window';

async function openAboutWindow() {
    // Check if window already exists
    const existing = await Window.getByLabel('about');
    if (existing) {
        await existing.show();
        await existing.setFocus();
        return;
    }

    // Create new window
    const aboutWindow = new Window('about', {
        url: '/about',
        title: 'About',
        width: 400,
        height: 300,
        center: true,
        resizable: false,
        maximizable: false,
    });
}
```

---

## Example 3: Inter-Window Communication

```rust
// src-tauri/src/lib.rs
use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct ThemeUpdate {
    theme: String,
    accent_color: String,
}

#[tauri::command]
fn change_theme(app: tauri::AppHandle, theme: String) {
    // Broadcast theme change to ALL windows
    app.emit("theme-changed", ThemeUpdate {
        theme: theme.clone(),
        accent_color: "#007bff".into(),
    }).unwrap();
}

#[tauri::command]
fn send_to_window(app: tauri::AppHandle, target: String, message: String) {
    // Send message to a specific window
    app.emit_to(&target, "direct-message", message).unwrap();
}
```

```typescript
// In any window -- listen for theme changes
import { listen } from '@tauri-apps/api/event';

interface ThemeUpdate {
    theme: string;
    accentColor: string;
}

const unlisten = await listen<ThemeUpdate>('theme-changed', (event) => {
    document.documentElement.setAttribute('data-theme', event.payload.theme);
    document.documentElement.style.setProperty('--accent', event.payload.accentColor);
});

// Cleanup when component unmounts
// unlisten();
```

```typescript
// Send event from one window to another (JS to JS)
import { emitTo } from '@tauri-apps/api/event';

await emitTo('settings', 'update-preference', {
    key: 'language',
    value: 'en',
});
```

---

## Example 4: Splashscreen Pattern

```json
// tauri.conf.json
{
  "app": {
    "windows": [
      {
        "label": "splashscreen",
        "url": "/splashscreen.html",
        "width": 400,
        "height": 300,
        "decorations": false,
        "resizable": false,
        "center": true,
        "transparent": true
      },
      {
        "label": "main",
        "url": "/index.html",
        "width": 1200,
        "height": 800,
        "visible": false,
        "center": true
      }
    ]
  }
}
```

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) {
    // Close splashscreen and show main window
    if let Some(splash) = app.get_webview_window("splashscreen") {
        splash.close().unwrap();
    }
    if let Some(main) = app.get_webview_window("main") {
        main.show().unwrap();
        main.set_focus().unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![close_splashscreen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
// In the main window's entry point (not the splashscreen!)
import { invoke } from '@tauri-apps/api/core';

// Wait for the app to fully initialize
window.addEventListener('DOMContentLoaded', async () => {
    // Optionally load initial data here
    await loadInitialData();

    // Then close the splashscreen
    await invoke('close_splashscreen');
});
```

---

## Example 5: Hide-on-Close Pattern (Persistent Window)

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // For the settings window, hide instead of close
                if window.label() == "settings" {
                    api.prevent_close();
                    window.hide().unwrap();
                }
                // Main window closes normally (exits app)
            }
        })
        .invoke_handler(tauri::generate_handler![toggle_settings])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn toggle_settings(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        if window.is_visible().unwrap() {
            window.hide().unwrap();
        } else {
            window.show().unwrap();
            window.set_focus().unwrap();
        }
    }
}
```

---

## Example 6: React Component with Event Cleanup

```typescript
// React component that listens for cross-window events
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

interface NotificationPayload {
    title: string;
    message: string;
}

function NotificationBar() {
    const [notification, setNotification] = useState<NotificationPayload | null>(null);

    useEffect(() => {
        let unlisten: (() => void) | undefined;

        listen<NotificationPayload>('notification', (event) => {
            setNotification(event.payload);
            // Auto-dismiss after 5 seconds
            setTimeout(() => setNotification(null), 5000);
        }).then((fn) => {
            unlisten = fn;
        });

        return () => {
            if (unlisten) unlisten();
        };
    }, []);

    if (!notification) return null;

    return (
        <div className="notification-bar">
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
        </div>
    );
}
```

---

## Example 7: Window with Close Confirmation (TypeScript)

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ask } from '@tauri-apps/plugin-dialog';

const currentWindow = getCurrentWindow();

await currentWindow.onCloseRequested(async (event) => {
    const confirmed = await ask('You have unsaved changes. Are you sure you want to close?', {
        title: 'Unsaved Changes',
        kind: 'warning',
    });
    if (!confirmed) {
        event.preventDefault();
    }
});
```

---

## Example 8: Listing All Open Windows

```typescript
import { getAllWindows } from '@tauri-apps/api/window';

async function listWindows() {
    const windows = await getAllWindows();
    for (const win of windows) {
        const title = await win.title();
        const visible = await win.isVisible();
        const size = await win.innerSize();
        console.log(`[${win.label}] "${title}" visible=${visible} ${size.width}x${size.height}`);
    }
}
```
