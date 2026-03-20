# SSR Examples

## Complete Express SSR Dev Server

### server.js

```javascript
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const isProduction = process.env.NODE_ENV === 'production'

async function createServer() {
  const app = express()

  let vite

  if (!isProduction) {
    // Development: create Vite server in middleware mode
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)
  } else {
    // Production: serve static files from client build
    app.use(
      express.static(path.resolve(import.meta.dirname, 'dist/client'), {
        index: false,
      }),
    )
  }

  app.use('*all', async (req, res, next) => {
    const url = req.originalUrl

    try {
      let template
      let render

      if (!isProduction) {
        // Dev: read template from root, apply Vite transforms
        template = fs.readFileSync(
          path.resolve(import.meta.dirname, 'index.html'),
          'utf-8',
        )
        template = await vite.transformIndexHtml(url, template)
        const mod = await vite.ssrLoadModule('/src/entry-server.js')
        render = mod.render
      } else {
        // Prod: read pre-built template, import pre-built server bundle
        template = fs.readFileSync(
          path.resolve(import.meta.dirname, 'dist/client/index.html'),
          'utf-8',
        )
        const mod = await import('./dist/server/entry-server.js')
        render = mod.render
      }

      const appHtml = await render(url)
      const html = template.replace(`<!--ssr-outlet-->`, () => appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      if (vite) {
        vite.ssrFixStacktrace(e)
      }
      next(e)
    }
  })

  app.listen(5173, () => {
    console.log('Server running at http://localhost:5173')
  })
}

createServer()
```

---

## index.html Template

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite SSR App</title>
  </head>
  <body>
    <div id="app"><!--ssr-outlet--></div>
    <script type="module" src="/src/entry-client.js"></script>
  </body>
</html>
```

---

## Entry Files

### src/entry-server.js

```javascript
import { renderToString } from 'some-framework/server'
import { createApp } from './app.js'

export async function render(url) {
  const app = createApp()
  const html = await renderToString(app)
  return html
}
```

### src/entry-client.js

```javascript
import { hydrateApp } from 'some-framework/client'
import { createApp } from './app.js'

const app = createApp()
hydrateApp(app, document.getElementById('app'))
```

---

## Build Commands

### package.json Scripts

```json
{
  "scripts": {
    "dev": "node server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.js",
    "build": "npm run build:client && npm run build:server",
    "serve": "NODE_ENV=production node server"
  }
}
```

### With SSR Manifest for Preload Directives

```json
{
  "scripts": {
    "build:client": "vite build --outDir dist/client --ssrManifest",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.js",
    "build": "npm run build:client && npm run build:server"
  }
}
```

The `--ssrManifest` flag generates `dist/client/.vite/ssr-manifest.json`, which maps module IDs to output chunks and assets. Use this to inject `<link rel="modulepreload">` tags in the server-rendered HTML.

---

## SSR Manifest Usage

### Reading and Using the Manifest

```javascript
import manifest from './dist/client/.vite/ssr-manifest.json' with { type: 'json' }

function renderPreloadLinks(modules, manifest) {
  let links = ''
  const seen = new Set()

  for (const id of modules) {
    const files = manifest[id]
    if (!files) continue

    for (const file of files) {
      if (seen.has(file)) continue
      seen.add(file)

      if (file.endsWith('.js')) {
        links += `<link rel="modulepreload" crossorigin href="${file}">\n`
      } else if (file.endsWith('.css')) {
        links += `<link rel="stylesheet" href="${file}">\n`
      }
    }
  }

  return links
}
```

---

## SSR Config Examples

### Node.js Target (Default)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: ['@my-org/ui-components'],
  },
})
```

### Webworker Target (Edge Runtimes)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    target: 'webworker',
    noExternal: true, // ALWAYS bundle everything for webworker
  },
})
```

### Custom Resolve Conditions

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    resolve: {
      conditions: ['node', 'import', 'module'],
      externalConditions: ['node', 'require'],
    },
  },
})
```

---

## Plugin with SSR Detection

```javascript
export function mySSRPlugin() {
  return {
    name: 'my-ssr-plugin',
    transform(code, id, options) {
      if (options?.ssr) {
        // Transform for server bundle
        return code.replace(
          'import.meta.env.SSR',
          'true',
        )
      }
      // Transform for client bundle
      return null
    },
    resolveId(id, importer, options) {
      if (options?.ssr && id === 'client-only-module') {
        // Redirect to server-compatible alternative
        return 'server-alternative-module'
      }
    },
  }
}
```
