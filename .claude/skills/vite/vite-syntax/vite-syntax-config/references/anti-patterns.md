# Config Anti-Patterns

Common Vite configuration mistakes and how to avoid them.

## AP-001: Empty envPrefix Exposes Secrets

**NEVER** set `envPrefix` to an empty string.

```typescript
// WRONG: Exposes ALL env vars to client bundle
export default defineConfig({
  envPrefix: '',  // DB_PASSWORD, AWS_SECRET_KEY now in client code!
})

// CORRECT: Use specific prefixes
export default defineConfig({
  envPrefix: 'VITE_',  // Only VITE_* vars exposed (default)
})

// CORRECT: Multiple specific prefixes
export default defineConfig({
  envPrefix: ['VITE_', 'APP_'],
})
```

**Why**: Every env variable matching the prefix is embedded in the client JavaScript bundle. An empty prefix matches everything, including database credentials, API secrets, and cloud provider keys.

---

## AP-002: Missing JSON.stringify in define

**NEVER** pass raw strings to `define` without `JSON.stringify()`.

```typescript
// WRONG: Produces syntax error -- value injected as bare identifier
export default defineConfig({
  define: {
    __API_URL__: 'https://api.example.com',
    // Compiles to: const url = https://api.example.com  (broken!)
  },
})

// CORRECT: Wrap strings in JSON.stringify
export default defineConfig({
  define: {
    __API_URL__: JSON.stringify('https://api.example.com'),
    // Compiles to: const url = "https://api.example.com"
  },
})
```

**Why**: `define` performs raw text replacement. Without `JSON.stringify()`, the string `https://api.example.com` is injected as a JavaScript expression, which is a syntax error.

---

## AP-003: Accessing process.env in Config Without loadEnv

**NEVER** assume `process.env.VITE_*` variables are available in `vite.config.ts`.

```typescript
// WRONG: VITE_ vars from .env files are NOT in process.env during config loading
export default defineConfig({
  define: {
    __API__: JSON.stringify(process.env.VITE_API_URL),
    // Result: __API__ is undefined
  },
})

// CORRECT: Use loadEnv() to load .env file variables
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __API__: JSON.stringify(env.VITE_API_URL),
    },
  }
})
```

**Why**: Vite loads `.env` files AFTER config resolution. The `loadEnv()` helper explicitly reads and parses `.env` files so their values are available during config setup.

---

## AP-004: Missing defineConfig Wrapper

**NEVER** export a plain object without `defineConfig()`.

```typescript
// WRONG: No type checking or IntelliSense
export default {
  plugins: [vue()],
  base: '/app/',
}

// CORRECT: Full type safety and autocomplete
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  base: '/app/',
})
```

**Why**: `defineConfig()` provides TypeScript type inference for all config options. Without it, typos in option names go undetected and your editor cannot provide autocomplete.

---

## AP-005: Using Static Config When Command Differs

**NEVER** use a static config object when dev and build need different settings.

```typescript
// WRONG: Same config for dev and build
export default defineConfig({
  base: '/production-path/',  // Broken during development!
})

// CORRECT: Use conditional config
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/production-path/',
}))
```

**Why**: A static `base: '/production-path/'` makes the dev server serve assets from the wrong path. ALWAYS use a function export when any option should differ between dev and build.

---

## AP-006: Putting Secrets in define

**NEVER** expose server-side secrets through the `define` option.

```typescript
// WRONG: Secret ends up in client JavaScript bundle
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __DB_PASSWORD__: JSON.stringify(env.DB_PASSWORD),  // In client bundle!
    },
  }
})

// CORRECT: Only expose non-sensitive config to the client
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),     // Public URL, safe
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME),   // Non-sensitive, safe
    },
  }
})
```

**Why**: Values in `define` are statically replaced in the client bundle. Anyone can read them by viewing the page source or the built JavaScript files.

---

## AP-007: Setting base Without Trailing Slash

**NEVER** set `base` to a subdirectory path without a trailing slash.

```typescript
// WRONG: Causes asset resolution issues
export default defineConfig({
  base: '/my-app',   // Missing trailing slash
})

// CORRECT: Always include trailing slash for directory paths
export default defineConfig({
  base: '/my-app/',
})
```

**Why**: Without the trailing slash, relative asset URLs may resolve incorrectly. The `base` value is used as-is in URL construction, and `/my-app` is interpreted as a file, not a directory.

---

## AP-008: Using esbuild Option in Vite 8+

**NEVER** use the `esbuild` config option in Vite 8+ projects.

```typescript
// WRONG (Vite 8+): esbuild is deprecated, converted internally to oxc
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})

// CORRECT (Vite 8+): Use oxc directly
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

**Why**: In Vite 8+, Oxc replaces esbuild for JS/TS transformation. While the `esbuild` option is converted internally, it is deprecated and may be removed in future versions. Using `oxc` directly gives you access to the full Oxc configuration surface.

---

## AP-009: Forgetting envDir When Using loadEnv

**NEVER** pass a different directory to `loadEnv()` without also setting `envDir`.

```typescript
// WRONG: loadEnv reads from './config' but Vite reads .env from root
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, './config', 'VITE_')
  return {
    // envDir defaults to root -- Vite loads different .env files than loadEnv!
  }
})

// CORRECT: Keep envDir and loadEnv directory in sync
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, './config', 'VITE_')
  return {
    envDir: './config',  // Match the loadEnv directory
  }
})
```

**Why**: `loadEnv()` and Vite's runtime env loading are separate. If they read from different directories, `import.meta.env` in your app will have different values than what you used during config setup.

---

## AP-010: Disabling publicDir Without Migrating Assets

**NEVER** set `publicDir: false` without verifying no code references `/` paths expecting static assets.

```typescript
// WRONG: Breaks all references to files from public/ directory
export default defineConfig({
  publicDir: false,
  // Templates still reference /favicon.ico, /robots.txt, etc. -- 404!
})

// CORRECT: If disabling, ensure all assets are imported or inlined
export default defineConfig({
  publicDir: false,
  // All assets are now handled via import statements or build plugins
})
```

**Why**: When `publicDir` is `false`, files previously served from `public/` (like favicons, manifests, robots.txt) return 404. You must migrate all references to use explicit imports or serve them through another mechanism.
