# tauri-core-runtime: Examples Reference

> Tauri 2.x. All examples verified against official documentation.

## Example 1: Complete Application Skeleton

The standard Tauri 2 app entry point with all common Builder methods.

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;

mod commands;

#[derive(Default)]
struct AppState {
    counter: Mutex<u32>,
    config: AppConfig,
}

struct AppConfig {
    api_url: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.example.com".into(),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_count,
            commands::increment,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // Register additional state that depends on app paths
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            // Spawn background heartbeat
            std::thread::spawn(move || {
                use tauri::Emitter;
                loop {
                    let _ = handle.emit("heartbeat", ());
                    std::thread::sleep(std::time::Duration::from_secs(60));
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Example: hide to tray instead of closing
                // api.prevent_close();
                // window.hide().unwrap();
                let _ = window; // suppress unused warning
                let _ = api;
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```rust
// src-tauri/src/main.rs
fn main() {
    app_lib::run();
}
```

## Example 2: Setup Hook -- Database Initialization

```rust
.setup(|app| {
    use tauri::Manager;

    // Get platform-appropriate data directory
    let db_path = app.path().app_data_dir()?.join("app.db");

    // Initialize database (example with a hypothetical DB type)
    let db = Database::open(&db_path)
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

    // Register as managed state
    app.manage(db);

    // Verify state is accessible
    let _db_ref = app.state::<Database>();

    Ok(())
})
```

## Example 3: Setup Hook -- Spawning Async Background Task

```rust
.setup(|app| {
    let handle = app.handle().clone();

    // Spawn on tokio runtime
    tauri::async_runtime::spawn(async move {
        use tauri::Emitter;

        loop {
            match check_for_updates().await {
                Ok(Some(version)) => {
                    handle.emit("update-available", version).unwrap();
                }
                Ok(None) => {}
                Err(e) => {
                    eprintln!("Update check failed: {}", e);
                }
            }
            tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
        }
    });

    Ok(())
})
```

## Example 4: AppHandle in Commands

```rust
#[tauri::command]
async fn create_child_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::webview::WebviewWindowBuilder;
    use tauri::WebviewUrl;

    let label = format!("child-{}", uuid::Uuid::new_v4());

    WebviewWindowBuilder::new(
        &app,
        &label,
        WebviewUrl::App("child.html".into()),
    )
    .title("Child Window")
    .inner_size(400.0, 300.0)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn close_all_children(app: tauri::AppHandle) {
    use tauri::Manager;

    for (label, window) in app.webview_windows() {
        if label.starts_with("child-") {
            window.close().unwrap();
        }
    }
}
```

## Example 5: Build + Run with Exit Handling

Use this pattern when you need to intercept app exit or implement "minimize to tray" behavior.

```rust
pub fn run() {
    let app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .setup(|_app| Ok(()))
        .build(tauri::generate_context!())
        .expect("error building app");

    app.run(|app_handle, event| {
        match event {
            tauri::RunEvent::ExitRequested { api, code, .. } => {
                if code.is_none() {
                    // Window close requested (not app.exit())
                    // Prevent exit to keep running in tray
                    api.prevent_exit();
                }
            }
            tauri::RunEvent::Exit => {
                // Application is about to exit
                // Perform final cleanup: close DB, flush logs, etc.
                println!("Goodbye!");
            }
            _ => {}
        }
    });
}
```

## Example 6: State Access via Manager Trait

The Manager trait provides unified state access from any context.

```rust
use tauri::Manager;

// In setup hook (via &mut App)
.setup(|app| {
    app.manage(MyService::new());

    // Access state immediately after registering
    let service = app.state::<MyService>();
    service.initialize()?;

    Ok(())
})

// In a command (via AppHandle)
#[tauri::command]
fn get_status(app: tauri::AppHandle) -> String {
    let service = app.state::<MyService>();
    service.status()
}

// In a window event handler
.on_window_event(|window, event| {
    if let tauri::WindowEvent::Focused(true) = event {
        // Access state from the window (Manager is implemented on Window)
        if let Some(state) = window.try_state::<MyService>() {
            state.on_window_focused(window.label());
        }
    }
})
```

## Example 7: Multiple State Registrations

```rust
#[derive(Default)]
struct UserSession {
    token: Mutex<Option<String>>,
}

struct AppSettings {
    theme: String,
    language: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Register multiple states -- each type is independent
        .manage(UserSession::default())
        .manage(AppSettings {
            theme: "dark".into(),
            language: "en".into(),
        })
        .invoke_handler(tauri::generate_handler![login, get_theme])
        .run(tauri::generate_context!())
        .expect("error running app");
}

#[tauri::command]
fn login(
    session: tauri::State<'_, UserSession>,
    username: String,
    password: String,
) -> Result<(), String> {
    let token = authenticate(&username, &password)?;
    *session.token.lock().unwrap() = Some(token);
    Ok(())
}

#[tauri::command]
fn get_theme(settings: tauri::State<'_, AppSettings>) -> String {
    settings.theme.clone()
}
```

## Example 8: Platform-Specific Setup

```rust
.setup(|app| {
    #[cfg(desktop)]
    {
        // Desktop-only initialization
        use tauri::tray::TrayIconBuilder;
        use tauri::menu::MenuBuilder;

        let menu = MenuBuilder::new(app)
            .text("show", "Show")
            .text("quit", "Quit")
            .build()?;

        let _tray = TrayIconBuilder::new()
            .menu(&menu)
            .on_menu_event(|app, event| {
                match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            w.show().unwrap();
                            w.set_focus().unwrap();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                }
            })
            .build(app)?;
    }

    #[cfg(mobile)]
    {
        // Mobile-only initialization
    }

    Ok(())
})
```

## Example 9: Menu Setup with Event Handling

```rust
use tauri::menu::{MenuBuilder, SubmenuBuilder, PredefinedMenuItem};

tauri::Builder::default()
    .menu(|app| {
        let file_menu = SubmenuBuilder::new(app, "File")
            .text("new", "New")
            .text("open", "Open")
            .separator()
            .quit()
            .build()?;

        let edit_menu = SubmenuBuilder::new(app, "Edit")
            .undo()
            .redo()
            .separator()
            .cut()
            .copy()
            .paste()
            .select_all()
            .build()?;

        MenuBuilder::new(app)
            .item(&file_menu)
            .item(&edit_menu)
            .build()
    })
    .on_menu_event(|app, event| {
        match event.id().as_ref() {
            "new" => {
                println!("New file");
            }
            "open" => {
                println!("Open file");
            }
            _ => {}
        }
    })
```

## Example 10: Custom URI Scheme

```rust
.register_uri_scheme_protocol("myapp", |_ctx, request| {
    let uri = request.uri().to_string();
    let path = uri.strip_prefix("myapp://localhost/").unwrap_or("");

    // Serve custom content based on path
    let body = format!("<html><body>Requested: {}</body></html>", path);

    tauri::http::Response::builder()
        .status(200)
        .header("Content-Type", "text/html")
        .body(body.into_bytes())
        .unwrap()
})
```
