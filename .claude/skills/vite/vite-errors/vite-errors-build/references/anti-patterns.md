# Build Configuration Anti-Patterns

Common build configuration mistakes and why they cause problems.

---

## Anti-Pattern 1: Silencing Chunk Size Warnings

**Wrong**:
```typescript
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 99999, // "Fix" by hiding the warning
  },
})
```

**Why it is wrong**: The 500 KiB warning exists because large chunks degrade page load performance. Raising the limit hides the problem without solving it.

**Correct approach**:
1. Identify the large dependency with a bundle analyzer
2. Use dynamic `import()` for route-level code splitting
3. Configure `manualChunks` to split vendor code into logical groups
4. Only raise the limit after verifying chunks are intentionally large (e.g., WASM modules)

---

## Anti-Pattern 2: Using inline Sourcemaps in Production

**Wrong**:
```typescript
export default defineConfig({
  build: {
    sourcemap: 'inline', // Embeds maps as data URIs
  },
})
```

**Why it is wrong**: Inline sourcemaps double (or more) the file size of every output chunk. They also expose all original source code to anyone who downloads the file.

**Correct approach**:
```typescript
export default defineConfig({
  build: {
    sourcemap: 'hidden', // Separate files, no reference in output
  },
})
// Upload .map files to error tracking service (Sentry, Datadog)
// NEVER deploy .map files to production web server
```

---

## Anti-Pattern 3: Bundling Peer Dependencies in Library Mode

**Wrong**:
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
    },
    // No external configuration -- react/vue get bundled into the library
  },
})
```

**Why it is wrong**: Consumers of your library will have their own copy of React/Vue. Bundling framework code into your library causes duplicate instances, broken hooks, and inflated bundle sizes.

**Correct approach**:
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
```

ALWAYS externalize every `peerDependency` listed in your `package.json`.

---

## Anti-Pattern 4: Mixing rollupOptions and rolldownOptions in v8

**Wrong**:
```typescript
// Vite 8 config
export default defineConfig({
  build: {
    rollupOptions: {  // Deprecated in v8
      external: ['react'],
    },
    rolldownOptions: {
      output: { manualChunks: () => 'vendor' },
    },
  },
})
```

**Why it is wrong**: Using both keys creates ambiguity. `rollupOptions` is deprecated in v8 and internally mapped to `rolldownOptions`, potentially causing conflicts.

**Correct approach**: Use ONLY `rolldownOptions` in v8:
```typescript
export default defineConfig({
  build: {
    rolldownOptions: {
      external: ['react'],
      output: { manualChunks: () => 'vendor' },
    },
  },
})
```

---

## Anti-Pattern 5: Using build.target: 'esnext' for Production

**Wrong**:
```typescript
export default defineConfig({
  build: {
    target: 'esnext', // Minimal transpilation
  },
})
```

**Why it is wrong**: `'esnext'` means "whatever the latest JavaScript features are." This breaks for any user whose browser does not support the newest syntax. It is unpredictable across Vite versions.

**Correct approach**:
```typescript
export default defineConfig({
  build: {
    // v7+/v8 default: baseline-widely-available
    target: 'es2022', // Explicit, predictable target
  },
})
```

ALWAYS use explicit version targets for production builds. Reserve `'esnext'` for development or internal tools only.

---

## Anti-Pattern 6: Disabling CSS Code Splitting

**Wrong**:
```typescript
export default defineConfig({
  build: {
    cssCodeSplit: false, // Forces ALL CSS into a single file
  },
})
```

**Why it is wrong**: Disabling CSS code splitting forces the browser to download ALL CSS before rendering anything. In large applications, this creates a significant render-blocking resource.

**Correct approach**: Keep `cssCodeSplit: true` (default). Each async chunk gets its own CSS file that loads only when needed.

The only valid use case for `cssCodeSplit: false` is library mode when you want a single CSS output file.

---

## Anti-Pattern 7: Not Handling vite:preloadError

**Wrong**:
```typescript
// No error handling for dynamic import failures
const routes = [
  { path: '/dashboard', component: () => import('./Dashboard.vue') },
]
```

**Why it is wrong**: After deployment, users with cached HTML request chunks that no longer exist (filenames are content-hashed). The dynamic import fails silently, showing a blank page.

**Correct approach**:
```typescript
// main.ts -- BEFORE app initialization
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})
```

ALWAYS add this handler in production SPAs that use dynamic imports.

---

## Anti-Pattern 8: Using Object Form of manualChunks in v8

**Wrong** (v8):
```typescript
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],  // Object form removed in v8
        },
      },
    },
  },
})
```

**Why it is wrong**: Vite 8 (Rolldown) removed the object form of `manualChunks`. It silently fails or throws an error.

**Correct approach**:
```typescript
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'vendor-react'
        },
      },
    },
  },
})
```

ALWAYS use the function form of `manualChunks` -- it works across all Vite versions.

---

## Anti-Pattern 9: Ignoring emptyOutDir Safety Warning

**Wrong**:
```bash
# Force-deleting the output directory manually before build
rm -rf ../dist && vite build
```

**Why it is wrong**: Manually deleting directories is error-prone and bypasses Vite's safety check. A typo could delete the wrong directory.

**Correct approach**:
```typescript
export default defineConfig({
  build: {
    outDir: '../dist',
    emptyOutDir: true, // Let Vite handle it safely
  },
})
```

---

## Anti-Pattern 10: Installing Vite Plugins for CSS Preprocessors

**Wrong**:
```bash
npm install vite-plugin-sass  # Unnecessary plugin
```

```typescript
import sass from 'vite-plugin-sass'
export default defineConfig({
  plugins: [sass()],
})
```

**Why it is wrong**: Vite has built-in support for Sass, Less, and Stylus. Third-party plugins add unnecessary complexity and may conflict with Vite's internal processing.

**Correct approach**:
```bash
npm install -D sass-embedded  # Just the preprocessor, no Vite plugin
```

NEVER install Vite plugins for CSS preprocessors. ALWAYS install only the preprocessor package itself.

---

## Anti-Pattern 11: Using esbuild Config in v8 Without Migration

**Wrong** (v8):
```typescript
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'es2020',
    drop: ['console', 'debugger'],
  },
})
```

**Why it is wrong**: Vite 8 replaces esbuild with Oxc. The `esbuild` config is internally converted, but not all options map cleanly. Some options are silently ignored.

**Correct approach**:
```typescript
export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'h',
      pragmaFrag: 'Fragment',
    },
  },
  build: {
    target: 'es2020',
    minify: 'oxc',
  },
})
```

---

## Anti-Pattern 12: Setting envPrefix to Empty String

**Wrong**:
```typescript
export default defineConfig({
  envPrefix: '', // Exposes ALL environment variables
})
```

**Why it is wrong**: This exposes every environment variable (including `DB_PASSWORD`, `SECRET_KEY`, etc.) to client-side code via `import.meta.env`. These values are embedded in the build output and visible to anyone.

**Correct approach**: ALWAYS use a prefix:
```typescript
export default defineConfig({
  envPrefix: 'VITE_', // Default -- only VITE_* variables exposed
})
```

NEVER set `envPrefix` to an empty string. This is a critical security vulnerability.
