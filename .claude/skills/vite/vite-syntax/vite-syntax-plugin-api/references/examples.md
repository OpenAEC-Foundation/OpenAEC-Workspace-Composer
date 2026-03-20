# Vite Plugin API -- Examples

## Complete Plugin Template

This template covers ALL common plugin patterns in a single, production-ready structure:

```ts
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'

interface MyPluginOptions {
  include?: string[]
  exclude?: string[]
  debug?: boolean
}

export default function myPlugin(options: MyPluginOptions = {}): Plugin {
  let config: ResolvedConfig
  let server: ViteDevServer | undefined

  return {
    name: 'vite-plugin-my-feature',
    enforce: 'pre', // optional: 'pre' | 'post'
    apply: 'serve', // optional: 'serve' | 'build' | function

    // Modify config before resolution
    config(userConfig, { command, mode }) {
      return {
        define: {
          __MY_PLUGIN__: JSON.stringify(true),
        },
      }
    },

    // Store resolved config
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    // Add dev server middleware
    configureServer(_server) {
      server = _server
      // Pre-middleware (runs before Vite internal middlewares)
      server.middlewares.use('/my-api', (req, res, next) => {
        if (req.url === '/health') {
          res.statusCode = 200
          res.end(JSON.stringify({ status: 'ok' }))
        } else {
          next()
        }
      })

      // Return function for post-middleware
      return () => {
        server!.middlewares.use((req, res, next) => {
          // Runs AFTER Vite internal middlewares
          next()
        })
      }
    },

    // Resolve virtual modules
    resolveId(id) {
      if (id === 'virtual:my-data') {
        return '\0virtual:my-data'
      }
      return null
    },

    // Load virtual modules
    load(id) {
      if (id === '\0virtual:my-data') {
        return `export const version = ${JSON.stringify(config.command)}`
      }
      return null
    },

    // Transform source code
    transform(code, id, transformOptions) {
      if (!id.endsWith('.ts') && !id.endsWith('.js')) return null
      if (transformOptions?.ssr) {
        // SSR-specific transform
      }
      return null // Return null when not transforming
    },

    // Transform HTML
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { name: 'generator', content: 'my-plugin' },
            injectTo: 'head',
          },
        ],
      }
    },

    // Custom HMR handling
    handleHotUpdate({ file, server: hmrServer, modules }) {
      if (file.endsWith('.custom')) {
        hmrServer.ws.send({
          type: 'custom',
          event: 'my-plugin:file-changed',
          data: { file },
        })
        return [] // Suppress default HMR
      }
      // Return void for default behavior
    },
  }
}
```

---

## Virtual Modules

### Basic Virtual Module

```ts
export default function virtualConfigPlugin(): Plugin {
  return {
    name: 'vite-plugin-virtual-config',
    resolveId(id) {
      if (id === 'virtual:app-config') return '\0virtual:app-config'
      return null
    },
    load(id) {
      if (id === '\0virtual:app-config') {
        return `
          export const APP_NAME = 'My App'
          export const BUILD_TIME = '${new Date().toISOString()}'
        `
      }
      return null
    },
  }
}
```

**Usage:**

```ts
import { APP_NAME, BUILD_TIME } from 'virtual:app-config'
```

**TypeScript declaration (for consumer projects):**

```ts
// src/vite-env.d.ts or env.d.ts
declare module 'virtual:app-config' {
  export const APP_NAME: string
  export const BUILD_TIME: string
}
```

### Virtual Module with Hook Filters (v6.3+)

```ts
import { exactRegex } from '@rolldown/pluginutils'

export default function filteredVirtualPlugin(): Plugin {
  const moduleId = 'virtual:my-module'
  const resolvedId = '\0' + moduleId

  return {
    name: 'vite-plugin-filtered-virtual',
    resolveId: {
      filter: { id: exactRegex(moduleId) },
      handler() {
        return resolvedId
      },
    },
    load: {
      filter: { id: exactRegex(resolvedId) },
      handler() {
        return `export const msg = "from virtual module"`
      },
    },
  }
}
```

---

## Tag Injection (transformIndexHtml)

### Inject Script and Meta Tags

```ts
export default function htmlTagPlugin(): Plugin {
  return {
    name: 'vite-plugin-html-tags',
    transformIndexHtml(html) {
      return [
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#ffffff' },
          injectTo: 'head',
        },
        {
          tag: 'script',
          attrs: { src: '/analytics.js', defer: true },
          injectTo: 'body',
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}
```

### Conditional HTML Transform with Order

```ts
export default function conditionalHtmlPlugin(): Plugin {
  return {
    name: 'vite-plugin-conditional-html',
    transformIndexHtml: {
      order: 'pre', // Run BEFORE other HTML transforms
      handler(html, ctx) {
        // ctx.server is available during dev
        // ctx.bundle and ctx.chunk are available during build
        if (ctx.server) {
          return html.replace('</head>', '<script>window.__DEV__ = true</script></head>')
        }
        return html
      },
    },
  }
}
```

---

## Client-Server WebSocket Communication

### Server-Side Plugin

```ts
export default function wsPlugin(): Plugin {
  return {
    name: 'vite-plugin-ws-comm',
    configureServer(server) {
      // Listen for client messages
      server.ws.on('my-plugin:ping', (data, client) => {
        console.log('Received ping:', data)
        // Reply to the specific client
        client.send('my-plugin:pong', { timestamp: Date.now() })
      })

      // Broadcast to all clients on connection
      server.ws.on('connection', () => {
        server.ws.send('my-plugin:server-ready', { version: '1.0' })
      })
    },
  }
}
```

### Client-Side Code

```ts
// In your application code (dev only)
if (import.meta.hot) {
  // Send message to server
  import.meta.hot.send('my-plugin:ping', { msg: 'hello' })

  // Listen for server messages
  import.meta.hot.on('my-plugin:pong', (data) => {
    console.log('Server replied at:', data.timestamp)
  })

  import.meta.hot.on('my-plugin:server-ready', (data) => {
    console.log('Server version:', data.version)
  })
}
```

### TypeScript Custom Event Types

```ts
// events.d.ts -- Place in your plugin's types
import 'vite/types/customEvent.d.ts'

declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    'my-plugin:ping': { msg: string }
    'my-plugin:pong': { timestamp: number }
    'my-plugin:server-ready': { version: string }
  }
}
```

Use `InferCustomEventPayload<T>` for typed payloads:

```ts
import type { InferCustomEventPayload } from 'vite'

type PongPayload = InferCustomEventPayload<'my-plugin:pong'>
// PongPayload = { timestamp: number }
```

---

## Output Bundle Metadata

Access CSS and asset imports associated with each chunk during build:

```ts
export default function bundleMetadataPlugin(): Plugin {
  return {
    name: 'vite-plugin-bundle-metadata',
    apply: 'build', // Only during build
    generateBundle(_, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        const meta = output.viteMetadata
        if (!meta) continue

        if (meta.importedCss.size > 0) {
          console.log(`${fileName} imports CSS:`, [...meta.importedCss])
        }
        if (meta.importedAssets.size > 0) {
          console.log(`${fileName} imports assets:`, [...meta.importedAssets])
        }
      }
    },
  }
}
```

---

## SSR-Aware Plugin

```ts
export default function ssrPlugin(): Plugin {
  return {
    name: 'vite-plugin-ssr-aware',
    transform(code, id, options) {
      if (options?.ssr) {
        // Server-side: strip browser-only code
        return code.replace(/if\s*\(typeof window !== 'undefined'\)\s*\{[^}]*\}/g, '')
      }
      // Client-side: default behavior
      return null
    },
  }
}
```

---

## Scoping a Rollup Plugin to Build Only

```ts
import someRollupPlugin from 'rollup-plugin-something'

export default defineConfig({
  plugins: [
    {
      ...someRollupPlugin(),
      enforce: 'post',
      apply: 'build',
    },
  ],
})
```

---

## Plugin with `createFilter` Utility

```ts
import { createFilter, normalizePath } from 'vite'
import type { Plugin } from 'vite'

export default function filteredPlugin(options: {
  include?: string[]
  exclude?: string[]
} = {}): Plugin {
  const filter = createFilter(
    options.include || ['**/*.custom'],
    options.exclude || ['node_modules/**']
  )

  return {
    name: 'vite-plugin-filtered',
    transform(code, id) {
      const normalizedId = normalizePath(id)
      if (!filter(normalizedId)) return null

      // Transform .custom files
      return {
        code: `export default ${JSON.stringify(code)}`,
        map: null,
      }
    },
  }
}
```

---

## Plugin Storing Config and Server References

This pattern is REQUIRED when you need resolved config or server access in hooks that do not receive them directly:

```ts
export default function statefulPlugin(): Plugin {
  let config: ResolvedConfig
  let server: ViteDevServer | undefined

  return {
    name: 'vite-plugin-stateful',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(_server) {
      server = _server
    },
    transform(code, id) {
      // Now you have access to both config and server
      if (config.command === 'serve' && server) {
        // Dev-specific logic with server access
      }
      return null
    },
  }
}
```
