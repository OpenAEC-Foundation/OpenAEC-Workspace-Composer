# Build Error Catalog

Complete catalog of Vite build errors organized by category. Each entry follows: **Symptom** > **Cause** > **Fix**.

---

## 1. Module Resolution Errors

### 1.1 Unresolved Relative Import

**Symptom**: `Could not resolve './components/Header'`

**Cause**: File does not exist at the specified path, or file extension is missing and not in `resolve.extensions`.

**Fix**:
```typescript
// Verify the file exists and check resolve.extensions
export default defineConfig({
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
})
```

ALWAYS verify the import path matches the actual file system path (case-sensitive on Linux).

### 1.2 Unresolved Bare Import

**Symptom**: `[vite]: Rollup failed to resolve import "some-package" from "src/main.ts"`

**Cause**: Package not installed or misspelled.

**Fix**:
```bash
npm install some-package
```

If the package is installed but still fails, add to `optimizeDeps.include`:
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['some-package'],
  },
})
```

### 1.3 Circular Dependency Warning

**Symptom**: `Circular dependency: src/a.ts -> src/b.ts -> src/a.ts`

**Cause**: Modules form an import cycle, which can cause undefined values at runtime.

**Fix**:
1. Extract shared logic into a third module imported by both
2. Use dynamic `import()` for one direction of the cycle
3. Restructure to use dependency injection pattern

### 1.4 TypeScript Path Aliases Not Resolving

**Symptom**: `Could not resolve '@/utils/helpers'`

**Cause**: TypeScript `paths` in `tsconfig.json` are NOT automatically used by Vite.

**Fix**:
```typescript
// Option A: resolve.alias (recommended)
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})

// Option B: resolve.tsconfigPaths (experimental, slower)
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
})
```

ALWAYS prefer `resolve.alias` over `resolve.tsconfigPaths` for production builds -- it has no performance cost.

### 1.5 Monorepo Linked Package Resolution

**Symptom**: `Could not resolve 'linked-package'` or `Optimized dependency changed` loop

**Cause**: Linked packages in monorepos are treated as source code. If they are not ESM, pre-bundling fails.

**Fix**:
```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['linked-package'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'], // Prevent duplicate dependencies
  },
})
```

---

## 2. Chunk and Bundle Errors

### 2.1 Chunk Size Warning

**Symptom**: `(!) Some chunks are larger than 500 KiB after minification.`

**Cause**: A single chunk exceeds `build.chunkSizeWarningLimit` (default 500 KiB uncompressed).

**Fix**:
1. Use dynamic `import()` for routes and heavy components
2. Configure `manualChunks` to split vendor code
3. Audit dependencies with `npx vite-bundle-visualizer`
4. Raise limit ONLY as last resort: `build.chunkSizeWarningLimit: 1000`

### 2.2 manualChunks Causes Missing Module

**Symptom**: Runtime error `Failed to fetch dynamically imported module`

**Cause**: `manualChunks` function incorrectly splits a module away from its dependencies.

**Fix**: Ensure the `manualChunks` function groups related modules together:
```typescript
// WRONG: splitting too aggressively
manualChunks(id) {
  if (id.includes('node_modules')) return 'vendor' // one giant chunk
}

// CORRECT: group related packages
manualChunks(id) {
  if (id.includes('node_modules/react')) return 'vendor-react'
  if (id.includes('node_modules/@mui')) return 'vendor-mui'
}
```

### 2.3 Empty Chunk Generated

**Symptom**: Build output contains empty `.js` files.

**Cause**: Side-effect-free modules with only re-exports tree-shaken to nothing.

**Fix**: Mark the module as having side effects in `package.json`:
```json
{
  "sideEffects": ["./src/styles.css", "./src/polyfills.ts"]
}
```

---

## 3. Build Target Errors

### 3.1 Syntax Unsupported by Target

**Symptom**: `Build failed: Unexpected token` or `Top-level await is not available in the configured target environment`

**Cause**: Code uses syntax newer than `build.target` allows.

**Fix**:
```typescript
// Raise target to support the syntax
export default defineConfig({
  build: {
    target: 'es2022', // Supports top-level await
  },
})

// Or use legacy plugin for old browser support
import legacy from '@vitejs/plugin-legacy'
export default defineConfig({
  plugins: [legacy({ targets: ['defaults', 'not IE 11'] })],
})
```

### 3.2 CSS Features Not Supported by cssTarget

**Symptom**: CSS uses modern features but output targets older browsers.

**Cause**: `build.cssTarget` defaults to same as `build.target`.

**Fix**:
```typescript
export default defineConfig({
  build: {
    target: 'es2015',        // JS target (older)
    cssTarget: 'chrome111',  // CSS target (modern)
  },
})
```

ALWAYS set `build.cssTarget` separately when `build.target` is lowered for JS compatibility but CSS can target modern browsers.

---

## 4. CSS Build Errors

### 4.1 Lightning CSS Parse Error (v8)

**Symptom**: `Lightning CSS: Invalid CSS syntax` or `Unexpected token in CSS`

**Cause**: Vite 8 defaults to Lightning CSS for CSS minification. Some CSS patterns valid in PostCSS fail in Lightning CSS.

**Fix**:
```typescript
// Fallback to esbuild CSS minification
export default defineConfig({
  build: {
    cssMinify: 'esbuild', // Requires npm install -D esbuild in v8
  },
})
```

### 4.2 Preprocessor Not Found

**Symptom**: `[vite] Internal server error: preprocessor dependency "sass" not found.`

**Cause**: CSS preprocessor package not installed. Vite detects `.scss`/`.less`/`.styl` files but requires manual installation.

**Fix**:
```bash
# Sass (use sass-embedded for best performance)
npm install -D sass-embedded
# Less
npm install -D less
# Stylus
npm install -D stylus
```

NEVER install Vite plugins for CSS preprocessors -- Vite handles them natively.

### 4.3 PostCSS Plugin Compatibility

**Symptom**: `Error: Loading PostCSS Plugin failed` or `Cannot find module 'ts-node'`

**Cause**: Vite 6+ uses postcss-load-config v6 which requires `tsx` or `jiti` for TypeScript PostCSS configs (not `ts-node`).

**Fix**:
```bash
# Remove ts-node, install tsx
npm uninstall ts-node
npm install -D tsx
```

---

## 5. Sourcemap Errors

### 5.1 Missing Source Content

**Symptom**: `Could not load content for /src/file.ts` in browser devtools

**Cause**: Sourcemap references a file path that does not exist in the deployed output.

**Fix**:
```typescript
export default defineConfig({
  build: {
    sourcemap: 'hidden', // Generate maps without reference comments
  },
})
```

### 5.2 Sourcemap Likely Incorrect Warning

**Symptom**: `Sourcemap is likely to be incorrect. A plugin (plugin-name) was used to transform files, but didn't return a sourcemap.`

**Cause**: A Vite plugin transforms code without providing sourcemap information.

**Fix**:
1. Update the plugin to latest version
2. If the warning persists, disable sourcemaps: `build.sourcemap: false`
3. Report the issue to the plugin author

### 5.3 Inline Sourcemap Bloats Bundle

**Symptom**: Output files are significantly larger than expected.

**Cause**: `build.sourcemap: 'inline'` embeds the entire sourcemap as a data URI in the output file.

**Fix**: NEVER use `'inline'` sourcemaps in production. Use `true` (separate file) or `'hidden'` (separate file, no reference).

---

## 6. Library Mode Errors

### 6.1 Missing Name for UMD/IIFE

**Symptom**: `Missing "name" option for UMD export.`

**Cause**: UMD and IIFE formats require a global variable name.

**Fix**:
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyLibrary',  // Required for UMD/IIFE
      formats: ['es', 'umd'],
    },
  },
})
```

### 6.2 Missing External Dependencies

**Symptom**: Peer dependencies bundled into library output, causing duplication in consumer apps.

**Cause**: Dependencies not marked as external.

**Fix**:
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {  // rollupOptions for v6/v7
      external: ['react', 'react-dom', 'vue'],
    },
  },
})
```

ALWAYS externalize peer dependencies in library mode.

### 6.3 assetsDir Ignored in Library Mode

**Symptom**: `build.assetsDir` has no effect when building a library.

**Cause**: Library mode does not use `assetsDir` -- it is only for application builds.

**Fix**: Use output-level asset naming:
```typescript
export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts' },
    rolldownOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
```

---

## 7. Minification Errors

### 7.1 Terser Not Installed

**Symptom**: `Error: terser not found. Since Vite v3, terser has become an optional dependency.`

**Cause**: `build.minify: 'terser'` requires manual installation.

**Fix**:
```bash
npm install -D terser
```

Or switch to the default minifier:
```typescript
// v8: oxc (default), v6-7: esbuild (default)
export default defineConfig({
  build: {
    minify: 'oxc', // v8 default, no extra install needed
  },
})
```

### 7.2 esbuild Not Found (v8)

**Symptom**: `Cannot find module 'esbuild'`

**Cause**: Vite 8 no longer bundles esbuild as a direct dependency.

**Fix**:
```bash
npm install -D esbuild
```

Or migrate to the v8 default tools:
```typescript
export default defineConfig({
  // oxc replaces esbuild for transforms (automatic in v8)
  build: {
    minify: 'oxc', // Default in v8
  },
})
```

---

## 8. Asset Processing Errors

### 8.1 Asset Not Found

**Symptom**: `Could not load /public/logo.png` or broken image in production

**Cause**: File referenced from code but not present in `publicDir` or source.

**Fix**:
- For static assets (no processing): place in `public/` and reference as `/logo.png`
- For processed assets (hashing): import in JS/TS with `import logo from './logo.png'`

### 8.2 Large Assets Not Inlined

**Symptom**: Small assets are base64-inlined but slightly larger ones are not.

**Cause**: `build.assetsInlineLimit` defaults to 4096 bytes (4 KiB).

**Fix**:
```typescript
export default defineConfig({
  build: {
    assetsInlineLimit: 8192, // Inline assets up to 8 KiB
  },
})
```

### 8.3 Public Dir Files Missing in Build

**Symptom**: Files from `public/` not appearing in build output.

**Cause**: `build.copyPublicDir` set to `false`, or `publicDir` misconfigured.

**Fix**:
```typescript
export default defineConfig({
  publicDir: 'public',          // Default
  build: {
    copyPublicDir: true,        // Default
  },
})
```

---

## 9. v8 Migration Errors

### 9.1 rollupOptions Deprecated

**Symptom**: `build.rollupOptions is deprecated. Use build.rolldownOptions instead.`

**Fix**: Rename the config key:
```typescript
// BEFORE (v6/v7)
build: { rollupOptions: { external: ['react'] } }

// AFTER (v8)
build: { rolldownOptions: { external: ['react'] } }
```

### 9.2 Plugin moduleType Missing

**Symptom**: `[plugin] Module type not set for non-JS content`

**Cause**: Vite 8 requires plugins to declare `moduleType: 'js'` when transforming non-JavaScript content into JavaScript.

**Fix** (plugin authors):
```typescript
// In plugin load or transform hook
return {
  code: generatedJsCode,
  moduleType: 'js', // Required in v8 for non-JS source files
}
```

### 9.3 esbuild Config Ignored

**Symptom**: `esbuild` config options have no effect in v8.

**Cause**: Vite 8 uses Oxc instead of esbuild. The `esbuild` config is internally converted but may not map 1:1.

**Fix**: Migrate to `oxc` config:
```typescript
// BEFORE (v6/v7)
export default defineConfig({
  esbuild: {
    jsx: 'preserve',
    target: 'es2020',
  },
})

// AFTER (v8)
export default defineConfig({
  oxc: {
    jsx: { runtime: 'classic' },
  },
  build: {
    target: 'es2020',
  },
})
```
