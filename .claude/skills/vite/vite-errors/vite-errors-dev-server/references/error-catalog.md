# Dev Server Error Catalog

Complete reference of Vite dev server error patterns organized by category.

---

## 1. HMR Errors

### ERR-HMR-001: Full Reload Instead of HMR Update

**Symptom**: Console shows `[vite] page reload` instead of `[vite] hot updated` after file save.

**Cause**: The changed module has no HMR boundary. Vite propagates the update up the import chain. If no module in the chain calls `import.meta.hot.accept()`, Vite triggers a full page reload.

**Fix**: Add an HMR boundary in the changed module or in a parent module:

```javascript
// In the module that should handle updates
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // Re-render or apply changes
    }
  })
}
```

**Note**: Framework plugins (Vue, React, Svelte) automatically add HMR boundaries for their component files. This error typically occurs in plain `.js`/`.ts` utility modules.

---

### ERR-HMR-002: HMR Boundary Not Detected (Static Analysis Failure)

**Symptom**: Module has `import.meta.hot.accept()` but Vite still triggers full reload.

**Cause**: Vite uses static text analysis to detect HMR boundaries. It searches for the exact token `import.meta.hot.accept(`. A line break, comment, or extra whitespace between `accept` and `(` breaks detection.

**Fix**:

```javascript
// CORRECT - single token, detected
import.meta.hot.accept((mod) => { /* ... */ })

// CORRECT - callback on next line is fine
import.meta.hot.accept(
  (mod) => { /* ... */ }
)

// BROKEN - line break between accept and (
import.meta.hot.accept
  ((mod) => { /* ... */ })

// BROKEN - comment between accept and (
import.meta.hot.accept /* callback */ ((mod) => {})
```

---

### ERR-HMR-003: WebSocket Connection Failed

**Symptom**: Console error: `WebSocket connection to 'ws://...' failed` or `[vite] server connection lost. Polling for restart...`

**Cause**: The HMR WebSocket cannot connect. Common when behind a reverse proxy, inside Docker, or using a cloud IDE.

**Fix**: Explicitly configure HMR connection parameters:

```javascript
export default defineConfig({
  server: {
    hmr: {
      protocol: 'wss',       // Match proxy protocol
      host: 'my-app.dev',    // External hostname
      clientPort: 443,       // External port (proxy)
    },
  },
})
```

For Docker with host networking:

```javascript
server: {
  hmr: {
    host: '0.0.0.0',
  },
  host: '0.0.0.0',
}
```

---

### ERR-HMR-004: HMR Update Causes Runtime Error

**Symptom**: `[vite] hot updated` appears but the page shows errors or stale state.

**Cause**: The `accept()` callback does not properly re-render or clean up side effects.

**Fix**: Use `dispose()` to clean up and `data` to persist state:

```javascript
if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data.savedState = currentState
    clearInterval(timerId)
  })

  if (import.meta.hot.data.savedState) {
    currentState = import.meta.hot.data.savedState
  }

  import.meta.hot.accept()
}
```

---

### ERR-HMR-005: Circular Import Causes HMR Failure

**Symptom**: HMR update triggers but `newModule` is `undefined` in the accept callback.

**Cause**: Circular imports can cause modules to be evaluated before their dependencies are ready. During HMR, this manifests as undefined module references.

**Fix**: Break the circular dependency, or use `import.meta.hot.invalidate()` to force upward propagation:

```javascript
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (!newModule) {
      import.meta.hot.invalidate('Circular dep detected, forcing reload')
    }
  })
}
```

---

## 2. Proxy Errors

### ERR-PROXY-001: ECONNREFUSED from Proxy

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:3000` in terminal when accessing proxied routes.

**Cause**: The proxy target server is not running, or the target URL is incorrect.

**Fix**: Verify the backend is running and the target includes protocol:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',  // MUST include http://
      changeOrigin: true,
    },
  },
}
```

---

### ERR-PROXY-002: Proxy Returns 404 for Valid Endpoints

**Symptom**: Backend returns 404 even though the endpoint exists when accessed directly.

**Cause**: The `rewrite` function strips too much or too little of the path prefix.

**Fix**: Verify the rewrite function produces the correct backend path:

```javascript
server: {
  proxy: {
    '/api/v1': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      // /api/v1/users -> /users
      rewrite: (path) => path.replace(/^\/api\/v1/, ''),
    },
  },
}
```

Debug by adding a `configure` callback:

```javascript
'/api': {
  target: 'http://localhost:3000',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api/, ''),
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      console.log('Proxying:', req.url, '->', proxyReq.path)
    })
  },
}
```

---

### ERR-PROXY-003: Proxy Does Not Forward Cookies/Auth Headers

**Symptom**: Authentication fails when requests go through the proxy.

**Cause**: Missing `changeOrigin: true` causes the `Host` header to remain as `localhost:5173`, which the backend may reject.

**Fix**:

```javascript
'/api': {
  target: 'http://backend.example.com',
  changeOrigin: true,   // Sets Host header to target
  secure: false,         // Accept self-signed certs on target
  cookieDomainRewrite: 'localhost',  // Rewrite cookie domains
}
```

---

### ERR-PROXY-004: WebSocket Proxy Not Working

**Symptom**: WebSocket connections fail through the proxy even though HTTP requests work.

**Cause**: WebSocket proxying requires explicit `ws: true` flag.

**Fix**:

```javascript
'/socket.io': {
  target: 'ws://localhost:3001',
  ws: true,  // REQUIRED for WebSocket
}
```

---

## 3. Server Startup Errors

### ERR-START-001: EADDRINUSE

**Symptom**: `Error: listen EADDRINUSE: address already in use :::5173`

**Cause**: Another process (often a previous Vite instance) is using port 5173.

**Fix options**:

1. Kill the existing process: `lsof -i :5173` (macOS/Linux) or `netstat -ano | findstr :5173` (Windows)
2. Let Vite auto-increment: `server.strictPort: false` (default behavior)
3. Use a different port: `server.port: 3000`

---

### ERR-START-002: 403 Forbidden on All Requests

**Symptom**: Every request returns 403 Forbidden after upgrading to Vite 6.2+.

**Cause**: `server.allowedHosts` rejects the `Host` header as a DNS rebinding protection.

**Fix**:

```javascript
server: {
  allowedHosts: ['my-app.dev.local'],  // Add your custom domain
}

// Or for development with ngrok/localtunnel:
server: {
  allowedHosts: true,  // Disable check entirely
}
```

---

### ERR-START-003: HTTPS Certificate Errors

**Symptom**: `Error: error:0906D06C:PEM routines` or browser shows `NET::ERR_CERT_INVALID`

**Cause**: Invalid, expired, or missing certificate files.

**Fix** (using mkcert for local development):

```bash
# Install mkcert and generate local certs
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

```javascript
import fs from 'node:fs'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./localhost+2-key.pem'),
      cert: fs.readFileSync('./localhost+2.pem'),
    },
  },
})
```

Or use the Vite plugin for zero-config HTTPS:

```javascript
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl()],
})
```

---

## 4. File System Errors

### ERR-FS-001: "Outside of Vite Serving Allow List"

**Symptom**: `403: The request url "..." is outside of Vite serving allow list.`

**Cause**: `server.fs.strict: true` (default) blocks serving files outside the workspace root. Common in monorepos where shared packages live in parent directories.

**Fix**:

```javascript
import { searchForWorkspaceRoot } from 'vite'

export default defineConfig({
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        '/absolute/path/to/shared/lib',
      ],
    },
  },
})
```

---

### ERR-FS-002: File Changes Not Detected

**Symptom**: Saving files produces no HMR update or rebuild. No activity in terminal.

**Cause**: Chokidar's native `fs.watch` API does not work on network filesystems, Docker bind mounts, or WSL2 cross-filesystem access.

**Fix**:

```javascript
server: {
  watch: {
    usePolling: true,
    interval: 1000,
  },
}
```

---

### ERR-FS-003: Sensitive Files Exposed

**Symptom**: `.env` files or SSL certificates accessible via browser.

**Cause**: Custom `server.fs.deny` overwrites the defaults instead of extending them.

**Fix**: ALWAYS include the defaults when adding custom deny patterns:

```javascript
server: {
  fs: {
    deny: [
      '.env', '.env.*', '*.{crt,pem}', '**/.git/**',  // defaults
      '**/*.secret',  // your additions
    ],
  },
}
```

---

## 5. Module Resolution Errors

### ERR-RESOLVE-001: Alias Not Resolving

**Symptom**: `Failed to resolve import "@/components/Foo"` or similar.

**Cause**: Alias uses relative path instead of absolute path.

**Fix**:

```javascript
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
```

---

### ERR-RESOLVE-002: Dependency Pre-Bundling Stale

**Symptom**: Module works after clean install but breaks after adding new dependencies or switching branches.

**Cause**: Stale pre-bundled dependencies in `node_modules/.vite`.

**Fix**: Force re-bundling:

```bash
# CLI flag
vite --force

# Or in config
optimizeDeps: {
  force: true,  // Remove after the issue is resolved
}
```

Or delete the cache manually:

```bash
rm -rf node_modules/.vite
```

---

### ERR-RESOLVE-003: CommonJS Module Errors in Browser

**Symptom**: `require is not defined` or `module is not defined` in browser console.

**Cause**: A dependency uses CommonJS but was excluded from pre-bundling.

**Fix**: NEVER exclude CommonJS dependencies from optimization:

```javascript
optimizeDeps: {
  include: ['problematic-cjs-package'],  // Force pre-bundling
}
```

---

## 6. Middleware Mode Errors

### ERR-MW-001: SPA Fallback Interferes with Custom Routes

**Symptom**: Custom server routes return the HTML fallback instead of the expected response.

**Cause**: `appType` defaults to `'spa'`, which adds a catch-all HTML fallback middleware.

**Fix**:

```javascript
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',  // Disables HTML fallback
})
```

---

### ERR-MW-002: Static Assets Not Served in Middleware Mode

**Symptom**: CSS, images, and other static assets return 404.

**Cause**: Vite middlewares must be mounted before custom catch-all routes.

**Fix**: Mount `vite.middlewares` BEFORE any wildcard route handler:

```javascript
const app = express()
app.use(vite.middlewares)        // FIRST: Vite handles assets, HMR
app.use('*all', customHandler)   // THEN: Your catch-all
```
