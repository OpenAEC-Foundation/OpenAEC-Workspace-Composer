# Build Configuration Examples

> All examples verified against Vite 8.x documentation. Version-specific notes included where applicable.

---

## 1. Standard Production Build

### Minimal Configuration (All Versions)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'baseline-widely-available',
    outDir: 'dist',
    sourcemap: 'hidden',
  },
})
```

Build command: `vite build`

### Optimized Production Build (v8+)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'baseline-widely-available',
    outDir: 'dist',
    sourcemap: 'hidden',
    minify: 'oxc',
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    reportCompressedSize: false,    // Faster builds for large projects
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
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

### Optimized Production Build (v6-v7)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'baseline-widely-available',  // v7; use 'modules' for v6
    outDir: 'dist',
    sourcemap: 'hidden',
    minify: 'esbuild',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
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

---

## 2. Multi-Page Application

### v8+ (Rolldown)

```typescript
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about/index.html'),
        contact: resolve(import.meta.dirname, 'contact/index.html'),
      },
    },
  },
})
```

### v6-v7 (Rollup)

```typescript
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about/index.html'),
        contact: resolve(import.meta.dirname, 'contact/index.html'),
      },
    },
  },
})
```

### Project Structure for Multi-Page Apps

```
project-root/
├── index.html                 # → http://localhost:5173/
├── about/
│   └── index.html             # → http://localhost:5173/about/
├── contact/
│   └── index.html             # → http://localhost:5173/contact/
├── src/
│   ├── main.ts
│   ├── about.ts
│   └── contact.ts
└── vite.config.ts
```

ALWAYS set `appType: 'mpa'` when NOT using SPA fallback routing:

```typescript
export default defineConfig({
  appType: 'mpa',
  build: {
    rolldownOptions: {
      input: { /* ... */ },
    },
  },
})
```

---

## 3. Library Mode

### Single Entry Library (v8+)

```typescript
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/main.ts'),
      name: 'MyLib',
      fileName: 'my-lib',
    },
    rolldownOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
```

Output files:
- `dist/my-lib.js` (ES module)
- `dist/my-lib.umd.cjs` (UMD)

### Multiple Entry Library (v8+)

```typescript
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: resolve(import.meta.dirname, 'lib/main.ts'),
        utils: resolve(import.meta.dirname, 'lib/utils.ts'),
        components: resolve(import.meta.dirname, 'lib/components/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: ['vue'],
    },
  },
})
```

### Library Mode with Custom Filenames

```typescript
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/main.ts'),
      name: 'MyLib',
      fileName: (format, entryName) => {
        if (format === 'es') return `${entryName}.mjs`
        if (format === 'cjs') return `${entryName}.cjs`
        return `${entryName}.${format}.js`
      },
      cssFileName: 'styles',
    },
    rolldownOptions: {
      external: ['vue'],
    },
  },
})
```

### Recommended package.json for Libraries

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-lib.umd.cjs",
  "module": "./dist/my-lib.js",
  "types": "./dist/types/main.d.ts",
  "exports": {
    ".": {
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.umd.cjs",
      "types": "./dist/types/main.d.ts"
    },
    "./style.css": "./dist/styles.css"
  }
}
```

---

## 4. Watch Mode

### Via Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    watch: {},
  },
})
```

### Via CLI

```bash
vite build --watch
```

### With Custom Watcher Options

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    watch: {
      include: 'src/**',
      exclude: 'node_modules/**',
    },
  },
})
```

---

## 5. Backend Integration with Manifest

### Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    manifest: true,
    rolldownOptions: {        // v8+; use rollupOptions for v6-v7
      input: '/src/main.ts',
    },
  },
})
```

### Manifest Output Structure

After build, `.vite/manifest.json` contains:

```json
{
  "src/main.ts": {
    "file": "assets/main-BRBmoGS9.js",
    "src": "src/main.ts",
    "isEntry": true,
    "imports": ["_vendor-B7PI925R.js"],
    "css": ["assets/main-5UjPuW-k.css"]
  },
  "_vendor-B7PI925R.js": {
    "file": "assets/vendor-B7PI925R.js"
  }
}
```

### Server-Side HTML Rendering

ALWAYS render assets in this order:
1. `<link rel="stylesheet">` for entry CSS files
2. `<link rel="stylesheet">` for imported chunk CSS files (recursive)
3. `<script type="module">` for the entry JS file
4. `<link rel="modulepreload">` for imported JS chunks (optional)

---

## 6. SSR Build

### Basic SSR Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    ssrManifest: true,
    rolldownOptions: {        // v8+; use rollupOptions for v6-v7
      input: '/src/entry-server.ts',
    },
  },
})
```

### SSR with Client Build

```bash
# Build client bundle
vite build --outDir dist/client

# Build SSR bundle
vite build --outDir dist/server --ssr src/entry-server.ts
```

---

## 7. Handling Build Errors (v8+)

```typescript
import { build } from 'vite'

try {
  await build()
} catch (e) {
  if (e.errors) {
    for (const error of e.errors) {
      console.error(`Build error [${error.code}]:`, error.message)
    }
  } else {
    throw e
  }
}
```

In v8+, `build()` throws a `BundleError` with an `.errors` array instead of a raw error.

---

## 8. Preload Error Handling

```typescript
// main.ts — Add to ALL production SPAs
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  // Reload to fetch fresh assets after deployment
  window.location.reload()
})
```

The `vite:preloadError` event fires when a dynamically imported chunk fails to load — typically after a deployment when cached pages reference stale chunk hashes.

---

## 9. Custom Asset Inlining

### Function-Based Inlining Control

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    assetsInlineLimit: (filePath, content) => {
      // ALWAYS inline SVG icons regardless of size
      if (filePath.endsWith('.svg')) return true
      // NEVER inline images over 2 KiB
      if (filePath.match(/\.(png|jpg|gif)$/)) return content.byteLength < 2048
      // Fall back to default 4 KiB threshold
      return undefined
    },
  },
})
```

---

## 10. License Generation (v8+)

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    license: true,
    // Or with custom filename:
    // license: { fileName: 'THIRD_PARTY_LICENSES.md' },
  },
})
```

Output: `.vite/license.md` (or custom filename) containing all bundled dependency licenses.
