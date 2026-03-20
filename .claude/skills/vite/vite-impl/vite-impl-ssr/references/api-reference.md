# SSR API Reference

## ViteDevServer SSR Methods

### ssrLoadModule()

Transforms and loads an ESM module for server-side execution without bundling. Provides HMR-like invalidation during development.

```typescript
ssrLoadModule(
  url: string,
  options?: { fixStacktrace?: boolean },
): Promise<Record<string, any>>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | YES | Module path relative to project root (e.g., `/src/entry-server.js`) |
| `options.fixStacktrace` | `boolean` | NO | Automatically fix stack traces for errors thrown during module execution |

**Returns:** `Promise<Record<string, any>>` -- the module's exported members.

**Usage:**

```javascript
// Development only
const { render } = await vite.ssrLoadModule('/src/entry-server.js')
const html = await render(url)
```

```javascript
// With automatic stack trace fixing
const mod = await vite.ssrLoadModule('/src/entry-server.js', {
  fixStacktrace: true,
})
```

**Behavior:**
- Transforms ESM source code to Node.js-compatible format
- Does NOT bundle -- each module is loaded individually
- Applies Vite plugin transforms (TypeScript, JSX, CSS modules, etc.)
- Invalidates modules on file change for HMR-like development experience
- ALWAYS prefix the path with `/` to indicate project root-relative

---

### ssrFixStacktrace()

Maps error stack traces from transformed code back to original source file locations.

```typescript
ssrFixStacktrace(e: Error): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `e` | `Error` | YES | The caught error object (mutated in place) |

**Returns:** `void` -- modifies the error's stack trace in place.

**Usage:**

```javascript
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.js')
  const html = await render(url)
} catch (e) {
  vite.ssrFixStacktrace(e)
  console.error(e) // Stack trace now points to original source
  next(e)
}
```

**Behavior:**
- Mutates the error object's `stack` property in place
- Maps transformed file positions back to original source positions using source maps
- ALWAYS call this before logging or forwarding errors in development SSR

---

### transformIndexHtml()

Applies Vite's HTML transform plugins to the template string.

```typescript
transformIndexHtml(
  url: string,
  html: string,
  originalUrl?: string,
): Promise<string>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | YES | The request URL being served |
| `html` | `string` | YES | The raw HTML template string |
| `originalUrl` | `string` | NO | The original URL before rewrites |

**Returns:** `Promise<string>` -- the transformed HTML with Vite's client script injected and plugin transforms applied.

**Usage in SSR dev server:**

```javascript
let template = fs.readFileSync(
  path.resolve(import.meta.dirname, 'index.html'),
  'utf-8',
)
template = await vite.transformIndexHtml(url, template)
```

---

## SSR Config Options

### ssr.noExternal

Forces dependencies through Vite's transformation pipeline instead of externalizing them.

```typescript
ssr: {
  noExternal: string[] | RegExp[] | true
}
```

| Value | Effect |
|-------|--------|
| `string[]` | Specific packages to transform (e.g., `['@my-org/ui']`) |
| `RegExp[]` | Pattern-matched packages to transform |
| `true` | Bundle ALL dependencies (required for webworker targets) |

**When to use:**
- Dependencies that contain untransformed ESM, JSX, CSS imports, or other code requiring Vite processing
- ALWAYS set to `true` when `ssr.target` is `'webworker'`

---

### ssr.external

Explicitly externalizes dependencies that would otherwise be processed by Vite.

```typescript
ssr: {
  external: string[]
}
```

**When to use:**
- Linked/monorepo packages that should NOT go through Vite's transform
- Dependencies that cause issues when bundled

---

### ssr.target

Specifies the SSR runtime environment, affecting module resolution and output format.

```typescript
ssr: {
  target: 'node' | 'webworker'
}
```

| Value | Runtime | Default |
|-------|---------|---------|
| `'node'` | Node.js server | YES |
| `'webworker'` | Cloudflare Workers, Deno Deploy, edge runtimes | NO |

**When `'webworker'`:**
- Node.js built-in modules are NOT externalized
- ALWAYS also set `ssr.noExternal: true`

---

### ssr.resolve.conditions

Override `resolve.conditions` specifically for SSR builds.

```typescript
ssr: {
  resolve: {
    conditions: string[]
  }
}
```

Controls which export conditions in `package.json` `exports` field are used during SSR module resolution. Defaults to the root `resolve.conditions` value.

---

### ssr.resolve.externalConditions

Additional export conditions applied when resolving externalized SSR dependencies.

```typescript
ssr: {
  resolve: {
    externalConditions: string[]
  }
}
```

These conditions are added on top of the normal resolution conditions for dependencies that remain external (not processed by Vite).

---

## import.meta.env.SSR

Boolean flag that is `true` during SSR execution and `false` in the client bundle.

```typescript
import.meta.env.SSR: boolean
```

**Behavior:**
- Statically replaced at build time (not a runtime check)
- Enables dead code elimination / tree-shaking
- Available in both development and production

```javascript
// Server-only code
if (import.meta.env.SSR) {
  const data = await fetchFromDatabase()
}

// Client-only code
if (!import.meta.env.SSR) {
  document.addEventListener('click', handler)
}
```
