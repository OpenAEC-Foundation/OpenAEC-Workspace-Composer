# Import Patterns Reference

## Asset Import Suffixes — Complete Reference

### URL Resolution Suffixes

| Suffix | Import Type | Return Value | When to Use |
|--------|-------------|-------------|-------------|
| (none) | Auto-detected asset | Resolved URL string | Images, fonts, media — auto-detected types |
| `?url` | Explicit URL | Resolved URL string | Non-auto-detected types that need URL resolution |
| `?raw` | Raw string | File content as string | Shaders (GLSL), SVG markup, text files, config files |
| `?inline` | Force inline | Base64 data URL | Override assetsInlineLimit — ALWAYS inline this asset |
| `?no-inline` | Force separate | URL to separate file | Override assetsInlineLimit — NEVER inline this asset |

### Worker Suffixes

| Suffix | Return Value | Description |
|--------|-------------|-------------|
| `?worker` | Worker constructor | Creates a dedicated Worker class |
| `?sharedworker` | SharedWorker constructor | Creates a SharedWorker class |
| `?worker&inline` | Inlined worker constructor | Worker code embedded as base64, no separate file |
| `?worker&url` | Worker URL string | Returns only the URL, not a constructor |

### WebAssembly Suffixes

| Suffix | Return Value | Description |
|--------|-------------|-------------|
| `?init` | Init function | Returns async function that instantiates the WASM module |
| `?url` | URL string | Returns URL for manual `WebAssembly.instantiateStreaming()` |

### CSS-Specific Suffixes

| Suffix | Return Value | Description |
|--------|-------------|-------------|
| `?inline` | CSS string | Returns CSS content WITHOUT injecting into page |
| (none) | Side effect | CSS is injected into page automatically |

---

## Auto-Detected Asset Types

Vite automatically treats the following file types as static assets (returns resolved URL on import):

**Images**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`, `.avif`
**Media**: `.mp4`, `.webm`, `.ogg`, `.mp3`, `.wav`, `.flac`, `.aac`
**Fonts**: `.woff`, `.woff2`, `.eot`, `.ttf`, `.otf`
**Other**: `.wasm`, `.pdf`

For types NOT in this list, use `?url` suffix or add them via `assetsInclude` config.

---

## Glob Import Options — Complete Reference

### `import.meta.glob(pattern, options?)`

#### Pattern Syntax

| Pattern | Matches |
|---------|---------|
| `./dir/*.js` | All `.js` files in `./dir/` (one level) |
| `./dir/**/*.js` | All `.js` files in `./dir/` (recursive) |
| `['./dir/*.js', './other/*.js']` | Multiple directories |
| `['./dir/*.js', '!**/bar.js']` | Exclude specific files |
| `/src/pages/*.vue` | Absolute from project root |

Patterns MUST be string literals. NEVER use variables, concatenation, or template literals.

#### Options Object

```ts
interface GlobOptions {
  eager?: boolean        // false = lazy () => import(), true = static import
  import?: string        // Named export to extract: 'default', 'setup', etc.
  query?: string | Record<string, string | boolean>  // Query suffix
  base?: string          // Resolve relative to this directory
}
```

#### Option Combinations

| eager | import | Result |
|-------|--------|--------|
| `false` (default) | — | `() => import('./file.js')` |
| `true` | — | Full module object (static import) |
| `false` | `'setup'` | `() => import('./file.js').then(m => m.setup)` |
| `true` | `'setup'` | Named import, tree-shakeable |
| `false` | `'default'` | `() => import('./file.js').then(m => m.default)` |
| `true` | `'default'` | Default export, tree-shakeable |

#### Query Option Formats

**String format** (matches import suffixes):
```ts
import.meta.glob('./dir/*.svg', { query: '?raw', import: 'default' })
import.meta.glob('./dir/*.svg', { query: '?url', import: 'default' })
```

**Object format** (custom queries for plugins):
```ts
import.meta.glob('./dir/*.js', { query: { foo: 'bar', bar: true } })
// Produces: ./dir/foo.js?foo=bar&bar=true
```

#### Base Option

```ts
import.meta.glob('./**/*.js', { base: './components' })
// Keys are relative to base: './Button.js', './Card.js'
// Resolved paths: './components/Button.js', './components/Card.js'
```

Base constraints:
- MUST be a directory path relative to the importing file
- OR an absolute path against the project root
- NEVER use aliases or virtual module paths as base

#### Glob Engine

Vite uses `tinyglobby` for pattern matching. ALWAYS use forward slashes in patterns, even on Windows.

---

## Worker Import Patterns

### Constructor Pattern (Recommended)

```ts
// Dedicated worker
const worker = new Worker(new URL('./worker.js', import.meta.url))

// Module worker (uses ESM imports inside worker)
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module',
})

// Shared worker
const shared = new SharedWorker(new URL('./shared.js', import.meta.url))
```

**Detection constraint**: `new URL()` MUST appear directly inside the `new Worker()` call. Extracting the URL to a variable prevents Vite from detecting and transforming it.

```ts
// CORRECT: Vite detects and transforms
const worker = new Worker(new URL('./worker.js', import.meta.url))

// INCORRECT: Vite cannot detect this pattern
const url = new URL('./worker.js', import.meta.url)
const worker = new Worker(url) // NOT transformed
```

### Query Suffix Pattern

```js
// Dedicated worker
import MyWorker from './worker?worker'
const worker = new MyWorker()

// Shared worker
import MySharedWorker from './worker?sharedworker'
const shared = new MySharedWorker()

// Inline worker (no separate file in production)
import InlineWorker from './worker?worker&inline'
const worker = new InlineWorker()

// URL-only (for manual Worker construction)
import workerUrl from './worker?worker&url'
const worker = new Worker(workerUrl)
```

---

## WebAssembly Import Patterns

### `?init` Pattern (Standard)

```js
import init from './module.wasm?init'

// Basic instantiation
const instance = await init()
instance.exports.myFunction()

// With imports object
const instance = await init({
  imports: {
    env: {
      memory: new WebAssembly.Memory({ initial: 1 }),
      log: (value) => console.log(value),
    },
  },
})
```

### `?url` Pattern (Multiple Instances)

When you need multiple independent instances of the same WASM module:

```js
import wasmUrl from './module.wasm?url'

async function createInstance() {
  const response = fetch(wasmUrl)
  const { module, instance } = await WebAssembly.instantiateStreaming(response)
  return instance
}

const instance1 = await createInstance()
const instance2 = await createInstance()
```

### Production Behavior

- `.wasm` files smaller than `assetsInlineLimit` are inlined as base64 strings
- Larger `.wasm` files are emitted as separate static assets with content hashes
- The `?init` helper handles both cases transparently
