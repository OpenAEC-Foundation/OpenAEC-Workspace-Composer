# Dev Server Error Scenarios with Solutions

Working examples of common Vite dev server error scenarios and their complete configuration fixes.

---

## Scenario 1: HMR Not Working for Utility Module

**Problem**: You edit `src/utils/format.ts` and the page fully reloads instead of hot-updating.

**Why**: `format.ts` is a plain utility module. No framework plugin adds HMR boundaries for `.ts` files. The update propagates up through all importers until it reaches the entry point, triggering a full reload.

**Solution A — Self-accepting module** (when the module has no side effects on import):

```typescript
// src/utils/format.ts
export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US')
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
```

**Solution B — Parent accepts the dependency** (when the consuming module manages rendering):

```typescript
// src/views/Dashboard.ts
import { formatDate } from '../utils/format'

function render() {
  document.getElementById('date')!.textContent = formatDate(new Date())
}
render()

if (import.meta.hot) {
  import.meta.hot.accept('../utils/format', (newFormat) => {
    if (newFormat) {
      document.getElementById('date')!.textContent = newFormat.formatDate(new Date())
    }
  })
}
```

---

## Scenario 2: Proxy to Backend API with Authentication

**Problem**: Frontend at `localhost:5173` needs to call a backend at `localhost:8080/api/*`. Cookies are not forwarded and the backend rejects requests.

**Solution**:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err.message)
          })
        },
      },
    },
  },
})
```

**Key points**:
- `changeOrigin: true` rewrites the `Host` header so the backend sees its own hostname
- `cookieDomainRewrite: 'localhost'` ensures Set-Cookie headers work in the browser
- `secure: false` allows self-signed certs on the backend

---

## Scenario 3: Vite Behind Nginx Reverse Proxy

**Problem**: Vite runs on port 5173 behind nginx on port 443. HMR WebSocket fails to connect.

**Nginx config**:

```nginx
server {
    listen 443 ssl;
    server_name myapp.dev;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**Vite config**:

```typescript
export default defineConfig({
  server: {
    hmr: {
      protocol: 'wss',
      host: 'myapp.dev',
      clientPort: 443,
    },
    allowedHosts: ['myapp.dev'],
  },
})
```

**Key points**:
- `clientPort: 443` tells the HMR client to connect to the proxy port, not 5173
- `protocol: 'wss'` matches the nginx SSL termination
- `allowedHosts` includes the custom domain to avoid 403 errors

---

## Scenario 4: Vite in Docker with File Watching

**Problem**: Vite runs inside a Docker container with the source code mounted as a bind volume. File changes are not detected.

**Dockerfile**:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

**docker-compose.yml**:

```yaml
services:
  frontend:
    build: .
    ports:
      - "5173:5173"
    volumes:
      - ./src:/app/src
      - ./public:/app/public
```

**Vite config**:

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',    // Listen on all interfaces (required in Docker)
    watch: {
      usePolling: true,  // Required for Docker bind mounts
      interval: 1000,    // Reduce CPU usage (default 100ms is aggressive)
    },
  },
})
```

---

## Scenario 5: Monorepo with Shared Packages

**Problem**: A monorepo has `packages/shared/` and `apps/web/`. The web app imports from `@myorg/shared` but Vite blocks it: `"The request url is outside of Vite serving allow list"`.

**Project structure**:

```
monorepo/
  packages/
    shared/
      src/
        index.ts
      package.json  (name: "@myorg/shared")
  apps/
    web/
      src/
        main.ts  (imports from "@myorg/shared")
      vite.config.ts
      package.json
```

**Solution** (`apps/web/vite.config.ts`):

```typescript
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import path from 'node:path'

export default defineConfig({
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
      ],
    },
  },
  resolve: {
    alias: {
      '@myorg/shared': path.resolve(import.meta.dirname, '../../packages/shared/src'),
    },
  },
  optimizeDeps: {
    include: ['@myorg/shared'],  // Only if the package uses CJS
  },
})
```

**Key point**: `searchForWorkspaceRoot()` walks up directories looking for a workspace root marker (pnpm-workspace.yaml, package.json with workspaces, lerna.json). This automatically allows serving files from the entire monorepo.

---

## Scenario 6: Custom Express Server with SSR (Middleware Mode)

**Problem**: Using Vite as middleware in an Express server for SSR. Routes return the wrong content or assets fail to load.

**Solution**:

```typescript
// server.ts
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',  // CRITICAL: disables SPA fallback
  })

  // 1. Vite middleware FIRST (handles HMR, assets, transforms)
  app.use(vite.middlewares)

  // 2. API routes SECOND
  app.use('/api', apiRouter)

  // 3. SSR catch-all LAST
  app.use('*all', async (req, res) => {
    const url = req.originalUrl

    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync('./index.html', 'utf-8')
    )

    const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
    const appHtml = await render(url)
    const html = template.replace('<!--ssr-outlet-->', () => appHtml)

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

  app.listen(5173)
}

createServer()
```

**Key points**:
- `appType: 'custom'` prevents Vite from adding its own HTML fallback
- Middleware order matters: Vite first, then API, then catch-all
- Use `vite.transformIndexHtml()` to apply Vite's HTML processing

---

## Scenario 7: CORS with Backend Integration

**Problem**: Frontend served by Vite at `http://localhost:5173`, backend at `http://localhost:8000`. Browser blocks API requests with CORS error.

**Solution A — Configure Vite CORS** (when backend is the origin):

```typescript
export default defineConfig({
  server: {
    cors: {
      origin: 'http://localhost:8000',
    },
  },
})
```

**Solution B — Use proxy** (recommended, avoids CORS entirely):

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

Solution B is preferred because it eliminates CORS complexity and more closely matches production where frontend and API typically share an origin.

---

## Scenario 8: Slow Cold Start with Large Project

**Problem**: First page load takes 5+ seconds because Vite transforms hundreds of modules on demand.

**Solution**:

```typescript
export default defineConfig({
  server: {
    warmup: {
      clientFiles: [
        './src/main.ts',
        './src/App.vue',
        './src/router/index.ts',
        './src/stores/*.ts',
        './src/components/layout/*.vue',
      ],
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
    ],
  },
})
```

**Key points**:
- `server.warmup.clientFiles` pre-transforms files before the browser requests them
- `optimizeDeps.include` forces eager pre-bundling of known dependencies
- Focus warmup on the critical rendering path (entry, router, layout components)

---

## Scenario 9: Port Conflict in CI/CD

**Problem**: CI pipeline intermittently fails because port 5173 is already in use from a parallel job.

**Solution**:

```typescript
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,  // Fail fast instead of silently using another port
  },
})
```

In CI, use environment-specific ports:

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5173,
    strictPort: process.env.CI === 'true',
  },
}))
```

---

## Scenario 10: Browser Console Errors Not Visible in Terminal

**Problem** (Vite 8+ only): Browser runtime errors do not appear in the terminal, making debugging harder when using Claude Code or other AI tools.

**Solution**:

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

**Note**: In Vite 8+, `server.forwardConsole` is auto-enabled when an AI agent is detected. Set it explicitly if auto-detection fails.
