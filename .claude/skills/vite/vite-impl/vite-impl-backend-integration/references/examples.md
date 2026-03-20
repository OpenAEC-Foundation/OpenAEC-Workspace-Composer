# Backend Integration Examples

## Vite Configuration

### Minimal Backend Integration Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: {
      origin: 'http://localhost:8000', // Your backend origin
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      // Vite 6/7 -- use rolldownOptions for Vite 8+
      input: 'src/main.ts',
    },
  },
})
```

### Multi-Entry Backend Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: {
      origin: 'http://localhost:8000',
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: 'src/main.ts',
        admin: 'src/admin.ts',
      },
    },
  },
})
```

### React Backend Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    cors: {
      origin: 'http://localhost:3000',
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: 'src/main.tsx',
    },
  },
})
```

---

## Entry Point

### Standard Entry with Modulepreload Polyfill

```javascript
// src/main.ts
import 'vite/modulepreload-polyfill'

import './styles/app.css'
import { initApp } from './app'

initApp()
```

ALWAYS place `import 'vite/modulepreload-polyfill'` as the FIRST import in your entry file.

---

## Development Mode HTML

### Basic Development Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
    <!-- No CSS links in dev mode -- Vite injects CSS via JS -->
  </head>
  <body>
    <div id="app"></div>

    <!-- Vite HMR client -->
    <script type="module" src="http://localhost:5173/@vite/client"></script>

    <!-- Application entry point -->
    <script type="module" src="http://localhost:5173/src/main.ts"></script>
  </body>
</html>
```

### React Development Template (with Preamble)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>

    <!-- STEP 1: React Refresh preamble (MUST come first) -->
    <script type="module">
      import RefreshRuntime from 'http://localhost:5173/@react-refresh'
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>

    <!-- STEP 2: Vite HMR client -->
    <script type="module" src="http://localhost:5173/@vite/client"></script>

    <!-- STEP 3: Application entry point -->
    <script type="module" src="http://localhost:5173/src/main.tsx"></script>
  </body>
</html>
```

### Vue Development Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>

    <!-- Vite HMR client -->
    <script type="module" src="http://localhost:5173/@vite/client"></script>

    <!-- Application entry point -->
    <script type="module" src="http://localhost:5173/src/main.ts"></script>
  </body>
</html>
```

No preamble needed for Vue -- `@vitejs/plugin-vue` handles HMR internally.

---

## Production Mode HTML

### Rendered Production Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>

    <!-- CSS: entry chunk -->
    <link rel="stylesheet" href="/dist/assets/main-5UjPuW-k.css" />
    <!-- CSS: imported chunks (recursive) -->
    <link rel="stylesheet" href="/dist/assets/vendor-ChJ_j-JJ.css" />
  </head>
  <body>
    <div id="app"></div>

    <!-- Entry JS module -->
    <script type="module" src="/dist/assets/main-BRBmoGS9.js"></script>
    <!-- Modulepreload for imported JS chunks -->
    <link rel="modulepreload" href="/dist/assets/vendor-B7PI925R.js" />
  </body>
</html>
```

---

## Server-Side Rendering Examples

### Node.js / Express

```typescript
import fs from 'node:fs'
import express from 'express'
import type { Manifest } from 'vite'
import importedChunks from './importedChunks'

const app = express()
const isDev = process.env.NODE_ENV !== 'production'

if (isDev) {
  // Development: proxy to Vite dev server
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app"></div>
          <script type="module" src="http://localhost:5173/@vite/client"></script>
          <script type="module" src="http://localhost:5173/src/main.ts"></script>
        </body>
      </html>
    `)
  })
} else {
  // Production: serve from manifest
  const manifest: Manifest = JSON.parse(
    fs.readFileSync('dist/.vite/manifest.json', 'utf-8')
  )

  app.use('/dist', express.static('dist'))

  app.get('*', (req, res) => {
    const entry = manifest['src/main.ts']
    const imported = importedChunks(manifest, 'src/main.ts')

    const cssLinks = [
      ...(entry.css ?? []),
      ...imported.flatMap((c) => c.css ?? []),
    ].map((css) => `<link rel="stylesheet" href="/dist/${css}" />`)

    const preloadLinks = imported.map(
      (c) => `<link rel="modulepreload" href="/dist/${c.file}" />`
    )

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>${cssLinks.join('\n')}</head>
        <body>
          <div id="app"></div>
          <script type="module" src="/dist/${entry.file}"></script>
          ${preloadLinks.join('\n')}
        </body>
      </html>
    `)
  })
}

app.listen(3000)
```

### Django (Python) Template Tag

```python
# templatetags/vite.py
import json
import os
from django.conf import settings
from django.utils.safestring import mark_safe

_manifest_cache = None

def get_manifest():
    global _manifest_cache
    if _manifest_cache is None or settings.DEBUG:
        manifest_path = os.path.join(
            settings.BASE_DIR, 'dist', '.vite', 'manifest.json'
        )
        with open(manifest_path) as f:
            _manifest_cache = json.load(f)
    return _manifest_cache

def get_imported_chunks(manifest, name):
    seen = set()
    chunks = []

    def collect(chunk):
        for key in chunk.get('imports', []):
            if key in seen:
                continue
            seen.add(key)
            importee = manifest[key]
            collect(importee)
            chunks.append(importee)

    collect(manifest[name])
    return chunks

def vite_assets(entry):
    if settings.DEBUG:
        return mark_safe(
            f'<script type="module" src="http://localhost:5173/@vite/client"></script>\n'
            f'<script type="module" src="http://localhost:5173/{entry}"></script>'
        )

    manifest = get_manifest()
    chunk = manifest[entry]
    imported = get_imported_chunks(manifest, entry)
    tags = []

    for css in chunk.get('css', []):
        tags.append(f'<link rel="stylesheet" href="/dist/{css}" />')
    for imp in imported:
        for css in imp.get('css', []):
            tags.append(f'<link rel="stylesheet" href="/dist/{css}" />')
    tags.append(f'<script type="module" src="/dist/{chunk["file"]}"></script>')
    for imp in imported:
        tags.append(f'<link rel="modulepreload" href="/dist/{imp["file"]}" />')

    return mark_safe('\n'.join(tags))
```

### Laravel (PHP) Helper

```php
<?php
// app/Helpers/Vite.php

function vite_assets(string $entry): string
{
    if (app()->environment('local')) {
        return <<<HTML
            <script type="module" src="http://localhost:5173/@vite/client"></script>
            <script type="module" src="http://localhost:5173/{$entry}"></script>
        HTML;
    }

    $manifest = json_decode(
        file_get_contents(public_path('dist/.vite/manifest.json')),
        true
    );

    $chunk = $manifest[$entry];
    $imported = get_imported_chunks($manifest, $entry);
    $tags = [];

    foreach ($chunk['css'] ?? [] as $css) {
        $tags[] = "<link rel=\"stylesheet\" href=\"/dist/{$css}\" />";
    }
    foreach ($imported as $imp) {
        foreach ($imp['css'] ?? [] as $css) {
            $tags[] = "<link rel=\"stylesheet\" href=\"/dist/{$css}\" />";
        }
    }
    $tags[] = "<script type=\"module\" src=\"/dist/{$chunk['file']}\"></script>";
    foreach ($imported as $imp) {
        $tags[] = "<link rel=\"modulepreload\" href=\"/dist/{$imp['file']}\" />";
    }

    return implode("\n", $tags);
}

function get_imported_chunks(array $manifest, string $name): array
{
    $seen = [];
    $chunks = [];

    $collect = function ($chunk) use ($manifest, &$seen, &$chunks, &$collect) {
        foreach ($chunk['imports'] ?? [] as $key) {
            if (isset($seen[$key])) continue;
            $seen[$key] = true;
            $importee = $manifest[$key];
            $collect($importee);
            $chunks[] = $importee;
        }
    };

    $collect($manifest[$name]);
    return $chunks;
}
```

---

## Custom Vite Dev Server Port

If your Vite dev server runs on a non-default port, update ALL dev script URLs accordingly:

```html
<!-- Custom port example (port 3001) -->
<script type="module" src="http://localhost:3001/@vite/client"></script>
<script type="module" src="http://localhost:3001/src/main.ts"></script>
```

ALWAYS ensure the port matches your `server.port` in `vite.config.ts`.
