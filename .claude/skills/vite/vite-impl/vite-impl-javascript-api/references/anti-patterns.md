# Anti-Patterns — Vite Programmatic JavaScript API

## AP-001: Forgetting to Call listen() After createServer()

**WRONG:**

```typescript
import { createServer } from 'vite'

const server = await createServer({ server: { port: 3000 } })
// Server is NOT listening — no requests are handled
server.printUrls()  // URLs are null
```

**CORRECT:**

```typescript
import { createServer } from 'vite'

const server = await createServer({ server: { port: 3000 } })
await server.listen()  // ALWAYS call listen() to start accepting connections
server.printUrls()
```

**Why:** `createServer()` only creates and configures the server instance. It does NOT bind to a port or start accepting connections. `resolvedUrls` is `null` until `listen()` completes.

---

## AP-002: Not Closing the Server on Shutdown

**WRONG:**

```typescript
const server = await createServer({ /* config */ })
await server.listen()
// Process exits without closing — file watchers and sockets leak
```

**CORRECT:**

```typescript
const server = await createServer({ /* config */ })
await server.listen()

process.on('SIGTERM', async () => {
  await server.close()
  process.exit(0)
})
```

**Why:** `ViteDevServer` holds file watchers (Chokidar), HTTP connections, and WebSocket handles. Failing to call `close()` leaks these resources. In long-running processes or test suites, this causes file descriptor exhaustion.

---

## AP-003: Mixing Modes in createServer + build

**WRONG:**

```typescript
// Dev server defaults to mode='development'
const server = await createServer({})

// Build defaults to mode='production'
await build({})
// NODE_ENV is now inconsistent — plugins may behave unpredictably
```

**CORRECT:**

```typescript
process.env.NODE_ENV = 'production'

const server = await createServer({ mode: 'production' })
await build({ mode: 'production' })
await server.close()
```

**Why:** When `createServer()` and `build()` run in the same Node.js process, they share `process.env.NODE_ENV`. The first call sets it, and the second may conflict. ALWAYS set `mode` explicitly and consistently for both.

---

## AP-004: Using mergeConfig with isRoot=true for Nested Options

**WRONG:**

```typescript
import { mergeConfig } from 'vite'

const baseBuild = { outDir: 'dist', minify: true }
const overrideBuild = { outDir: 'build' }

// isRoot defaults to true — treats these as root-level configs
const merged = mergeConfig(baseBuild, overrideBuild)
// May produce unexpected results for nested structures
```

**CORRECT:**

```typescript
import { mergeConfig } from 'vite'

const baseBuild = { outDir: 'dist', minify: true }
const overrideBuild = { outDir: 'build' }

// ALWAYS pass isRoot=false when merging nested config subsections
const merged = mergeConfig(baseBuild, overrideBuild, false)
// Result: { outDir: 'build', minify: true }
```

**Why:** `mergeConfig` with `isRoot=true` applies root-level merging logic (e.g., special handling of `plugins` arrays). When merging nested subsections like `build`, `server`, or `css`, ALWAYS pass `isRoot=false` to get correct deep-merge behavior.

---

## AP-005: Using transformWithEsbuild on Vite 8+

**WRONG:**

```typescript
import { transformWithEsbuild } from 'vite'

// Deprecated in Vite 8+ — uses a compatibility shim
const result = await transformWithEsbuild(code, 'file.ts', { loader: 'ts' })
```

**CORRECT:**

```typescript
import { transformWithOxc } from 'vite'

// Use the current transform API
const result = await transformWithOxc(code, 'file.ts')
```

**Why:** Vite 8+ uses OXC as its transform engine (replacing esbuild). `transformWithEsbuild` is deprecated and may be removed in future versions. ALWAYS use `transformWithOxc` for new code targeting Vite 8+.

---

## AP-006: Accessing resolvedUrls Before listen()

**WRONG:**

```typescript
const server = await createServer({ /* config */ })
console.log(server.resolvedUrls.local)  // null — server not listening yet
```

**CORRECT:**

```typescript
const server = await createServer({ /* config */ })
await server.listen()
console.log(server.resolvedUrls.local)  // ['http://localhost:5173/']
```

**Why:** `resolvedUrls` is populated only after the HTTP server starts listening and the port is resolved. Accessing it before `listen()` returns `null`.

---

## AP-007: Loading All Env Variables Without Understanding Prefixes

**WRONG:**

```typescript
import { loadEnv } from 'vite'

// Loads ONLY VITE_ prefixed variables — misses DATABASE_URL, SECRET_KEY
const env = loadEnv('production', process.cwd())
console.log(env.DATABASE_URL)  // undefined
```

**CORRECT (when you need all variables):**

```typescript
import { loadEnv } from 'vite'

// Pass empty string to load ALL variables
const env = loadEnv('production', process.cwd(), '')
console.log(env.DATABASE_URL)  // loaded

// Or pass specific prefixes
const env = loadEnv('production', process.cwd(), ['VITE_', 'DB_'])
```

**Why:** `loadEnv` defaults to the `'VITE_'` prefix. Variables without this prefix are filtered out. Pass `''` to load all variables or an array of prefixes for selective loading. Be cautious with `''` in client-side code as it may expose secrets.

---

## AP-008: Not Using configFile: false for Fully Programmatic Setups

**WRONG:**

```typescript
const server = await createServer({
  root: '/my/project',
  server: { port: 3000 },
  // A vite.config.ts in /my/project will be auto-loaded and MERGED
  // This may override your programmatic settings
})
```

**CORRECT:**

```typescript
const server = await createServer({
  configFile: false,  // ALWAYS set when you want zero config file influence
  root: '/my/project',
  server: { port: 3000 },
})
```

**Why:** By default, Vite auto-resolves `vite.config.{ts,js,mjs,cjs}` in the root directory and merges it with inline config. If you are providing a complete programmatic configuration, ALWAYS set `configFile: false` to prevent unexpected config merging.

---

## AP-009: Calling ssrLoadModule Without Error Handling

**WRONG:**

```typescript
const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
const html = await render(url)
// Stack traces point to bundled code — unreadable
```

**CORRECT:**

```typescript
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
  const html = await render(url)
} catch (e) {
  vite.ssrFixStacktrace(e)  // Fix stack trace to show original source locations
  console.error(e)
  throw e
}
```

**Why:** SSR errors have stack traces pointing to Vite's transformed modules. Without `ssrFixStacktrace()`, error messages reference virtual file paths and transformed line numbers that are impossible to debug.

---

## AP-010: Using resolveConfig with Wrong Command Parameter

**WRONG:**

```typescript
import { resolveConfig } from 'vite'

// Using 'build' command for a preview scenario
const config = await resolveConfig({}, 'build', 'production', 'production', true)
```

**CORRECT:**

```typescript
import { resolveConfig } from 'vite'

// Use 'serve' for BOTH dev and preview — 'build' is ONLY for production builds
const config = await resolveConfig({}, 'serve', 'production', 'production', true)
```

**Why:** The `command` parameter is `'serve'` for both dev server and preview scenarios. Using `'build'` changes how plugins with `apply: 'build'` or `apply: 'serve'` are activated, leading to missing or incorrect plugin behavior.
