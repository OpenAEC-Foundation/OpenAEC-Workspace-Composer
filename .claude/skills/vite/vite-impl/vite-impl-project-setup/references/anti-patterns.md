# Project Setup Anti-Patterns

## AP-001: Missing isolatedModules in tsconfig.json

**Wrong:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

**Correct:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "isolatedModules": true
  }
}
```

**Why:** Vite transpiles each TypeScript file independently without type information. Without `isolatedModules: true`, TypeScript allows patterns that break under single-file transpilation — such as `const enum` re-exports and implicit type-only imports. The flag makes TypeScript warn about these patterns at development time.

---

## AP-002: Placing index.html Inside src/ or public/

**Wrong:**
```
my-app/
├── public/
│   └── index.html     # WRONG — Vite will not find this
├── src/
│   └── index.html     # WRONG — this is not the entry
```

**Correct:**
```
my-app/
├── index.html          # CORRECT — project root
├── src/
│   └── main.ts
```

**Why:** Vite uses `index.html` at the project root as the entry point. It resolves `<script type="module" src="...">` tags relative to the project root. Placing it elsewhere means Vite will not serve your application.

---

## AP-003: Using require() Instead of ESM Imports

**Wrong:**
```javascript
const path = require('path')
const config = require('./config.json')
```

**Correct:**
```javascript
import path from 'path'
import config from './config.json'
```

**Why:** Vite serves all source code as native ES modules during development. CommonJS `require()` does not work in ESM context. ALWAYS use `import` syntax in source code.

---

## AP-004: Missing type="module" on Script Tags

**Wrong:**
```html
<script src="/src/main.ts"></script>
```

**Correct:**
```html
<script type="module" src="/src/main.ts"></script>
```

**Why:** Without `type="module"`, the browser treats the script as a classic script and cannot use ES module features like `import`/`export`. Vite's dev server and HMR system depend on native ESM.

---

## AP-005: Relying on Vite for Type Checking

**Wrong:**
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

**Correct:**
```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build"
  }
}
```

**Why:** Vite performs transpile-only on TypeScript — it strips types but NEVER validates them. Type errors pass silently through `vite build`. ALWAYS run `tsc --noEmit` before or alongside `vite build` to catch type errors.

---

## AP-006: Installing Vite Plugins for CSS Preprocessors

**Wrong:**
```bash
npm install -D vite-plugin-sass sass
```

**Correct:**
```bash
npm install -D sass-embedded
```

**Why:** Vite has built-in support for Sass, Less, and Stylus. You only need to install the preprocessor package itself. No Vite plugin is required. Installing unnecessary plugins adds bloat and may conflict with Vite's built-in handling.

---

## AP-007: Forgetting vite-env.d.ts

**Wrong:** No `vite-env.d.ts` file, TypeScript errors on:
```typescript
import logo from './logo.svg'        // TS error: Cannot find module
console.log(import.meta.env.VITE_API) // TS error: Property does not exist
```

**Correct:**
```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />
```

**Why:** The `vite/client` type reference provides TypeScript with declarations for asset imports (`.svg`, `.png`, `.css`), `import.meta.env` variables, and `import.meta.hot` HMR API. Without it, TypeScript reports false errors for Vite-specific features.

---

## AP-008: Exposing Secrets via envPrefix

**Wrong:**
```typescript
// vite.config.ts
export default defineConfig({
  envPrefix: '',  // DANGER: exposes ALL env variables
})
```

**Correct:**
```typescript
// vite.config.ts — use default VITE_ prefix or a custom safe prefix
export default defineConfig({
  envPrefix: 'PUBLIC_',
})
```

**Why:** Setting `envPrefix` to an empty string exposes every environment variable (including `DB_PASSWORD`, `SECRET_KEY`, `AWS_ACCESS_KEY`) to client-side JavaScript via `import.meta.env`. Client code is visible to all users. NEVER use an empty prefix.

---

## AP-009: Using sass Instead of sass-embedded

**Wrong:**
```bash
npm install -D sass
```

**Correct:**
```bash
npm install -D sass-embedded
```

**Why:** `sass-embedded` runs the Dart Sass compiler as a native binary and communicates via protocol buffers. It is significantly faster than the pure JavaScript `sass` package, especially for large projects with many Sass files. Vite supports both, but `sass-embedded` is the recommended choice.

---

## AP-010: Not Setting "type": "module" in package.json

**Wrong:**
```json
{
  "name": "my-app",
  "scripts": {
    "dev": "vite"
  }
}
```

**Correct:**
```json
{
  "name": "my-app",
  "type": "module",
  "scripts": {
    "dev": "vite"
  }
}
```

**Why:** Without `"type": "module"`, Node.js treats `.js` files as CommonJS by default. Vite config files using ESM syntax (`import`/`export`) may fail to load. Setting `"type": "module"` ensures consistent ESM behavior across the project.

---

## AP-011: Mismatched Path Aliases Between Vite and TypeScript

**Wrong:** Aliases defined in Vite but not in tsconfig.json:
```typescript
// vite.config.ts
resolve: {
  alias: { '@': resolve(import.meta.dirname, 'src') }
}
```
```json
// tsconfig.json — missing paths config
{
  "compilerOptions": {}
}
```

**Correct:** Both must match:
```typescript
// vite.config.ts
resolve: {
  alias: { '@': resolve(import.meta.dirname, 'src') }
}
```
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

**Why:** Vite resolves imports at build/dev time, but TypeScript resolves them for type checking. If they disagree, you get either runtime errors (Vite cannot find the module) or TypeScript errors (tsc cannot resolve the import). ALWAYS keep both in sync.

---

## AP-012: Running tsc (with emit) Instead of tsc --noEmit

**Wrong:**
```json
{
  "scripts": {
    "build": "tsc && vite build"
  }
}
```

**Correct:**
```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build"
  }
}
```

**Why:** Running `tsc` without `--noEmit` outputs `.js` files alongside your `.ts` source files (or to `outDir`). Vite handles all transpilation itself. The emitted files are unnecessary, may cause confusion, and can interfere with Vite's module resolution. Use `tsc --noEmit` for type checking only.

---

## AP-013: Using Relative Paths for public/ Assets in Source Code

**Wrong:**
```tsx
<img src="../public/logo.png" />
```

**Correct:**
```tsx
<img src="/logo.png" />
```

**Why:** Files in `public/` are served at the root URL path. During development, `public/logo.png` maps to `http://localhost:5173/logo.png`. Using relative paths to the `public` directory will break in production builds because `public/` contents are copied to `dist/` root, not `dist/public/`.
