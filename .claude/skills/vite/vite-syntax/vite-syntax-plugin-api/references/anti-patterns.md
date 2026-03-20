# Vite Plugin API -- Anti-Patterns

## AP-001: Injecting Plugins in the `config` Hook

**Wrong:**

```ts
config(userConfig) {
  userConfig.plugins.push(anotherPlugin()) // Has NO effect
}
```

**Why:** User plugins are resolved BEFORE the `config` hook runs. Injecting plugins here is silently ignored.

**Correct:** Add plugins directly in `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [myPlugin(), anotherPlugin()],
})
```

---

## AP-002: Relying on `moduleParsed` During Dev

**Wrong:**

```ts
moduleParsed(info) {
  // Track module metadata during dev
  moduleMap.set(info.id, info.ast)
}
```

**Why:** Vite does NOT call `moduleParsed` during development for performance reasons. Your plugin will silently do nothing in dev mode.

**Correct:** Use `transform` hook to track modules during dev:

```ts
transform(code, id) {
  // This runs during both dev and build
  moduleMap.set(id, parseMetadata(code))
  return null
}
```

---

## AP-003: Missing `\0` Prefix on Virtual Module IDs

**Wrong:**

```ts
resolveId(id) {
  if (id === 'virtual:my-module') return 'virtual:my-module'
},
load(id) {
  if (id === 'virtual:my-module') return 'export default {}'
}
```

**Why:** Without the `\0` prefix, other plugins will attempt to resolve and process the virtual module ID as a file path, causing errors or unexpected behavior.

**Correct:**

```ts
resolveId(id) {
  if (id === 'virtual:my-module') return '\0virtual:my-module'
},
load(id) {
  if (id === '\0virtual:my-module') return 'export default {}'
}
```

---

## AP-004: Returning `undefined` Instead of `null` From Hooks

**Wrong:**

```ts
resolveId(id) {
  if (id === 'my-module') return 'resolved-id'
  // Implicit return undefined
}
```

**Why:** Some hooks treat `undefined` and `null` differently. Returning `undefined` can break the plugin chain or cause subtle bugs. The Rollup plugin convention is to return `null` explicitly when your plugin does not handle the input.

**Correct:**

```ts
resolveId(id) {
  if (id === 'my-module') return 'resolved-id'
  return null // Explicitly pass to next plugin
}
```

---

## AP-005: Not Storing `resolvedConfig` for Later Use

**Wrong:**

```ts
transform(code, id) {
  // Cannot access config.command here!
  // config is not available in transform hook parameters
}
```

**Why:** Most hooks do not receive the resolved config. You MUST capture it in `configResolved` and store it in a closure variable.

**Correct:**

```ts
let config: ResolvedConfig

return {
  configResolved(resolvedConfig) {
    config = resolvedConfig
  },
  transform(code, id) {
    if (config.command === 'serve') {
      // Dev-specific logic
    }
    return null
  },
}
```

---

## AP-006: Using Backslashes in File Path Comparisons

**Wrong:**

```ts
transform(code, id) {
  if (id.includes('src\\utils\\helper.ts')) {
    // Fails on macOS/Linux
  }
}
```

**Why:** Vite normalizes all paths to forward slashes internally. Backslash comparisons fail on non-Windows platforms and sometimes even on Windows.

**Correct:**

```ts
import { normalizePath } from 'vite'

transform(code, id) {
  if (normalizePath(id).includes('src/utils/helper.ts')) {
    // Works everywhere
  }
}
```

---

## AP-007: Missing `name` Property

**Wrong:**

```ts
export default function myPlugin() {
  return {
    // No name property!
    transform(code, id) { /* ... */ },
  }
}
```

**Why:** The `name` property is REQUIRED. Without it, Vite cannot identify your plugin in warnings, errors, or debug output.

**Correct:**

```ts
export default function myPlugin() {
  return {
    name: 'vite-plugin-my-feature',
    transform(code, id) { /* ... */ },
  }
}
```

---

## AP-008: Not Returning an Object From the Factory Function

**Wrong:**

```ts
// Exporting a plain object instead of a factory function
export default {
  name: 'my-plugin',
  transform(code, id) { /* ... */ },
}
```

**Why:** Plugins MUST be factory functions that return plugin objects. This ensures each consumer gets a fresh plugin instance and enables options passing. A plain object is shared across all uses, causing state leakage.

**Correct:**

```ts
export default function myPlugin(options = {}) {
  return {
    name: 'vite-plugin-my-feature',
    transform(code, id) { /* ... */ },
  }
}
```

---

## AP-009: Blocking the Dev Server With Synchronous Operations

**Wrong:**

```ts
import fs from 'node:fs'

transform(code, id) {
  const data = fs.readFileSync('/some/large/file.json', 'utf-8') // Blocks!
  return code.replace('__DATA__', data)
}
```

**Why:** Synchronous file I/O blocks the entire dev server. During dev, Vite processes module requests on the main thread -- blocking freezes HMR and all other requests.

**Correct:**

```ts
import fs from 'node:fs/promises'

async transform(code, id) {
  const data = await fs.readFile('/some/large/file.json', 'utf-8')
  return code.replace('__DATA__', data)
}
```

---

## AP-010: Not Providing Sourcemaps in Transform

**Wrong:**

```ts
transform(code, id) {
  return code.replace('old', 'new') // No sourcemap!
}
```

**Why:** Without a sourcemap, browser devtools and error stack traces point to the wrong line numbers in transformed files, making debugging extremely difficult.

**Correct:**

```ts
import MagicString from 'magic-string'

transform(code, id) {
  const s = new MagicString(code)
  s.replace('old', 'new')
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  }
}
```

Or when sourcemaps are genuinely not needed (e.g., metadata-only transforms):

```ts
transform(code, id) {
  return { code: modifiedCode, map: null }
}
```

---

## AP-011: Forgetting `apply` on Dev-Only or Build-Only Plugins

**Wrong:**

```ts
// Plugin adds dev-only middleware but runs during build too
configureServer(server) {
  server.middlewares.use(/* ... */)
},
transform(code, id) {
  // Dev-only logic that errors during build
}
```

**Why:** Without `apply`, the plugin runs in both dev and build modes. If your logic is mode-specific, it may error or waste resources in the wrong mode.

**Correct:**

```ts
return {
  name: 'vite-plugin-dev-only',
  apply: 'serve', // Only active during dev
  configureServer(server) { /* ... */ },
  transform(code, id) { /* dev-specific */ },
}
```

---

## AP-012: Using Non-Namespaced Custom Event Names

**Wrong:**

```ts
server.ws.send('update', { data: 'hello' })
```

**Why:** Generic event names like `update` or `change` collide with other plugins or Vite's internal events, causing unpredictable behavior.

**Correct:**

```ts
server.ws.send('my-plugin:update', { data: 'hello' })
```

ALWAYS namespace custom events with your plugin name.

---

## AP-013: Mutating `config` in `configResolved`

**Wrong:**

```ts
configResolved(config) {
  config.build.outDir = 'custom-dist' // Mutation after resolution!
}
```

**Why:** The config is already resolved and frozen at this point. Mutations may be silently ignored or cause inconsistent behavior depending on which properties Vite has already read.

**Correct:** Use the `config` hook (not `configResolved`) to modify config:

```ts
config() {
  return {
    build: { outDir: 'custom-dist' },
  }
}
```
