# optimizeDeps.* Configuration Options

Complete reference for all dependency pre-bundling configuration options.

---

## optimizeDeps.entries

- **Type**: `string | string[]`
- **Default**: Auto-detected from `.html` files or `build.rollupOptions.input`

Custom entry points for dependency discovery crawling. Supports tinyglobby patterns.

```javascript
// Single entry
optimizeDeps: {
  entries: 'src/main.ts',
}

// Multiple entries with globs
optimizeDeps: {
  entries: [
    'src/main.ts',
    'src/pages/**/*.tsx',
    'src/workers/*.ts',
  ],
}
```

**Version note (v7+)**: `entries` ALWAYS receives glob patterns, not literal file paths. Vite normalizes paths to globs internally.

**When to use**: ALWAYS set custom entries when your app entry is NOT an HTML file (e.g., SSR entry, worker entry, or non-standard project structure).

---

## optimizeDeps.include

- **Type**: `string[]`
- **Default**: `[]`

Force specific dependencies to be pre-bundled. ALWAYS use when:

1. Auto-discovery misses a dependency (plugin-transformed imports)
2. A dependency has many internal ESM modules (performance optimization)
3. A linked monorepo package does NOT export ESM

```javascript
optimizeDeps: {
  include: [
    'react',                              // Ensure CJS dep is pre-bundled
    'lodash-es',                          // Collapse 600+ modules to one
    'my-lib/components/**/*.vue',         // Deep import globs
    '@scope/shared-utils',                // Scoped package
  ],
}
```

### Deep Import Globs

For packages with deep import paths, use glob patterns:

```javascript
optimizeDeps: {
  include: [
    'my-lib/components/**/*.vue',         // All .vue files under components
    'icons-package/svg/**/*',             // All icon assets
  ],
}
```

**NEVER** add a dependency to both `include` and `exclude` -- `include` takes precedence but this creates confusing behavior.

---

## optimizeDeps.exclude

- **Type**: `string[]`
- **Default**: `[]`

Exclude specific dependencies from pre-bundling. Safe ONLY for:

- Small, already-valid ESM packages with few internal modules
- Packages that MUST remain unbundled (e.g., they use `import.meta` features that break when bundled)

```javascript
optimizeDeps: {
  exclude: [
    'tiny-esm-only-package',
  ],
}
```

**NEVER** exclude CommonJS dependencies. They MUST be converted to ESM by the pre-bundler. Excluding a CJS dep causes this browser error:

```
Uncaught SyntaxError: The requested module does not provide an export named 'default'
```

**NEVER** exclude dependencies that have CJS transitive dependencies -- the entire dependency tree must be pre-bundled together.

---

## optimizeDeps.force

- **Type**: `boolean`
- **Default**: `false`

Force re-bundling of ALL dependencies, ignoring the existing cache in `node_modules/.vite`.

```javascript
optimizeDeps: {
  force: true,
}
```

**When to use**:
- After manually editing files inside `node_modules`
- When cache appears corrupted or stale
- During CI/CD pipelines where cache consistency matters

**Prefer the CLI flag** `vite --force` over the config option -- the config option permanently disables caching, which slows down every dev server start.

---

## optimizeDeps.noDiscovery

- **Type**: `boolean`
- **Default**: `false`

Disable automatic dependency discovery. When `true`, ONLY dependencies listed in `include` are pre-bundled.

```javascript
optimizeDeps: {
  noDiscovery: true,
  include: [
    'react',
    'react-dom',
    'axios',
  ],
}
```

**WARNING**: With `noDiscovery: true`, ANY dependency NOT in `include` will cause runtime errors. You MUST manually maintain the complete list.

**When to use**: Large projects where automatic crawling is slow and the dependency list is stable and well-known.

---

## optimizeDeps.rolldownOptions (v8+)

- **Type**: `Omit<RolldownOptions, 'input' | 'logLevel' | 'output'> & { output?: ... }`

Customize the Rolldown bundler used for dependency pre-bundling in Vite 8+.

```javascript
// Vite 8+
optimizeDeps: {
  rolldownOptions: {
    plugins: [myCustomPlugin()],
    resolve: {
      alias: { /* ... */ },
    },
  },
}
```

**NEVER** set `input` or `logLevel` in rolldownOptions -- Vite manages these internally.

---

## optimizeDeps.esbuildOptions (v5-v7, deprecated in v8)

- **Type**: `Omit<EsbuildBuildOptions, 'bundle' | 'entryPoints' | 'external' | 'write' | 'outdir' | 'outfile' | 'outbase' | 'absWorkingDir'>`

Customize the esbuild bundler used for pre-bundling in Vite 5-7.

```javascript
// Vite 5-7
optimizeDeps: {
  esbuildOptions: {
    target: 'es2020',
    plugins: [myEsbuildPlugin()],
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  },
}
```

**Version note**: In Vite 8, `esbuildOptions` is converted internally to `rolldownOptions`. ALWAYS use `rolldownOptions` for new Vite 8+ projects.

---

## optimizeDeps.holdUntilCrawlEnd

- **Type**: `boolean`
- **Default**: `true`
- **Status**: Experimental

Controls whether Vite waits until all static imports are crawled before starting the optimization.

- `true` (default): Holds optimization until the full import graph is discovered. Avoids repeated re-bundling.
- `false`: Start optimization immediately for each discovered dependency. Faster initial start but may trigger multiple re-bundles.

```javascript
optimizeDeps: {
  holdUntilCrawlEnd: true,  // default, RECOMMENDED
}
```

**ALWAYS** keep the default (`true`) unless you have a specific reason to start serving deps before discovery completes.

---

## optimizeDeps.needsInterop

- **Type**: `string[]`
- **Status**: Experimental

Force ESM interop wrapping for specific dependencies. Use when a CJS package has broken default export handling.

```javascript
optimizeDeps: {
  needsInterop: [
    'legacy-cjs-package',
  ],
}
```

**When to use**: The dependency's default export is `undefined` or wrapped incorrectly after pre-bundling. This forces Vite to add interop helpers.

---

## Complete Configuration Example

```typescript
// vite.config.ts — Vite 8+
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    // Custom entry points for crawling
    entries: ['src/main.ts', 'src/pages/**/*.tsx'],

    // Force pre-bundle these deps
    include: [
      'lodash-es',                         // Many internal modules
      'react',                             // CJS package
      'react-dom',                         // CJS package
      '@ui/shared/components/**/*.vue',    // Deep imports from monorepo
    ],

    // Exclude only pure ESM packages with few modules
    exclude: ['tiny-esm-util'],

    // Do NOT force (use --force CLI flag instead)
    force: false,

    // Keep auto-discovery enabled
    noDiscovery: false,

    // Rolldown options (v8+)
    rolldownOptions: {
      plugins: [],
    },

    // Hold until all imports discovered (default, recommended)
    holdUntilCrawlEnd: true,
  },
})
```

```typescript
// vite.config.ts — Vite 6/7
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    entries: ['src/main.ts'],
    include: ['lodash-es', 'react', 'react-dom'],
    exclude: ['tiny-esm-util'],
    force: false,
    noDiscovery: false,

    // esbuild options (v5-v7)
    esbuildOptions: {
      target: 'es2020',
    },

    holdUntilCrawlEnd: true,
  },
})
```

---

## Options Quick Reference Table

| Option | Type | Default | Version | Purpose |
|--------|------|---------|---------|---------|
| `entries` | `string \| string[]` | auto-detected | All | Custom entry points for dep crawling |
| `include` | `string[]` | `[]` | All | Force pre-bundle specific deps |
| `exclude` | `string[]` | `[]` | All | Skip pre-bundling for specific deps |
| `force` | `boolean` | `false` | All | Ignore cache, re-bundle everything |
| `noDiscovery` | `boolean` | `false` | All | Disable automatic dep discovery |
| `rolldownOptions` | `object` | — | v8+ | Customize Rolldown pre-bundler |
| `esbuildOptions` | `object` | — | v5-v7 | Customize esbuild pre-bundler |
| `holdUntilCrawlEnd` | `boolean` | `true` | All | Wait for full crawl before optimizing |
| `needsInterop` | `string[]` | — | All | Force ESM interop for specific deps |
