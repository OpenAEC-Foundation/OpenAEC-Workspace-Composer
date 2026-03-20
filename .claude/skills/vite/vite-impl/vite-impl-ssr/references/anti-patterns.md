# SSR Anti-Patterns

## AP-001: Using ssrLoadModule in Production

**NEVER** use `vite.ssrLoadModule()` in production.

```javascript
// WRONG: ssrLoadModule is a dev-only API
const { render } = await vite.ssrLoadModule('/src/entry-server.js')
```

```javascript
// CORRECT: import the pre-built server bundle in production
const { render } = await import('./dist/server/entry-server.js')
```

**Why:** `ssrLoadModule` creates a Vite dev server instance, transforms modules on-the-fly, and is not optimized for production performance. It adds startup overhead and memory usage that is unnecessary when a pre-built bundle exists.

---

## AP-002: Reading Root index.html in Production

**NEVER** read `index.html` from the project root in production.

```javascript
// WRONG: root index.html has unprocessed asset references
const template = fs.readFileSync('index.html', 'utf-8')
```

```javascript
// CORRECT: dist/client/index.html has hashed asset URLs
const template = fs.readFileSync('dist/client/index.html', 'utf-8')
```

**Why:** The root `index.html` references source files like `/src/entry-client.js`. In production, the client build outputs `dist/client/index.html` with correct hashed asset URLs (e.g., `/assets/entry-client-a1b2c3.js`). Using the root template results in 404 errors for all client assets.

---

## AP-003: Forgetting appType: 'custom'

**NEVER** omit `appType: 'custom'` when using Vite in middleware mode for SSR.

```javascript
// WRONG: Vite injects its own HTML handling
const vite = await createViteServer({
  server: { middlewareMode: true },
})
```

```javascript
// CORRECT: custom appType prevents HTML middleware conflicts
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
})
```

**Why:** Without `appType: 'custom'`, Vite adds its own HTML serving middleware that intercepts requests and conflicts with your SSR route handler. This causes the raw `index.html` to be served instead of the server-rendered HTML.

---

## AP-004: Forgetting ssrFixStacktrace in Error Handler

**NEVER** skip `ssrFixStacktrace()` in the development error handler.

```javascript
// WRONG: stack traces point to transformed/virtual files
catch (e) {
  console.error(e)
  next(e)
}
```

```javascript
// CORRECT: stack traces point to original source files
catch (e) {
  vite.ssrFixStacktrace(e)
  console.error(e)
  next(e)
}
```

**Why:** Vite transforms source files (TypeScript, JSX, etc.) before executing them in Node.js. Without `ssrFixStacktrace()`, error stack traces reference the transformed code with wrong line numbers, making debugging extremely difficult.

---

## AP-005: Using ssr.noExternal: true for Node.js Targets

**NEVER** set `ssr.noExternal: true` for Node.js SSR targets without a specific reason.

```javascript
// WRONG: unnecessarily bundles all dependencies
export default defineConfig({
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
```

```javascript
// CORRECT: only transform dependencies that need it
export default defineConfig({
  ssr: {
    noExternal: ['specific-esm-package', '@my-org/ui'],
  },
})
```

**Why:** Node.js can import `node_modules` directly at runtime. Bundling all dependencies increases build time, bundle size, and can cause issues with native modules or packages that expect to be loaded from `node_modules`. Only use `noExternal: true` for webworker targets where runtime `require()` is unavailable.

---

## AP-006: Missing ssr.noExternal: true for Webworker Targets

**ALWAYS** set `ssr.noExternal: true` when `ssr.target` is `'webworker'`.

```javascript
// WRONG: webworker cannot resolve external modules at runtime
export default defineConfig({
  ssr: {
    target: 'webworker',
  },
})
```

```javascript
// CORRECT: bundle everything for webworker environments
export default defineConfig({
  ssr: {
    target: 'webworker',
    noExternal: true,
  },
})
```

**Why:** Webworker environments (Cloudflare Workers, Deno Deploy) do not have access to `node_modules` at runtime. All dependencies must be bundled into the output. Without `noExternal: true`, the build produces `import` statements that fail at runtime.

---

## AP-007: Not Guarding Vite Dev Server Behind Environment Check

**NEVER** create the Vite dev server unconditionally in a combined dev/prod server file.

```javascript
// WRONG: creates Vite server even in production
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
})
app.use(vite.middlewares)
```

```javascript
// CORRECT: only create in development
let vite
if (!isProduction) {
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })
  app.use(vite.middlewares)
} else {
  app.use(express.static('dist/client', { index: false }))
}
```

**Why:** The Vite dev server watches files, maintains a module graph, and runs a WebSocket server for HMR. Creating it in production wastes memory and CPU, and the `vite` package may not even be installed (it should be a devDependency).

---

## AP-008: Using options.ssr Without Optional Chaining

**NEVER** access `options.ssr` directly in plugin hooks.

```javascript
// WRONG: options may be undefined
transform(code, id, options) {
  if (options.ssr) { /* ... */ }
}
```

```javascript
// CORRECT: use optional chaining
transform(code, id, options) {
  if (options?.ssr) { /* ... */ }
}
```

**Why:** The `options` parameter in plugin hooks may be `undefined` in certain contexts. Accessing `.ssr` on `undefined` throws a TypeError that crashes the build process.

---

## AP-009: Keeping "dev": "vite" with SSR

**ALWAYS** change the dev script when implementing SSR.

```json
// WRONG: default Vite dev server does not handle SSR
{
  "scripts": {
    "dev": "vite"
  }
}
```

```json
// CORRECT: custom server handles SSR rendering
{
  "scripts": {
    "dev": "node server"
  }
}
```

**Why:** The default `vite` command starts the standard dev server which serves `index.html` directly without server-side rendering. The custom `server.js` creates Vite in middleware mode and runs your SSR logic for every request.

---

## AP-010: Forgetting transformIndexHtml in Development

**NEVER** skip `vite.transformIndexHtml()` when serving HTML in development SSR.

```javascript
// WRONG: HTML lacks Vite's client script injection
let template = fs.readFileSync('index.html', 'utf-8')
const html = template.replace('<!--ssr-outlet-->', appHtml)
```

```javascript
// CORRECT: Vite injects HMR client and applies plugin transforms
let template = fs.readFileSync('index.html', 'utf-8')
template = await vite.transformIndexHtml(url, template)
const html = template.replace('<!--ssr-outlet-->', appHtml)
```

**Why:** `transformIndexHtml` injects Vite's HMR client script (`/@vite/client`), applies `transformIndexHtml` plugin hooks, and resolves module paths. Without it, HMR does not work and plugin HTML transforms are skipped.
