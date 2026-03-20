# Anti-Patterns: Dependency Optimization Mistakes

Common mistakes when configuring Vite's dependency pre-bundling, with explanations of WHY they fail and what to do instead.

---

## AP-001: Excluding CJS Dependencies from Pre-Bundling

**The mistake:**
```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['moment', 'lodash', 'jquery'],
  },
})
```

**Why it fails:** CJS packages use `require()` and `module.exports`. Browsers cannot execute CJS. Pre-bundling converts CJS to ESM. Excluding a CJS package bypasses this conversion, serving raw CJS to the browser.

**Error you will see:**
```
Uncaught ReferenceError: require is not defined
```

**Correct approach:** NEVER exclude CJS packages. Only exclude packages that are already valid ESM and do not benefit from pre-bundling.

---

## AP-002: Assuming Pre-Bundling Affects Production

**The mistake:** Debugging a production build error by changing `optimizeDeps` configuration.

**Why it fails:** Pre-bundling is a development-only optimization. Production builds use Rollup (v5–v7) or Rolldown (v8) directly. The `optimizeDeps` config has ZERO effect on `vite build` output.

**Correct approach:** For production CJS issues, check:
- `build.commonjsOptions` (Vite 5–7, Rollup's `@rollup/plugin-commonjs`)
- `build.rolldownOptions` (Vite 8, native CJS handling)

---

## AP-003: Deleting node_modules/.vite Without Clearing Browser Cache

**The mistake:**
```bash
rm -rf node_modules/.vite
vite
# "It still shows old code!"
```

**Why it fails:** Pre-bundled dependencies are served with `Cache-Control: max-age=31536000,immutable`. The browser never re-requests them until the version query string changes. Deleting the server cache generates new hashes, but if the browser still holds the old response, it never checks.

**Correct approach:**
```bash
rm -rf node_modules/.vite
vite --force
# Then in browser: DevTools → Network → "Disable cache" → Hard reload
```

---

## AP-004: Adding Everything to optimizeDeps.include

**The mistake:**
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['**'],  // "Optimize everything!"
  },
})
```

**Why it fails:** Pre-bundling YOUR source code breaks HMR. Vite is designed to serve your source code as unbundled ESM for instant hot updates. Pre-bundling your own modules defeats the purpose of Vite's dev server.

**Correct approach:** ONLY include:
- CJS/UMD packages that need ESM conversion
- ESM packages with many internal modules (performance)
- Dependencies imported via plugin transforms (discovery gap)
- Linked monorepo packages that do not export ESM

---

## AP-005: Using optimizeDeps.force in vite.config.ts Permanently

**The mistake:**
```typescript
export default defineConfig({
  optimizeDeps: {
    force: true,  // "Always re-bundle to avoid cache issues"
  },
})
```

**Why it fails:** This re-bundles ALL dependencies on every dev server start. For large projects with many dependencies, this adds 5-30 seconds to every startup. It defeats the purpose of caching.

**Correct approach:** Use `--force` as a CLI flag when needed, not as a permanent config:
```bash
# One-time force rebuild
vite --force

# Normal development (uses cache)
vite
```

---

## AP-006: Ignoring "New Dependencies Found" Warnings

**The mistake:** Seeing `[vite] New dependencies found: X, optimizing...` repeatedly and doing nothing about it.

**Why it fails:** Each re-discovery triggers re-bundling and a full page reload. This destroys application state and slows development. The warnings indicate gaps in dependency discovery.

**Correct approach:** Add EVERY dependency that triggers this warning to `optimizeDeps.include`:
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['dep-from-warning-1', 'dep-from-warning-2'],
  },
})
```

---

## AP-007: Using esbuildOptions in Vite 8

**The mistake:**
```typescript
// Vite 8 project
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      plugins: [myEsbuildPlugin()],
    },
  },
})
```

**Why it fails:** Vite 8 uses Rolldown for pre-bundling, not esbuild. The `esbuildOptions` key is deprecated and internally converted, but esbuild plugins are NOT compatible with Rolldown. Plugin-level configuration silently breaks.

**Correct approach:**
```typescript
// Vite 8
export default defineConfig({
  optimizeDeps: {
    rolldownOptions: {
      plugins: [myRolldownPlugin()],
    },
  },
})
```

---

## AP-008: Excluding a Dependency to Fix a Bug in It

**The mistake:**
```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['buggy-lib'],  // "Maybe pre-bundling is causing the bug"
  },
})
```

**Why it fails:** If `buggy-lib` is CJS, excluding it causes `require is not defined`. If it is ESM with many modules, excluding it causes hundreds of HTTP requests and slow startup. Excluding rarely fixes bugs — it usually creates new ones.

**Correct approach:** If you suspect pre-bundling causes a bug:
1. Run `vite --force` to rebuild the cache
2. Check the pre-bundled output in `node_modules/.vite/deps/buggy-lib.js`
3. If the bundled output is genuinely broken, file a bug on Vite's GitHub

---

## AP-009: Not Configuring Linked Deps in Monorepos

**The mistake:** Setting up a monorepo with workspace packages and expecting everything to work automatically.

**Why it fails:** Vite detects linked packages and treats them as source code (not dependencies). If a linked package exports CJS, Vite serves the raw CJS to the browser. If a linked package has its own deep dependency tree, those nested deps may not be discovered.

**Correct approach:**
```typescript
// apps/web/vite.config.ts in a monorepo
export default defineConfig({
  optimizeDeps: {
    include: [
      '@myorg/shared-utils',      // CJS linked package
      '@myorg/ui > lodash-es',    // Nested dep of linked package
    ],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],  // Prevent duplicate React instances
  },
})
```

---

## AP-010: Using noDiscovery Without Complete Include List

**The mistake:**
```typescript
export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: ['react'],  // Forgot react-dom, react-router, etc.
  },
})
```

**Why it fails:** `noDiscovery: true` disables automatic dependency crawling. ONLY packages in `include` are pre-bundled. Any omitted CJS package causes runtime errors. Any omitted large ESM package causes performance degradation.

**Correct approach:** When using `noDiscovery`, ALWAYS list every single dependency:
```typescript
export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'date-fns',
      // EVERY dependency your app imports
    ],
  },
})
```

**Better approach:** Avoid `noDiscovery` unless you have a specific reason (e.g., reproducible CI builds). Auto-discovery works well for most projects.

---

## AP-011: Manually Editing node_modules Without patch-package

**The mistake:** Editing files directly in `node_modules/` to fix a bug or test a change.

**Why it fails:**
1. Changes are invisible to Vite's cache invalidation system
2. Pre-bundled cache holds the old version
3. Browser cache holds the old version with `immutable` header
4. `npm install` or `yarn install` overwrites your changes

**Correct approach:** Use `patch-package` or `pnpm patch`:
```bash
# Make your edit in node_modules/some-lib/index.js, then:
npx patch-package some-lib
# Creates patches/some-lib+1.0.0.patch

# Vite detects patches/ folder changes and auto-invalidates cache
```

---

## AP-012: Mixing Development and Production Debugging

**The mistake:** Seeing an import error in the browser and checking production build config, or seeing a build error and changing `optimizeDeps`.

**Why it fails:** Dev and production use completely different module resolution paths:

| Aspect | Development | Production |
|--------|------------|------------|
| CJS handling | Pre-bundling (esbuild/Rolldown) | `@rollup/plugin-commonjs` or Rolldown native |
| Module serving | Unbundled ESM over HTTP | Single bundled output |
| Cache | `node_modules/.vite` + browser cache | No runtime cache |
| Config | `optimizeDeps.*` | `build.*` |

**Correct approach:** ALWAYS identify whether the error occurs in dev or production FIRST, then look at the correct configuration section.
