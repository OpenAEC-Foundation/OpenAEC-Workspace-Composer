# Examples — Vite Programmatic JavaScript API

## Programmatic Dev Server

### Basic Dev Server

```typescript
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  root: import.meta.dirname,
  server: {
    port: 1337,
  },
})

await server.listen()
server.printUrls()
server.bindCLIShortcuts({ print: true })
```

### Dev Server with Custom Middleware

```typescript
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
})

// Attach Vite's middleware to your own HTTP framework
app.use(server.middlewares)

// Custom API route BEFORE Vite middleware
server.middlewares.use('/api/health', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok' }))
})
```

### Dev Server with SSR

```typescript
import { createServer } from 'vite'
import express from 'express'

const app = express()

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
})

app.use(vite.middlewares)

app.use('*', async (req, res, next) => {
  try {
    const url = req.originalUrl

    // Load the server entry module via Vite's SSR pipeline
    const { render } = await vite.ssrLoadModule('/src/entry-server.ts')

    // Read and transform the HTML template
    let template = fs.readFileSync('index.html', 'utf-8')
    template = await vite.transformIndexHtml(url, template)

    // Render the app and inject into template
    const appHtml = await render(url)
    const html = template.replace('<!--ssr-outlet-->', appHtml)

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    vite.ssrFixStacktrace(e)
    next(e)
  }
})

app.listen(5173)
```

### Graceful Shutdown

```typescript
import { createServer } from 'vite'

const server = await createServer({ /* config */ })
await server.listen()

// ALWAYS register cleanup handlers
process.on('SIGTERM', async () => {
  await server.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await server.close()
  process.exit(0)
})
```

---

## Programmatic Build

### Basic Build

```typescript
import path from 'node:path'
import { build } from 'vite'

const result = await build({
  root: path.resolve(import.meta.dirname, './project'),
  base: '/foo/',
  build: {
    rollupOptions: {
      input: 'src/main.ts',
    },
  },
})

// result is RollupOutput or RollupOutput[]
if (Array.isArray(result)) {
  for (const output of result) {
    console.log('Bundle:', output.output.length, 'chunks')
  }
} else {
  console.log('Bundle:', result.output.length, 'chunks')
}
```

### Build Without Config File

```typescript
import { build } from 'vite'

await build({
  configFile: false,
  root: '/path/to/project',
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
  },
})
```

### SSR Build

```typescript
import { build } from 'vite'

// Client build
await build({
  build: {
    outDir: 'dist/client',
  },
})

// SSR build
await build({
  build: {
    outDir: 'dist/server',
    ssr: 'src/entry-server.ts',
  },
})
```

### Dev Server + Build in Same Process

```typescript
import { createServer, build } from 'vite'

// CRITICAL: Set mode consistently when using both APIs in one process
process.env.NODE_ENV = 'production'

const server = await createServer({
  mode: 'production',
  // ...
})

await build({
  mode: 'production',
  // ...
})

await server.close()
```

---

## Preview Server

### Basic Preview

```typescript
import { preview } from 'vite'

const previewServer = await preview({
  preview: {
    port: 8080,
    open: true,
  },
})

previewServer.printUrls()
previewServer.bindCLIShortcuts({ print: true })
```

### Preview with Custom Middleware

```typescript
import { preview } from 'vite'

const previewServer = await preview()

// Add middleware to the preview server
previewServer.middlewares.use('/api', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ mock: true }))
})

previewServer.printUrls()
```

---

## loadEnv

### Load Environment Variables

```typescript
import { loadEnv } from 'vite'

// Load only VITE_ prefixed variables (default)
const env = loadEnv('development', process.cwd())
console.log(env.VITE_API_URL)

// Load ALL environment variables (use empty string prefix)
const allEnv = loadEnv('production', process.cwd(), '')
console.log(allEnv.DATABASE_URL)

// Load variables with custom prefixes
const customEnv = loadEnv('staging', './envdir', ['VITE_', 'APP_'])
console.log(customEnv.APP_NAME)
```

---

## Transform Functions

### transformWithOxc (Vite 8+)

```typescript
import { transformWithOxc } from 'vite'

const result = await transformWithOxc(
  `const x: number = 1; export default x;`,
  'file.ts',
  {
    jsx: 'react-jsx',
  },
)

console.log(result.code)    // Transformed JavaScript
console.log(result.map)     // Source map
```

### transformWithEsbuild (Vite 5-7)

```typescript
import { transformWithEsbuild } from 'vite'

const result = await transformWithEsbuild(
  `const x: number = 1; export default x;`,
  'file.ts',
  {
    loader: 'ts',
    target: 'es2020',
  },
)

console.log(result.code)
console.log(result.map)
```

---

## Config Utilities

### resolveConfig

```typescript
import { resolveConfig } from 'vite'

// Resolve config as if running dev server
const devConfig = await resolveConfig({}, 'serve')
console.log(devConfig.root)
console.log(devConfig.build.outDir)

// Resolve config as if running build
const buildConfig = await resolveConfig({}, 'build', 'production', 'production')
console.log(buildConfig.build.minify)
```

### mergeConfig

```typescript
import { mergeConfig } from 'vite'

// Merge two root-level configs
const merged = mergeConfig(
  {
    plugins: [pluginA()],
    build: { outDir: 'dist' },
  },
  {
    plugins: [pluginB()],
    build: { minify: true },
  },
)
// Result: plugins=[pluginA, pluginB], build={outDir:'dist', minify:true}

// Merge nested options — ALWAYS pass isRoot=false
const mergedBuild = mergeConfig(
  { outDir: 'dist', minify: true },
  { outDir: 'build' },
  false,  // isRoot=false for nested subsections
)
// Result: { outDir: 'build', minify: true }
```

### loadConfigFromFile

```typescript
import { loadConfigFromFile } from 'vite'

const result = await loadConfigFromFile(
  { command: 'serve', mode: 'development' },
  undefined,           // auto-detect config file
  process.cwd(),
)

if (result) {
  console.log('Config file:', result.path)
  console.log('Config:', result.config)
  console.log('Dependencies:', result.dependencies)
}
```

---

## Utility Functions

### normalizePath

```typescript
import { normalizePath } from 'vite'

// Converts Windows paths to forward slashes
const normalized = normalizePath('src\\components\\App.tsx')
// Result: 'src/components/App.tsx'
```

### createFilter

```typescript
import { createFilter } from 'vite'

const filter = createFilter(
  ['**/*.ts', '**/*.tsx'],    // include patterns
  ['**/node_modules/**'],     // exclude patterns
)

if (filter('/src/App.tsx')) {
  // Process the file
}

if (!filter('/node_modules/lodash/index.js')) {
  // Correctly excluded
}
```

### searchForWorkspaceRoot

```typescript
import { searchForWorkspaceRoot } from 'vite'

const workspaceRoot = searchForWorkspaceRoot(process.cwd())
console.log('Workspace root:', workspaceRoot)
// Finds pnpm-workspace.yaml, package.json workspaces, or .git
```

---

## Using transformRequest for Custom Pipelines

```typescript
import { createServer } from 'vite'

const server = await createServer({ /* config */ })
await server.listen()

// Transform a module through Vite's full pipeline
const result = await server.transformRequest('/src/main.ts')
if (result) {
  console.log(result.code)  // Transformed source
  console.log(result.map)   // Source map
}

await server.close()
```
