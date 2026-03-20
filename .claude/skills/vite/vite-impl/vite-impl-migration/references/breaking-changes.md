# Breaking Changes Reference

Complete breaking changes for each Vite major version migration.

---

## Vite 5 to 6 Breaking Changes (10 Items)

### 1. Environment API

The Environment API introduces internal refactoring of how Vite handles different execution environments (client, SSR, custom). Plugin authors who accessed internal `server` properties MUST review their code. User-facing config is mostly unaffected.

**Impact**: Plugin authors (high), application developers (low).

### 2. Vite Runtime API Removed, Replaced by Module Runner

The `createViteRuntime` function is removed. Use `createServerModuleRunner` instead.

```javascript
// v5 (REMOVED):
import { createViteRuntime } from 'vite'
const runtime = await createViteRuntime(server)
const mod = await runtime.executeUrl('/src/entry.js')

// v6 (REPLACEMENT):
import { createServerModuleRunner } from 'vite'
const runner = createServerModuleRunner(server.environments.ssr)
const mod = await runner.import('/src/entry.js')
```

### 3. resolve.conditions Defaults Changed

Vite 6 explicitly defines default conditions for package.json `exports` resolution:

- **Client**: `['module', 'browser', 'development|production']`
- **SSR**: `['module', 'node', 'development|production']`

The `development|production` token is replaced at runtime based on `NODE_ENV`. If you were relying on implicit conditions, verify resolution behavior after upgrade.

### 4. json.stringify Default Changed to 'auto'

| Version | Default | Behavior |
|---------|---------|----------|
| Vite 5  | `false` | JSON imported as ES module with named exports |
| Vite 6  | `'auto'` | JSON files >10kB are stringified for performance |

```javascript
// Restore v5 behavior if needed:
export default defineConfig({
  json: { stringify: false },
})
```

### 5. HTML Asset Processing Extended

More HTML elements now process asset references (beyond `<script>`, `<link>`, `<img>`). This includes `<video>`, `<source>`, `<object>`, and other media elements. If you had raw URLs in these elements that should NOT be processed, use the `?url` suffix or move them to `public/`.

### 6. PostCSS Config Loader Updated to v6

`postcss-load-config` upgraded from v4 to v6:

- **TypeScript configs**: `ts-node` is NO longer supported. ALWAYS use `tsx` or `jiti`.
- **ESM configs**: `.postcssrc.mjs` and `postcss.config.mjs` MUST use `export default` (not `module.exports`).

```bash
# Install tsx for PostCSS TypeScript configs
npm install -D tsx
```

### 7. Sass Modern API Is Default

| Version | Default Sass API | Legacy Available? |
|---------|-----------------|-------------------|
| Vite 5  | Legacy          | Yes (default)     |
| Vite 6  | Modern          | Yes (opt-in)      |
| Vite 7+ | Modern          | No (removed)      |

```javascript
// v6: Temporarily opt into legacy (prepare for v7 removal)
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: { api: 'legacy' },
    },
  },
})

// v6+: Use modern API (recommended)
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // Modern API uses `additionalData` the same way
        additionalData: `@use "src/styles/variables" as *;`,
      },
    },
  },
})
```

**Key modern API differences**:
- `@import` is deprecated in favor of `@use` and `@forward`
- Variables are namespaced by default
- `sass-embedded` package is recommended for performance

### 8. Library Mode CSS Filename

CSS output in library mode now uses the `name` field from `package.json` instead of the generic `style.css`.

```javascript
// If your library consumers import CSS directly, update your docs:
// v5: import 'my-lib/dist/style.css'
// v6: import 'my-lib/dist/my-lib.css'

// Or explicitly set cssFileName:
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      cssFileName: 'style', // Force 'style.css' name
    },
  },
})
```

### 9. build.cssMinify Enabled for SSR

CSS minification is now enabled by default for SSR builds. To restore v5 behavior:

```javascript
export default defineConfig({
  build: {
    cssMinify: false, // Disable for SSR if needed
  },
})
```

### 10. CommonJS strictRequires Default Changed

`strictRequires` changed from `'auto'` to `true`. This enforces stricter CommonJS require semantics. If CJS dependencies break, check their `exports` field or add them to `optimizeDeps.include`.

---

## Vite 6 to 7 Breaking Changes (5 Items)

### 1. Node.js 20.19+ or 22.12+ Required

Node.js 18 reached EOL and is no longer supported. ALWAYS verify before upgrading:

```bash
node --version
# MUST output v20.19.0+ or v22.12.0+
```

### 2. build.target Default Updated

Default changed to `'baseline-widely-available'`:

| Version | Default Target | Browser Versions |
|---------|---------------|-----------------|
| Vite 6  | `'modules'`   | es2020 capable browsers |
| Vite 7  | `'baseline-widely-available'` | Chrome 107, Edge 107, Firefox 104, Safari 16.0 |

```javascript
// Restore v6 behavior:
export default defineConfig({
  build: {
    target: 'modules',
  },
})
```

### 3. Sass Legacy API Completely Removed

The `api: 'legacy'` option no longer exists. All Sass compilation uses the modern API exclusively.

**Migration steps**:
1. Replace `@import` with `@use` and `@forward`
2. Update variable references to use namespaces
3. Install `sass-embedded` for best performance
4. Remove any `api: 'legacy'` from config

```bash
# Recommended: use sass-embedded for better performance
npm install -D sass-embedded
npm uninstall sass
```

### 4. splitVendorChunkPlugin Removed

The built-in `splitVendorChunkPlugin` is removed. Use manual chunking instead:

```javascript
// v6 (REMOVED):
import { splitVendorChunkPlugin } from 'vite'
export default defineConfig({
  plugins: [splitVendorChunkPlugin()],
})

// v7 (REPLACEMENT):
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
```

### 5. transformIndexHtml Hook Changes

Hook-level `enforce` and `transform` properties on `transformIndexHtml` are removed. ALWAYS use plugin-level `enforce` instead:

```javascript
// v6 (REMOVED):
{
  transformIndexHtml: {
    enforce: 'pre',
    transform(html) { return html },
  },
}

// v7 (REPLACEMENT):
{
  enforce: 'pre',
  transformIndexHtml(html) { return html },
}
```

### 6. optimizeDeps.entries Receives Globs

`optimizeDeps.entries` now ALWAYS receives glob patterns. Literal file paths are no longer accepted:

```javascript
// v6:
optimizeDeps: {
  entries: ['src/main.ts'],
}

// v7:
optimizeDeps: {
  entries: ['src/**/*.ts'],
}
```

---

## Vite 7 to 8 Breaking Changes (12 Items)

### 1. Rolldown Replaces Rollup

Rolldown is a Rust-based bundler that replaces Rollup as the production bundler. The config option changes accordingly:

```javascript
// v7:
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react'],
      output: { globals: { react: 'React' } },
    },
  },
})

// v8:
export default defineConfig({
  build: {
    rolldownOptions: {
      external: ['react'],
      output: { globals: { react: 'React' } },
    },
  },
})
```

`build.rollupOptions` still works but is deprecated and internally mapped to `rolldownOptions`.

### 2. Oxc Replaces esbuild

Oxc (Oxidation Compiler) replaces esbuild for JavaScript/TypeScript transformation:

```javascript
// v7:
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'es2020',
    drop: ['console', 'debugger'],
  },
})

// v8:
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

The `esbuild` option still works in v8 but is deprecated and converted internally.

### 3. Lightning CSS Is Default CSS Minifier

Lightning CSS replaces esbuild as the default CSS minification engine. No configuration change required unless you need specific Lightning CSS options:

```javascript
// Optional: configure Lightning CSS features
export default defineConfig({
  css: {
    lightningcss: {
      drafts: { customMedia: true },
    },
  },
})
```

### 4. Oxc Minifier Default (30-90x Faster Than Terser)

`build.minify` defaults to `'oxc'` for client builds. Terser and esbuild remain available:

```javascript
// Default (v8): 'oxc'
// To use terser instead:
export default defineConfig({
  build: {
    minify: 'terser',
  },
})
```

### 5. CommonJS Interop Consistency

Rolldown handles `default` imports from CommonJS modules differently than Rollup. If a CJS module exports `module.exports = { foo: 1 }`, the default import behavior may change. Test CJS dependency imports after upgrade.

### 6. Module Resolution Changes

Removed the format sniffing heuristic between `browser` and `module` fields in `package.json`. Resolution now follows a stricter algorithm. If specific packages fail to resolve, check their `package.json` exports configuration.

### 7. esbuild Is Now Optional

esbuild is no longer a direct dependency of Vite. If your plugins or custom code requires esbuild:

```bash
npm install -D esbuild
```

### 8. build.target Default Updated

| Version | Browsers |
|---------|----------|
| Vite 7  | Chrome 107, Edge 107, Firefox 104, Safari 16.0 |
| Vite 8  | Chrome 111, Edge 111, Firefox 114, Safari 16.4 |

### 9. import.meta.url Not Polyfilled in UMD/IIFE

`import.meta.url` is no longer polyfilled in UMD and IIFE output formats. If your library uses `import.meta.url` for asset references in UMD/IIFE builds, you MUST use an alternative approach (e.g., pass URLs as function parameters).

### 10. Object Form of manualChunks Removed

```javascript
// v7 (REMOVED):
output: {
  manualChunks: {
    vendor: ['react', 'react-dom'],
    utils: ['lodash', 'date-fns'],
  },
}

// v8 (REPLACEMENT):
output: {
  manualChunks(id) {
    if (id.includes('react')) return 'vendor'
    if (id.includes('lodash') || id.includes('date-fns')) return 'utils'
  },
}
```

### 11. Plugin Authors: moduleType Required

When a plugin's `load` or `transform` hook returns content that is not the original module type, you MUST specify `moduleType: 'js'`:

```javascript
// v7: Worked without moduleType
{
  name: 'my-plugin',
  transform(code, id) {
    if (id.endsWith('.custom')) {
      return { code: `export default ${JSON.stringify(code)}` }
    }
  },
}

// v8: MUST include moduleType
{
  name: 'my-plugin',
  transform(code, id) {
    if (id.endsWith('.custom')) {
      return {
        code: `export default ${JSON.stringify(code)}`,
        moduleType: 'js',
      }
    }
  },
}
```

### 12. build() API Throws BundleError

The programmatic `build()` function now throws a `BundleError` with structured error information instead of raw errors:

```javascript
// v7:
try {
  await build()
} catch (e) {
  console.error(e.message)
}

// v8:
try {
  await build()
} catch (e) {
  if (e.errors) {
    for (const error of e.errors) {
      console.log(error.code, error.message)
    }
  } else {
    console.error(e)
  }
}
```

---

## Node.js Compatibility Matrix

| Vite Version | Node.js 16 | Node.js 18 | Node.js 20 | Node.js 22 |
|-------------|-----------|-----------|-----------|-----------|
| Vite 5      | No        | Yes       | Yes       | Yes       |
| Vite 6      | No        | Yes       | Yes       | Yes       |
| Vite 7      | No        | No        | 20.19+    | 22.12+    |
| Vite 8      | No        | No        | 20.19+    | 22.12+    |

---

## Internal Tooling Evolution

| Component | Vite 5 | Vite 6 | Vite 7 | Vite 8 |
|-----------|--------|--------|--------|--------|
| Dev Transform | esbuild | esbuild | esbuild | Oxc |
| Dep Pre-bundling | esbuild | esbuild | esbuild | Rolldown |
| Production Bundler | Rollup | Rollup | Rollup | Rolldown |
| JS Minifier | esbuild/terser | esbuild/terser | esbuild/terser | Oxc/terser |
| CSS Minifier | esbuild | esbuild/Lightning CSS | esbuild/Lightning CSS | Lightning CSS |
| Config Key (bundler) | rollupOptions | rollupOptions | rollupOptions | rolldownOptions |
| Config Key (transform) | esbuild | esbuild | esbuild | oxc |
