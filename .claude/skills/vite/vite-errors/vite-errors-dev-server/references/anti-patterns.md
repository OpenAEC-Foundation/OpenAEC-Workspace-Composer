# Dev Server Anti-Patterns

Configuration mistakes and bad practices that cause Vite dev server problems. Each anti-pattern includes the wrong approach, why it fails, and the correct alternative.

---

## AP-001: Disabling server.fs.strict to Fix Allow List Errors

**WRONG**:

```javascript
server: {
  fs: {
    strict: false,  // "Just turn it off"
  },
}
```

**Why it fails**: `server.fs.strict` is a security boundary that prevents the dev server from serving arbitrary files (like `/etc/passwd` or `.env` files) to the browser. Disabling it exposes the entire filesystem.

**CORRECT**: Add specific directories to the allow list:

```javascript
import { searchForWorkspaceRoot } from 'vite'

server: {
  fs: {
    allow: [
      searchForWorkspaceRoot(process.cwd()),
      '/specific/path/to/shared/code',
    ],
  },
}
```

---

## AP-002: Using Relative Paths in Aliases

**WRONG**:

```javascript
resolve: {
  alias: {
    '@': './src',
    '@components': './src/components',
  },
}
```

**Why it fails**: Relative paths resolve from the config file's location, which may differ from expectations — especially in monorepos, workspaces, or when `root` is configured. This causes intermittent "module not found" errors.

**CORRECT**: ALWAYS use absolute paths:

```javascript
import path from 'node:path'

resolve: {
  alias: {
    '@': path.resolve(import.meta.dirname, './src'),
    '@components': path.resolve(import.meta.dirname, './src/components'),
  },
}
```

---

## AP-003: Omitting changeOrigin in Proxy Config

**WRONG**:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://api.example.com',
      rewrite: (path) => path.replace(/^\/api/, ''),
      // Missing changeOrigin!
    },
  },
}
```

**Why it fails**: Without `changeOrigin: true`, the proxied request sends `Host: localhost:5173` to the target server. Most backend servers check the `Host` header for routing, virtual hosting, or security. The request either fails or routes to the wrong service.

**CORRECT**:

```javascript
'/api': {
  target: 'http://api.example.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api/, ''),
}
```

---

## AP-004: Omitting Protocol in Proxy Target

**WRONG**:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'localhost:3000',  // Missing http://
    },
  },
}
```

**Why it fails**: The proxy library interprets the target as a path, not a URL. This causes `ECONNREFUSED` or routes all requests to the wrong destination.

**CORRECT**:

```javascript
'/api': {
  target: 'http://localhost:3000',
}
```

---

## AP-005: Using Middleware Mode Without appType: 'custom'

**WRONG**:

```javascript
const vite = await createServer({
  server: { middlewareMode: true },
  // Missing appType!
})
```

**Why it fails**: Without `appType: 'custom'`, Vite adds its default SPA fallback middleware. This intercepts requests that should go to your custom server routes, returning `index.html` instead of API responses or server-rendered content.

**CORRECT**:

```javascript
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
})
```

---

## AP-006: Adding Framework Extensions to resolve.extensions

**WRONG**:

```javascript
resolve: {
  extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.svelte'],
}
```

**Why it fails**: Framework plugins (e.g., `@vitejs/plugin-vue`) handle their own file resolution. Adding `.vue` or `.svelte` to `resolve.extensions` causes double-resolution, slower module resolution, and can lead to incorrect file being picked up when files share a base name.

**CORRECT**: Leave `resolve.extensions` at default. Framework plugins handle their own extensions automatically.

---

## AP-007: Setting envPrefix to Empty String

**WRONG**:

```javascript
envPrefix: '',
```

**Why it fails**: This exposes ALL environment variables (including `DB_PASSWORD`, `JWT_SECRET`, `AWS_SECRET_KEY`) to client-side code via `import.meta.env`. These variables are embedded in the JavaScript bundle and visible to anyone inspecting the page source.

**CORRECT**: Keep the default `VITE_` prefix or use a custom prefix:

```javascript
envPrefix: 'VITE_',  // default
// or
envPrefix: 'PUBLIC_',
```

---

## AP-008: Excluding CommonJS Dependencies from Pre-Bundling

**WRONG**:

```javascript
optimizeDeps: {
  exclude: ['some-cjs-library'],
}
```

**Why it fails**: Vite serves code as native ESM during development. If a CommonJS dependency is excluded from pre-bundling, the browser receives `require()` calls that it cannot execute, resulting in `require is not defined` errors.

**CORRECT**: NEVER exclude CommonJS dependencies. If anything, force their inclusion:

```javascript
optimizeDeps: {
  include: ['some-cjs-library'],
}
```

Only exclude ESM-only packages that you want to bypass pre-bundling for (e.g., for debugging).

---

## AP-009: Mounting Custom Middleware Before Vite Middleware

**WRONG**:

```javascript
const app = express()
app.use('*', myCustomHandler)   // Catches everything first
app.use(vite.middlewares)        // Vite never gets requests
```

**Why it fails**: Express processes middleware in order. If a catch-all handler runs first, Vite's middleware for HMR, static assets, and module transforms never executes. HMR breaks, CSS fails to load, and the dev experience is completely broken.

**CORRECT**: ALWAYS mount Vite middleware first:

```javascript
const app = express()
app.use(vite.middlewares)        // Vite handles assets, HMR, transforms
app.use('/api', apiRouter)       // API routes
app.use('*all', myCustomHandler) // Catch-all LAST
```

---

## AP-010: Hardcoding HMR Port Behind Reverse Proxy

**WRONG**:

```javascript
server: {
  hmr: {
    port: 5173,  // This is the SERVER port, not what the CLIENT needs
  },
}
```

**Why it fails**: When behind a reverse proxy (nginx, Caddy), the client browser connects to the proxy port (e.g., 443), not the internal Vite port. Setting only `port` tells Vite's server which port to use, but the client still tries to connect to the wrong port.

**CORRECT**: Set `clientPort` for the browser:

```javascript
server: {
  hmr: {
    protocol: 'wss',
    host: 'myapp.dev',
    clientPort: 443,   // What the BROWSER connects to
  },
}
```

---

## AP-011: Using usePolling Everywhere

**WRONG**:

```javascript
server: {
  watch: {
    usePolling: true,  // "Works everywhere!"
  },
}
```

**Why it fails**: Polling uses significantly more CPU than native file watching. With `interval: 100` (default) on a project with thousands of files, polling can consume 5-15% CPU continuously. This degrades battery life on laptops and wastes resources on servers.

**CORRECT**: Only enable polling when native file watching is broken (Docker, WSL2, network filesystems):

```javascript
server: {
  watch: {
    usePolling: process.env.DOCKER === 'true',
    interval: 1000,  // If polling, use a longer interval
  },
}
```

---

## AP-012: Overwriting server.fs.deny Defaults

**WRONG**:

```javascript
server: {
  fs: {
    deny: ['**/*.secret'],  // REPLACES defaults, .env files now exposed!
  },
}
```

**Why it fails**: Setting `deny` replaces the default list (`['.env', '.env.*', '*.{crt,pem}', '**/.git/**']`). Your `.env` files and SSL certificates become accessible via the dev server.

**CORRECT**: Include the defaults when adding custom patterns:

```javascript
server: {
  fs: {
    deny: [
      '.env', '.env.*', '*.{crt,pem}', '**/.git/**',  // Keep defaults
      '**/*.secret',  // Add custom
    ],
  },
}
```

---

## AP-013: Setting cors: true for Production Preview

**WRONG**:

```javascript
// vite.config.ts used for both dev and preview
server: {
  cors: true,  // Any origin allowed
},
preview: {
  cors: true,  // Any origin allowed in preview too
},
```

**Why it fails**: The preview server (`vite preview`) serves production-built files. Setting `cors: true` allows any website to make requests to your preview server, which may expose API responses or static content. While preview is not a production server, it is often deployed to staging environments.

**CORRECT**: Configure specific origins:

```javascript
server: {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8080'],
  },
},
preview: {
  cors: {
    origin: 'https://staging.example.com',
  },
},
```

---

## AP-014: Ignoring optimizeDeps Cache Issues

**WRONG**: After adding a new dependency, restarting `vite dev` without clearing the cache and wondering why the dependency is not available or throws errors.

**Why it fails**: Vite caches pre-bundled dependencies in `node_modules/.vite`. When the dependency graph changes (new packages, version changes, branch switches), the cache may become stale and serve outdated or incompatible bundles.

**CORRECT**: Use `--force` flag or force option:

```bash
vite --force
```

Or clear manually:

```bash
rm -rf node_modules/.vite
```

Vite re-bundles automatically when `package-lock.json`/`pnpm-lock.yaml` changes, but branch switches and manual `node_modules` edits may not trigger re-bundling.

---

## AP-015: Reassigning import.meta.hot.data

**WRONG**:

```javascript
if (import.meta.hot) {
  import.meta.hot.data = { count: 0 }  // Reassignment — BROKEN
}
```

**Why it fails**: `import.meta.hot.data` is a persistent object that survives across HMR updates. Reassigning it replaces the reference, losing all previously stored state. Vite does not support full reassignment of this object.

**CORRECT**: Mutate individual properties:

```javascript
if (import.meta.hot) {
  import.meta.hot.data.count = import.meta.hot.data.count ?? 0
  import.meta.hot.data.count++
}
```
