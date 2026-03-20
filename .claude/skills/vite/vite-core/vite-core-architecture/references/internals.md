# Vite Architecture Internals

## Version Evolution Table

### Complete Internal Tools Matrix

| Version | Dev Transform | Dev Pre-bundling | Production Bundler | CSS Minification | JS Minifier | Config Option |
|---------|--------------|------------------|--------------------|------------------|-------------|--------------|
| Vite 5 | esbuild | esbuild | Rollup | esbuild | esbuild | `build.rollupOptions`, `esbuild` |
| Vite 6 | esbuild | esbuild | Rollup | esbuild or lightningcss | esbuild | `build.rollupOptions`, `esbuild` |
| Vite 7 | esbuild | esbuild | Rollup | esbuild or lightningcss | esbuild | `build.rollupOptions`, `esbuild` |
| Vite 8 | **Oxc** | **Rolldown** | **Rolldown** | **Lightning CSS** | **Oxc** | `build.rolldownOptions`, `oxc` |

### What Changed in v8

- **Oxc replaces esbuild** for dev transforms: `oxc` config option replaces `esbuild` config option. The `esbuild` option is deprecated and converted internally to `oxc`.
- **Rolldown replaces Rollup** for production bundling: `build.rolldownOptions` replaces `build.rollupOptions`. The old option is deprecated.
- **Rolldown replaces esbuild** for dependency pre-bundling: `optimizeDeps.rolldownOptions` replaces `optimizeDeps.esbuildOptions`.
- **Lightning CSS** becomes the default CSS minifier.
- **Oxc Minifier** is 30-90x faster than Terser for JS minification. `build.minify` defaults to `'oxc'` (v8) instead of `'esbuild'` (v5-7).
- **esbuild is no longer a direct dependency**. Install it manually if plugins require it.

### Migration Config Changes

```typescript
// Vite 5-7
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    rollupOptions: {
      output: { manualChunks: { vendor: ['react', 'react-dom'] } },
    },
  },
})

// Vite 8
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  build: {
    rolldownOptions: {
      output: { manualChunks: { vendor: ['react', 'react-dom'] } },
    },
  },
})
```

---

## Module Graph

### Dev Server Module Resolution

When the browser requests a module, Vite builds a module graph on-demand:

```
Browser requests /src/main.ts
  → Vite transforms TypeScript to JavaScript
  → Returns ES module with import statements
  → Browser parses imports, requests each dependency:
      /src/App.tsx
      /src/utils/helpers.ts
      /node_modules/.vite/deps/react.js  (pre-bundled)
```

Key characteristics:
- **On-demand**: Modules are only processed when requested by the browser
- **Cached**: Transformed modules are cached; only re-transformed when source changes
- **HMR-aware**: The module graph tracks import relationships for precise hot updates

### Pre-bundled Dependencies

Dependencies from `node_modules` are handled differently from source code:

1. Vite crawls source code to discover bare imports (e.g., `import React from 'react'`)
2. Pre-bundling converts CommonJS/UMD packages to ESM
3. Packages with many internal modules are consolidated (lodash-es: 600+ modules → 1 module)
4. Results cached in `node_modules/.vite/` with aggressive HTTP caching (`max-age=31536000,immutable`)
5. Version query strings (`?v=abc123`) ensure cache invalidation on updates

### Cache Invalidation Triggers

The pre-bundling cache in `node_modules/.vite/` is automatically invalidated when:

| Trigger | Example |
|---------|---------|
| Lockfile changes | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` modified |
| Vite config changes | `vite.config.ts` modified |
| NODE_ENV changes | Switching between development/production |
| Patches folder changes | Files in `patches/` directory modified |
| Manual force | `vite --force` or `optimizeDeps.force: true` |

---

## Build Pipeline Details

### Production Build Steps

1. **Entry resolution**: Start from `index.html` (or `build.rollupOptions.input` / `build.rolldownOptions.input`)
2. **Module graph traversal**: Resolve all `import` statements recursively
3. **Plugin transforms**: Apply all plugin `transform` hooks (JSX, TypeScript, CSS modules, Vue SFC, etc.)
4. **Code splitting**: Automatic chunk splitting at dynamic `import()` boundaries
5. **Tree shaking**: Remove unused exports (dead code elimination)
6. **JS minification**: Oxc (v8) or esbuild (v5-7) — configurable via `build.minify`
7. **CSS processing**: Extract, minify, and code-split CSS
8. **Asset processing**: Hash filenames for cache busting, inline small assets (< 4 KiB by default)
9. **Output**: Write to `dist/` (configurable via `build.outDir`)

### Output Structure

```
dist/
├── index.html                          # Processed HTML with hashed asset references
├── assets/
│   ├── index-BRBmoGS9.js              # Main JS chunk (hashed)
│   ├── index-5UjPuW-k.css             # Main CSS (hashed)
│   ├── vendor-B7PI925R.js             # Vendor chunk (if code-split)
│   └── logo-a1b2c3d4.png             # Processed assets (hashed)
└── .vite/
    ├── manifest.json                   # Asset manifest (if build.manifest: true)
    └── ssr-manifest.json               # SSR manifest (if build.ssrManifest: true)
```

### Build Manifest

When `build.manifest: true`, Vite generates `.vite/manifest.json` mapping source files to hashed outputs:

```json
{
  "src/main.ts": {
    "file": "assets/index-BRBmoGS9.js",
    "src": "src/main.ts",
    "isEntry": true,
    "imports": ["_vendor-B7PI925R.js"],
    "css": ["assets/index-5UjPuW-k.css"]
  }
}
```

ManifestChunk properties: `src`, `file`, `css`, `assets`, `isEntry`, `name`, `isDynamicEntry`, `imports`, `dynamicImports`.

---

## Monorepo Considerations

### Linked Dependencies

In monorepos, linked packages from the workspace are treated as **source code** (not pre-bundled). However, if a linked package is NOT ESM, it MUST be added to `optimizeDeps.include`:

```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['linked-non-esm-package'],
  },
})
```

### Deduplication

Use `resolve.dedupe` to force shared dependencies to resolve to the same copy:

```typescript
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
```

This prevents duplicate React instances in monorepos where multiple packages depend on React.
