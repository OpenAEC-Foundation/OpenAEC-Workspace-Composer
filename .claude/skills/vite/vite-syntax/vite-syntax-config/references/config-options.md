# Config Options Reference

Complete reference for all Vite shared configuration options with types, defaults, and descriptions.

## root

- **Type**: `string`
- **Default**: `process.cwd()`
- **Description**: Project root directory where `index.html` is located. Can be absolute or relative to the current working directory.
- **CLI**: `vite --root ./src`

```typescript
export default defineConfig({
  root: './src',
})
```

## base

- **Type**: `string`
- **Default**: `'/'`
- **Description**: Public base path when served. Controls the base URL for all generated asset URLs.
- **CLI**: `vite --base /my-app/`

Accepted values:
| Value | Use Case |
|-------|----------|
| `'/'` | Default, app served at domain root |
| `'/app/'` | App served at subdirectory |
| `'https://cdn.example.com/'` | Assets served from CDN |
| `'./'` or `''` | Embedded deployment (relative paths) |

```typescript
export default defineConfig({
  base: '/my-app/',
})
```

## mode

- **Type**: `string`
- **Default**: `'development'` for `vite` (serve), `'production'` for `vite build`
- **Description**: Overrides the default mode. Determines which `.env.[mode]` files are loaded and the value of `import.meta.env.MODE`.
- **CLI**: `vite --mode staging`

```typescript
export default defineConfig({
  mode: 'staging',
})
```

**Important**: `mode` and `NODE_ENV` are independent. Setting `mode` does NOT change `NODE_ENV`. See the conditional config pattern to vary config per mode.

## define

- **Type**: `Record<string, any>`
- **Description**: Define global constant replacements. Entries are replaced as-is during development, and statically replaced during build.

**Rules**:
- String values MUST be wrapped in `JSON.stringify()` -- they are injected as raw expressions
- Non-string values are converted to expressions automatically
- Starting from Vite 8, only `import.meta.env` properties are supported in HTML files

```typescript
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.2.3'),
    __API_URL__: JSON.stringify('https://api.example.com'),
    __IS_DEBUG__: 'false',
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
```

**TypeScript**: Add declarations to avoid type errors:

```typescript
// vite-env.d.ts
declare const __APP_VERSION__: string
declare const __API_URL__: string
```

## plugins

- **Type**: `(Plugin | Plugin[] | Promise<Plugin | Plugin[]>)[]`
- **Description**: Array of plugins to use. Falsy values are ignored and nested arrays are flattened.

```typescript
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    vue(),
    // Conditional plugin (falsy ignored)
    process.env.ANALYZE && visualizer(),
    // Nested arrays flattened
    [pluginA(), pluginB()],
  ],
})
```

## publicDir

- **Type**: `string | false`
- **Default**: `'public'`
- **Description**: Directory to serve as plain static assets. Files here are:
  - Served at `/` during development
  - Copied to `build.outDir` root during build
  - NEVER transformed or processed

Set to `false` to disable this feature entirely.

```typescript
export default defineConfig({
  publicDir: 'static',       // Use 'static/' instead of 'public/'
  // publicDir: false,        // Disable static asset directory
})
```

## cacheDir

- **Type**: `string`
- **Default**: `'node_modules/.vite'`
- **Description**: Directory for storing pre-bundled dependencies and other Vite cache files. Delete this directory or run `vite --force` to regenerate.

```typescript
export default defineConfig({
  cacheDir: '.vite-cache',
})
```

## logLevel

- **Type**: `'info' | 'warn' | 'error' | 'silent'`
- **Default**: `'info'`
- **Description**: Adjust console output verbosity.
- **CLI**: `vite --logLevel warn`

| Level | Shows |
|-------|-------|
| `'info'` | All messages |
| `'warn'` | Warnings and errors only |
| `'error'` | Errors only |
| `'silent'` | No output |

## customLogger

- **Type**: `Logger`
- **Description**: Custom logger instance to override Vite's default logging. Use `createLogger()` from Vite to create a base logger, then override individual methods.

```typescript
import { createLogger, defineConfig } from 'vite'

const logger = createLogger()
const originalWarn = logger.warn
logger.warn = (msg, options) => {
  // Filter out specific warnings
  if (msg.includes('some-known-warning')) return
  originalWarn(msg, options)
}

export default defineConfig({
  customLogger: logger,
})
```

The Logger interface provides: `info(msg)`, `warn(msg)`, `warnOnce(msg)`, `error(msg)`, `clearScreen(type)`, `hasErrorLogged(error)`, `hasWarned`.

## clearScreen

- **Type**: `boolean`
- **Default**: `true`
- **Description**: When `true`, Vite clears the terminal screen when logging certain messages. Set to `false` to keep terminal history visible.

```typescript
export default defineConfig({
  clearScreen: false,
})
```

## envDir

- **Type**: `string | false`
- **Default**: `root` (same as project root)
- **Description**: Directory from which `.env` files are loaded. Can be absolute or relative to `root`. Set to `false` to disable `.env` file loading entirely.

```typescript
export default defineConfig({
  envDir: './config',    // Load .env files from ./config/
  // envDir: false,       // Disable .env loading
})
```

## envPrefix

- **Type**: `string | string[]`
- **Default**: `'VITE_'`
- **Description**: Only environment variables starting with this prefix are exposed to client code via `import.meta.env`.

```typescript
export default defineConfig({
  envPrefix: ['VITE_', 'APP_'],  // Expose both VITE_ and APP_ prefixed vars
})
```

**SECURITY WARNING**: NEVER set `envPrefix` to `''` -- this exposes ALL environment variables to the client bundle, including secrets like `DB_PASSWORD`, `API_SECRET`, and `AWS_ACCESS_KEY`.

## appType

- **Type**: `'spa' | 'mpa' | 'custom'`
- **Default**: `'spa'`
- **Description**: Controls whether HTML-related middleware is included in the dev server.

| Value | HTML Middleware | SPA Fallback | Use Case |
|-------|----------------|-------------|----------|
| `'spa'` | Yes | Yes | Single Page Applications |
| `'mpa'` | Yes | No | Multi-Page Applications |
| `'custom'` | No | No | Custom server (Express, SSR framework) |

```typescript
export default defineConfig({
  appType: 'mpa',
})
```

## assetsInclude

- **Type**: `string | RegExp | (string | RegExp)[]`
- **Description**: Specify additional file types to be treated as static assets (so they can be imported and will return their resolved URL).

```typescript
export default defineConfig({
  assetsInclude: ['**/*.gltf', '**/*.fbx'],
})
```

## future

- **Type**: `Record<string, 'warn' | undefined>`
- **Description**: Enable future breaking changes on an opt-in basis for smooth migration. When set to `'warn'`, Vite logs deprecation warnings for the upcoming change.

```typescript
export default defineConfig({
  future: {
    removePluginHookHandleHotUpdate: 'warn',
  },
})
```

## oxc (v8+)

- **Type**: `OxcOptions | false`
- **Description**: Configure the Oxc transformer for JSX and TypeScript transformation. Replaces esbuild in Vite 8+. Applied to `.ts`, `.jsx`, `.tsx` files by default.

```typescript
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',   // 'automatic' (default) or 'classic'
      pragma: 'React.createElement',
      pragmaFrag: 'React.Fragment',
    },
  },
})
```

Set `oxc: false` to disable the Oxc transform entirely.

## esbuild (deprecated in v8)

- **Type**: `ESBuildOptions | false`
- **Description**: In Vite 8+, this option is converted internally to `oxc`. ALWAYS use the `oxc` option directly when targeting Vite 8+. For Vite 6/7 projects, configure `esbuild` as before.

```typescript
// Vite 6/7 only
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})
```
