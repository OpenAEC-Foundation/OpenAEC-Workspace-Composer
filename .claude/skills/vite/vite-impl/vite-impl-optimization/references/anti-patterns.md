# Dependency Optimization Anti-Patterns

Common mistakes when configuring Vite dependency pre-bundling, with explanations and fixes.

---

## AP-1: Excluding CJS Dependencies

### The Mistake

```javascript
// WRONG: Excluding a CommonJS package from pre-bundling
export default defineConfig({
  optimizeDeps: {
    exclude: ['react'],  // react is CJS!
  },
})
```

### Why It Fails

The browser ONLY understands ESM. When you exclude a CJS dependency, Vite serves the raw CJS code to the browser, which cannot parse `require()` or `module.exports`. You get:

```
Uncaught SyntaxError: The requested module does not provide an export named 'default'
```

### The Fix

**NEVER** exclude CJS dependencies. Let the pre-bundler convert them:

```javascript
export default defineConfig({
  optimizeDeps: {
    // Do NOT list CJS deps in exclude
    // If needed, explicitly include them:
    include: ['react'],
  },
})
```

---

## AP-2: Using force: true in Config Permanently

### The Mistake

```javascript
// WRONG: Permanent cache disable
export default defineConfig({
  optimizeDeps: {
    force: true,
  },
})
```

### Why It Is Wrong

This re-bundles ALL dependencies on EVERY dev server start. Pre-bundling takes seconds for small projects but can take 10-30 seconds for large dependency trees. You lose the entire benefit of caching.

### The Fix

Use the CLI flag `--force` only when needed, not the config option:

```bash
# One-time force re-bundle
vite --force

# Then normal starts use cache
vite
```

If you committed `force: true` to fix a one-time issue, remove it immediately after.

---

## AP-3: Using noDiscovery Without Complete Include List

### The Mistake

```javascript
// WRONG: Disabled discovery but forgot dependencies
export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: ['react', 'react-dom'],
    // Missing: react-router-dom, axios, date-fns, etc.
  },
})
```

### Why It Fails

With `noDiscovery: true`, Vite ONLY pre-bundles what is in `include`. Every other bare import fails at runtime:

```
[vite] Pre-transform error: Failed to resolve import "axios" from "src/api.ts"
```

### The Fix

Either keep `noDiscovery: false` (default) or EXHAUSTIVELY list every dependency:

```javascript
export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'date-fns',
      // EVERY bare import must be listed
    ],
  },
})
```

**ALWAYS** prefer automatic discovery unless you have a measured performance reason to disable it.

---

## AP-4: Ignoring Linked Monorepo Dependencies

### The Mistake

```javascript
// WRONG: No include for CJS linked package
// packages/app/vite.config.js
export default defineConfig({
  // @myorg/utils is linked from workspace but ships CJS
  // No optimizeDeps config → browser gets raw CJS
})
```

### Why It Fails

Vite auto-detects linked packages and treats them as source code (skips pre-bundling). If the linked package ships CJS instead of ESM, the browser receives unconverted CJS.

### The Fix

ALWAYS add linked CJS packages to `include`:

```javascript
export default defineConfig({
  optimizeDeps: {
    include: ['@myorg/utils'],
  },
})
```

For linked ESM packages, no action is needed -- Vite handles them correctly.

---

## AP-5: Excluding Dependencies with CJS Transitive Dependencies

### The Mistake

```javascript
// WRONG: Excluding a package whose internal deps are CJS
export default defineConfig({
  optimizeDeps: {
    exclude: ['my-esm-wrapper'],  // wraps a CJS package internally
  },
})
```

### Why It Fails

Even if `my-esm-wrapper` itself is ESM, if it imports CJS packages internally, those CJS imports fail when served unbundled to the browser. The pre-bundler needs to process the entire dependency tree together.

### The Fix

Only exclude packages that are pure ESM all the way down:

```javascript
export default defineConfig({
  optimizeDeps: {
    exclude: ['nanoid'],  // Pure ESM, zero CJS transitive deps
  },
})
```

When in doubt, do NOT exclude. Let the pre-bundler handle it.

---

## AP-6: Not Restarting After Linked Dependency Changes

### The Mistake

```
1. Edit code in linked workspace package
2. Expect HMR to pick up changes
3. Wonder why old code still runs
```

### Why It Fails

Linked dependencies are NOT watched by HMR in the same way as source files. Changes to linked packages may require cache invalidation.

### The Fix

After changing linked dependency code:

```bash
# Restart with --force to clear dep cache
vite --force
```

---

## AP-7: Adding Same Dependency to Both Include and Exclude

### The Mistake

```javascript
// WRONG: Contradictory configuration
export default defineConfig({
  optimizeDeps: {
    include: ['some-package'],
    exclude: ['some-package'],
  },
})
```

### Why It Is Wrong

The behavior is undefined and confusing. In practice, `include` typically wins, but this signals a configuration error and makes the intent unclear.

### The Fix

Decide: does the package need pre-bundling or not? Use ONLY the appropriate list:

```javascript
// If it needs pre-bundling (CJS, many modules):
optimizeDeps: {
  include: ['some-package'],
}

// If it should be excluded (pure ESM, few modules):
optimizeDeps: {
  exclude: ['some-package'],
}
```

---

## AP-8: Not Clearing Browser Cache During Debugging

### The Mistake

```
1. Fix a dependency issue
2. Restart dev server with --force
3. Page still shows old behavior
4. Conclude the fix did not work
```

### Why It Fails

Pre-bundled dependencies are served with `Cache-Control: max-age=31536000,immutable`. The browser aggressively caches them. Even after server-side re-bundling, the browser may serve the old cached version.

### The Fix

When debugging dependency issues, ALWAYS:

1. Open DevTools > Network tab > check "Disable cache"
2. Restart dev server with `vite --force`
3. Hard-reload the page (Ctrl+Shift+R / Cmd+Shift+R)

---

## AP-9: Confusing Dev Pre-Bundling with Production Build

### The Mistake

```javascript
// WRONG: Adding optimizeDeps config to fix production build errors
export default defineConfig({
  optimizeDeps: {
    include: ['broken-in-prod-dep'],  // This does NOT affect production
  },
})
```

### Why It Is Wrong

`optimizeDeps` ONLY affects the development server. Production builds use Rolldown (v8) or Rollup (v5-v7) with different CJS handling (`@rollup/plugin-commonjs` in v5-v7, native Rolldown CJS support in v8).

### The Fix

For production build issues with CJS dependencies:

```javascript
// Vite 8+
export default defineConfig({
  build: {
    rolldownOptions: {
      // Production-specific CJS handling
    },
  },
})

// Vite 5-7
export default defineConfig({
  build: {
    rollupOptions: {
      // Production-specific CJS handling via @rollup/plugin-commonjs
    },
  },
})
```

---

## AP-10: Over-Including Dependencies

### The Mistake

```javascript
// WRONG: Including everything "just in case"
export default defineConfig({
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'lodash-es', 'date-fns', 'axios',
      'tiny-util-a', 'tiny-util-b', 'tiny-util-c',
      // ... 50 more packages
    ],
  },
})
```

### Why It Is Wrong

Vite's automatic discovery handles most dependencies correctly. Over-including:
- Slows down initial pre-bundling (more work for the bundler)
- Makes the config harder to maintain
- Masks actual discovery issues that should be investigated

### The Fix

Only include dependencies that NEED explicit inclusion:

```javascript
export default defineConfig({
  optimizeDeps: {
    include: [
      'lodash-es',     // 600+ modules → performance reason
      '@myorg/utils',  // Linked CJS → discovery cannot find it
    ],
    // Let auto-discovery handle everything else
  },
})
```

**Rule**: If automatic discovery works for a dependency, do NOT add it to `include`.

---

## Anti-Pattern Summary Table

| # | Anti-Pattern | Consequence | Fix |
|---|-------------|-------------|-----|
| AP-1 | Exclude CJS deps | Browser SyntaxError | Never exclude CJS |
| AP-2 | `force: true` in config | Slow every start | Use `--force` CLI flag |
| AP-3 | `noDiscovery` without full list | Runtime import failures | Keep discovery on or list all |
| AP-4 | Ignore linked CJS deps | Browser gets raw CJS | Add to include |
| AP-5 | Exclude deps with CJS internals | Transitive CJS fails | Only exclude pure ESM |
| AP-6 | No restart after linked dep change | Stale cached code | Restart with --force |
| AP-7 | Same dep in include AND exclude | Undefined behavior | Choose one list |
| AP-8 | Skip browser cache clear | Old code persists | Disable cache + hard reload |
| AP-9 | optimizeDeps for production fixes | No effect on prod | Use build.rolldownOptions |
| AP-10 | Over-including deps | Slow pre-bundling | Only include when needed |
