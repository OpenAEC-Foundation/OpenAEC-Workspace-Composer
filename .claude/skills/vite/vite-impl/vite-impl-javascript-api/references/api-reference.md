# API Reference — Vite Programmatic JavaScript API

## createServer

```typescript
async function createServer(inlineConfig?: InlineConfig): Promise<ViteDevServer>
```

Creates a Vite dev server instance. The server does NOT start listening until `server.listen()` is called.

**Parameters:**
- `inlineConfig` (optional): `InlineConfig` — extends `UserConfig` with `configFile` property

**Returns:** `Promise<ViteDevServer>`

---

## ViteDevServer Interface

```typescript
interface ViteDevServer {
  // Properties
  config: ResolvedConfig
  middlewares: Connect.Server
  httpServer: http.Server | null
  watcher: FSWatcher
  ws: WebSocketServer
  pluginContainer: PluginContainer
  moduleGraph: ModuleGraph
  resolvedUrls: ResolvedServerUrls | null

  // Methods
  transformRequest(
    url: string,
    options?: TransformOptions,
  ): Promise<TransformResult | null>

  transformIndexHtml(
    url: string,
    html: string,
    originalUrl?: string,
  ): Promise<string>

  ssrLoadModule(
    url: string,
    options?: { fixStacktrace?: boolean },
  ): Promise<Record<string, any>>

  ssrFixStacktrace(e: Error): void
  reloadModule(module: ModuleNode): Promise<void>
  listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
  restart(forceOptimize?: boolean): Promise<void>
  close(): Promise<void>
  bindCLIShortcuts(options?: BindCLIShortcutsOptions<ViteDevServer>): void
  waitForRequestsIdle(ignoredId?: string): Promise<void>
}
```

### Property Details

| Property | Description |
|----------|-------------|
| `config` | The fully resolved `ResolvedConfig` object |
| `middlewares` | A Connect app instance. Custom HTTP middleware can be attached via `middlewares.use()` |
| `httpServer` | The underlying `http.Server`. `null` when running in middleware mode |
| `watcher` | Chokidar `FSWatcher` instance. Use for custom file watching logic |
| `ws` | WebSocket server. Use `ws.send()` to push custom HMR messages to connected clients |
| `pluginContainer` | Provides `resolveId()`, `load()`, and `transform()` methods to run plugin hooks on demand |
| `moduleGraph` | Tracks all loaded modules, their import relationships, and HMR boundaries |
| `resolvedUrls` | Contains `local` and `network` URL arrays. Only populated AFTER `listen()` completes |

### Method Details

**`transformRequest(url, options?)`**
Transforms a module URL through the full Vite pipeline (resolve, load, transform). Returns `null` if the module cannot be resolved.

**`transformIndexHtml(url, html, originalUrl?)`**
Applies all `transformIndexHtml` plugin hooks to the given HTML string. ALWAYS use this when serving HTML programmatically.

**`ssrLoadModule(url, options?)`**
Loads and executes a module in the SSR context. Returns the module's exports. Set `options.fixStacktrace` to `true` for readable error traces.

**`ssrFixStacktrace(e)`**
Rewrites an error's stack trace to map back to original source locations.

**`reloadModule(module)`**
Triggers HMR update for the specified `ModuleNode`. Useful for programmatic HMR triggers.

**`listen(port?, isRestart?)`**
Starts the HTTP server. Returns the same `ViteDevServer` instance for chaining.

**`restart(forceOptimize?)`**
Restarts the server. If `forceOptimize` is `true`, re-runs dependency optimization.

**`close()`**
Shuts down the server: closes HTTP server, file watcher, WebSocket connections, and cleans up resources.

**`bindCLIShortcuts(options?)`**
Enables CLI keyboard shortcuts: `r` (restart), `u` (show URLs), `c` (clear console), `q` (quit).

**`waitForRequestsIdle(ignoredId?)`**
Returns a promise that resolves when all in-flight requests have completed. Use before performing operations that require a quiet server (e.g., closing).

---

## build

```typescript
async function build(
  inlineConfig?: InlineConfig,
): Promise<RollupOutput | RollupOutput[]>
```

Runs a production build. Returns `RollupOutput[]` when multiple outputs are configured (e.g., SSR + client).

**Parameters:**
- `inlineConfig` (optional): `InlineConfig`

**Returns:** `Promise<RollupOutput | RollupOutput[]>`

---

## preview

```typescript
async function preview(inlineConfig?: InlineConfig): Promise<PreviewServer>
```

Creates a static file server for previewing built output from `dist/`.

---

## PreviewServer Interface

```typescript
interface PreviewServer {
  config: ResolvedConfig
  middlewares: Connect.Server
  httpServer: http.Server
  resolvedUrls: ResolvedServerUrls | null
  printUrls(): void
  bindCLIShortcuts(options?: BindCLIShortcutsOptions<PreviewServer>): void
}
```

Unlike `ViteDevServer`, `httpServer` is ALWAYS present (never null).

---

## resolveConfig

```typescript
async function resolveConfig(
  inlineConfig: InlineConfig,
  command: 'build' | 'serve',
  defaultMode?: string,       // default: 'development'
  defaultNodeEnv?: string,    // default: 'development'
  isPreview?: boolean,        // default: false
): Promise<ResolvedConfig>
```

Resolves and merges all configuration sources (inline config, config file, defaults) into a final `ResolvedConfig`.

- `command: 'serve'` — for dev server and preview
- `command: 'build'` — for production builds only

---

## mergeConfig

```typescript
function mergeConfig(
  defaults: Record<string, any>,
  overrides: Record<string, any>,
  isRoot?: boolean,  // default: true
): Record<string, any>
```

Deep-merges two Vite configuration objects. Arrays are concatenated, objects are recursively merged, and overrides take precedence for scalar values.

**CRITICAL:** Set `isRoot=false` when merging nested subsections:

```typescript
// CORRECT: merging nested build options
const merged = mergeConfig(
  { outDir: 'dist', minify: true },
  { outDir: 'build' },
  false,  // isRoot=false for nested options
)

// WRONG: using default isRoot=true for nested options
const merged = mergeConfig(buildDefaults, buildOverrides)
```

---

## loadConfigFromFile

```typescript
async function loadConfigFromFile(
  configEnv: ConfigEnv,
  configFile?: string,
  configRoot?: string,       // default: process.cwd()
  logLevel?: LogLevel,
  customLogger?: Logger,
): Promise<{
  path: string
  config: UserConfig
  dependencies: string[]
} | null>
```

Loads a Vite config file from disk. Returns `null` if no config file is found. The `dependencies` array lists all files the config depends on (for watching).

---

## loadEnv

```typescript
function loadEnv(
  mode: string,
  envDir: string,
  prefixes?: string | string[],  // default: 'VITE_'
): Record<string, string>
```

Loads `.env`, `.env.local`, `.env.[mode]`, and `.env.[mode].local` files from `envDir`. Only variables with matching `prefixes` are returned.

**Loaded file priority (later overrides earlier):**
1. `.env`
2. `.env.local`
3. `.env.[mode]`
4. `.env.[mode].local`

---

## searchForWorkspaceRoot

```typescript
function searchForWorkspaceRoot(
  current: string,
  root?: string,  // default: searchForPackageRoot(current)
): string
```

Searches upward from `current` for a workspace root (pnpm workspace, Yarn/npm workspaces, or a `.git` directory). Returns the root path found.

---

## transformWithOxc (Vite 8+)

```typescript
async function transformWithOxc(
  code: string,
  filename: string,
  options?: OxcTransformOptions,
  inMap?: object,
): Promise<Omit<OxcTransformResult, 'errors'> & { warnings: string[] }>
```

Transforms TypeScript/JSX code using the OXC compiler. This is the current recommended transform function.

---

## transformWithEsbuild (DEPRECATED)

```typescript
async function transformWithEsbuild(
  code: string,
  filename: string,
  options?: EsbuildTransformOptions,
  inMap?: object,
): Promise<ESBuildTransformResult>
```

**DEPRECATED in Vite 8+.** Use `transformWithOxc()` instead. Still available in Vite 5.x/6.x/7.x.

---

## normalizePath

```typescript
function normalizePath(id: string): string
```

Converts Windows-style backslash paths to forward-slash paths. ALWAYS use this when comparing or storing file paths in cross-platform code.

---

## createFilter

```typescript
function createFilter(
  include?: FilterPattern,
  exclude?: FilterPattern,
): (id: string) => boolean
```

Creates a picomatch-based filter function. Returns `true` if a path matches `include` and does not match `exclude`. Re-exported from the underlying bundler utilities.

---

## preprocessCSS (Experimental)

```typescript
async function preprocessCSS(
  code: string,
  filename: string,
  config: ResolvedConfig,
): Promise<PreprocessCSSResult>

interface PreprocessCSSResult {
  code: string
  map?: SourceMapInput
  modules?: Record<string, string>
  deps?: Set<string>
}
```

Preprocesses CSS using Vite's internal CSS pipeline. Requires a `ResolvedConfig` (obtain via `resolveConfig()`). Experimental API -- may change between versions.

---

## Key Types

### InlineConfig

```typescript
interface InlineConfig extends UserConfig {
  configFile?: string | false
  envFile?: false
}
```

- `configFile: false` — disables automatic config file resolution
- `configFile: '/path/to/vite.config.ts'` — use a specific config file
- `envFile: false` — disables `.env` file loading

### ResolvedConfig

All `UserConfig` properties with defaults resolved (no `undefined` values), plus:
- `assetsInclude(id: string): boolean` — checks if an ID should be treated as an asset
- `logger: Logger` — Vite's internal logger instance

### ConfigEnv

```typescript
interface ConfigEnv {
  command: 'build' | 'serve'
  mode: string
  isSsrBuild?: boolean
  isPreview?: boolean
}
```

Passed to the config function and `loadConfigFromFile`.
