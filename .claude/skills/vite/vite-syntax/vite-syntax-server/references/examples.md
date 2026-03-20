# Server Configuration Examples

Working code examples for common Vite dev server configurations.

---

## Proxy Configuration

### String Shorthand

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // All requests to /api/* are forwarded to http://localhost:3001/api/*
      '/api': 'http://localhost:3001',
    },
  },
})
```

### Path Rewriting

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        // /api/posts → http://jsonplaceholder.typicode.com/posts
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

### WebSocket Proxy

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:5174',
        ws: true,
      },
    },
  },
})
```

### Multiple Proxy Targets

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, '/files'),
      },
    },
  },
})
```

### Proxy with Self-Signed Certificate

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://internal-api.local',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
      },
    },
  },
})
```

### Proxy with Custom Headers

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        headers: {
          'X-Forwarded-For': 'vite-dev-server',
          'Authorization': 'Bearer dev-token',
        },
      },
    },
  },
})
```

### Conditional Proxy Bypass

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        bypass(req, res, options) {
          // Serve HTML requests directly (do not proxy)
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
          // Return undefined to continue with proxy
        },
      },
    },
  },
})
```

---

## HTTPS Configuration

### Basic HTTPS with Local Certificates

```typescript
import fs from 'node:fs'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('certs/localhost-key.pem'),
      cert: fs.readFileSync('certs/localhost-cert.pem'),
    },
  },
})
```

### HTTPS with mkcert (Recommended for Local Dev)

Generate certificates first:
```bash
# Install mkcert, then:
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

```typescript
import fs from 'node:fs'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('localhost+2-key.pem'),
      cert: fs.readFileSync('localhost+2.pem'),
    },
  },
})
```

### HTTPS with Custom CA

```typescript
import fs from 'node:fs'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('certs/server.key'),
      cert: fs.readFileSync('certs/server.crt'),
      ca: fs.readFileSync('certs/ca.crt'),
    },
  },
})
```

---

## Middleware Mode

### Express Integration

```typescript
// server.ts
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  // Mount Vite's middleware stack
  app.use(vite.middlewares)

  // Custom API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  // SSR catch-all handler
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      // Read and transform index.html
      let template = fs.readFileSync('index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)

      // Load the SSR entry module
      const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
      const appHtml = await render(url)

      const html = template.replace('<!--ssr-outlet-->', appHtml)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e as Error)
      next(e)
    }
  })

  app.listen(5173, () => {
    console.log('Server running at http://localhost:5173')
  })
}

createServer()
```

### Fastify Integration

```typescript
import Fastify from 'fastify'
import middie from '@fastify/middie'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const fastify = Fastify()
  await fastify.register(middie)

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  fastify.use(vite.middlewares)

  fastify.get('/api/health', async () => {
    return { status: 'ok' }
  })

  await fastify.listen({ port: 5173 })
}

createServer()
```

---

## Server Warmup

### Warming Up Critical Components

```typescript
export default defineConfig({
  server: {
    warmup: {
      clientFiles: [
        './src/App.vue',
        './src/components/Layout.vue',
        './src/components/Header.vue',
        './src/pages/Home.vue',
        './src/styles/main.css',
      ],
    },
  },
})
```

### Warmup with Glob Patterns

```typescript
export default defineConfig({
  server: {
    warmup: {
      clientFiles: [
        './src/components/**/*.vue',
        './src/pages/**/*.tsx',
      ],
      ssrFiles: [
        './src/server/**/*.ts',
      ],
    },
  },
})
```

---

## File System Restrictions

### Monorepo Setup (Allow Parent Directories)

```typescript
export default defineConfig({
  server: {
    fs: {
      strict: true,
      allow: [
        // Allow serving from monorepo root
        '..',
        // Allow serving from shared packages
        '../../packages/shared',
      ],
    },
  },
})
```

### Deny Additional Sensitive Files

```typescript
export default defineConfig({
  server: {
    fs: {
      deny: [
        // Keep ALL defaults
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        // Add custom patterns
        '**/secrets/**',
        '**/*.key',
        '**/config/production.*',
      ],
    },
  },
})
```

---

## LAN Access Configuration

### Expose to Local Network with Host Restriction

```typescript
export default defineConfig({
  server: {
    host: true,
    allowedHosts: ['my-dev-machine.local'],
  },
})
```

### Mobile Testing Setup

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.local'], // Allow all .local domains
  },
})
```

---

## HMR Configuration

### Behind a Reverse Proxy (nginx)

```typescript
export default defineConfig({
  server: {
    hmr: {
      // Client connects to proxy on port 443
      clientPort: 443,
      // HMR WebSocket served from this path
      path: '/hmr',
    },
  },
})
```

### Disable Error Overlay

```typescript
export default defineConfig({
  server: {
    hmr: {
      overlay: false,
    },
  },
})
```

### Separate HMR WebSocket Server

```typescript
import { createServer } from 'node:http'
import { defineConfig } from 'vite'

const hmrServer = createServer()

export default defineConfig({
  server: {
    hmr: {
      server: hmrServer,
      port: 24678,
    },
  },
})
```

---

## File Watcher Configuration

### Docker / WSL2 / Network Drives (Polling)

```typescript
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
```

### Ignore Large Directories

```typescript
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
  },
})
```

---

## Custom Response Headers

### Security Headers

```typescript
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
```

---

## Forward Console (Vite 8+ Only)

### Enable for AI-Assisted Development

```typescript
export default defineConfig({
  server: {
    forwardConsole: true,
  },
})
```

### Filter to Errors and Warnings Only

```typescript
export default defineConfig({
  server: {
    forwardConsole: {
      unhandledErrors: true,
      logLevels: ['error', 'warn'],
    },
  },
})
```
