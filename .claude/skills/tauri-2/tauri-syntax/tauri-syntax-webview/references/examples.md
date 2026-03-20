# tauri-syntax-webview: Working Code Examples

All examples verified against official Tauri 2 documentation:
- https://v2.tauri.app/reference/javascript/api/namespacewebview/
- https://docs.rs/tauri/latest/tauri/webview/index.html

---

## Example 1: Basic Webview Access

```typescript
// Get the current webview and inspect its properties
import { getCurrentWebview } from '@tauri-apps/api/webview';

const webview = getCurrentWebview();
console.log('Label:', webview.label);

const size = await webview.size();
console.log('Size:', size.width, 'x', size.height);

const pos = await webview.position();
console.log('Position:', pos.x, ',', pos.y);
```

---

## Example 2: Split-Panel Layout (Two Webviews in One Window)

```typescript
import { Webview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';

const parentWindow = getCurrentWindow();

// Left panel: file tree
const fileTree = new Webview(parentWindow, 'file-tree', {
  url: '/file-tree.html',
  x: 0,
  y: 0,
  width: 250,
  height: 600,
});

// Right panel: editor
const editor = new Webview(parentWindow, 'editor', {
  url: '/editor.html',
  x: 250,
  y: 0,
  width: 550,
  height: 600,
});
```

---

## Example 3: Resizable Webview That Fills the Window

```typescript
import { getCurrentWebview } from '@tauri-apps/api/webview';

const webview = getCurrentWebview();

// Enable auto-resize so the webview fills the parent window
await webview.setAutoResize(true);
```

---

## Example 4: Dynamic Zoom Control

```typescript
import { getCurrentWebview } from '@tauri-apps/api/webview';

const webview = getCurrentWebview();

async function zoomIn() {
  const currentSize = await webview.size();
  // Zoom is a scale factor, not pixel-based
  await webview.setZoom(1.25);
}

async function zoomOut() {
  await webview.setZoom(0.75);
}

async function resetZoom() {
  await webview.setZoom(1.0);
}
```

---

## Example 5: Reparenting a Webview Between Windows

```typescript
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { Window } from '@tauri-apps/api/window';

// Create a second window
const secondWindow = new Window('secondary', {
  title: 'Detached Panel',
  width: 600,
  height: 400,
});

// Move current webview to the new window
const webview = getCurrentWebview();
await webview.reparent('secondary');
```

---

## Example 6: Drag-Drop File Handling

```typescript
import { getCurrentWebview } from '@tauri-apps/api/webview';

const webview = getCurrentWebview();

const unlisten = await webview.onDragDropEvent((event) => {
  const { type } = event.payload;

  switch (type) {
    case 'enter':
      console.log('Files entering:', event.payload.paths);
      document.body.classList.add('drag-over');
      break;
    case 'over':
      // Update position indicator
      console.log('Hovering at:', event.payload.position);
      break;
    case 'drop':
      console.log('Dropped files:', event.payload.paths);
      handleFiles(event.payload.paths);
      document.body.classList.remove('drag-over');
      break;
    case 'leave':
      document.body.classList.remove('drag-over');
      break;
  }
});

// Clean up when done
// unlisten();
```

---

## Example 7: React Component with Webview Events

```typescript
import { useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';

function DropZone() {
  const [droppedFiles, setDroppedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const webview = getCurrentWebview();
    const promise = webview.onDragDropEvent((event) => {
      switch (event.payload.type) {
        case 'enter':
          setIsDragging(true);
          break;
        case 'drop':
          setDroppedFiles(event.payload.paths);
          setIsDragging(false);
          break;
        case 'leave':
          setIsDragging(false);
          break;
      }
    });

    return () => {
      promise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className={isDragging ? 'drop-active' : ''}>
      <h2>Drop Zone</h2>
      <ul>
        {droppedFiles.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Example 8: Listing All Webviews

```typescript
import { getAllWebviews } from '@tauri-apps/api/webview';

const webviews = await getAllWebviews();
for (const wv of webviews) {
  const size = await wv.size();
  console.log(`Webview "${wv.label}": ${size.width}x${size.height}`);
}
```

---

## Example 9: Webview Communication via Events

```typescript
// In webview A (sender)
import { getCurrentWebview } from '@tauri-apps/api/webview';

const webviewA = getCurrentWebview();
await webviewA.emitTo('webview-b', 'data-update', { value: 42 });

// In webview B (receiver)
import { getCurrentWebview } from '@tauri-apps/api/webview';

const webviewB = getCurrentWebview();
const unlisten = await webviewB.listen<{ value: number }>('data-update', (event) => {
  console.log('Received value:', event.payload.value);
});
```

---

## Example 10: Rust -- Creating Multiple Webviews in Setup

```rust
use tauri::webview::{WebviewBuilder, WebviewWindowBuilder};
use tauri::{LogicalPosition, LogicalSize, Manager, WebviewUrl};

tauri::Builder::default()
    .setup(|app| {
        // Create a window first
        let window = tauri::window::WindowBuilder::new(app, "multi-panel")
            .title("Multi-Panel App")
            .inner_size(1000.0, 600.0)
            .build()?;

        // Add sidebar webview
        let sidebar = WebviewBuilder::new(
            "sidebar",
            WebviewUrl::App("sidebar.html".into()),
        );
        window.add_child(
            sidebar,
            LogicalPosition::new(0.0, 0.0),
            LogicalSize::new(250.0, 600.0),
        )?;

        // Add main content webview
        let content = WebviewBuilder::new(
            "content",
            WebviewUrl::App("content.html".into()),
        );
        window.add_child(
            content,
            LogicalPosition::new(250.0, 0.0),
            LogicalSize::new(750.0, 600.0),
        )?;

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```
