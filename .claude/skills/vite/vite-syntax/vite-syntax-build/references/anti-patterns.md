# Build Configuration Anti-Patterns

> Common mistakes in Vite build configuration and their corrections.

---

## AP-001: Using rollupOptions in Vite 8+

### Wrong

```typescript
// vite.config.ts — Vite 8+ project
export default defineConfig({
  build: {
    rollupOptions: {              // DEPRECATED in v8
      external: ['react'],
    },
  },
})
```

### Correct

```typescript
// vite.config.ts — Vite 8+
export default defineConfig({
  build: {
    rolldownOptions: {            // ALWAYS use rolldownOptions in v8+
      external: ['react'],
    },
  },
})
```

### Why

`build.rollupOptions` is a deprecated alias in Vite 8+. The underlying bundler changed from Rollup to Rolldown. While the alias works today, it will be removed in a future version.

---

## AP-002: Using esbuild Minifier in Vite 8+ Without Installing It

### Wrong

```typescript
// vite.config.ts — Vite 8+
export default defineConfig({
  build: {
    minify: 'esbuild',           // esbuild is NOT a direct dependency in v8+
  },
})
```

### Correct

```typescript
// Option A: Use the default oxc minifier (recommended)
export default defineConfig({
  build: {
    minify: 'oxc',               // Default in v8+, 30-90x faster than terser
  },
})

// Option B: If you specifically need esbuild, install it first
// npm install -D esbuild
export default defineConfig({
  build: {
    minify: 'esbuild',
  },
})
```

### Why

Vite 8 replaced esbuild with Oxc for transforms and minification. esbuild is no longer a direct dependency. Using `'esbuild'` without installing it causes a build failure.

---

## AP-003: Bundling Peer Dependencies in Library Mode

### Wrong

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts',
      name: 'MyComponent',
    },
    // Missing external — Vue gets bundled into the library
  },
})
```

### Correct

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts',
      name: 'MyComponent',
    },
    rolldownOptions: {            // v8+; use rollupOptions for v6-v7
      external: ['vue', 'vue-router'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
        },
      },
    },
  },
})
```

### Why

Bundling framework dependencies into a library creates duplicate instances at runtime. The consumer's app and your library each have their own copy of Vue/React, causing state management failures, broken reactivity, and increased bundle size.

---

## AP-004: Setting emptyOutDir When outDir Is Outside Root

### Wrong

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: '../../shared-dist',     // Outside project root
    emptyOutDir: true,               // DANGEROUS — deletes files you may need
  },
})
```

### Correct

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: '../../shared-dist',
    emptyOutDir: false,              // Let Vite's safety check protect you
  },
})
```

### Why

When `outDir` is outside the project root, Vite defaults `emptyOutDir` to `false` and emits a warning. Forcing it to `true` risks deleting files from shared directories, other projects, or important system paths.

---

## AP-005: Expecting assetsDir to Work in Library Mode

### Wrong

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts',
      name: 'MyLib',
    },
    assetsDir: 'static',            // IGNORED in library mode
  },
})
```

### Correct

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts',
      name: 'MyLib',
      fileName: 'my-lib',
      cssFileName: 'my-lib-styles',
    },
  },
})
```

### Why

`build.assetsDir` is NEVER used in Library Mode. Library output filenames are controlled exclusively by `build.lib.fileName` and `build.lib.cssFileName`.

---

## AP-006: Using Object Form of manualChunks in Vite 8+

### Wrong

```typescript
// vite.config.ts — Vite 8+
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],     // Object form REMOVED in v8
        },
      },
    },
  },
})
```

### Correct

```typescript
// vite.config.ts — Vite 8+
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
```

### Why

Vite 8 (Rolldown) removed the object form of `output.manualChunks`. ALWAYS use the function form, which provides more control and is compatible across all versions.

---

## AP-007: Forgetting vite:preloadError Handling in SPAs

### Wrong

```typescript
// main.ts — No error handling for stale chunks
const module = await import('./lazy-page.ts')
```

### Correct

```typescript
// main.ts — ALWAYS add this for production SPAs
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

const module = await import('./lazy-page.ts')
```

### Why

After a deployment, users with cached HTML pages will request chunk filenames that no longer exist (because content hashes changed). Without handling `vite:preloadError`, dynamic imports silently fail or show cryptic errors.

---

## AP-008: Enabling Sourcemaps in Public-Facing Production Builds

### Wrong

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true,              // Exposes source code to anyone via browser DevTools
  },
})
```

### Correct

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: 'hidden',         // Maps generated but not linked in output files
  },
})
```

### Why

`sourcemap: true` adds `//# sourceMappingURL` comments that tell browsers where to find source maps. Anyone opening DevTools can see your original source code. Use `'hidden'` to generate maps for error tracking services (Sentry, Datadog) without exposing them publicly.

---

## AP-009: Disabling CSS Code Splitting Without Understanding Impact

### Wrong

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    cssCodeSplit: false,          // ALL CSS in one file — may cause FOUC
  },
})
```

### Correct

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    cssCodeSplit: true,           // Default — CSS loaded per chunk, prevents FOUC
  },
})
```

### Why

With `cssCodeSplit: false`, ALL CSS is bundled into a single file that must load before any content renders. This increases initial load time and can cause FOUC. The default `true` splits CSS per async chunk and auto-loads it via `<link>` tags before chunk execution.

---

## AP-010: Using __dirname Instead of import.meta.dirname

### Wrong

```typescript
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),     // __dirname not available in ESM
      },
    },
  },
})
```

### Correct

```typescript
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
})
```

### Why

Vite config files are processed as ES modules. `__dirname` is a CommonJS global that does not exist in ESM context. ALWAYS use `import.meta.dirname` (Node.js 21.2+) or `fileURLToPath(new URL('.', import.meta.url))` for older Node versions.

---

## AP-011: Not Installing Terser When Using terser Minifier

### Wrong

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',            // terser is NOT bundled with Vite
  },
})
```

### Correct

```bash
npm install -D terser
```

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
})
```

### Why

Vite does NOT include terser as a dependency. Using `minify: 'terser'` without installing the package causes a build failure with a missing module error. ALWAYS install terser as a dev dependency first.

---

## AP-012: Setting build.target Too Low Without plugin-legacy

### Wrong

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',            // Syntax transforms only — no polyfills
  },
})
```

### Correct

```typescript
// vite.config.ts
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
})
```

### Why

`build.target` only controls syntax transforms (arrow functions, optional chaining, etc.) — it does NOT add polyfills for missing APIs (Promise, fetch, etc.). For older browser support, ALWAYS use `@vitejs/plugin-legacy` which generates polyfilled bundles alongside modern ones.
