# Vite Review — Good vs Bad Code Examples

Every example is verified against official Vite documentation. Each section shows the WRONG way first, then the CORRECT way.

---

## 1. Configuration

### defineConfig Wrapper

```typescript
// BAD: Raw object export — no type safety, no IDE autocomplete
export default {
  build: { outDir: 'dist' },
}

// GOOD: defineConfig provides full TypeScript support
import { defineConfig } from 'vite'

export default defineConfig({
  build: { outDir: 'dist' },
})
```

### Version-Specific Bundler Options

```typescript
// BAD (v8): Using deprecated rollupOptions
export default defineConfig({
  build: {
    rollupOptions: { external: ['react'] }, // deprecated in v8
  },
})

// GOOD (v8): Using rolldownOptions
export default defineConfig({
  build: {
    rolldownOptions: { external: ['react'] },
  },
})

// GOOD (v6-v7): rollupOptions is correct for these versions
export default defineConfig({
  build: {
    rollupOptions: { external: ['react'] },
  },
})
```

### Version-Specific Transform Config

```typescript
// BAD (v8): Using deprecated esbuild option
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
  },
})

// GOOD (v8): Using oxc option
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'h',
      pragmaFrag: 'Fragment',
    },
  },
})
```

### Environment Variables in Config

```typescript
// BAD: import.meta.env is undefined during config resolution
export default defineConfig({
  define: {
    __API_URL__: import.meta.env.VITE_API_URL, // undefined!
  },
})

// GOOD: Use loadEnv() to access .env variables in config
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },
  }
})
```

### Conditional Config

```typescript
// BAD: Static config when dev/build need different behavior
export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:3000' } },
  build: { sourcemap: true },
})

// GOOD: Function form for command/mode-dependent config
export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    return {
      server: { proxy: { '/api': 'http://localhost:3000' } },
    }
  }
  return {
    build: { sourcemap: mode !== 'production' },
  }
})
```

---

## 2. Plugins

### Factory Function Pattern

```typescript
// BAD: Plain object — cannot accept configuration
export default {
  name: 'my-plugin',
  transform(code) { return code },
}

// GOOD: Factory function with options
export default function myPlugin(options = {}) {
  return {
    name: 'vite-plugin-my-feature',
    transform(code, id) {
      if (options.include && !id.match(options.include)) return null
      return { code, map: null }
    },
  }
}
```

### Storing Resolved Config

```typescript
// BAD: Trying to use resolved config without storing it
export default function myPlugin() {
  return {
    name: 'my-plugin',
    transform(code) {
      // ERROR: 'config' is not defined
      if (config.command === 'serve') { /* ... */ }
    },
  }
}

// GOOD: Store in closure variable via configResolved
export default function myPlugin() {
  let config

  return {
    name: 'my-plugin',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    transform(code) {
      if (config.command === 'serve') { /* ... */ }
    },
  }
}
```

### Virtual Modules

```typescript
// BAD: Missing \0 prefix — other plugins may process this module
export default function myPlugin() {
  return {
    name: 'my-plugin',
    resolveId(id) {
      if (id === 'virtual:config') return 'virtual:config'
    },
    load(id) {
      if (id === 'virtual:config') return 'export default {}'
    },
  }
}

// GOOD: Proper virtual module conventions
export default function myPlugin() {
  const virtualId = 'virtual:config'
  const resolvedId = '\0' + virtualId

  return {
    name: 'my-plugin',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id === resolvedId) return 'export default {}'
    },
  }
}
```

### Post-Middleware in configureServer

```typescript
// BAD: Middleware runs BEFORE Vite's internal middlewares
export default function myPlugin() {
  return {
    name: 'my-plugin',
    configureServer(server) {
      // This runs before Vite's HTML fallback — custom routes may not work
      server.middlewares.use((req, res, next) => {
        if (req.url === '/custom') { res.end('custom page') }
        else { next() }
      })
    },
  }
}

// GOOD: Return function to run AFTER internal middlewares
export default function myPlugin() {
  return {
    name: 'my-plugin',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/custom') { res.end('custom page') }
          else { next() }
        })
      }
    },
  }
}
```

### moduleType in v8

```typescript
// BAD (v8): Missing moduleType for non-JS content
export default function cssToJsPlugin() {
  return {
    name: 'css-to-js',
    transform(code, id) {
      if (id.endsWith('.css')) {
        return { code: `export default ${JSON.stringify(code)}` }
        // Rolldown cannot determine module type
      }
    },
  }
}

// GOOD (v8): Set moduleType explicitly
export default function cssToJsPlugin() {
  return {
    name: 'css-to-js',
    transform(code, id) {
      if (id.endsWith('.css')) {
        return {
          code: `export default ${JSON.stringify(code)}`,
          moduleType: 'js',
        }
      }
    },
  }
}
```

---

## 3. HMR

### import.meta.hot Guard

```typescript
// BAD: HMR code ships to production
import.meta.hot.accept(() => {
  console.log('updated')
})

// GOOD: Guard enables tree-shaking in production
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('updated')
  })
}
```

### accept() Whitespace

```typescript
// BAD: Space before parenthesis breaks Vite's static analysis
if (import.meta.hot) {
  import.meta.hot.accept ((mod) => { /* ... */ })
  //                     ^ space here breaks HMR detection
}

// GOOD: No space between accept and parenthesis
if (import.meta.hot) {
  import.meta.hot.accept((mod) => { /* ... */ })
}
```

### hot.data Mutation

```typescript
// BAD: Reassigning hot.data is not supported
if (import.meta.hot) {
  import.meta.hot.data = { count: 0 }  // silently fails
}

// GOOD: Mutate individual properties
if (import.meta.hot) {
  import.meta.hot.data.count = import.meta.hot.data.count ?? 0
}
```

### accept() Before invalidate()

```typescript
// BAD: invalidate() without accept() — no HMR boundary
if (import.meta.hot) {
  import.meta.hot.invalidate('cannot handle update')
  // No boundary established — invalidate has no effect
}

// GOOD: accept() establishes boundary, invalidate() propagates when needed
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (!canHandleUpdate(newModule)) {
      import.meta.hot.invalidate('schema changed, full reload needed')
    }
  })
}
```

### Cleanup with dispose()

```typescript
// BAD: Timer leaks across HMR updates
const timer = setInterval(() => { tick() }, 1000)

// GOOD: Clean up on module replacement
const timer = setInterval(() => { tick() }, 1000)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(timer)
  })
}
```

### Full HMR Pattern with State Preservation

```typescript
// GOOD: Complete HMR pattern with state persistence
let state = { count: 0 }

// Restore state from previous module version
if (import.meta.hot?.data.state) {
  state = import.meta.hot.data.state
}

function render() {
  document.getElementById('app').textContent = `Count: ${state.count}`
}

render()

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      newModule.render?.()
    }
  })

  import.meta.hot.dispose((data) => {
    data.state = state  // Preserve state for next version
  })
}

export { render }
```

---

## 4. Environment Variables

### Client-Side Access

```bash
# BAD: Non-prefixed variable — undefined in client code
API_KEY=secret123

# GOOD: VITE_ prefix for client-visible variables
VITE_API_URL=https://api.example.com

# GOOD: Non-prefixed for server-only secrets
DATABASE_URL=postgres://localhost/mydb
SECRET_KEY=sk_live_abc123
```

### TypeScript Declarations

```typescript
// BAD: No type safety for env vars
const url = import.meta.env.VITE_API_URL  // type: any

// GOOD: Declare in src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Secrets in VITE_ Variables

```bash
# BAD: Secret exposed to every browser user
VITE_STRIPE_SECRET=sk_live_abc123
VITE_DB_PASSWORD=admin123

# GOOD: Secrets never have VITE_ prefix
STRIPE_SECRET=sk_live_abc123
DB_PASSWORD=admin123
VITE_STRIPE_PUBLIC=pk_live_xyz789  # public key is OK
```

---

## 5. Build

### Library Mode Complete Example

```typescript
// BAD: Missing name for UMD, no externals
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'umd'],
      // Missing name — UMD build fails!
    },
    // Missing externals — Vue bundled into library
  },
})

// GOOD: Complete library mode config
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'MyLib',
      fileName: 'my-lib',
      formats: ['es', 'umd'],
    },
    rolldownOptions: {  // v8; use rollupOptions for v6-v7
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
```

### Package.json Exports

```json
{
  "name": "my-lib",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-lib.umd.cjs",
  "module": "./dist/my-lib.js",
  "exports": {
    ".": {
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.umd.cjs"
    },
    "./style.css": "./dist/my-lib.css"
  }
}
```

### Sourcemap Configuration

```typescript
// BAD: Sourcemaps publicly accessible
export default defineConfig({
  build: {
    sourcemap: true,  // .map files deployed with your app
  },
})

// GOOD: Hidden sourcemaps for error tracking services
export default defineConfig({
  build: {
    sourcemap: 'hidden',  // generates .map files but no //# sourceMappingURL
  },
})
```

---

## 6. SSR

### Middleware Mode Setup

```typescript
// BAD: Missing appType with middleware mode
const vite = await createServer({
  server: { middlewareMode: true },
  // appType defaults to 'spa' — SPA fallback conflicts with SSR routes
})

// GOOD: Custom appType for middleware mode
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
})
```

### SSR Error Handling

```typescript
// BAD: Stack traces point to transformed code
app.use('*all', async (req, res, next) => {
  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.js')
    const html = await render(req.url)
    res.end(html)
  } catch (e) {
    next(e)  // Stack trace is unreadable
  }
})

// GOOD: Fix stack traces before handling
app.use('*all', async (req, res, next) => {
  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.js')
    const html = await render(req.url)
    res.end(html)
  } catch (e) {
    vite.ssrFixStacktrace(e)
    next(e)
  }
})
```

### SSR Conditional Logic

```typescript
// BAD: typeof window check — unreliable in edge runtimes
if (typeof window === 'undefined') {
  // server code — but edge workers have partial window objects
}

// GOOD: import.meta.env.SSR — statically replaced, tree-shakeable
if (import.meta.env.SSR) {
  // server-only code — dead-code eliminated in client build
}
```

---

## 7. Security

### envPrefix Security

```typescript
// BAD: Empty prefix exposes ALL env vars to client
export default defineConfig({
  envPrefix: '',  // DB_PASSWORD, SECRET_KEY visible in browser!
})

// GOOD: Default VITE_ prefix or custom non-empty prefix
export default defineConfig({
  envPrefix: 'PUBLIC_',  // Only PUBLIC_* vars exposed
})
```

### Filesystem Restriction

```typescript
// BAD: Disabling fs restriction without reason
export default defineConfig({
  server: {
    fs: { strict: false },  // Any file on machine accessible via dev server
  },
})

// GOOD: Keep strict mode, allow specific directories if needed
export default defineConfig({
  server: {
    fs: {
      strict: true,
      allow: ['/path/to/shared-assets'],
    },
  },
})
```

### Allowed Hosts

```typescript
// BAD: Server exposed to network without host restriction
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Listens on all interfaces
    // No allowedHosts — DNS rebinding possible
  },
})

// GOOD: Restrict allowed hosts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['myapp.local', 'dev.myapp.com'],
  },
})
```
