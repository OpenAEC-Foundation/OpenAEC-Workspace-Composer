# Asset Handling Anti-Patterns

## AP-001: Using Variables in `import.meta.glob` Arguments

**WRONG:**
```js
const dir = './pages'
const modules = import.meta.glob(`${dir}/*.vue`) // FAILS: not a string literal
```

**CORRECT:**
```js
const modules = import.meta.glob('./pages/*.vue')
```

**WHY**: Vite performs static analysis at build time. `import.meta.glob` arguments MUST be string literals because Vite cannot evaluate runtime expressions. The glob pattern is resolved during compilation, not at runtime.

---

## AP-002: Using `new URL(path, import.meta.url)` in SSR

**WRONG:**
```js
// server-side code
const assetUrl = new URL('./image.png', import.meta.url).href
res.send(`<img src="${assetUrl}" />`)
```

**CORRECT:**
```js
// Use a manifest lookup or public directory for SSR asset references
import manifest from './dist/.vite/manifest.json'
const assetUrl = manifest['src/image.png'].file
res.send(`<img src="/${assetUrl}" />`)
```

**WHY**: `import.meta.url` has different semantics in browsers (HTTP URL) vs Node.js (file:// URL). The `new URL()` pattern is designed for client-side code only and produces incorrect paths in SSR contexts.

---

## AP-003: Importing Public Directory Assets with `import`

**WRONG:**
```js
import robotsTxt from '../public/robots.txt?raw'
import favicon from '../public/favicon.ico'
```

**CORRECT:**
```js
// Reference public assets with absolute URL paths
fetch('/robots.txt').then(res => res.text())

// In HTML
// <link rel="icon" href="/favicon.ico" />
```

**WHY**: Public directory assets are served at root `/` and copied as-is to the output directory. Importing them with `import` bypasses this mechanism and may result in duplicated files or incorrect paths. ALWAYS use absolute URL paths for public assets.

---

## AP-004: Extracting `new URL()` from `new Worker()` Constructor

**WRONG:**
```js
const workerUrl = new URL('./worker.js', import.meta.url)
const worker = new Worker(workerUrl) // Vite CANNOT detect this
```

**CORRECT:**
```js
const worker = new Worker(new URL('./worker.js', import.meta.url))
```

**WHY**: Vite detects worker patterns by statically analyzing `new Worker(new URL(...))` as a single expression. Extracting the URL to a variable breaks this detection, and the worker file will not be processed or bundled correctly.

---

## AP-005: Using Dynamic Expressions in Worker Options

**WRONG:**
```js
const type = isModule ? 'module' : 'classic'
const worker = new Worker(new URL('./worker.js', import.meta.url), { type })
```

**CORRECT:**
```js
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module',
})
```

**WHY**: Worker detection requires ALL option parameters to be static values. Dynamic option values prevent Vite from determining the worker type at build time.

---

## AP-006: Forgetting `import: 'default'` with Glob Queries

**WRONG:**
```js
const svgs = import.meta.glob('./icons/*.svg', { query: '?raw', eager: true })
// Result: { './icons/arrow.svg': { default: '<svg>...</svg>' } }
// Must access: svgs['./icons/arrow.svg'].default
```

**CORRECT:**
```js
const svgs = import.meta.glob('./icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})
// Result: { './icons/arrow.svg': '<svg>...</svg>' }
```

**WHY**: Without `import: 'default'`, glob imports return the full module object. For `?raw` and `?url` queries, the actual value is on the `default` export. ALWAYS specify `import: 'default'` when using query suffixes in glob imports to get the value directly.

---

## AP-007: Setting `assetsInlineLimit` Too High

**WRONG:**
```js
export default defineConfig({
  build: {
    assetsInlineLimit: 1024 * 1024, // 1 MB — inlines huge files
  },
})
```

**CORRECT:**
```js
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // 4 KiB (default) — reasonable threshold
  },
})
```

**WHY**: Inlining large assets as base64 increases JavaScript bundle size by approximately 33% (base64 encoding overhead). Large inlined assets cannot be cached independently by the browser, hurt parse time, and bloat initial load. ALWAYS keep the limit reasonable (4-8 KiB).

---

## AP-008: Using `assetsInclude` Instead of Query Suffixes

**WRONG:**
```js
// Adding .glsl to assetsInclude when you need the content as a string
export default defineConfig({
  assetsInclude: ['**/*.glsl'],
})
```

```js
import shader from './vertex.glsl' // Returns URL, not content
```

**CORRECT:**
```js
import shader from './vertex.glsl?raw' // Returns content as string
```

**WHY**: `assetsInclude` makes Vite treat files as static assets (returning URLs). If you need file content as a string, use `?raw` instead. `assetsInclude` is for files you want served as separate assets with URL resolution.

---

## AP-009: Mixing Public and Processed Asset Strategies

**WRONG:**
```js
// Some images from public dir, some from imports — inconsistent
const logo = '/logo.png'                      // public dir (no hash)
import hero from './hero.png'                 // processed (hashed)
const banner = '/banner.png'                  // public dir (no hash)
```

**CORRECT:**
```js
// Consistent: use imports for all referenced assets
import logo from './logo.png'
import hero from './hero.png'
import banner from './banner.png'
```

**WHY**: Mixing strategies leads to inconsistent cache behavior. Imported assets get content hashes for cache busting; public dir assets do not. ALWAYS use imports for assets referenced in code. Reserve the public directory for files that MUST keep their exact filename (favicon.ico, robots.txt, manifest.json).

---

## AP-010: Using Glob Import for Known, Fixed File Sets

**WRONG:**
```js
// Only two files, both known at dev time
const configs = import.meta.glob('./configs/*.json', { eager: true })
const devConfig = configs['./configs/dev.json']
const prodConfig = configs['./configs/prod.json']
```

**CORRECT:**
```js
import devConfig from './configs/dev.json'
import prodConfig from './configs/prod.json'
```

**WHY**: `import.meta.glob` is designed for dynamic file discovery where the set of files is not known in advance. For a fixed, small set of known files, direct imports are simpler, more explicit, and give better type safety. Use glob only when you need to import files discovered by pattern.

---

## AP-011: Relying on `import.meta.glob` as a Web Standard

**WRONG:**
```js
// Assuming this works outside Vite (e.g., in Node.js, Webpack, or browsers)
const modules = import.meta.glob('./plugins/*.js')
```

**WHY**: `import.meta.glob` is a Vite-specific compile-time transformation. It is NOT part of any web or ECMAScript standard. Code using glob imports is not portable to other bundlers or runtimes without equivalent plugins. ALWAYS document this Vite dependency when using glob imports in shared libraries.

---

## AP-012: Not Using `type: 'module'` for Workers with ESM Imports

**WRONG:**
```ts
// worker.ts uses import statements
import { heavyCalc } from './math-utils'
self.onmessage = (e) => self.postMessage(heavyCalc(e.data))
```

```ts
// main.ts — missing type: 'module'
const worker = new Worker(new URL('./worker.ts', import.meta.url))
```

**CORRECT:**
```ts
const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module',
})
```

**WHY**: Without `type: 'module'`, the worker runs as a classic script where `import` statements are not available. In development, Vite serves worker files as native ESM, so omitting the module type causes immediate errors. ALWAYS specify `type: 'module'` when your worker uses ESM imports.
