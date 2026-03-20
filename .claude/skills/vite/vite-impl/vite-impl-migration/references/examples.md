# Config Migration Examples

Before/after config examples for each Vite version migration.

---

## Vite 5 to 6 Examples

### Sass Configuration

```javascript
// BEFORE (v5): Legacy Sass API was default
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `$primary: #333;`,
      },
    },
  },
})

// AFTER (v6): Modern Sass API is default
// Same config works, but Sass files should migrate:
//   - Replace @import with @use/@forward
//   - Use namespaced variables
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "src/styles/variables" as *;`,
      },
    },
  },
})
```

### JSON Stringify Behavior

```javascript
// BEFORE (v5): Default was false (full ES module import)
export default defineConfig({
  // json.stringify defaulted to false
})

// AFTER (v6): Default is 'auto' (stringifies >10kB files)
// To keep v5 behavior:
export default defineConfig({
  json: {
    stringify: false,
  },
})

// To explicitly use auto (recommended):
export default defineConfig({
  json: {
    stringify: 'auto',
  },
})
```

### PostCSS TypeScript Config

```javascript
// BEFORE (v5): ts-node worked for PostCSS TS configs
// postcss.config.ts loaded via ts-node

// AFTER (v6): MUST use tsx or jiti
// Install: npm install -D tsx
// postcss.config.ts now loaded via tsx/jiti
```

### Library Mode CSS

```javascript
// BEFORE (v5): CSS output was style.css
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyLib',
    },
  },
})
// Output: dist/style.css

// AFTER (v6): CSS output uses package.json name
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyLib',
      cssFileName: 'style', // Explicit name to keep v5 behavior
    },
  },
})
// Without cssFileName: dist/my-lib.css (from package.json name)
// With cssFileName: dist/style.css
```

### SSR CSS Minification

```javascript
// BEFORE (v5): CSS not minified in SSR builds
export default defineConfig({
  build: {
    ssr: true,
  },
})

// AFTER (v6): CSS minified in SSR builds by default
// To disable:
export default defineConfig({
  build: {
    ssr: true,
    cssMinify: false,
  },
})
```

---

## Vite 6 to 7 Examples

### Node.js Version Check

```bash
# BEFORE upgrading to Vite 7, verify Node.js:
node --version
# v18.x.x → MUST upgrade first
# v20.19.0+ → OK
# v22.12.0+ → OK

# Update Node.js if needed:
nvm install 22
nvm use 22
```

### Build Target

```javascript
// BEFORE (v6): Default target was 'modules' (es2020)
export default defineConfig({
  // build.target defaulted to 'modules'
})

// AFTER (v7): Default target is 'baseline-widely-available'
// Chrome 107, Edge 107, Firefox 104, Safari 16.0

// To restore v6 behavior:
export default defineConfig({
  build: {
    target: 'modules',
  },
})
```

### Removing splitVendorChunkPlugin

```javascript
// BEFORE (v6):
import { defineConfig, splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [splitVendorChunkPlugin()],
})

// AFTER (v7): Manual chunking strategy
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

### Sass Legacy to Modern Migration

```scss
// BEFORE (v6 with legacy): @import based
// src/styles/main.scss
@import 'variables';
@import 'mixins';

.button {
  color: $primary-color;
  @include rounded-corners;
}
```

```scss
// AFTER (v7 modern only): @use/@forward based
// src/styles/_variables.scss (no change)
$primary-color: #333;

// src/styles/_mixins.scss
@use 'variables' as vars;

@mixin rounded-corners {
  border-radius: vars.$border-radius;
}

// src/styles/main.scss
@use 'variables' as vars;
@use 'mixins';

.button {
  color: vars.$primary-color;
  @include mixins.rounded-corners;
}
```

### transformIndexHtml Hook Migration

```javascript
// BEFORE (v6): Hook-level enforce
const myPlugin = {
  name: 'my-plugin',
  transformIndexHtml: {
    enforce: 'pre',
    transform(html) {
      return html.replace('<!-- MARKER -->', '<div>injected</div>')
    },
  },
}

// AFTER (v7): Plugin-level enforce
const myPlugin = {
  name: 'my-plugin',
  enforce: 'pre',
  transformIndexHtml(html) {
    return html.replace('<!-- MARKER -->', '<div>injected</div>')
  },
}
```

---

## Vite 7 to 8 Examples

### Rolldown Options Migration

```javascript
// BEFORE (v7): rollupOptions
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})

// AFTER (v8): rolldownOptions
export default defineConfig({
  build: {
    rolldownOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
```

### esbuild to Oxc Migration

```javascript
// BEFORE (v7): esbuild config
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'es2020',
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
})

// AFTER (v8): oxc config
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
    minify: 'oxc', // Default, explicit for clarity
  },
})
```

### React Project Migration (v7 to v8)

```javascript
// BEFORE (v7): React with esbuild
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})

// AFTER (v8): React with Oxc + Rolldown
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // jsxInject not needed with modern React (automatic runtime)
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react')) return 'vendor'
        },
      },
    },
  },
})
```

### Plugin Migration for moduleType

```javascript
// BEFORE (v7): Plugin without moduleType
function svgPlugin() {
  return {
    name: 'vite-plugin-svg',
    transform(code, id) {
      if (id.endsWith('.svg')) {
        return {
          code: `export default ${JSON.stringify(code)}`,
        }
      }
    },
  }
}

// AFTER (v8): Plugin WITH moduleType
function svgPlugin() {
  return {
    name: 'vite-plugin-svg',
    transform(code, id) {
      if (id.endsWith('.svg')) {
        return {
          code: `export default ${JSON.stringify(code)}`,
          moduleType: 'js', // REQUIRED in v8
        }
      }
    },
  }
}
```

### Build Error Handling

```javascript
// BEFORE (v7): Raw error
import { build } from 'vite'

async function runBuild() {
  try {
    await build({
      root: './my-app',
      build: { outDir: 'dist' },
    })
  } catch (error) {
    console.error('Build failed:', error.message)
    process.exit(1)
  }
}

// AFTER (v8): BundleError with structured errors
import { build } from 'vite'

async function runBuild() {
  try {
    await build({
      root: './my-app',
      build: { outDir: 'dist' },
    })
  } catch (error) {
    if (error.errors) {
      // BundleError: structured error list
      for (const err of error.errors) {
        console.error(`[${err.code}] ${err.message}`)
        if (err.location) {
          console.error(`  at ${err.location.file}:${err.location.line}`)
        }
      }
    } else {
      // Non-bundle error (config issues, etc.)
      console.error('Build failed:', error.message)
    }
    process.exit(1)
  }
}
```

### Minifier Configuration

```javascript
// BEFORE (v7): esbuild was default minifier
export default defineConfig({
  build: {
    minify: 'esbuild', // Default in v7
  },
})

// AFTER (v8): Oxc is default minifier (30-90x faster than Terser)
export default defineConfig({
  build: {
    minify: 'oxc', // Default in v8, explicit for clarity
  },
})

// To keep using esbuild (now optional dependency):
// First: npm install -D esbuild
export default defineConfig({
  build: {
    minify: 'esbuild',
  },
})
```

---

## Multi-Version Jump: v5 to v8

For projects jumping multiple major versions, apply changes sequentially:

```javascript
// STEP 1: Original v5 config
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: { api: 'legacy' },
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})

// STEP 2: After applying v5→v6 changes
export default defineConfig({
  json: { stringify: 'auto' }, // Explicit (was implicit in v6)
  css: {
    preprocessorOptions: {
      scss: { api: 'legacy' }, // Still available in v6
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})

// STEP 3: After applying v6→v7 changes
export default defineConfig({
  json: { stringify: 'auto' },
  css: {
    preprocessorOptions: {
      scss: {
        // Legacy removed! Must use modern API
        additionalData: `@use "src/styles/variables" as *;`,
      },
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  build: {
    target: 'baseline-widely-available',
    rollupOptions: {
      output: {
        manualChunks(id) { // Object form still works in v7
          if (id.includes('react')) return 'vendor'
        },
      },
    },
  },
})

// STEP 4: Final v8 config
export default defineConfig({
  json: { stringify: 'auto' },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "src/styles/variables" as *;`,
      },
    },
  },
  oxc: { // esbuild → oxc
    jsx: {
      runtime: 'classic',
      pragma: 'h',
      pragmaFrag: 'Fragment',
    },
  },
  build: {
    target: 'baseline-widely-available',
    rolldownOptions: { // rollupOptions → rolldownOptions
      output: {
        manualChunks(id) { // Object form removed, function required
          if (id.includes('react')) return 'vendor'
        },
      },
    },
  },
})
```
