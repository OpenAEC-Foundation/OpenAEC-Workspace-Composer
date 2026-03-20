# Vite Plugin Hooks -- Complete Reference

## Vite-Specific Hooks

### `config`

**Kind:** async, sequential
**Called:** Before Vite config is resolved

```ts
config(
  config: UserConfig,
  env: { mode: string; command: 'build' | 'serve' }
): UserConfig | null | void | Promise<UserConfig | null | void>
```

- Return a partial `UserConfig` to merge with existing config (recommended)
- Or mutate the `config` parameter directly
- NEVER inject plugins here -- user plugins resolve BEFORE this hook runs

---

### `configResolved`

**Kind:** async, parallel
**Called:** After Vite config is fully resolved

```ts
configResolved(
  config: ResolvedConfig
): void | Promise<void>
```

- Use to read and store the final resolved config
- ALWAYS store in a closure variable for use in other hooks
- `config.command` is `'serve'` (dev/preview) or `'build'`

---

### `configureServer`

**Kind:** async, sequential
**Called:** Dev server setup (NOT called during production build)

```ts
configureServer(
  server: ViteDevServer
): (() => void) | void | Promise<(() => void) | void>
```

- Add custom middleware via `server.middlewares.use()`
- Return a function to add **post-middleware** (runs after Vite internal middlewares)
- Store `server` reference for use in other hooks (e.g., `transform`)
- Access WebSocket server via `server.ws` for client-server communication

**ViteDevServer key properties:**

```ts
interface ViteDevServer {
  config: ResolvedConfig
  middlewares: Connect.Server
  httpServer: http.Server | null
  watcher: FSWatcher
  ws: WebSocketServer
  pluginContainer: PluginContainer
  moduleGraph: ModuleGraph
  resolvedUrls: ResolvedServerUrls | null
  transformRequest(url: string, options?: TransformOptions): Promise<TransformResult | null>
  transformIndexHtml(url: string, html: string, originalUrl?: string): Promise<string>
  ssrLoadModule(url: string, options?: { fixStacktrace?: boolean }): Promise<Record<string, any>>
  ssrFixStacktrace(e: Error): void
  reloadModule(module: ModuleNode): Promise<void>
  listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
  restart(forceOptimize?: boolean): Promise<void>
  close(): Promise<void>
  bindCLIShortcuts(options?: BindCLIShortcutsOptions<ViteDevServer>): void
  waitForRequestsIdle(ignoredId?: string): Promise<void>
}
```

---

### `configurePreviewServer`

**Kind:** async, sequential
**Called:** Preview server setup

```ts
configurePreviewServer(
  server: PreviewServer
): (() => void) | void | Promise<(() => void) | void>
```

Identical behavior to `configureServer` but for the preview server (`vite preview`).

**PreviewServer key properties:**

```ts
interface PreviewServer {
  config: ResolvedConfig
  middlewares: Connect.Server
  httpServer: http.Server
  resolvedUrls: ResolvedServerUrls | null
  printUrls(): void
  bindCLIShortcuts(options?: BindCLIShortcutsOptions<PreviewServer>): void
}
```

---

### `transformIndexHtml`

**Kind:** async, sequential
**Called:** On every HTML entry file request

```ts
// Simple form
transformIndexHtml(
  html: string,
  ctx: IndexHtmlTransformContext
): IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void>

// Object form with ordering
transformIndexHtml: {
  order?: 'pre' | 'post'  // default: 'post'
  handler(
    html: string,
    ctx: IndexHtmlTransformContext
  ): IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void>
}
```

**Context type:**

```ts
interface IndexHtmlTransformContext {
  path: string
  filename: string
  server?: ViteDevServer
  bundle?: OutputBundle
  chunk?: OutputChunk
}
```

**Return type:**

```ts
type IndexHtmlTransformResult =
  | string                          // replaced HTML
  | HtmlTagDescriptor[]             // tags to inject
  | {
      html: string                  // replaced HTML + tags
      tags: HtmlTagDescriptor[]
    }
```

**Tag descriptor:**

```ts
interface HtmlTagDescriptor {
  tag: string
  attrs?: Record<string, string | boolean>
  children?: string | HtmlTagDescriptor[]
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend'
}
```

**Order:**
- `'pre'`: Transform runs BEFORE HTML processing
- `'post'` (default): Transform runs AFTER HTML processing

---

### `handleHotUpdate`

**Kind:** async, sequential
**Called:** When a file changes during dev (NOT called during build)

```ts
handleHotUpdate(
  ctx: HmrContext
): Array<ModuleNode> | void | Promise<Array<ModuleNode> | void>
```

**HmrContext type:**

```ts
interface HmrContext {
  file: string                        // absolute path of changed file
  timestamp: number                   // change timestamp
  modules: Array<ModuleNode>          // affected modules
  read: () => string | Promise<string> // lazy file content reader
  server: ViteDevServer               // dev server instance
}
```

- Return a filtered `ModuleNode[]` to narrow which modules are updated
- Return `[]` (empty array) to suppress the default HMR update entirely
- Return `void` / `undefined` to use default behavior
- Use `server.ws.send()` inside this hook to send custom HMR events

---

## Rollup-Compatible (Universal) Hooks

These hooks follow Rollup's plugin interface. Vite calls them during both dev and build, with noted exceptions.

### `options`

**Called:** On dev server start / build start

```ts
options(
  options: InputOptions
): InputOptions | null | Promise<InputOptions | null>
```

Modifies Rollup input options before processing.

---

### `buildStart`

**Called:** On dev server start / build start

```ts
buildStart(
  this: PluginContext
): void | Promise<void>
```

Called after `options` is resolved. Use for initialization logic.

---

### `resolveId`

**Called:** Per module request (resolving import specifiers)

```ts
resolveId(
  this: PluginContext,
  source: string,
  importer: string | undefined,
  options: { attributes: Record<string, string>; isEntry: boolean; ssr?: boolean }
): string | null | { id: string; external?: boolean } | Promise<...>
```

- Return a string to resolve the module to a specific ID
- Return `null` to defer to other plugins
- NEVER return `undefined` -- ALWAYS return `null` to pass through

---

### `load`

**Called:** Per module request (loading module content)

```ts
load(
  this: PluginContext,
  id: string
): string | null | { code: string; map?: SourceMapInput } | Promise<...>
```

- Return a string or `{ code, map }` to provide module content
- Return `null` to defer to other plugins or default loading
- ALWAYS use this with `resolveId` for virtual modules

---

### `transform`

**Called:** Per module request (transforming loaded content)

```ts
transform(
  this: PluginContext,
  code: string,
  id: string,
  options?: { ssr?: boolean }
): string | null | { code: string; map?: SourceMapInput } | Promise<...>
```

- Return transformed code as string or `{ code, map }` object
- Return `null` to skip transformation
- Check `options?.ssr` for SSR-specific transforms
- ALWAYS provide a sourcemap (`map`) when transforming code for debugging support

---

### `buildEnd`

**Called:** On server close / build end

```ts
buildEnd(
  this: PluginContext
): void | Promise<void>
```

Called after the build has completed (or dev server closes).

---

### `closeBundle`

**Called:** On server close / after bundle is written

```ts
closeBundle(): void | Promise<void>
```

Final cleanup hook. Runs after all output has been generated.

---

## Build-Only Hooks

These Rollup hooks are ONLY called during `vite build`, NOT during dev:

| Hook | Purpose |
|------|---------|
| `moduleParsed` | After a module is parsed (NEVER called in dev) |
| `renderChunk` | Transform individual chunks |
| `augmentChunkHash` | Add data to chunk hash |
| `generateBundle` | Generate or modify output bundle |
| `writeBundle` | After bundle is written to disk |

---

## Hook Filter Syntax (v6.3+)

Any hook that accepts `id` or `code` parameters supports an object form with `filter`:

```ts
// Object form with filter
transform: {
  filter: {
    id?: RegExp        // filter by module ID
    code?: RegExp      // filter by module content (transform only)
  },
  handler(code: string, id: string): TransformResult | null
}

resolveId: {
  filter: {
    id?: RegExp        // filter by source specifier
  },
  handler(source: string, importer?: string): string | null
}

load: {
  filter: {
    id?: RegExp        // filter by resolved module ID
  },
  handler(id: string): string | null
}
```

**Utility functions from `@rolldown/pluginutils`:**

```ts
import { exactRegex, prefixRegex } from '@rolldown/pluginutils'

// exactRegex('virtual:my-module') matches exactly 'virtual:my-module'
// prefixRegex('virtual:') matches any ID starting with 'virtual:'
```
