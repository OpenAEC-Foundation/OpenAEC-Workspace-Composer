# Error Catalog: Dependency Pre-Bundling

Complete catalog of Vite dependency pre-bundling errors organized by error type.

---

## CJS/ESM Conversion Errors

### ERR-DEP-001: Named Import from CJS Package Fails

**Error message:**
```
SyntaxError: The requested module '/node_modules/.vite/deps/some-package.js'
does not provide an export named 'namedExport'
```

**Cause:** The package uses CommonJS `module.exports = { namedExport }`. Vite's smart import analysis usually handles this, but complex dynamic exports or conditional assignments can fail.

**Fix — Option A (restructure import):**
```typescript
// BROKEN: Named import from CJS that Vite cannot analyze
import { namedExport } from 'some-cjs-package'

// FIXED: Import default, then destructure
import pkg from 'some-cjs-package'
const { namedExport } = pkg
```

**Fix — Option B (force pre-bundling):**
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['some-cjs-package'],
  },
})
```

**Fix — Option C (force interop):**
```typescript
// vite.config.ts — experimental
export default defineConfig({
  optimizeDeps: {
    needsInterop: ['some-cjs-package'],
  },
})
```

---

### ERR-DEP-002: `require is not defined` in Browser

**Error message:**
```
Uncaught ReferenceError: require is not defined
```

**Cause:** A CJS dependency was excluded from pre-bundling via `optimizeDeps.exclude`, so the raw CJS code is served to the browser.

**Fix:**
```typescript
// BROKEN
export default defineConfig({
  optimizeDeps: {
    exclude: ['cjs-package'],  // NEVER exclude CJS packages
  },
})

// FIXED: Remove from exclude list entirely
export default defineConfig({
  optimizeDeps: {
    // Do NOT list CJS packages here
    exclude: ['already-esm-only-package'],
  },
})
```

**Rule:** NEVER add a CJS package to `optimizeDeps.exclude`. The browser cannot execute CommonJS. Only exclude packages that are already valid ESM and small enough to not benefit from pre-bundling.

---

### ERR-DEP-003: Default Export Mismatch

**Error message:**
```
TypeError: somePackage is not a function
// or
TypeError: somePackage.default is not a function
```

**Cause:** CJS package uses `module.exports = function(){}` but ESM interop wraps it as `{ default: function(){} }`. Consumer code expects different shape.

**Fix:**
```typescript
// If package exports a function directly via module.exports:
import pkg from 'some-package'
pkg()  // Call the default

// NOT:
import { default as pkg } from 'some-package'
// This may double-wrap depending on interop behavior
```

**Version note (Vite 8):** Rolldown handles CJS interop differently from esbuild. If upgrading from v5–v7, test all CJS default imports. Vite 8 applies consistent `default` handling — ALWAYS check if `pkg.default` is the actual export.

---

## Missing Dependency Discovery Errors

### ERR-DEP-004: Import from Plugin Transform Not Found

**Error message:**
```
[vite] Internal server error: Failed to resolve import "virtual-dep"
from "src/component.tsx"
```

**Cause:** Vite discovers dependencies by crawling static source code. If a plugin's `transform` hook injects a new `import` statement, Vite does not see it during the initial crawl.

**Fix:**
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['virtual-dep'],  // Explicitly include plugin-generated imports
  },
})
```

**Detection:** Check the terminal output during startup. Vite logs discovered dependencies. If the failing import is NOT in the list, it was missed by auto-discovery.

---

### ERR-DEP-005: Dynamic Import Not Discovered

**Error message:**
```
[vite] New dependencies found: some-package, optimizing...
```
(followed by a full page reload)

**Cause:** A dependency was imported dynamically or conditionally, so it was not found during the initial static crawl. Vite re-bundles and reloads, which is disruptive.

**Fix:**
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['some-package'],  // Pre-discover to avoid reload
  },
})
```

---

## Monorepo and Linked Dependency Errors

### ERR-DEP-006: Linked Dep Not Exporting ESM

**Error message:**
```
SyntaxError: Unexpected token 'export'
// or
SyntaxError: Cannot use import statement outside a module
```

**Cause:** In a monorepo, Vite treats linked packages (symlinked from workspace) as source code, not as `node_modules` dependencies. If the linked package only exports CJS, Vite serves it raw — causing ESM parse errors.

**Fix:**
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['@my-org/shared-utils'],  // Force pre-bundling of linked CJS dep
  },
})
```

**Prevention:** ALWAYS configure linked dependencies to export ESM. If that is not possible, ALWAYS add them to `optimizeDeps.include`.

---

### ERR-DEP-007: Linked Dep Changes Not Reflected

**Symptom:** You modify source code in a linked monorepo package, but the dev server still serves the old version.

**Cause:** Linked deps are not watched for changes the same way as project source files. The pre-bundled cache may hold stale content.

**Fix:**
```bash
# Restart with --force to re-bundle all deps
vite --force
```

**Alternative — configure file watching:**
```typescript
export default defineConfig({
  server: {
    watch: {
      // Watch linked package directories
      ignored: ['!**/node_modules/@my-org/**'],
    },
  },
})
```

---

## Cache Errors

### ERR-DEP-008: Stale Pre-Bundle Cache

**Symptom:** Dev server starts but modules contain outdated code or wrong versions.

**Cause:** The `node_modules/.vite` cache was not invalidated. This happens when:
- You manually edited files in `node_modules/`
- You used `npm link` or `yarn link` without restarting
- A patch was applied outside the normal `patches/` folder

**Fix — Step 1:** Delete the cache:
```bash
rm -rf node_modules/.vite
```

**Fix — Step 2:** Restart with force flag:
```bash
vite --force
```

**Fix — Step 3:** Clear browser cache:
- Open DevTools → Network tab → check "Disable cache"
- Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)

---

### ERR-DEP-009: Browser Serves Immutable Cached Version

**Symptom:** Network tab shows `200 (from disk cache)` for a dependency that should have changed. Server restart does not help.

**Cause:** Pre-bundled deps are served with `Cache-Control: max-age=31536000,immutable`. The browser caches them aggressively. The version query string (`?v=abc123`) MUST change for the browser to fetch a new version.

**Fix:**
1. Open DevTools → Network tab
2. Check "Disable cache"
3. Run `vite --force` to generate new version hashes
4. Reload the page

**Prevention:** NEVER manually edit `node_modules/` without running `vite --force` afterward. Use `patch-package` or `pnpm patch` instead — Vite detects patches folder changes automatically.

---

## Performance Errors

### ERR-DEP-010: Slow Startup from Large Dependency Tree

**Symptom:** Dev server takes 10+ seconds to start. Network tab shows hundreds of individual module requests.

**Cause:** An ESM dependency with many internal modules (e.g., `lodash-es` has 600+ modules) is not being pre-bundled. Each internal module becomes a separate HTTP request.

**Detection:**
1. Open DevTools → Network tab
2. Filter by the dependency name
3. Count the number of requests

**Fix:**
```typescript
export default defineConfig({
  optimizeDeps: {
    include: [
      'lodash-es',           // 600+ modules → 1 module
      '@mui/material',       // Large component libraries
      'rxjs',                // Many internal modules
    ],
  },
})
```

---

### ERR-DEP-011: Repeated Re-Bundling During Development

**Symptom:** Vite logs "New dependencies found, optimizing..." repeatedly, causing page reloads.

**Cause:** Dependencies are discovered incrementally as you navigate the app. Each new discovery triggers re-bundling.

**Fix:**
```typescript
export default defineConfig({
  optimizeDeps: {
    include: [
      // List ALL dependencies used across your app
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      // Add any dep that triggers "New dependencies found" log
    ],
  },
})
```

**Alternative — hold until crawl completes:**
```typescript
export default defineConfig({
  optimizeDeps: {
    holdUntilCrawlEnd: true,  // Default: true. Ensures static crawl finishes first.
  },
})
```

---

## Configuration Errors

### ERR-DEP-012: Wrong Engine Options for Vite Version

**Error message:**
```
[vite] Unknown option: optimizeDeps.esbuildOptions
```
(Vite 8, where esbuild is replaced by Rolldown)

**Cause:** Using `optimizeDeps.esbuildOptions` in Vite 8, which uses Rolldown for pre-bundling.

**Fix:**
```typescript
// Vite 5–7
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: { target: 'es2020' },
  },
})

// Vite 8+
export default defineConfig({
  optimizeDeps: {
    rolldownOptions: {
      plugins: [/* Rolldown plugins */],
    },
  },
})
```

**Note:** Vite 8 internally converts `esbuildOptions` to `rolldownOptions` with a deprecation warning. ALWAYS migrate to the correct key for your version.

---

### ERR-DEP-013: optimizeDeps.entries Misconfiguration

**Error message:**
```
[vite] No dependencies found during pre-bundling
```

**Cause:** Custom `optimizeDeps.entries` points to wrong files or uses incorrect patterns.

**Fix:**
```typescript
// BROKEN: Literal file path in Vite 7+ (must be glob)
export default defineConfig({
  optimizeDeps: {
    entries: ['src/main.ts'],  // Fails in v7+
  },
})

// FIXED: Use glob pattern
export default defineConfig({
  optimizeDeps: {
    entries: ['src/**/*.ts'],  // Glob pattern
  },
})
```

**Note (Vite 7+):** `optimizeDeps.entries` ALWAYS receives globs, not literal paths. This changed from Vite 6.
