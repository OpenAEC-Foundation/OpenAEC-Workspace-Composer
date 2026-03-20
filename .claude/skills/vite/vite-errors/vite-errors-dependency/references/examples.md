# Examples: Dependency Error Scenarios

Real-world error scenarios with step-by-step diagnosis and resolution.

---

## Scenario 1: React Named Imports Fail from CJS

**Setup:** New Vite project with React (CJS version).

**Error:**
```
SyntaxError: The requested module '/node_modules/.vite/deps/react.js'
does not provide an export named 'useState'
```

**Diagnosis:**
1. React publishes CJS (`module.exports = React`)
2. Vite's smart import analysis normally handles this
3. If pre-bundling is broken or skipped, named imports fail

**Resolution:**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
```

Then restart:
```bash
vite --force
```

**Verification:** Open DevTools Network tab. Confirm `react.js` loads as a single pre-bundled module from `node_modules/.vite/deps/`.

---

## Scenario 2: lodash-es Causes 600+ HTTP Requests

**Setup:** Project imports `debounce` from `lodash-es`.

**Symptom:** Page load takes 8+ seconds. Network tab shows 634 individual module requests.

**Diagnosis:**
1. `lodash-es` is a valid ESM package with 600+ internal modules
2. Each internal module is a separate file request in dev
3. Vite does not pre-bundle it by default because it is valid ESM

**Resolution:**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['lodash-es'],
  },
})
```

**Before:** 634 HTTP requests, 8s load time
**After:** 1 HTTP request for lodash-es, <1s load time

---

## Scenario 3: Plugin-Generated Import Not Found

**Setup:** Using a Vite plugin that transforms `.graphql` files and injects `import { gql } from 'graphql-tag'`.

**Error:**
```
[vite] Internal server error: Failed to resolve import "graphql-tag"
```

**Diagnosis:**
1. The plugin's `transform` hook adds the import AFTER Vite's dependency crawl
2. `graphql-tag` is installed in `node_modules` but Vite never discovered it
3. Auto-discovery only analyzes static source files, not plugin output

**Resolution:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [graphqlPlugin()],
  optimizeDeps: {
    include: ['graphql-tag'],  // Pre-discover what plugins will import
  },
})
```

---

## Scenario 4: Monorepo Linked Package Breaks

**Setup:** Monorepo with `packages/shared` linked to `apps/web`. The shared package only builds to CJS.

**Error:**
```
Uncaught SyntaxError: Unexpected token 'exports'
```

**Diagnosis:**
1. `packages/shared` is symlinked into `apps/web/node_modules/@myorg/shared`
2. Vite detects it as a linked dep and skips pre-bundling
3. The raw CJS code (`exports.foo = ...`) is served to the browser
4. Browser cannot parse CJS syntax

**Resolution — Option A (recommended: fix the package):**
```json
// packages/shared/package.json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

**Resolution — Option B (force pre-bundling):**
```typescript
// apps/web/vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['@myorg/shared'],
  },
})
```

---

## Scenario 5: Stale Cache After Manual node_modules Edit

**Setup:** Developer patches a bug directly in `node_modules/some-lib/index.js` for quick testing.

**Symptom:** Changes not visible in the browser. Even after dev server restart, the old code runs.

**Diagnosis:**
1. Developer edited `node_modules/some-lib/index.js` directly
2. Vite's pre-bundled cache in `node_modules/.vite` still holds the old version
3. Browser cache holds the old pre-bundled version with `immutable` header
4. Neither Vite nor the browser knows the file changed

**Resolution — Step by step:**
```bash
# Step 1: Clear Vite's file system cache
rm -rf node_modules/.vite

# Step 2: Restart with force flag
vite --force

# Step 3: Clear browser cache
# Open DevTools → Network → check "Disable cache"
# Hard reload: Ctrl+Shift+R
```

**Prevention:** NEVER edit `node_modules/` directly. Use `patch-package` or `pnpm patch` instead:
```bash
# patch-package workflow
npx patch-package some-lib
# Creates patches/some-lib+1.0.0.patch
# Vite detects patches/ changes automatically
```

---

## Scenario 6: Upgrading from Vite 7 to Vite 8 Breaks Pre-Bundling Config

**Setup:** Project uses `optimizeDeps.esbuildOptions` with custom plugins.

**Error:**
```
[vite] [DEPRECATION] optimizeDeps.esbuildOptions has been replaced by
optimizeDeps.rolldownOptions
```

**Diagnosis:**
1. Vite 8 replaced esbuild with Rolldown for pre-bundling
2. `esbuildOptions` is deprecated and internally converted
3. esbuild-specific plugins do NOT work with Rolldown

**Resolution:**
```typescript
// BEFORE (Vite 5–7)
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      plugins: [esbuildPluginFoo()],
    },
  },
})

// AFTER (Vite 8)
export default defineConfig({
  optimizeDeps: {
    rolldownOptions: {
      plugins: [rolldownPluginFoo()],  // Must use Rolldown-compatible plugins
    },
  },
})
```

**Key difference:** esbuild plugins are NOT compatible with Rolldown. Find Rolldown equivalents or use Vite plugins instead.

---

## Scenario 7: Repeated "New Dependencies Found" Page Reloads

**Setup:** Large app with 50+ route-based code splits. Each navigation discovers new deps.

**Symptom:**
```
[vite] New dependencies found: @emotion/react, optimizing...
[vite] New dependencies found: @mui/icons-material, optimizing...
[vite] ✨ optimized dependencies changed. reloading
```

**Diagnosis:**
1. Dependencies used only in lazy-loaded routes are not discovered during initial crawl
2. As user navigates, new deps trigger re-bundling and page reload
3. Each reload loses application state

**Resolution:**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: [
      // List ALL deps used across the entire app, including lazy routes
      'react',
      'react-dom',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
      '@tanstack/react-query',
    ],
  },
})
```

**Detection tip:** Run `vite --force` and navigate through ALL routes once. Collect every "New dependencies found" log entry. Add all of them to `include`.

---

## Scenario 8: optimizeDeps.exclude Breaks a CJS Dependency

**Setup:** Developer excludes a package thinking it will speed up startup.

**Config:**
```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['moment'],  // moment is CJS-only
  },
})
```

**Error:**
```
Uncaught ReferenceError: require is not defined
```

**Diagnosis:**
1. `moment` is a CJS package using `require()` and `module.exports`
2. Excluding it from pre-bundling means raw CJS is served to the browser
3. Browsers do not support `require()`

**Resolution:**
```typescript
// REMOVE moment from exclude
export default defineConfig({
  optimizeDeps: {
    // exclude: ['moment'],  // REMOVED — CJS MUST be pre-bundled
  },
})
```

**Rule:** ONLY exclude packages that are:
1. Already valid ESM
2. Small (do not benefit from collapsing internal modules)
3. Must remain unbundled for a specific technical reason (e.g., worker loading)

---

## Scenario 9: Deep Import Optimization for Component Libraries

**Setup:** Using a large UI library with deep imports like `@ant-design/icons-vue`.

**Symptom:** Hundreds of requests for individual icon components on first load.

**Resolution:**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: [
      '@ant-design/icons-vue',
      // Use deep import glob for selective optimization
      '@mui/material/Button',
      '@mui/material/TextField',
      // Or optimize the entire library
      '@mui/material',
    ],
  },
})
```

---

## Scenario 10: noDiscovery Mode for Controlled Optimization

**Setup:** CI environment where you want deterministic, fast startup without dependency crawling.

**Resolution:**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,  // Disable automatic crawling
    include: [
      // Explicitly list EVERY dependency
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
    ],
  },
})
```

**Warning:** If you miss a dependency in the `include` list with `noDiscovery: true`, that dependency will NOT be pre-bundled. This causes runtime errors for CJS deps or performance degradation for large ESM deps.
