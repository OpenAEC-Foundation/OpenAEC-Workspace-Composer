# Asset Handling Examples

## Static Asset Imports

### Basic Image Import

```js
// Returns resolved URL (dev: /src/logo.png, prod: /assets/logo.a1b2c3d4.png)
import logoUrl from './logo.png'

const img = document.createElement('img')
img.src = logoUrl
document.body.appendChild(img)
```

### Multiple Asset Types

```js
import heroImage from './hero.jpg'
import iconSvg from './icon.svg'
import bgVideo from './background.mp4'
import customFont from './font.woff2'
```

### Raw Import (Shader, SVG Markup, Text)

```js
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'

const program = createShaderProgram(gl, vertexShader, fragmentShader)
```

```js
import svgMarkup from './icon.svg?raw'

// Insert SVG directly into DOM (allows CSS styling of SVG internals)
document.getElementById('icon-container').innerHTML = svgMarkup
```

### Explicit URL Import

```js
import workletUrl from './paint-worklet.js?url'
CSS.paintWorklet.addModule(workletUrl)
```

### Inline Control

```js
// Force inline regardless of size (becomes base64 data URL)
import tinyIcon from './tiny-icon.svg?inline'

// Force separate file regardless of size (never base64)
import heroImage from './hero.png?no-inline'
```

### Dynamic Asset with `new URL()`

```js
// Static path — Vite transforms this at build time
const imgUrl = new URL('./img.png', import.meta.url).href

// Dynamic with template literal — static prefix required
function getAssetUrl(name) {
  return new URL(`./assets/${name}.png`, import.meta.url).href
}

// Usage
const avatar = getAssetUrl('user-avatar')
```

### Custom Asset Types via `assetsInclude`

```js
// vite.config.js
export default defineConfig({
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr'],
})
```

```js
// Now these work as standard asset imports
import model from './scene.gltf'
import environment from './studio.hdr'
```

---

## Public Directory Assets

### Directory Structure

```
public/
├── robots.txt          -> /robots.txt
├── favicon.ico         -> /favicon.ico
├── og-image.png        -> /og-image.png
└── data/
    └── countries.json  -> /data/countries.json
```

### Referencing Public Assets

```html
<!-- In HTML -->
<link rel="icon" href="/favicon.ico" />
<meta property="og:image" content="/og-image.png" />
```

```js
// In JavaScript — use absolute path from root
fetch('/data/countries.json')
  .then(res => res.json())
  .then(data => console.log(data))
```

### Custom Public Directory

```js
// vite.config.js
export default defineConfig({
  publicDir: 'static', // Use 'static/' instead of 'public/'
})
```

```js
// Disable public directory entirely
export default defineConfig({
  publicDir: false,
})
```

---

## JSON Imports

### Full Object Import

```js
import packageJson from '../package.json'
console.log(packageJson.version)
console.log(packageJson.dependencies)
```

### Named Exports (Tree-Shakeable)

```js
// Only 'version' and 'name' are included in the bundle
import { version, name } from '../package.json'
console.log(`${name}@${version}`)
```

### JSON Configuration

```js
// vite.config.js
export default defineConfig({
  json: {
    namedExports: true,  // Enable named imports (default: true)
    stringify: 'auto',   // Use JSON.parse() for files >10 KiB (default: 'auto')
  },
})
```

---

## Glob Import Examples

### Lazy-Loaded Route Modules

```js
const pages = import.meta.glob('./pages/*.vue')

// Create routes from file system
const routes = Object.keys(pages).map((path) => {
  const name = path.match(/\.\/pages\/(.*)\.vue$/)[1]
  return {
    path: name === 'index' ? '/' : `/${name.toLowerCase()}`,
    component: pages[path], // Lazy-loaded
  }
})
```

### Eager Loading with Named Imports

```ts
// Extract only the 'meta' export from each module
const pageMeta = import.meta.glob('./pages/*.ts', {
  import: 'meta',
  eager: true,
})

// Result: { './pages/home.ts': { title: 'Home', ... }, ... }
for (const [path, meta] of Object.entries(pageMeta)) {
  console.log(path, meta)
}
```

### Raw SVG Imports via Glob

```ts
const icons = import.meta.glob('./icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Result: { './icons/arrow.svg': '<svg ...>...</svg>', ... }
function getIcon(name) {
  return icons[`./icons/${name}.svg`]
}
```

### URL Imports via Glob

```ts
const imageUrls = import.meta.glob('./images/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
})

// Result: { './images/photo1.png': '/assets/photo1.abc123.png', ... }
```

### Multiple Patterns with Exclusions

```js
const components = import.meta.glob([
  './components/**/*.vue',
  './shared/**/*.vue',
  '!**/__tests__/**',
  '!**/internal/**',
])
```

### Base Path for Cleaner Keys

```ts
const plugins = import.meta.glob('./**/*.ts', { base: './plugins' })

// Without base: { './plugins/auth.ts': ..., './plugins/logger.ts': ... }
// With base:    { './auth.ts': ..., './logger.ts': ... }
```

### Custom Queries for Plugin Consumption

```ts
const modules = import.meta.glob('./modules/*.js', {
  query: { transform: true, format: 'esm' },
})
// Each import gets: ./modules/foo.js?transform=true&format=esm
```

---

## WebAssembly Examples

### Basic WASM Init

```js
import init from './add.wasm?init'

async function main() {
  const instance = await init()
  const result = instance.exports.add(1, 2)
  console.log(result) // 3
}
main()
```

### WASM with Import Object

```js
import init from './graphics.wasm?init'

const memory = new WebAssembly.Memory({ initial: 1 })

const instance = await init({
  imports: {
    env: {
      memory,
      log: (value) => console.log('WASM says:', value),
      random: () => Math.random(),
    },
  },
})

instance.exports.render()
```

### Multiple WASM Instances

```js
import wasmUrl from './physics.wasm?url'

async function createPhysicsWorld() {
  const response = fetch(wasmUrl)
  const { instance } = await WebAssembly.instantiateStreaming(response)
  return instance.exports
}

// Independent physics simulations
const world1 = await createPhysicsWorld()
const world2 = await createPhysicsWorld()
```

---

## Web Worker Examples

### Constructor Pattern — Basic

```ts
// main.ts
const worker = new Worker(new URL('./heavy-calc.js', import.meta.url))

worker.postMessage({ data: largeDataSet })
worker.onmessage = (e) => {
  console.log('Result:', e.data)
}
```

```js
// heavy-calc.js
self.onmessage = (e) => {
  const result = processData(e.data.data)
  self.postMessage(result)
}
```

### Constructor Pattern — Module Worker

```ts
// main.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module',
})
```

```ts
// worker.ts — can use ESM imports
import { processData } from './utils'

self.onmessage = (e) => {
  const result = processData(e.data)
  self.postMessage(result)
}
```

### Query Suffix Pattern

```js
import ImageProcessor from './image-processor?worker'

const processor = new ImageProcessor()
processor.postMessage({ imageData: canvas.getImageData(0, 0, w, h) })
processor.onmessage = (e) => {
  canvas.putImageData(e.data, 0, 0)
}
```

### Inline Worker (No Separate File)

```js
import InlineWorker from './small-task?worker&inline'

// Worker code is embedded as base64 — no network request for the worker file
const worker = new InlineWorker()
```

---

## HTML Asset Handling

### Processed HTML Elements

```html
<!-- All of these asset references are processed by Vite -->
<script type="module" src="./main.ts"></script>
<link rel="stylesheet" href="./style.css" />
<img src="./hero.png" />
<img srcset="./hero-1x.png 1x, ./hero-2x.png 2x" />
<video src="./intro.mp4" poster="./poster.jpg"></video>
<audio src="./notification.mp3"></audio>
<source src="./video.webm" />
```

### Opting Out of Asset Processing

```html
<!-- vite-ignore prevents Vite from processing this reference -->
<img src="./dynamic-path.png" vite-ignore />
```

### `assetsInlineLimit` Configuration

```js
// vite.config.js
export default defineConfig({
  build: {
    assetsInlineLimit: 8192, // 8 KiB (default: 4096)
  },
})
```

```js
// Function form for fine-grained control
export default defineConfig({
  build: {
    assetsInlineLimit: (filePath, content) => {
      if (filePath.endsWith('.svg')) return false // Never inline SVGs
      if (content.length < 1024) return true      // Always inline < 1 KiB
      return undefined                             // Use default threshold
    },
  },
})
```
