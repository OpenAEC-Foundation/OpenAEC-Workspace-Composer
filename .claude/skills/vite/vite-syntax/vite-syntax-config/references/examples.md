# Configuration Examples

Working code examples verified against official Vite documentation.

## Conditional Config Based on Command

ALWAYS use a function export when dev and build configs differ:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  const isDevServer = command === 'serve'

  return {
    base: isDevServer ? '/' : '/production-path/',
    define: {
      __DEV__: JSON.stringify(isDevServer),
    },
    build: isDevServer ? {} : {
      sourcemap: true,
      minify: 'oxc',
    },
  }
})
```

## Conditional Config Based on Mode

Use `mode` to load different configurations per environment:

```typescript
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  if (mode === 'staging') {
    return {
      define: {
        __API_URL__: JSON.stringify('https://staging-api.example.com'),
      },
    }
  }
  // Default production config
  return {
    define: {
      __API_URL__: JSON.stringify('https://api.example.com'),
    },
  }
})
```

Run with: `vite build --mode staging`

## Async Config

Use when config depends on async data (database, remote config, dynamic imports):

```typescript
import { defineConfig } from 'vite'

export default defineConfig(async ({ command, mode }) => {
  const { default: mdPlugin } = await import('@mdx-js/rollup')

  return {
    plugins: [mdPlugin()],
  }
})
```

## Loading Environment Variables in Config

Environment variables are NOT automatically available in `vite.config.ts`. ALWAYS use `loadEnv()`:

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load only VITE_-prefixed variables
  const env = loadEnv(mode, process.cwd())

  return {
    // env.VITE_API_URL is available here
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },
  }
})
```

### Loading ALL Environment Variables

Pass an empty string as the third argument to load variables regardless of prefix:

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load ALL env vars (not just VITE_-prefixed)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      __DB_HOST__: JSON.stringify(env.DB_HOST),  // Only for build-time replacement!
    },
  }
})
```

**Warning**: Loading all env vars with `''` prefix is safe in config (server-side), but NEVER expose secrets through `define` -- values end up in the client bundle.

### Loading from Custom Directory

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, './config', 'VITE_')

  return {
    envDir: './config',  // Also set envDir to match
    define: {
      __TITLE__: JSON.stringify(env.VITE_APP_TITLE),
    },
  }
})
```

### Loading with Multiple Prefixes

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load vars starting with VITE_ or APP_
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'APP_'])

  return {
    envPrefix: ['VITE_', 'APP_'],  // Expose both prefixes to client
    define: {
      __APP_NAME__: JSON.stringify(env.APP_NAME),
    },
  }
})
```

## Plugin Arrays and Conditional Plugins

Vite flattens nested arrays and ignores falsy values in the plugins array:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command }) => ({
  plugins: [
    // Always included
    vue(),

    // Conditional: only in production builds
    command === 'build' && legacy({
      targets: ['defaults', 'not IE 11'],
    }),

    // Conditional: only when ANALYZE env var is set
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
    }),

    // Nested array (automatically flattened)
    [
      pluginA(),
      pluginB(),
    ],

    // Falsy values are silently ignored
    null,
    undefined,
    false,
  ],
}))
```

## Multi-Page Application Config

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa',
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        contact: 'contact/index.html',
      },
    },
  },
})
```

## Custom Public Directory

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: 'static',  // Use 'static/' instead of 'public/'
})
```

## Global Constants with define

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    // Strings MUST use JSON.stringify
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),

    // Booleans and numbers are fine as-is
    __IS_DEBUG__: 'false',
    __MAX_RETRIES__: '3',

    // Replace process.env references
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
```

## Custom Logger (Filtering Warnings)

```typescript
import { createLogger, defineConfig } from 'vite'

const logger = createLogger()
const originalWarn = logger.warn

logger.warn = (msg, options) => {
  // Suppress empty CSS file warnings
  if (msg.includes('vite:css') && msg.includes(' is empty')) return
  // Suppress specific deprecation warnings
  if (msg.includes('deprecated-feature')) return
  originalWarn(msg, options)
}

export default defineConfig({
  customLogger: logger,
  clearScreen: false,
})
```

## Future Breaking Changes Opt-In

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  future: {
    removePluginHookHandleHotUpdate: 'warn',
  },
})
```

## Oxc Configuration (Vite 8+)

```typescript
import { defineConfig } from 'vite'

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

## Complete Real-World Config

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = command === 'serve'

  return {
    root: '.',
    base: isDev ? '/' : env.VITE_BASE_URL || '/',
    mode,
    plugins: [
      react(),
      !isDev && legacy({ targets: ['defaults'] }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    publicDir: 'public',
    cacheDir: 'node_modules/.vite',
    logLevel: isDev ? 'info' : 'warn',
    clearScreen: true,
    envDir: '.',
    envPrefix: 'VITE_',
    appType: 'spa',
    assetsInclude: ['**/*.gltf', '**/*.glb'],
  }
})
```
