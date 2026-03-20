# Build Error Examples

Reproducible error scenarios with step-by-step solutions.

---

## Example 1: Chunk Size Warning with React + MUI

**Scenario**: A React app using Material UI produces a 1.2 MB vendor chunk.

**Error Output**:
```
(!) Some chunks are larger than 500 KiB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.manualChunks to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit
```

**Root Cause**: All of `@mui/material` is bundled into a single vendor chunk.

**Solution**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@mui/material')) {
            return 'vendor-mui'
          }
          if (id.includes('node_modules/@mui/icons-material')) {
            return 'vendor-mui-icons'
          }
          if (id.includes('node_modules/react')) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
```

**Better Solution**: Import MUI components individually:
```typescript
// WRONG: imports entire library
import { Button, TextField, Dialog } from '@mui/material'

// CORRECT: tree-shakeable individual imports
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
```

---

## Example 2: Top-Level Await Build Failure

**Scenario**: Using top-level await in a module fails during build.

**Error Output**:
```
[ERROR] Top-level await is not available in the configured target environment
("chrome87", "edge88", "es2020", "firefox78", "safari14")
```

**Root Cause**: `build.target` does not include browsers supporting top-level await (ES2022).

**Solution**:
```typescript
export default defineConfig({
  build: {
    target: 'es2022', // Minimum for top-level await
  },
})
```

**If you MUST support older browsers**:
```typescript
// Wrap the await in an async IIFE
const data = await (async () => {
  const response = await fetch('/api/config')
  return response.json()
})()
```

---

## Example 3: Library Mode Missing UMD Name

**Scenario**: Building a component library with UMD format.

**Error Output**:
```
[vite:build] Missing "name" option for UMD export.
```

**Root Cause**: UMD format requires a global variable name to attach the library to `window`.

**Solution**:
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyComponentLib',  // Global variable name for UMD
      formats: ['es', 'umd'],
      fileName: (format) => `my-lib.${format}.js`,
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

---

## Example 4: v8 BundleError in CI Pipeline

**Scenario**: CI build script crashes with unhandled BundleError after upgrading to Vite 8.

**Error Output**:
```
BundleError: Build failed with 2 errors
  error[UNRESOLVED_IMPORT]: Could not resolve "./missing-module"
  error[PARSE_ERROR]: Unexpected token in src/broken.ts:15:3
```

**Root Cause**: Vite 8 `build()` API throws `BundleError` with structured `errors` array instead of a generic error.

**Solution**:
```typescript
// build-script.ts
import { build } from 'vite'

async function runBuild() {
  try {
    await build()
    console.log('Build succeeded')
    process.exit(0)
  } catch (e) {
    if (e.errors) {
      // v8 BundleError: structured error reporting
      console.error(`Build failed with ${e.errors.length} error(s):`)
      for (const error of e.errors) {
        console.error(`  [${error.code}] ${error.message}`)
        if (error.loc) {
          console.error(`    at ${error.loc.file}:${error.loc.line}:${error.loc.column}`)
        }
        if (error.frame) {
          console.error(error.frame)
        }
      }
    } else {
      // Non-BundleError (config issues, plugin crashes, etc.)
      console.error('Unexpected build error:', e.message)
    }
    process.exit(1)
  }
}

runBuild()
```

---

## Example 5: Stale Chunks After Deployment (vite:preloadError)

**Scenario**: Users see blank pages after a new deployment because their cached HTML references old chunk filenames.

**Error Output** (browser console):
```
TypeError: Failed to fetch dynamically imported module: https://example.com/assets/Dashboard-abc123.js
```

**Root Cause**: Content-hashed chunk filenames change on each build. Users with cached HTML request chunks that no longer exist on the server.

**Solution**:
```typescript
// src/main.ts -- add BEFORE router/app initialization
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  // Force reload to get new HTML with updated chunk references
  window.location.reload()
})

// Alternative: show user-friendly message
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const userConfirmed = confirm(
    'A new version is available. Reload to update?'
  )
  if (userConfirmed) {
    window.location.reload()
  }
})
```

---

## Example 6: Lightning CSS Failure in v8

**Scenario**: CSS that worked in Vite 7 fails to minify in Vite 8.

**Error Output**:
```
[vite:css] Lightning CSS: Unexpected token in style.css:42:5
```

**Root Cause**: Vite 8 defaults to Lightning CSS for CSS minification. Some CSS patterns (vendor prefixes, non-standard syntax) that PostCSS/esbuild accepted are rejected by Lightning CSS.

**Solution**:
```typescript
// Quick fix: fall back to esbuild for CSS minification
export default defineConfig({
  build: {
    cssMinify: 'esbuild', // Requires: npm install -D esbuild
  },
})

// Better fix: update CSS to use standard syntax
// Lightning CSS handles vendor prefixes automatically based on build.cssTarget
```

---

## Example 7: Plugin moduleType Error in v8

**Scenario**: A custom Vite plugin that transforms `.graphql` files into JavaScript breaks after upgrading to Vite 8.

**Error Output**:
```
[vite:rolldown] Module type not specified for non-JS content
```

**Root Cause**: Vite 8 (Rolldown) requires plugins to explicitly declare `moduleType: 'js'` when their load/transform hooks produce JavaScript from non-JavaScript source files.

**Solution**:
```typescript
// BEFORE (v6/v7) -- worked without moduleType
function graphqlPlugin() {
  return {
    name: 'vite-plugin-graphql',
    transform(code, id) {
      if (!id.endsWith('.graphql')) return
      const jsCode = compileGraphQL(code)
      return { code: jsCode }
    },
  }
}

// AFTER (v8) -- moduleType required
function graphqlPlugin() {
  return {
    name: 'vite-plugin-graphql',
    transform(code, id) {
      if (!id.endsWith('.graphql')) return
      const jsCode = compileGraphQL(code)
      return {
        code: jsCode,
        moduleType: 'js', // REQUIRED in v8
      }
    },
  }
}
```

---

## Example 8: emptyOutDir Safety Warning

**Scenario**: Build output directory is outside the project root.

**Error Output**:
```
Could not auto-determine entry point from rollupOptions or html files and
there are no explicit optimizeDeps.include patterns. Skipping dependency pre-bundling.
```

Or:
```
vite build will not empty outDir "../dist" because it is outside of project root.
Use --emptyOutDir to override.
```

**Root Cause**: Vite adds a safety check to prevent deleting directories outside the project root.

**Solution**:
```typescript
export default defineConfig({
  build: {
    outDir: '../dist',
    emptyOutDir: true,  // Explicitly confirm you want to empty this directory
  },
})
```

---

## Example 9: Sourcemap in Production Exposing Source

**Scenario**: Production build includes sourcemaps with original source code visible in browser devtools.

**Root Cause**: `build.sourcemap: true` generates sourcemaps with `//# sourceMappingURL` references, making them downloadable by anyone.

**Solution**:
```typescript
export default defineConfig({
  build: {
    // Option A: Hidden sourcemaps (for error tracking services only)
    sourcemap: 'hidden',
    // Generates .map files but no reference comment in output
    // Upload .map files to Sentry/Datadog, do NOT deploy them

    // Option B: No sourcemaps in production
    sourcemap: false,
  },
})
```

NEVER deploy sourcemap files to production servers. ALWAYS upload them separately to error tracking services if needed.

---

## Example 10: Migrating rollupOptions to rolldownOptions (v8)

**Scenario**: Upgrading from Vite 7 to Vite 8, all `build.rollupOptions` must migrate.

**Before (v7)**:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
      external: ['react', 'react-dom'],
      output: {
        manualChunks: {
          vendor: ['lodash', 'axios'],
        },
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
```

**After (v8)**:
```typescript
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
      external: ['react', 'react-dom'],
      output: {
        // NOTE: object form of manualChunks removed in v8
        // MUST use function form instead
        manualChunks(id) {
          if (id.includes('lodash') || id.includes('axios')) {
            return 'vendor'
          }
        },
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
```

Key changes:
1. `rollupOptions` renamed to `rolldownOptions`
2. Object form of `manualChunks` removed -- ALWAYS use function form
3. `output.manualChunks` with `chokidar` option removed
