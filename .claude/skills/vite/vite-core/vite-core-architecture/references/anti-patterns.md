# Vite Architecture Anti-Patterns

## Entry Point Mistakes

### NEVER use a JavaScript file as the entry point

**Wrong** -- treating JS as entry like Webpack:
```json
{
  "scripts": {
    "dev": "vite src/main.ts"
  }
}
```

**Correct** -- Vite uses `index.html` as the entry point:
```html
<!-- index.html at project root -->
<script type="module" src="/src/main.ts"></script>
```

**Why**: Vite is an HTML-first build tool. It resolves the module graph starting from `<script type="module">` tags in HTML files. Passing a JS file as argument sets the `root` directory, not the entry point.

---

### NEVER place index.html inside src/

**Wrong**:
```
my-app/
├── src/
│   ├── index.html    # Wrong location
│   └── main.ts
```

**Correct**:
```
my-app/
├── index.html        # At project root
├── src/
│   └── main.ts
```

**Why**: Vite expects `index.html` at the project root (the `root` config option, defaults to `process.cwd()`). Placing it elsewhere requires changing the `root` option, which shifts all relative paths.

---

## Configuration Mistakes

### NEVER use bare `export default {}` without defineConfig

**Wrong**:
```typescript
export default {
  plugins: [react()],
}
```

**Correct**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**Why**: `defineConfig()` provides TypeScript IntelliSense, type checking, and auto-completion for all configuration options. Without it, you get no editor assistance and can easily introduce typos in option names.

---

### NEVER set envPrefix to an empty string

**Wrong**:
```typescript
export default defineConfig({
  envPrefix: '',  // Exposes ALL env vars to client
})
```

**Correct**:
```typescript
export default defineConfig({
  envPrefix: 'VITE_',  // Default, only VITE_* vars exposed
})
```

**Why**: Setting `envPrefix: ''` exposes every environment variable (including `DB_PASSWORD`, `SECRET_KEY`, API tokens) to client-side code via `import.meta.env`. This is a critical security vulnerability.

---

### NEVER use deprecated options in Vite 8

**Wrong** (Vite 8):
```typescript
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  build: {
    rollupOptions: { /* ... */ },
  },
  optimizeDeps: {
    esbuildOptions: { /* ... */ },
  },
})
```

**Correct** (Vite 8):
```typescript
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  build: {
    rolldownOptions: { /* ... */ },
  },
  optimizeDeps: {
    rolldownOptions: { /* ... */ },
  },
})
```

**Why**: In Vite 8, esbuild is replaced by Oxc and Rollup is replaced by Rolldown. The old options are deprecated and converted internally, but using them directly causes confusion and may not support all new features.

---

## Dependency Management Mistakes

### NEVER exclude CommonJS dependencies from pre-bundling

**Wrong**:
```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['some-cjs-package'],  // Breaks at runtime
  },
})
```

**Why**: The dev server serves ONLY native ESM. CommonJS packages that are excluded from pre-bundling cannot be served as ES modules, causing runtime import errors in the browser. ONLY exclude packages that are already pure ESM and explicitly need to bypass pre-bundling.

---

### NEVER manually delete node_modules/.vite to fix caching issues

**Wrong**:
```bash
rm -rf node_modules/.vite
```

**Correct**:
```bash
vite --force
```

Or in config:
```typescript
export default defineConfig({
  optimizeDeps: {
    force: true,  // Remove after issue is resolved
  },
})
```

**Why**: The `--force` flag properly rebuilds the pre-bundling cache and handles all edge cases. Manual deletion may leave inconsistent state and does not trigger all necessary re-processing steps.

---

## Build Mistakes

### NEVER rely on Vite for TypeScript type checking

**Wrong** -- assuming Vite checks types:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

**Correct** -- run type checking before build:
```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build"
  }
}
```

**Why**: Vite uses esbuild (v5-7) or Oxc (v8) for TypeScript transpilation, which is 20-30x faster than `tsc` precisely because it skips type checking. Type errors will NOT prevent a successful build unless you explicitly run `tsc`.

---

### NEVER serve the dist/ folder with vite dev server in production

**Wrong**:
```bash
# Do not use `vite` to serve production content
vite
```

**Correct**:
```bash
# Build first, then use vite preview or a proper static server
vite build
vite preview        # For testing only
# For production: use nginx, Caddy, or a CDN
```

**Why**: The `vite` dev server is optimized for development (no bundling, native ESM, HMR). It is NOT a production server. Use `vite build` to create optimized bundles, then serve `dist/` with a proper HTTP server. `vite preview` is for local testing of the production build only.

---

## Project Structure Mistakes

### NEVER import from public/ directory in source code

**Wrong**:
```typescript
import logo from '../public/logo.png'
```

**Correct**:
```typescript
// Reference public assets by absolute URL path
const logoUrl = '/logo.png'

// Or import from src/assets/ for processed assets
import logo from './assets/logo.png'
```

**Why**: Files in `public/` are served as-is at the root URL and copied unchanged to `dist/`. They are NOT part of the module graph and cannot be imported. Use absolute URL paths to reference them. For assets that need processing (hashing, optimization), place them in `src/assets/` instead.

---

### NEVER assume dev and production behavior are identical

**Wrong assumption**: "It works in dev, so it works in production."

Key differences:

| Behavior | Dev Server | Production Build |
|----------|-----------|-----------------|
| Module format | Individual ESM files | Bundled chunks |
| Import resolution | On-demand, browser-native | Static analysis at build time |
| CSS handling | Injected via JS (HMR-compatible) | Extracted to separate CSS files |
| Environment | `import.meta.env.DEV === true` | `import.meta.env.PROD === true` |
| Glob imports | Resolved at request time | Resolved at build time |
| Asset URLs | Dev server URLs | Hashed filenames |

**ALWAYS** test with `vite build && vite preview` before deploying to verify production behavior matches expectations.
