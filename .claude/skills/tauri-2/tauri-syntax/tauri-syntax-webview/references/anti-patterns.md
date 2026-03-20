# tauri-syntax-webview: Anti-Patterns

These are confirmed error patterns from the Tauri 2 Webview API. Each entry documents the WRONG pattern, the CORRECT pattern, and the WHY.

Sources:
- https://v2.tauri.app/reference/javascript/api/namespacewebview/
- vooronderzoek-tauri.md §3.4, §10

---

## AP-001: Creating a Webview Without a Parent Window

**WHY this is wrong**: Webviews MUST be children of a Window. Attempting to create a standalone webview without a parent will fail. The Webview constructor requires a Window instance as the first argument.

```typescript
// WRONG -- no parent window reference
const webview = new Webview(null, 'my-view', {
  url: '/page.html',
  x: 0,
  y: 0,
  width: 400,
  height: 300,
});
```

```typescript
// CORRECT -- pass a valid Window instance
import { Webview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';

const parentWindow = getCurrentWindow();
const webview = new Webview(parentWindow, 'my-view', {
  url: '/page.html',
  x: 0,
  y: 0,
  width: 400,
  height: 300,
});
```

ALWAYS provide a valid `Window` instance when creating a `Webview`.

---

## AP-002: Confusing Window and Webview APIs

**WHY this is wrong**: `getCurrentWindow()` returns the OS window container. `getCurrentWebview()` returns the web content renderer. In a multi-webview setup, they are different objects with different APIs. Using the wrong one leads to operating on the window frame when you meant to control web content, or vice versa.

```typescript
// WRONG -- using Window API to set zoom (Window has no setZoom method)
import { getCurrentWindow } from '@tauri-apps/api/window';
const win = getCurrentWindow();
await win.setZoom(1.5); // Error: setZoom is not a function on Window
```

```typescript
// CORRECT -- use Webview API for webview-specific operations
import { getCurrentWebview } from '@tauri-apps/api/webview';
const webview = getCurrentWebview();
await webview.setZoom(1.5);
```

ALWAYS use `getCurrentWebview()` for webview-specific operations (zoom, browsing data, webview sizing). Use `getCurrentWindow()` for window chrome operations (title, minimize, maximize).

---

## AP-003: Forgetting setAutoResize for Full-Window Webviews

**WHY this is wrong**: By default, a webview does NOT auto-resize when its parent window is resized. If you create a webview with a fixed size and the user resizes the window, the webview stays at its original size, leaving dead space or getting clipped.

```typescript
// WRONG -- webview stays at 800x600 even if window is resized
const webview = new Webview(parentWindow, 'main', {
  url: '/',
  x: 0,
  y: 0,
  width: 800,
  height: 600,
});
// Window resized to 1200x800 → webview still 800x600
```

```typescript
// CORRECT -- enable auto-resize
const webview = new Webview(parentWindow, 'main', {
  url: '/',
  x: 0,
  y: 0,
  width: 800,
  height: 600,
});
await webview.setAutoResize(true);
// Window resized to 1200x800 → webview follows
```

ALWAYS call `setAutoResize(true)` when a webview should fill its parent window.

---

## AP-004: Using Pixel Values Without DPI Types

**WHY this is wrong**: On high-DPI displays, raw pixel values cause incorrect sizing. A 400-pixel webview may appear at 200 logical pixels on a 2x display, or 400 logical pixels on a 1x display. Using `LogicalSize` and `LogicalPosition` ensures consistent behavior.

```typescript
// WRONG -- raw object without type information
await webview.setSize({ width: 400, height: 300 });
```

```typescript
// CORRECT -- use DPI-aware types
import { LogicalSize } from '@tauri-apps/api/dpi';
await webview.setSize(new LogicalSize(400, 300));
```

ALWAYS use `LogicalSize` / `LogicalPosition` from `@tauri-apps/api/dpi` for consistent cross-platform sizing.

---

## AP-005: Not Cleaning Up Webview Event Listeners

**WHY this is wrong**: Webview event listeners persist until explicitly removed. In component-based frameworks like React, Vue, or Svelte, failing to clean up listeners causes memory leaks and duplicate handler invocations when components remount.

```typescript
// WRONG -- no cleanup in React
useEffect(() => {
  const webview = getCurrentWebview();
  webview.onDragDropEvent((event) => {
    handleDrop(event);
  });
  // No return cleanup!
}, []);
```

```typescript
// CORRECT -- clean up on unmount
useEffect(() => {
  const webview = getCurrentWebview();
  const promise = webview.onDragDropEvent((event) => {
    handleDrop(event);
  });

  return () => {
    promise.then((unlisten) => unlisten());
  };
}, []);
```

ALWAYS clean up webview event listeners in component teardown functions.

---

## AP-006: Passing a Window Object to reparent() Instead of a Label

**WHY this is wrong**: While `reparent()` does accept Window instances, passing the wrong type (e.g., a WebviewWindow label when the actual window has a different internal label) causes silent failures. Using a string label is the most explicit and reliable approach.

```typescript
// FRAGILE -- passing object that may have unexpected label resolution
await webview.reparent(someWindowObject);
```

```typescript
// CLEAR -- use explicit label string
await webview.reparent('target-window');
```

ALWAYS verify the target window label exists before calling `reparent()`.

---

## AP-007: Missing Webview Permissions in Capability File

**WHY this is wrong**: Tauri 2's permission system requires explicit permission grants for all IPC operations. Webview operations like `setZoom`, `setSize`, `reparent`, and `close` all go through IPC and require corresponding permissions. Without them, every call throws a "command not allowed" error at runtime.

```json
// WRONG -- no webview permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

```json
// CORRECT -- explicit webview permissions
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:webview:default",
    "core:webview:allow-create-webview",
    "core:webview:allow-set-webview-size",
    "core:webview:allow-set-webview-position"
  ]
}
```

ALWAYS add required `core:webview:*` permissions to your capability file when using Webview APIs.

---

## AP-008: Duplicate Webview Labels

**WHY this is wrong**: Every webview MUST have a unique label within the application. Creating two webviews with the same label causes the second creation to fail with an error. Labels are used for event routing and identification.

```typescript
// WRONG -- duplicate labels
const panel1 = new Webview(win, 'panel', { url: '/a.html', x: 0, y: 0, width: 400, height: 300 });
const panel2 = new Webview(win, 'panel', { url: '/b.html', x: 400, y: 0, width: 400, height: 300 });
// panel2 creation FAILS
```

```typescript
// CORRECT -- unique labels
const panel1 = new Webview(win, 'panel-left', { url: '/a.html', x: 0, y: 0, width: 400, height: 300 });
const panel2 = new Webview(win, 'panel-right', { url: '/b.html', x: 400, y: 0, width: 400, height: 300 });
```

ALWAYS use unique, descriptive labels for each webview.
