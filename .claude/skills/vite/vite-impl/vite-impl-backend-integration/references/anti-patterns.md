# Backend Integration Anti-Patterns

## AP-001: Hardcoding Hashed Filenames

**NEVER** hardcode hashed filenames in production templates.

```html
<!-- WRONG: Hardcoded hash -- breaks on next build -->
<script type="module" src="/dist/assets/main-BRBmoGS9.js"></script>
```

```html
<!-- CORRECT: Resolved from manifest.json at runtime -->
<script type="module" src="/dist/{{ manifest['src/main.ts'].file }}"></script>
```

**Why**: Vite generates unique content hashes on every build. Hardcoded paths will return 404 after any code change and rebuild.

---

## AP-002: Missing Modulepreload Polyfill

**NEVER** omit the modulepreload polyfill from your entry point.

```javascript
// WRONG: No polyfill
import './styles/app.css'
import { createApp } from './app'
```

```javascript
// CORRECT: Polyfill as first import
import 'vite/modulepreload-polyfill'
import './styles/app.css'
import { createApp } from './app'
```

**Why**: Without the polyfill, `<link rel="modulepreload">` tags have no effect in browsers that lack native support. This causes waterfall loading instead of parallel preloading.

---

## AP-003: Serving Dev Scripts in Production

**NEVER** include Vite dev server scripts in production HTML.

```html
<!-- WRONG: Dev scripts in production -->
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.ts"></script>
```

**Why**: The Vite dev server is not running in production. These scripts will fail to load, breaking the entire application. ALWAYS use environment detection to switch between dev and production rendering.

---

## AP-004: Missing React Preamble

**NEVER** omit the React Refresh preamble when using `@vitejs/plugin-react` with a backend.

```html
<!-- WRONG: Missing preamble -- HMR silently fails -->
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.tsx"></script>
```

```html
<!-- CORRECT: Preamble before Vite client -->
<script type="module">
  import RefreshRuntime from 'http://localhost:5173/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.tsx"></script>
```

**Why**: React Fast Refresh requires global hooks to be set up BEFORE any React code loads. Without the preamble, HMR updates will silently fail and require full page reloads.

---

## AP-005: Wrong Script Order in Dev Mode

**NEVER** place the entry script before `@vite/client`.

```html
<!-- WRONG: Entry before client -->
<script type="module" src="http://localhost:5173/src/main.ts"></script>
<script type="module" src="http://localhost:5173/@vite/client"></script>
```

```html
<!-- CORRECT: Client first, then entry -->
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.ts"></script>
```

**Why**: The `@vite/client` script establishes the WebSocket connection for HMR. If the entry script loads first, HMR will not be active during initial module evaluation.

---

## AP-006: Missing CORS Configuration

**NEVER** skip `server.cors` configuration when the backend serves HTML from a different origin.

```typescript
// WRONG: No CORS -- browser blocks dev server requests
export default defineConfig({
  build: {
    manifest: true,
  },
})
```

```typescript
// CORRECT: CORS allows backend origin
export default defineConfig({
  server: {
    cors: {
      origin: 'http://localhost:8000',
    },
  },
  build: {
    manifest: true,
  },
})
```

**Why**: When your backend (e.g., `localhost:8000`) serves the HTML page but scripts load from the Vite dev server (`localhost:5173`), the browser enforces Same-Origin Policy. Without CORS headers, all module requests are blocked.

---

## AP-007: Wrong Rendering Order in Production

**NEVER** render JS before CSS in production templates.

```html
<!-- WRONG: JS before CSS -- flash of unstyled content -->
<script type="module" src="/dist/assets/main-BRBmoGS9.js"></script>
<link rel="stylesheet" href="/dist/assets/main-5UjPuW-k.css" />
```

```html
<!-- CORRECT: CSS first, then JS -->
<link rel="stylesheet" href="/dist/assets/main-5UjPuW-k.css" />
<script type="module" src="/dist/assets/main-BRBmoGS9.js"></script>
```

**Why**: If JS loads and renders before CSS is available, users see a flash of unstyled content (FOUC). CSS MUST be in the `<head>` or before the script tags to ensure styles are applied before first paint.

---

## AP-008: Ignoring Imported Chunks' CSS

**NEVER** render only the entry chunk's CSS and ignore imported chunks.

```typescript
// WRONG: Only entry CSS
const cssFiles = entry.css ?? []
```

```typescript
// CORRECT: Entry CSS + all imported chunks' CSS
const imported = importedChunks(manifest, entryName)
const cssFiles = [
  ...(entry.css ?? []),
  ...imported.flatMap((chunk) => chunk.css ?? []),
]
```

**Why**: Shared chunks (e.g., vendor libraries) often have their own CSS. If you only render the entry chunk's CSS, styles from shared components will be missing, causing broken layouts.

---

## AP-009: Not Handling Missing Manifest Entries

**NEVER** assume a manifest entry exists without checking.

```typescript
// WRONG: Crashes if entry not found
const chunk = manifest['src/main.ts']
const file = chunk.file // TypeError if undefined
```

```typescript
// CORRECT: Validate entry exists
const chunk = manifest['src/main.ts']
if (!chunk) {
  throw new Error(
    'Manifest entry "src/main.ts" not found. ' +
    'Did you run "vite build"? Is the input path correct in vite.config.ts?'
  )
}
```

**Why**: The manifest key MUST match the `input` path in your Vite config exactly. Mismatches (e.g., `main.ts` vs `src/main.ts`) cause silent failures with undefined lookups.

---

## AP-010: Using build.manifest Without Explicit Input

**NEVER** enable `build.manifest` without specifying `input`.

```typescript
// WRONG: No explicit input -- manifest keys unpredictable
export default defineConfig({
  build: {
    manifest: true,
  },
})
```

```typescript
// CORRECT: Explicit input for predictable manifest keys
export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: 'src/main.ts',
    },
  },
})
```

**Why**: Without explicit `input`, Vite uses `index.html` as the entry point (SPA behavior). The manifest keys will reference the HTML file, not your JS/TS entry, making server-side manifest parsing unreliable.
