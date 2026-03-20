# tauri-syntax-menu: Anti-Patterns

These are confirmed error patterns from the Tauri 2 Menu and Tray API. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/develop/menu/
- https://v2.tauri.app/develop/system-tray/
- vooronderzoek-tauri.md sections 2.7, 3.6, 3.7, 8.6, 10

---

## AP-001: Using Tauri v1 Menu Type Names

**WHY this is wrong**: Tauri 2 renamed all menu types. Using v1 names causes compilation errors in Rust and import errors in JavaScript.

```rust
// WRONG — Tauri v1 names (do not exist in v2)
use tauri::Menu;                 // renamed to MenuBuilder
use tauri::CustomMenuItem;       // renamed to MenuItemBuilder
use tauri::Submenu;              // renamed to SubmenuBuilder
use tauri::MenuItem;             // this was for predefined items, now PredefinedMenuItem
use tauri::SystemTray;           // renamed to TrayIconBuilder
```

```rust
// CORRECT — Tauri v2 names
use tauri::menu::{MenuBuilder, SubmenuBuilder, PredefinedMenuItem, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
```

ALWAYS use Tauri 2 names. See the migration table in SKILL.md.

---

## AP-002: Using new Menu() Instead of Menu.new() in JavaScript

**WHY this is wrong**: JavaScript menu classes use async factory methods (`Menu.new()`), not constructors (`new Menu()`). The constructor syntax does not exist for these types.

```typescript
// WRONG — constructor does not exist
const menu = new Menu({ items: [...] });
const item = new MenuItem({ text: 'Click me' });
```

```typescript
// CORRECT — async factory methods
const menu = await Menu.new({ items: [...] });
const item = await MenuItem.new({ text: 'Click me', action: () => {} });
```

ALWAYS use the async `ClassName.new()` factory pattern for Menu, MenuItem, Submenu, CheckMenuItem, PredefinedMenuItem, and TrayIcon.

---

## AP-003: Forgetting to Call .build() on Rust Builders

**WHY this is wrong**: `MenuBuilder`, `SubmenuBuilder`, and `TrayIconBuilder` return builder objects, not the final menu/tray. Without `.build()`, you get a type mismatch error.

```rust
// WRONG — returns SubmenuBuilder, not Submenu
let file_menu = SubmenuBuilder::new(app, "File")
    .text("new", "New")
    .quit();
// file_menu is a SubmenuBuilder, not a Submenu!

MenuBuilder::new(app)
    .item(&file_menu)  // Type error: expected &dyn IsMenuItem, got SubmenuBuilder
    .build()
```

```rust
// CORRECT — call .build()
let file_menu = SubmenuBuilder::new(app, "File")
    .text("new", "New")
    .quit()
    .build()?;  // Now it's a Submenu

MenuBuilder::new(app)
    .item(&file_menu)
    .build()
```

ALWAYS call `.build()` on menu/submenu/tray builders to get the final object.

---

## AP-004: Matching Menu Event IDs Without .as_ref()

**WHY this is wrong**: `event.id()` returns a `MenuId` type, not a `&str`. Direct string comparison fails. Use `.as_ref()` to get a `&str` for pattern matching.

```rust
// WRONG — MenuId is not &str
.on_menu_event(|app, event| {
    match event.id() {
        "new" => {}   // Type mismatch: MenuId vs &str
        _ => {}
    }
})
```

```rust
// CORRECT — use .as_ref() for string matching
.on_menu_event(|app, event| {
    match event.id().as_ref() {
        "new" => println!("New file"),
        "open" => println!("Open file"),
        _ => {}
    }
})
```

ALWAYS use `event.id().as_ref()` when matching menu event IDs in Rust.

---

## AP-005: Missing Permissions for Menu and Tray Operations

**WHY this is wrong**: In Tauri 2, menu and tray operations from JavaScript require explicit permissions. Without them, JS API calls fail with "command not allowed" errors.

```json
// WRONG — missing menu/tray permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

```json
// CORRECT — includes menu and tray permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:menu:default",
    "core:tray:default"
  ]
}
```

ALWAYS add `core:menu:default` and/or `core:tray:default` to capabilities when using menu/tray from JavaScript.

---

## AP-006: Tray Icon Without Image Error Handling

**WHY this is wrong**: `Image::from_path()` can fail if the icon file is missing or in an unsupported format. Not handling this error crashes the application on startup.

```rust
// WRONG — unwrap panics if icon file is missing
let _tray = TrayIconBuilder::new()
    .icon(Image::from_path("icons/tray.png").unwrap())
    .build(app)?;
```

```rust
// CORRECT — propagate the error with ?
let _tray = TrayIconBuilder::new()
    .icon(Image::from_path("icons/tray.png")?)
    .build(app)?;
```

ALWAYS use `?` to propagate icon loading errors. NEVER use `.unwrap()` on `Image::from_path()`.

---

## AP-007: Not Storing TrayIcon Reference

**WHY this is wrong**: If the `TrayIcon` is dropped (goes out of scope), it is removed from the system tray. You MUST keep the reference alive for the lifetime you need the tray icon.

```rust
// WRONG — tray icon is dropped at end of setup, disappears immediately
.setup(|app| {
    let tray = TrayIconBuilder::new()
        .icon(Image::from_path("icons/tray.png")?)
        .build(app)?;
    // tray is dropped here!
    Ok(())
})
```

```rust
// CORRECT — prefix with underscore to keep alive without warning
.setup(|app| {
    let _tray = TrayIconBuilder::new()
        .icon(Image::from_path("icons/tray.png")?)
        .build(app)?;
    // _tray stays alive for the duration of setup
    Ok(())
})
```

Note: In practice, Tauri internally manages the tray icon lifetime after `.build()`, but the `_` prefix convention makes the intent clear and prevents compiler warnings.

---

## AP-008: Using Builder::on_menu_event (Removed in v2)

**WHY this is wrong**: In Tauri v1, menu events were handled via `Builder::on_menu_event()` directly on the builder chain. In v2, the method still exists but the signature changed. The handler now receives `(&AppHandle, MenuEvent)` instead of `(WindowMenuEvent)`.

```rust
// WRONG — Tauri v1 signature
.on_menu_event(|event| {
    match event.menu_item_id() {
        "new" => {}
        _ => {}
    }
})
```

```rust
// CORRECT — Tauri v2 signature
.on_menu_event(|app, event| {
    match event.id().as_ref() {
        "new" => {}
        _ => {}
    }
})
```

ALWAYS use the Tauri v2 `on_menu_event` signature with `(app, event)` parameters and `event.id().as_ref()` for matching.
