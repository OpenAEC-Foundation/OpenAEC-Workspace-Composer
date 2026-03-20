# tauri-syntax-menu: API Method Reference

Sources: https://v2.tauri.app/develop/menu/,
https://v2.tauri.app/develop/system-tray/,
https://v2.tauri.app/reference/javascript/api/namespacemenu/,
https://v2.tauri.app/reference/javascript/api/namespacetray/

---

## Rust: MenuBuilder

**Import:** `use tauri::menu::MenuBuilder;`

### Constructor

```rust
MenuBuilder::new(manager: &impl Manager<R>) -> Self
```

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `item` | `(&dyn IsMenuItem) -> Self` | Add any menu item |
| `items` | `(&[&dyn IsMenuItem]) -> Self` | Add multiple items |
| `text` | `(id: impl Into<String>, text: impl Into<String>) -> Self` | Add text menu item |
| `separator` | `() -> Self` | Add separator |
| `quit` | `() -> Self` | Add Quit predefined item |
| `about` | `(metadata: Option<AboutMetadata>) -> Self` | Add About item |
| `copy` | `() -> Self` | Add Copy item |
| `cut` | `() -> Self` | Add Cut item |
| `paste` | `() -> Self` | Add Paste item |
| `select_all` | `() -> Self` | Add Select All item |
| `undo` | `() -> Self` | Add Undo item |
| `redo` | `() -> Self` | Add Redo item |
| `build` | `() -> Result<Menu<R>>` | Build the menu |

---

## Rust: SubmenuBuilder

**Import:** `use tauri::menu::SubmenuBuilder;`

### Constructor

```rust
SubmenuBuilder::new(manager: &impl Manager<R>, text: impl Into<String>) -> Self
```

### Methods

Same as `MenuBuilder` plus:

| Method | Signature | Description |
|--------|-----------|-------------|
| `enabled` | `(bool) -> Self` | Set enabled state |
| `build` | `() -> Result<Submenu<R>>` | Build the submenu |

---

## Rust: MenuItem / MenuItemBuilder

**Import:** `use tauri::menu::{MenuItem, MenuItemBuilder};`

### MenuItemBuilder

```rust
MenuItemBuilder::new(text: impl Into<String>) -> Self
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `id` | `(impl Into<MenuId>) -> Self` | Set item ID |
| `enabled` | `(bool) -> Self` | Set enabled state |
| `accelerator` | `(impl Into<String>) -> Self` | Set keyboard shortcut |
| `build` | `(manager: &impl Manager<R>) -> Result<MenuItem<R>>` | Build item |

### MenuItem Direct Constructor

```rust
MenuItem::new(
    manager: &impl Manager<R>,
    text: impl Into<String>,
    enabled: bool,
    accelerator: Option<impl Into<String>>,
) -> Result<MenuItem<R>>
```

---

## Rust: CheckMenuItem / CheckMenuItemBuilder

**Import:** `use tauri::menu::{CheckMenuItem, CheckMenuItemBuilder};`

```rust
CheckMenuItemBuilder::new(text: impl Into<String>) -> Self
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `id` | `(impl Into<MenuId>) -> Self` | Set item ID |
| `enabled` | `(bool) -> Self` | Set enabled state |
| `checked` | `(bool) -> Self` | Set initial checked state |
| `accelerator` | `(impl Into<String>) -> Self` | Set keyboard shortcut |
| `build` | `(manager: &impl Manager<R>) -> Result<CheckMenuItem<R>>` | Build item |

---

## Rust: IconMenuItem / IconMenuItemBuilder

**Import:** `use tauri::menu::{IconMenuItem, IconMenuItemBuilder};`

```rust
IconMenuItemBuilder::new(text: impl Into<String>) -> Self
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `id` | `(impl Into<MenuId>) -> Self` | Set item ID |
| `enabled` | `(bool) -> Self` | Set enabled state |
| `icon` | `(Image) -> Self` | Set item icon |
| `native_icon` | `(NativeIcon) -> Self` | Set platform-native icon |
| `accelerator` | `(impl Into<String>) -> Self` | Set keyboard shortcut |
| `build` | `(manager: &impl Manager<R>) -> Result<IconMenuItem<R>>` | Build item |

---

## Rust: PredefinedMenuItem

**Import:** `use tauri::menu::PredefinedMenuItem;`

All methods take `(manager: &impl Manager<R>)` and return `Result<PredefinedMenuItem<R>>`:

| Factory Method | Description |
|---------------|-------------|
| `separator(manager)` | Menu separator line |
| `quit(manager, text)` | Quit application |
| `about(manager, text, metadata)` | About dialog |
| `copy(manager, text)` | Copy to clipboard |
| `cut(manager, text)` | Cut to clipboard |
| `paste(manager, text)` | Paste from clipboard |
| `select_all(manager, text)` | Select all |
| `undo(manager, text)` | Undo |
| `redo(manager, text)` | Redo |
| `minimize(manager, text)` | Minimize window |
| `maximize(manager, text)` | Maximize window |
| `fullscreen(manager, text)` | Toggle fullscreen |
| `hide(manager, text)` | Hide application (macOS) |
| `hide_others(manager, text)` | Hide other apps (macOS) |
| `show_all(manager, text)` | Show all windows (macOS) |
| `close_window(manager, text)` | Close current window |
| `bring_all_to_front(manager, text)` | Bring all to front (macOS) |
| `services(manager, text)` | Services menu (macOS) |

---

## Rust: TrayIconBuilder

**Import:** `use tauri::tray::TrayIconBuilder;`

### Constructor

```rust
TrayIconBuilder::new() -> Self
```

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `with_id` | `(id: impl Into<TrayIconId>) -> Self` | Set custom ID |
| `icon` | `(icon: Image) -> Self` | Set tray icon |
| `tooltip` | `(tooltip: impl Into<String>) -> Self` | Set tooltip text |
| `title` | `(title: impl Into<String>) -> Self` | Set title text |
| `menu` | `(menu: &Menu<R>) -> Self` | Attach context menu |
| `show_menu_on_left_click` | `(bool) -> Self` | Show menu on left click (default: true) |
| `icon_as_template` | `(bool) -> Self` | Use as template icon (macOS only) |
| `on_menu_event` | `(F: Fn(&AppHandle, MenuEvent)) -> Self` | Menu event handler |
| `on_tray_icon_event` | `(F: Fn(&TrayIcon, TrayIconEvent)) -> Self` | Tray click handler |
| `build` | `(manager: impl Manager<R>) -> Result<TrayIcon<R>>` | Build tray icon |

---

## Rust: Menu Event

```rust
pub struct MenuEvent {
    pub fn id(&self) -> &MenuId  // Get the menu item ID
}
```

Use `event.id().as_ref()` to get `&str` for matching.

---

## Rust: Builder Integration

### Menu on Builder

```rust
tauri::Builder::default()
    .menu(|app| {
        // app: &AppHandle — use to create menu items
        MenuBuilder::new(app).build()
    })
    .on_menu_event(|app, event| {
        // app: &AppHandle, event: MenuEvent
    })
```

### Tray on Builder

```rust
tauri::Builder::default()
    .on_tray_icon_event(|app, event| {
        // Global tray icon event handler
    })
```

---

## JavaScript: Menu Class

**Import:** `import { Menu } from '@tauri-apps/api/menu'`

### Factory Method

```typescript
Menu.new(options: MenuOptions): Promise<Menu>

interface MenuOptions {
  items: Array<MenuItem | Submenu | CheckMenuItem | PredefinedMenuItem>;
}
```

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setAsAppMenu()` | `Promise<void>` | Set as application menu |
| `setAsWindowMenu()` | `Promise<void>` | Set as window menu |
| `popup()` | `Promise<void>` | Show as context menu at cursor |
| `popup(options)` | `Promise<void>` | Show at specific position `{ x, y }` |
| `append(item)` | `Promise<void>` | Add item at end |
| `prepend(item)` | `Promise<void>` | Add item at beginning |
| `insert(index, item)` | `Promise<void>` | Add item at index |
| `remove(id)` | `Promise<void>` | Remove item by ID |
| `removeAt(index)` | `Promise<void>` | Remove item at index |
| `get(id)` | `Promise<MenuItem \| null>` | Get item by ID |
| `items()` | `Promise<Array>` | Get all items |

---

## JavaScript: MenuItem Class

**Import:** `import { MenuItem } from '@tauri-apps/api/menu'`

```typescript
MenuItem.new(options: MenuItemOptions): Promise<MenuItem>

interface MenuItemOptions {
  id?: string;
  text: string;
  enabled?: boolean;
  accelerator?: string;
  action?: (item: MenuItem) => void;
}
```

---

## JavaScript: CheckMenuItem Class

**Import:** `import { CheckMenuItem } from '@tauri-apps/api/menu'`

```typescript
CheckMenuItem.new(options: CheckMenuItemOptions): Promise<CheckMenuItem>

interface CheckMenuItemOptions {
  id?: string;
  text: string;
  enabled?: boolean;
  checked?: boolean;
  accelerator?: string;
  action?: (item: CheckMenuItem) => void;
}
```

---

## JavaScript: PredefinedMenuItem Class

**Import:** `import { PredefinedMenuItem } from '@tauri-apps/api/menu'`

```typescript
PredefinedMenuItem.new(options: PredefinedMenuItemOptions): Promise<PredefinedMenuItem>

interface PredefinedMenuItemOptions {
  item: 'About' | 'Hide' | 'HideOthers' | 'ShowAll' | 'CloseWindow' | 'Quit'
      | 'Copy' | 'Cut' | 'Paste' | 'SelectAll' | 'Undo' | 'Redo'
      | 'Minimize' | 'Zoom' | 'Separator' | 'Fullscreen'
      | 'Services' | 'BringAllToFront';
  text?: string;
}
```

---

## JavaScript: Submenu Class

**Import:** `import { Submenu } from '@tauri-apps/api/menu'`

```typescript
Submenu.new(options: SubmenuOptions): Promise<Submenu>

interface SubmenuOptions {
  id?: string;
  text: string;
  enabled?: boolean;
  items: Array<MenuItem | CheckMenuItem | PredefinedMenuItem | Submenu>;
}
```

---

## JavaScript: TrayIcon Class

**Import:** `import { TrayIcon } from '@tauri-apps/api/tray'`

### Factory Method

```typescript
TrayIcon.new(options: TrayIconOptions): Promise<TrayIcon>

interface TrayIconOptions {
  id?: string;
  icon?: string | Uint8Array;
  tooltip?: string;
  title?: string;
  menu?: Menu;
  menuOnLeftClick?: boolean;
  action?: (event: TrayIconEvent) => void;
}
```

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setIcon(icon)` | `Promise<void>` | Update tray icon |
| `setTooltip(text)` | `Promise<void>` | Update tooltip |
| `setTitle(text)` | `Promise<void>` | Update title |
| `setVisible(bool)` | `Promise<void>` | Show/hide tray icon |
| `setMenu(menu)` | `Promise<void>` | Update context menu |

### TrayIconEvent

```typescript
interface TrayIconEvent {
  type: 'Click' | 'DoubleClick' | 'Enter' | 'Move' | 'Leave';
  button?: 'Left' | 'Right' | 'Middle';
  buttonState?: 'Down' | 'Up';
  position?: PhysicalPosition;
  rect?: { position: PhysicalPosition; size: PhysicalSize };
}
```

---

## Accelerator Key Syntax

Keyboard shortcuts use the format: `Modifier+Key`

| Modifier | Description |
|----------|-------------|
| `CmdOrCtrl` | Cmd on macOS, Ctrl on Windows/Linux |
| `Ctrl` | Control key |
| `Shift` | Shift key |
| `Alt` | Alt/Option key |
| `Super` | Windows/Cmd key |

Examples: `CmdOrCtrl+S`, `CmdOrCtrl+Shift+Z`, `Alt+F4`, `F11`
