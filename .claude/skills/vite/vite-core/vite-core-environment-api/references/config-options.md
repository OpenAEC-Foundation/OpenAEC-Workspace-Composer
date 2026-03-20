# EnvironmentOptions Interface — Config Reference

> **Vite 6+ ONLY** — None of these options exist in Vite 5.

## EnvironmentOptions Properties

### `define`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `define` | `Record<string, any>` | `{}` | Global constant replacements scoped to this environment |

Behaves identically to top-level `define` but applies only to the specific environment. ALWAYS use `JSON.stringify()` for string values.

```javascript
environments: {
  server: {
    define: {
      __SERVER__: JSON.stringify(true),
      __API_URL__: JSON.stringify('https://api.example.com')
    }
  }
}
```

### `resolve`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `resolve.alias` | `Record<string, string> \| Array` | Inherited | Path aliases |
| `resolve.conditions` | `string[]` | Inherited | Export conditions for package.json |
| `resolve.extensions` | `string[]` | Inherited | File extensions to try |
| `resolve.mainFields` | `string[]` | Inherited | Fields to try in package.json |
| `resolve.noExternal` | `true \| string[]` | `undefined` | Force bundling of specified packages (critical for edge/worker) |
| `resolve.external` | `string[]` | `undefined` | Exclude packages from bundling |

ALWAYS set `resolve.noExternal: true` for edge/worker environments — these runtimes typically cannot resolve `node_modules` at runtime.

### `optimizeDeps`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `optimizeDeps.include` | `string[]` | `[]` | Force pre-bundle these dependencies |
| `optimizeDeps.exclude` | `string[]` | `[]` | Exclude from pre-bundling |
| `optimizeDeps.force` | `boolean` | `false` | Ignore cache, force re-bundle |
| `optimizeDeps.rolldownOptions` | `RolldownOptions` | `{}` | Rolldown config for pre-bundling (Vite 6) |

**CRITICAL**: `optimizeDeps` from top-level config propagates ONLY to the `client` environment. Server and custom environments do NOT inherit it. ALWAYS configure explicitly if needed.

### `consumer`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `consumer` | `'client' \| 'server'` | `'client'` (top-level) | Declares the runtime target |

- `'client'` — Browser runtime. Code is served to the browser.
- `'server'` — Server runtime (Node.js, edge, worker). Code runs on the server.

ALWAYS set `consumer: 'server'` for SSR, edge worker, and Node.js environments. This affects how Vite resolves modules and handles externals.

### `dev`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dev` | `DevEnvironmentOptions` | `{}` | Dev-server-specific options for this environment |

Dev options control how Vite's dev server handles this environment during development. Includes settings for module loading, HMR behavior, and runtime execution.

### `build`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `build.outDir` | `string` | `'dist'` | Output directory for this environment's build |
| `build.ssr` | `boolean` | `false` | Enable SSR build mode |
| `build.sourcemap` | `boolean \| 'inline' \| 'hidden'` | Inherited | Source map generation |
| `build.target` | `string \| string[]` | Inherited | Build target for this environment |
| `build.minify` | `boolean \| 'terser' \| 'esbuild'` | Inherited | Minification strategy |
| `build.rolldownOptions` | `RolldownOptions` | Inherited | Rolldown bundler options |

ALWAYS set a unique `build.outDir` per environment to avoid output conflicts. For example:
- `client` → `dist/client`
- `server` → `dist/server`
- `edge` → `dist/edge`

---

## UserConfig Extends EnvironmentOptions

```typescript
interface EnvironmentOptions {
  define?: Record<string, any>
  resolve?: ResolveOptions
  optimizeDeps?: DepOptimizationOptions
  consumer?: 'client' | 'server'
  dev?: DevEnvironmentOptions
  build?: BuildEnvironmentOptions
}

interface UserConfig extends EnvironmentOptions {
  environments?: Record<string, EnvironmentOptions>
  // ... plus all other Vite config (plugins, server, css, etc.)
}
```

Top-level properties in `UserConfig` are `EnvironmentOptions` for the default `client` environment. The `environments` record defines additional environments that inherit from and override those defaults.

---

## Configuration Inheritance Diagram

```
UserConfig (top-level)
│
├── resolve: { alias: { '@': './src' } }     ← Default for ALL environments
├── define: { __VERSION__: '"1.0"' }          ← Default for ALL environments
├── build: { sourcemap: true }                ← Default for ALL environments
├── optimizeDeps: { include: ['lib'] }        ← Client ONLY (does NOT propagate)
│
└── environments:
    ├── server:                               ← Inherits resolve, define, build
    │   ├── consumer: 'server'                ← Override
    │   ├── build: { outDir: 'dist/server' }  ← Merges with inherited build
    │   └── (optimizeDeps NOT inherited)      ← Must configure explicitly
    │
    └── edge:                                 ← Inherits resolve, define, build
        ├── consumer: 'server'                ← Override
        ├── resolve: { noExternal: true }     ← Merges with inherited resolve
        └── build: { outDir: 'dist/edge' }    ← Merges with inherited build
```

---

## Per-Environment Config Keys Summary

| Config Key | Inherits from Top-Level? | Commonly Overridden For |
|-----------|--------------------------|-------------------------|
| `define` | YES | Server-specific globals, feature flags |
| `resolve` | YES | Edge workers (noExternal), platform conditions |
| `resolve.noExternal` | YES | Edge/worker environments (set to `true`) |
| `optimizeDeps` | **NO (client only)** | Rarely needed for server environments |
| `consumer` | NO (defaults to `'client'`) | Every non-browser environment |
| `dev` | YES | Custom dev server behavior |
| `build.outDir` | YES | ALWAYS override to avoid conflicts |
| `build.ssr` | YES | Server environments |
| `build.target` | YES | Different Node/edge runtime targets |
| `build.sourcemap` | YES | Disable for production server builds |
