# Dependency Optimization Examples

Working configuration examples for common dependency pre-bundling scenarios.

---

## Example 1: Include Large ESM Dependencies

**Problem**: `lodash-es` has 600+ internal modules, causing hundreds of HTTP requests on dev server.

```javascript
// vite.config.js
export default defineConfig({
  optimizeDeps: {
    include: ['lodash-es'],
  },
})
```

**Result**: All 600+ modules collapsed into a single pre-bundled file. First page load drops from hundreds of requests to one.

---

## Example 2: Include CJS Dependencies Missed by Discovery

**Problem**: A dependency is imported via a plugin transform, not visible in source code crawl.

```javascript
// Plugin transforms this at build time:
// const lib = usePluginLib()  →  import lib from 'hidden-cjs-dep'

export default defineConfig({
  optimizeDeps: {
    include: ['hidden-cjs-dep'],
  },
})
```

**Result**: The CJS dependency is pre-bundled to ESM before the dev server needs it.

---

## Example 3: Exclude a Pure ESM Package

**Problem**: A small, pure ESM package with no internal modules does not need pre-bundling.

```javascript
export default defineConfig({
  optimizeDeps: {
    exclude: ['nanoid'],  // Pure ESM, single module, no conversion needed
  },
})
```

**Result**: `nanoid` is served directly as an ESM module without pre-bundling overhead.

**WARNING**: NEVER exclude CJS packages. This ALWAYS causes browser errors.

---

## Example 4: Monorepo with Linked Packages

**Problem**: A monorepo has a shared `@myorg/utils` package linked via workspace. It ships CJS only.

```javascript
// vite.config.js
export default defineConfig({
  optimizeDeps: {
    include: ['@myorg/utils'],  // Linked but CJS → must pre-bundle
  },
})
```

**Result**: The linked CJS package is converted to ESM for the dev server.

### Monorepo with ESM Linked Package (No Action Needed)

If `@myorg/utils` exports valid ESM, Vite auto-detects and treats it as source code:

```javascript
// No optimizeDeps config needed for ESM linked deps
export default defineConfig({
  // Vite handles it automatically
})
```

---

## Example 5: Monorepo Deep Imports with Glob Patterns

**Problem**: A linked UI library has many component files imported individually.

```javascript
// Application code:
import Button from '@myorg/ui/components/Button.vue'
import Modal from '@myorg/ui/components/Modal.vue'
import Table from '@myorg/ui/components/Table.vue'

// vite.config.js
export default defineConfig({
  optimizeDeps: {
    include: ['@myorg/ui/components/**/*.vue'],
  },
})
```

**Result**: All Vue component files under the components directory are discovered and pre-bundled.

---

## Example 6: Force Re-Bundle After node_modules Edit

**Problem**: You patched a dependency directly in `node_modules` but the dev server serves the old cached version.

### Option A: CLI Flag (Recommended)

```bash
vite --force
```

### Option B: Config Option (Persistent)

```javascript
export default defineConfig({
  optimizeDeps: {
    force: true,  // WARNING: Disables caching permanently
  },
})
```

### Option C: Manual Cache Delete

```bash
# Delete the cache directory
rm -rf node_modules/.vite

# Restart dev server
vite
```

**ALWAYS** prefer the CLI `--force` flag over the config option. The config option disables caching for every subsequent start.

---

## Example 7: Custom Entry Points

**Problem**: Your app has no HTML entry point (e.g., SSR-only or library with custom entry).

```javascript
export default defineConfig({
  optimizeDeps: {
    entries: [
      'src/server/entry.ts',       // SSR entry
      'src/client/entry.ts',       // Client entry
      'src/workers/**/*.ts',       // Worker entries (glob)
    ],
  },
})
```

**Result**: Vite crawls these entry files instead of looking for HTML files.

---

## Example 8: Disable Auto-Discovery (Full Manual Control)

**Problem**: Large project where automatic crawling is too slow and the dependency list is well-known.

```javascript
export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'date-fns',
      'zod',
    ],
  },
})
```

**CRITICAL**: With `noDiscovery: true`, ANY dependency NOT in `include` will fail at runtime. You MUST manually add every dependency your app imports.

---

## Example 9: Customize Pre-Bundler (Vite 8+ with Rolldown)

**Problem**: A dependency needs special resolution or transformation during pre-bundling.

```javascript
// Vite 8+
export default defineConfig({
  optimizeDeps: {
    rolldownOptions: {
      plugins: [
        {
          name: 'fix-cjs-export',
          transform(code, id) {
            if (id.includes('problematic-package')) {
              return code.replace('module.exports =', 'export default')
            }
          },
        },
      ],
    },
  },
})
```

### Same Example for Vite 6/7 (esbuild)

```javascript
// Vite 6/7
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'fix-cjs-export',
          setup(build) {
            build.onLoad({ filter: /problematic-package/ }, (args) => {
              // Custom load logic
            })
          },
        },
      ],
    },
  },
})
```

---

## Example 10: Handle CJS Default Export Issues

**Problem**: A CJS package's default export is `undefined` after pre-bundling.

```javascript
// The import returns { default: undefined } instead of the actual module
import pkg from 'broken-cjs-package'
console.log(pkg) // undefined

// Fix: Force interop
export default defineConfig({
  optimizeDeps: {
    needsInterop: ['broken-cjs-package'],
  },
})
```

**Result**: Vite adds ESM interop helpers that correctly unwrap the CJS default export.

---

## Example 11: Environment-Specific Optimization (Vite 6+)

**Problem**: Client and server environments need different dependency optimization.

```javascript
// Vite 6+ with Environment API
export default defineConfig({
  // Top-level applies to client environment
  optimizeDeps: {
    include: ['lodash-es', 'react'],
  },

  environments: {
    // SSR environment gets separate optimization
    ssr: {
      optimizeDeps: {
        include: ['node-fetch'],
        noDiscovery: false,
      },
    },
  },
})
```

**Note**: Top-level `optimizeDeps` applies ONLY to the `client` environment by default. Server environments do NOT inherit top-level `optimizeDeps`.

---

## Example 12: Complete Production-Ready Configuration

```typescript
// vite.config.ts — Vite 8+
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    // Let Vite discover from HTML entries (default)
    // entries: auto-detected

    // Pre-bundle heavy and CJS deps
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lodash-es',             // 600+ modules → 1
      'date-fns',              // Many sub-modules
      'framer-motion',         // Large ESM with many imports
    ],

    // Exclude only small pure ESM
    exclude: ['nanoid'],

    // Keep auto-discovery enabled
    noDiscovery: false,

    // Wait for full crawl (recommended)
    holdUntilCrawlEnd: true,

    // Do NOT force in config (use --force CLI flag when needed)
    force: false,
  },
})
```
