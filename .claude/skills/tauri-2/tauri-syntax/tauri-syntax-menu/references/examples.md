# tauri-syntax-menu: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/develop/menu/
- https://v2.tauri.app/develop/system-tray/
- vooronderzoek-tauri.md sections 2.7, 3.6, 3.7

---

## Example 1: Complete Application Menu (Rust)

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
                println!("New file requested");
            }
            "open" => {
                println!("Open file requested");
            }
            _ => {}
        }
    })
    .run(tauri::generate_context!())
    .expect("error running app");
```

---

## Example 2: Complete Application Menu (JavaScript)

```typescript
import { Menu, MenuItem, Submenu, PredefinedMenuItem, CheckMenuItem } from '@tauri-apps/api/menu';

const menu = await Menu.new({
  items: [
    await Submenu.new({
      text: 'File',
      items: [
        await MenuItem.new({
          text: 'Open',
          accelerator: 'CmdOrCtrl+O',
          action: () => { console.log('Open clicked'); },
        }),
        await MenuItem.new({
          text: 'Save',
          accelerator: 'CmdOrCtrl+S',
          action: () => { console.log('Save clicked'); },
        }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({ item: 'Quit' }),
      ],
    }),
    await Submenu.new({
      text: 'View',
      items: [
        await CheckMenuItem.new({
          text: 'Dark Mode',
          checked: false,
          action: (item) => { console.log('Dark mode toggled'); },
        }),
      ],
    }),
  ],
});

// Set as application menu
await menu.setAsAppMenu();

// Or set as window-specific menu
// await menu.setAsWindowMenu();
```

---

## Example 3: Context Menu (JavaScript)

```typescript
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';

const contextMenu = await Menu.new({
  items: [
    await MenuItem.new({ text: 'Cut', accelerator: 'CmdOrCtrl+X', action: () => cut() }),
    await MenuItem.new({ text: 'Copy', accelerator: 'CmdOrCtrl+C', action: () => copy() }),
    await MenuItem.new({ text: 'Paste', accelerator: 'CmdOrCtrl+V', action: () => paste() }),
    await PredefinedMenuItem.new({ item: 'Separator' }),
    await MenuItem.new({ text: 'Delete', action: () => deleteSelection() }),
  ],
});

// Show at cursor position
document.addEventListener('contextmenu', async (e) => {
  e.preventDefault();
  await contextMenu.popup();
});

// Or show at specific position
// await contextMenu.popup({ x: 100, y: 200 });
```

---

## Example 4: System Tray with Menu (Rust)

```rust
use tauri::tray::TrayIconBuilder;
use tauri::menu::MenuBuilder;
use tauri::image::Image;

tauri::Builder::default()
    .setup(|app| {
        let menu = MenuBuilder::new(app)
            .text("show", "Show Window")
            .text("hide", "Hide Window")
            .separator()
            .text("quit", "Quit")
            .build()?;

        let _tray = TrayIconBuilder::new()
            .icon(Image::from_path("icons/tray.png")?)
            .tooltip("My Tauri App")
            .menu(&menu)
            .show_menu_on_left_click(true)
            .on_menu_event(|app, event| {
                match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            w.show().unwrap();
                            w.set_focus().unwrap();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            w.hide().unwrap();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                }
            })
            .on_tray_icon_event(|tray, event| {
                println!("Tray event: {:?}", event);
            })
            .build(app)?;

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error running app");
```

---

## Example 5: System Tray (JavaScript)

```typescript
import { TrayIcon } from '@tauri-apps/api/tray';
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';

const menu = await Menu.new({
  items: [
    await MenuItem.new({
      text: 'Show',
      action: async () => {
        const win = getCurrentWindow();
        await win.show();
        await win.setFocus();
      },
    }),
    await MenuItem.new({
      text: 'Quit',
      action: async () => { await exit(0); },
    }),
  ],
});

const tray = await TrayIcon.new({
  icon: 'icons/tray-icon.png',
  tooltip: 'My App',
  menu,
  action: (event) => {
    if (event.type === 'Click') {
      console.log('Tray clicked with button:', event.button);
    }
    if (event.type === 'DoubleClick') {
      getCurrentWindow().show();
    }
  },
});
```

---

## Example 6: Dynamic Menu Updates (JavaScript)

```typescript
import { Menu, MenuItem } from '@tauri-apps/api/menu';

const menu = await Menu.new({ items: [] });

// Add items dynamically
await menu.append(await MenuItem.new({
  id: 'item-1',
  text: 'First Item',
  action: () => console.log('First'),
}));

await menu.prepend(await MenuItem.new({
  id: 'item-0',
  text: 'Zeroth Item',
  action: () => console.log('Zeroth'),
}));

await menu.insert(1, await MenuItem.new({
  id: 'item-between',
  text: 'Between',
  action: () => console.log('Between'),
}));

// Query items
const allItems = await menu.items();
const specific = await menu.get('item-1');

// Remove items
await menu.remove('item-between');
await menu.removeAt(0);
```

---

## Example 7: Update Tray at Runtime (JavaScript)

```typescript
// Update tooltip
await tray.setTooltip('Processing... 45%');

// Update icon
await tray.setIcon('icons/tray-active.png');

// Update menu
const newMenu = await Menu.new({
  items: [
    await MenuItem.new({ text: 'Cancel', action: () => cancel() }),
  ],
});
await tray.setMenu(newMenu);

// Hide tray
await tray.setVisible(false);
```

---

## Example 8: Tray App Pattern (Rust) -- Hide on Close

```rust
use tauri::WindowEvent;

tauri::Builder::default()
    .setup(|app| {
        // Create tray icon
        let menu = MenuBuilder::new(app)
            .text("show", "Show")
            .text("quit", "Quit")
            .build()?;

        TrayIconBuilder::new()
            .icon(Image::from_path("icons/tray.png")?)
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

        Ok(())
    })
    .on_window_event(|window, event| {
        // Hide window instead of closing (tray app pattern)
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            window.hide().unwrap();
        }
    })
    .run(tauri::generate_context!())
    .expect("error running app");
```
